import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from '@hono/node-server/serve-static'
import { serve } from '@hono/node-server'
import cron from 'node-cron'
import { existsSync } from 'node:fs'
import { PORT, VAPID, MOCK_MAIL, imapAccounts, coachProvider, mailProvider } from './env'
import { Mails, Rules, Push, Coach } from './db'
import { poll, dailyDigest } from './mail'
import { coachReply, type ChatMsg, type CoachContext } from './coach'

const app = new Hono()
app.use('/api/*', cors())

app.get('/api/health', (c) =>
  c.json({
    ok: true,
    coach: coachProvider(),
    mailAi: mailProvider(),
    mockMail: MOCK_MAIL,
    accounts: imapAccounts().map((a) => a.name),
  }),
)

// ---- Mail ----
app.get('/api/mails', (c) => {
  const all = Mails.all()
  const group = (cat: string) => all.filter((m) => m.category === cat).map((m) => ({
    id: m.id, account: m.account, from: m.from_name || m.from_addr, addr: m.from_addr,
    subject: m.subject, date: m.date, summary: m.summary, reason: m.reason, category: m.category,
  }))
  return c.json({ Wichtig: group('Wichtig'), Später: group('Später'), Unwichtig: group('Unwichtig') })
})

// Korrektur → lernt eine Absender-Regel und ordnet gleiche Absender neu ein
app.post('/api/mails/:id/correct', async (c) => {
  const id = c.req.param('id')
  const { category } = await c.req.json<{ category: string }>()
  const mail = Mails.get(id)
  if (!mail) return c.json({ error: 'not found' }, 404)
  if (!['Wichtig', 'Später', 'Unwichtig'].includes(category)) return c.json({ error: 'bad category' }, 400)
  Rules.add('sender', mail.from_addr, category)
  Mails.reclassifyBySender(mail.from_addr, category, 'Deine Regel')
  return c.json({ ok: true })
})

app.post('/api/mail/refresh', async (c) => { await poll(); return c.json({ ok: true }) })

// ---- Push ----
app.get('/api/push/key', (c) => c.json({ key: VAPID.publicKey }))
app.post('/api/push/subscribe', async (c) => {
  const sub = await c.req.json<{ endpoint: string; keys: { p256dh: string; auth: string } }>()
  if (!sub?.endpoint || !sub.keys) return c.json({ error: 'bad sub' }, 400)
  Push.add(sub.endpoint, sub.keys.p256dh, sub.keys.auth)
  return c.json({ ok: true })
})

// ---- Coach ----
app.get('/api/coach', (c) => c.json({ messages: Coach.history() }))
app.post('/api/coach', async (c) => {
  const { messages, context } = await c.req.json<{ messages: ChatMsg[]; context: CoachContext }>()
  const last = messages[messages.length - 1]
  if (last?.role === 'user') Coach.add('user', last.content)
  const reply = await coachReply(messages, context || {})
  Coach.add('assistant', reply)
  return c.json({ reply })
})

// ---- Frontend ausliefern (ein Deploy) ----
if (existsSync('./dist')) {
  app.use('/*', serveStatic({ root: './dist' }))
  app.get('*', serveStatic({ path: './dist/index.html' })) // SPA-Fallback
}

// ---- Zeitpläne ----
cron.schedule('*/10 * * * *', () => { poll().catch((e) => console.error('poll', e)) }) // alle 10 Min
cron.schedule('0 7 * * *', () => { dailyDigest().catch((e) => console.error('digest', e)) }) // 7:00 Uhr

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Noel OS Server · Port ${info.port} · Coach ${coachProvider()} · Mail-Sortierung ${mailProvider() === 'none' ? 'lokal' : mailProvider()} · Postfach ${MOCK_MAIL ? 'Mock' : imapAccounts().map((a) => a.name).join('+')}`)
  poll().catch((e) => console.error('initial poll', e)) // einmal beim Start
})
