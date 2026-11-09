import Anthropic from '@anthropic-ai/sdk'
import { ANTHROPIC_API_KEY, coachProvider } from './env'
import { geminiGenerate } from './ai'

export type ChatMsg = { role: 'user' | 'assistant'; content: string }
export type CoachContext = {
  profile?: { weightKg?: number; kcalGoal?: number; proteinGoal?: number; trainingDays?: number; maxPullups?: number }
  todayTasksDone?: number
  todayTasksTotal?: number
  weeklyDiscipline?: number
  kcalToday?: number
  proteinToday?: number
  lastSession?: string
  importantMails?: number
}

function ctxText(c: CoachContext): string {
  const p = c.profile || {}
  return [
    `Gewicht: ${p.weightKg ?? '?'} kg, Ziel ${p.kcalGoal ?? '?'} kcal / ${p.proteinGoal ?? '?'} g Protein, ${p.trainingDays ?? '?'}× Training/Woche, max. Klimmzüge ${p.maxPullups ?? '?'}.`,
    `Heute: ${c.todayTasksDone ?? 0}/${c.todayTasksTotal ?? 0} Aufgaben, ${c.kcalToday ?? 0} kcal, ${c.proteinToday ?? 0} g Protein. Disziplin diese Woche ${c.weeklyDiscipline ?? 0} %.`,
    c.lastSession ? `Letzte Einheit: ${c.lastSession}.` : 'Noch keine Einheit geloggt.',
    `Wichtige Mails offen: ${c.importantMails ?? 0}.`,
  ].join(' ')
}

const SYSTEM = `Du bist der persönliche Coach eines 19-jährigen, der ein ästhetischer Calisthenics-Athlet werden will (Rücken, Schultern, Brust, Arme, definierter Bauch, sauberer Aufbau ohne viel Fett). Sprich Deutsch, direkt, motivierend, ohne Schuldgefühle. Antworte kurz und konkret. Du kennst seine Trainings-, Ernährungs-, Aufgaben- und Mail-Daten. Wenn du eine Plananpassung vorschlägst, formuliere sie als Vorschlag und bitte ausdrücklich um Bestätigung, bevor etwas geändert wird — du änderst nichts eigenmächtig.`

const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null

export async function coachReply(messages: ChatMsg[], context: CoachContext): Promise<string> {
  const system = `${SYSTEM}\n\nAktueller Stand: ${ctxText(context)}`
  const provider = coachProvider()

  if (provider === 'gemini') {
    try {
      const text = await geminiGenerate({
        system,
        messages: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', text: m.content })),
        maxTokens: 600,
      })
      if (text.trim()) return text.trim()
    } catch (e) { console.error('gemini coach', (e as Error).message) }
  } else if (provider === 'claude' && anthropic) {
    try {
      const res = await anthropic.messages.create({
        model: 'claude-sonnet-5-5', max_tokens: 500, system,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      })
      return res.content.find((c) => c.type === 'text')?.text ?? '…'
    } catch (e) { console.error('claude coach', (e as Error).message) }
  }

  // Lokaler Fallback (ohne KI-Key)
  const c = context
  const openTasks = (c.todayTasksTotal ?? 0) - (c.todayTasksDone ?? 0)
  const proteinGap = (c.profile?.proteinGoal ?? 0) - (c.proteinToday ?? 0)
  return [
    openTasks > 0 ? `Noch ${openTasks} Aufgaben offen — zieh die zuerst durch.` : 'Aufgaben sitzen, stark.',
    proteinGap > 10 ? `Dir fehlen ~${proteinGap} g Protein heute, plan die nächste Mahlzeit entsprechend.` : 'Protein ist auf Kurs.',
    'Sag mir, woran du gerade arbeitest, dann gehen wir’s konkret an. (Voller Coach aktiv, sobald der kostenlose Gemini-Key gesetzt ist.)',
  ].join(' ')
}
