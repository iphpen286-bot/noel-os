import { useEffect, useState } from 'react'
import { api, type Mailbox, type MailItem, type Health } from '../lib/api'
import { enablePush, pushPermission } from '../lib/push'
import Sheet from '../components/Sheet'
import { Segmented, Button } from '../components/ui'
import { haptic } from '../lib/haptics'
import './Mail.css'

type Cat = 'Wichtig' | 'Später' | 'Unwichtig'
const CATS: Cat[] = ['Wichtig', 'Später', 'Unwichtig']

function timeAgo(ts: number): string {
  const min = Math.max(0, Math.round((Date.now() - ts) / 60000))
  if (min < 1) return 'gerade'
  if (min < 60) return `vor ${min} Min`
  const h = Math.round(min / 60)
  if (h < 24) return `vor ${h} Std`
  return `vor ${Math.round(h / 24)} Tg`
}

export default function Mail() {
  const [box, setBox] = useState<Mailbox | null>(null)
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState(false)
  const [tab, setTab] = useState<Cat>('Wichtig')
  const [sel, setSel] = useState<MailItem | null>(null)
  const [perm, setPerm] = useState(pushPermission())

  const load = async () => {
    try {
      const [h, b] = await Promise.all([api.health(), api.mails()])
      setHealth(h); setBox(b); setError(false)
    } catch { setError(true) }
  }
  useEffect(() => { load() }, [])

  const correct = async (m: MailItem, category: Cat) => {
    haptic.success()
    await api.correct(m.id, category)
    setSel(null)
    await load()
  }

  const onPush = async () => {
    const r = await enablePush()
    setPerm(pushPermission())
    if (r === 'unsupported') alert('Push wird hier nicht unterstützt. Auf dem iPhone: App erst zum Home-Bildschirm hinzufügen.')
  }

  if (error) {
    return (
      <main className="scroll">
        <header style={{ padding: 'var(--sp-5) var(--sp-1) var(--sp-4)' }}><h1 className="display">Mail</h1></header>
        <div className="card">
          <p className="caption" style={{ marginBottom: 8 }}>Noch nicht verbunden</p>
          <p className="body secondary">Der Mail-Server läuft noch nicht. In Phase 4 richten wir GMX/Gmail (App-Passwörter) ein und starten den Server — dann erscheinen hier deine sortierten Mails.</p>
        </div>
      </main>
    )
  }

  const list = box?.[tab] ?? []

  return (
    <main className="scroll">
      <header className="mail-head">
        <h1 className="display">Mail</h1>
        {health && (
          <span className="mail-status footnote">
            {health.mockMail ? 'Demo-Daten' : health.accounts.join(' · ')} · Sortierung {health.mailAi === 'none' ? 'lokal (privat)' : health.mailAi}
          </span>
        )}
      </header>

      {perm !== 'granted' && (
        <button className="push-banner press" onClick={onPush}>
          🔔 Push für wichtige Mails aktivieren
        </button>
      )}

      <div style={{ margin: 'var(--sp-2) 0 var(--sp-4)' }}>
        <Segmented
          options={CATS.map((c) => ({ label: `${c} ${box ? (box[c]?.length ?? 0) : ''}`.trim(), value: c }))}
          value={tab}
          onChange={setTab}
        />
      </div>

      {!box ? (
        <p className="footnote" style={{ padding: '0 var(--sp-1)' }}>Lädt …</p>
      ) : list.length === 0 ? (
        <p className="footnote" style={{ padding: '0 var(--sp-1)' }}>Keine Mails in „{tab}".</p>
      ) : (
        <div className="mail-list-full">
          {list.map((m) => (
            <button key={m.id} className="mail-card-full press" onClick={() => setSel(m)}>
              <div className="mail-row-top">
                <span className="mail-from">{m.from}</span>
                <span className="mail-time footnote">{timeAgo(m.date)}</span>
              </div>
              <p className="mail-subj">{m.subject}</p>
              <p className="mail-summary">{m.summary}</p>
              <p className="mail-reason caption">{m.reason}</p>
            </button>
          ))}
        </div>
      )}

      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)} title="Einordnung ändern">
        {sel && (
          <>
            <p className="body" style={{ marginBottom: 4 }}>{sel.subject}</p>
            <p className="footnote" style={{ marginBottom: 'var(--sp-4)' }}>{sel.from} · aktuell „{sel.category}"</p>
            <p className="caption" style={{ marginBottom: 'var(--sp-2)' }}>Verschieben nach — und merken</p>
            <div className="reclass-btns">
              {CATS.filter((c) => c !== sel.category).map((c) => (
                <Button key={c} variant="ghost" full onClick={() => correct(sel, c)}>{c}</Button>
              ))}
            </div>
            <p className="footnote" style={{ marginTop: 'var(--sp-3)' }}>Ich merke mir diesen Absender und sortiere ihn künftig automatisch so.</p>
          </>
        )}
      </Sheet>
    </main>
  )
}
