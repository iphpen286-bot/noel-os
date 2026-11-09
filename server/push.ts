import { createRequire } from 'node:module'
import { Push } from './db'
const require = createRequire(import.meta.url)
const webpush = require('web-push')

export type PushPayload = { title: string; body: string; tag?: string; url?: string }

export async function sendToAll(payload: PushPayload) {
  const subs = Push.all()
  const data = JSON.stringify(payload)
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          data,
        )
      } catch (e: unknown) {
        const code = (e as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) Push.remove(s.endpoint) // Abo abgelaufen
      }
    }),
  )
}
