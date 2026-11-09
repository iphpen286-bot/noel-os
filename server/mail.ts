import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import { Mails, type MailRow } from './db'
import { classify, type MailInput } from './classify'
import { imapAccounts, MOCK_MAIL, type ImapAccount } from './env'
import { MOCK_MAILS } from './mock'
import { sendToAll } from './push'

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

async function ingest(base: Omit<MailRow, 'category' | 'summary' | 'reason' | 'pushed' | 'created_at'>) {
  if (Mails.exists(base.id)) return
  const input: MailInput = { from_name: base.from_name, from_addr: base.from_addr, subject: base.subject, snippet: base.snippet }
  const c = await classify(input)
  Mails.insert({ ...base, category: c.category, summary: c.summary, reason: c.reason, pushed: 0, created_at: Date.now() })
}

/** Echter IMAP-Abruf — nur lesend. Nutzt BODY.PEEK (kein \Seen), nie löschen/senden/verschieben. */
async function pollReal(acc: ImapAccount) {
  const client = new ImapFlow({ host: acc.host, port: 993, secure: true, auth: { user: acc.user, pass: acc.pass }, logger: false })
  await client.connect()
  const lock = await client.getMailboxLock('INBOX')
  try {
    const total = client.mailbox && typeof client.mailbox !== 'boolean' ? client.mailbox.exists : 0
    if (!total) return
    const start = Math.max(1, total - 59) // letzte ~60 Nachrichten
    for await (const msg of client.fetch(`${start}:*`, { uid: true, envelope: true, source: true })) {
      const id = `${acc.name}:${msg.uid}`
      if (Mails.exists(id)) continue
      const env = msg.envelope
      const from = env?.from?.[0]
      let snippet = ''
      try {
        const parsed = await simpleParser(msg.source as Buffer)
        snippet = (parsed.text || '').replace(/\s+/g, ' ').trim().slice(0, 240)
      } catch { /* Snippet optional */ }
      await ingest({
        id, account: acc.name, uid: msg.uid ?? null,
        from_name: from?.name || from?.address || '', from_addr: (from?.address || '').toLowerCase(),
        subject: env?.subject || '(kein Betreff)', date: env?.date ? env.date.getTime() : Date.now(), snippet,
      })
    }
  } finally {
    lock.release()
    await client.logout().catch(() => {})
  }
}

async function pollMock() {
  for (const m of MOCK_MAILS) {
    await ingest({
      id: `Mock:${m.uid}`, account: 'Mock', uid: m.uid,
      from_name: m.from_name, from_addr: m.from_addr.toLowerCase(),
      subject: m.subject, date: m.date, snippet: m.snippet,
    })
  }
}

let running = false
export async function poll() {
  if (running) return
  running = true
  try {
    if (MOCK_MAIL) await pollMock()
    else for (const acc of imapAccounts()) {
      try { await pollReal(acc) } catch (e) { console.error(`IMAP ${acc.name} Fehler:`, (e as Error).message) }
    }
    Mails.pruneOlderThan(Date.now() - THIRTY_DAYS) // max. 30 Tage speichern

    // Push bei neuen wichtigen Mails
    const important = Mails.unpushedImportant()
    for (const m of important) {
      await sendToAll({ title: `Wichtig · ${m.from_name}`, body: m.subject, tag: m.id, url: '/mail' })
      Mails.markPushed(m.id)
    }
  } finally {
    running = false
  }
}

/** Tagesübersicht 7:00 — Anzahl wichtiger Mails der letzten 24 h. */
export async function dailyDigest() {
  const since = Date.now() - 24 * 60 * 60 * 1000
  const n = Mails.byCategory('Wichtig').filter((m) => m.date >= since).length
  await sendToAll({
    title: 'Deine Mail-Übersicht',
    body: n > 0 ? `${n} wichtige Mail${n === 1 ? '' : 's'} seit gestern.` : 'Nichts Wichtiges über Nacht. Sauberer Start.',
    tag: 'digest', url: '/mail',
  })
}
