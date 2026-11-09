import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const webpush = require('web-push')

export const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), 'data')
mkdirSync(DATA_DIR, { recursive: true })

export const PORT = Number(process.env.PORT || 8787)
// APP_ORIGIN automatisch: Render liefert RENDER_EXTERNAL_URL, sonst localhost.
export const APP_ORIGIN =
  process.env.APP_ORIGIN || process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`

// ---- KI-Anbieter (Gemini gratis bevorzugt, Claude optional) ----
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''
export const hasGemini = !!GEMINI_API_KEY
export const hasAnthropic = !!ANTHROPIC_API_KEY

/** Anbieter für den Coach: Gemini (gratis) vor Claude, sonst lokaler Fallback. */
export function coachProvider(): 'gemini' | 'claude' | 'none' {
  if (hasGemini) return 'gemini'
  if (hasAnthropic) return 'claude'
  return 'none'
}

/** Mail-Sortierung: Standard LOKAL (Heuristik, keine Cloud). Nur wenn MAIL_AI
 *  ausdrücklich auf einen Anbieter gesetzt ist, gehen Mail-Inhalte an die KI. */
export function mailProvider(): 'gemini' | 'claude' | 'none' {
  const want = (process.env.MAIL_AI || 'off').toLowerCase()
  if (want === 'gemini' && hasGemini) return 'gemini'
  if (want === 'claude' && hasAnthropic) return 'claude'
  return 'none' // lokal/heuristisch — Mails verlassen den Server nicht
}

// ---- IMAP-Konten NUR aus Umgebungsvariablen (nie im Repo/Frontend) ----
export type ImapAccount = { name: string; host: string; user: string; pass: string }
export function imapAccounts(): ImapAccount[] {
  const list: ImapAccount[] = []
  if (process.env.GMX_USER && process.env.GMX_PASS)
    list.push({ name: 'GMX', host: 'imap.gmx.net', user: process.env.GMX_USER, pass: process.env.GMX_PASS })
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS)
    list.push({ name: 'Gmail', host: 'imap.gmail.com', user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS })
  return list
}
export const MOCK_MAIL = imapAccounts().length === 0

// ---- VAPID-Schlüssel für Web-Push (persistiert, falls nicht per Env gesetzt) ----
function loadVapid(): { publicKey: string; privateKey: string; subject: string } {
  const subject = process.env.VAPID_SUBJECT || 'mailto:noel-os@example.com'
  if (process.env.VAPID_PUBLIC && process.env.VAPID_PRIVATE)
    return { publicKey: process.env.VAPID_PUBLIC, privateKey: process.env.VAPID_PRIVATE, subject }
  const file = join(DATA_DIR, 'vapid.json')
  if (existsSync(file)) {
    const v = JSON.parse(readFileSync(file, 'utf8'))
    return { ...v, subject }
  }
  const keys = webpush.generateVAPIDKeys()
  writeFileSync(file, JSON.stringify(keys))
  return { ...keys, subject }
}
export const VAPID = loadVapid()
webpush.setVapidDetails(VAPID.subject, VAPID.publicKey, VAPID.privateKey)
