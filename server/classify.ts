import Anthropic from '@anthropic-ai/sdk'
import { ANTHROPIC_API_KEY, mailProvider } from './env'
import { geminiGenerate } from './ai'
import { Rules, type Rule } from './db'

export type Category = 'Wichtig' | 'Später' | 'Unwichtig'
export type Classification = { category: Category; summary: string; reason: string }
export type MailInput = { from_name: string; from_addr: string; subject: string; snippet: string }

const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null

const IMPORTANT = ['rechnung', 'mahnung', 'frist', 'termin', 'bewerbung', 'zusage', 'absage', 'vertrag', 'kündigung', 'prüfung', 'klausur', 'immatrikulation', 'bestätigung', 'dringend', 'wichtig', 'zahlung', 'konto gesperrt', 'sicherheit', 'verifizieren', 'interview', 'deadline', 'invoice', 'urgent', 'overdue', 'ausbildung', 'azubi', 'berufsschule']
const JUNK = ['newsletter', 'angebot', 'rabatt', 'sale', '% off', 'gewinnspiel', 'gewinne', 'werbung', 'abonnier', 'unsubscribe', 'abmelden', 'deal', 'gutschein', 'promo', 'no-reply', 'noreply']

export function applyRules(m: MailInput, rules: Rule[]): Classification | null {
  const addr = m.from_addr.toLowerCase()
  const domain = addr.split('@')[1] || ''
  const subj = m.subject.toLowerCase()
  for (const r of rules) {
    const hit =
      (r.match_type === 'sender' && addr === r.value) ||
      (r.match_type === 'domain' && domain === r.value) ||
      (r.match_type === 'subject' && subj.includes(r.value))
    if (hit) return { category: r.category as Category, summary: m.subject, reason: 'Deine Regel' }
  }
  return null
}

export function heuristic(m: MailInput): Classification {
  const hay = `${m.subject} ${m.snippet} ${m.from_addr}`.toLowerCase()
  if (JUNK.some((k) => hay.includes(k)))
    return { category: 'Unwichtig', summary: m.subject, reason: 'Wirkt wie Werbung/Newsletter' }
  if (IMPORTANT.some((k) => hay.includes(k)))
    return { category: 'Wichtig', summary: m.subject, reason: 'Enthält ein wichtiges Signal (z. B. Frist/Termin)' }
  return { category: 'Später', summary: m.subject, reason: 'Kein dringendes Signal erkannt' }
}

const AI_SYSTEM =
  'Du sortierst E-Mails für einen 19-jährigen Azubi in genau eine Kategorie: "Wichtig" (braucht bald Aufmerksamkeit: Fristen, Termine, Behörden, Ausbildung/Berufsschule, Geld, Verträge, Bewerbungen), "Später" (relevant, nicht dringend) oder "Unwichtig" (Werbung, Newsletter, Spam). Antworte NUR mit JSON: {"category","summary","reason"}. summary und reason auf Deutsch, je ein knapper Satz.'

function parseAI(text: string, m: MailInput): Classification {
  const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1))
  const category: Category = ['Wichtig', 'Später', 'Unwichtig'].includes(json.category) ? json.category : 'Später'
  return { category, summary: String(json.summary || m.subject), reason: String(json.reason || '') }
}

async function aiClassify(m: MailInput): Promise<Classification> {
  const prompt = `Von: ${m.from_name} <${m.from_addr}>\nBetreff: ${m.subject}\nAuszug: ${m.snippet}`
  const provider = mailProvider()
  if (provider === 'gemini') {
    const text = await geminiGenerate({ system: AI_SYSTEM, messages: [{ role: 'user', text: prompt }], json: true, maxTokens: 200 })
    return parseAI(text, m)
  }
  if (provider === 'claude' && anthropic) {
    const res = await anthropic.messages.create({
      model: 'claude-haiku-5-5', max_tokens: 200, system: AI_SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    })
    return parseAI(res.content.find((c) => c.type === 'text')?.text ?? '', m)
  }
  return heuristic(m)
}

export async function classify(m: MailInput): Promise<Classification> {
  const ruled = applyRules(m, Rules.all())
  if (ruled) return ruled
  if (mailProvider() !== 'none') {
    try { return await aiClassify(m) } catch { /* Fallback unten */ }
  }
  return heuristic(m) // Standard: lokal, Mails verlassen den Server nicht
}
