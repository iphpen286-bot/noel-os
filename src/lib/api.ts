// Gleiche Herkunft im Deploy (Server liefert das Frontend aus).
// Für getrennte Dev-Server via VITE_API_URL überschreibbar.
const BASE = (import.meta.env.VITE_API_URL as string | undefined) || '/api'

export type MailItem = {
  id: string; account: string; from: string; addr: string
  subject: string; date: number; summary: string; reason: string
  category: 'Wichtig' | 'Später' | 'Unwichtig'
}
export type Mailbox = { Wichtig: MailItem[]; Später: MailItem[]; Unwichtig: MailItem[] }
export type Provider = 'gemini' | 'claude' | 'none'
export type Health = { ok: boolean; coach: Provider; mailAi: Provider; mockMail: boolean; accounts: string[] }

async function j<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

export const api = {
  health: () => j<Health>('/health'),
  mails: () => j<Mailbox>('/mails'),
  correct: (id: string, category: string) =>
    j<{ ok: boolean }>(`/mails/${encodeURIComponent(id)}/correct`, { method: 'POST', body: JSON.stringify({ category }) }),
  refresh: () => j<{ ok: boolean }>('/mail/refresh', { method: 'POST' }),
  pushKey: () => j<{ key: string }>('/push/key'),
  subscribe: (sub: PushSubscriptionJSON) => j<{ ok: boolean }>('/push/subscribe', { method: 'POST', body: JSON.stringify(sub) }),
  coachHistory: () => j<{ messages: { role: 'user' | 'assistant'; content: string }[] }>('/coach'),
  coachSend: (messages: { role: 'user' | 'assistant'; content: string }[], context: unknown) =>
    j<{ reply: string }>('/coach', { method: 'POST', body: JSON.stringify({ messages, context }) }),
}
