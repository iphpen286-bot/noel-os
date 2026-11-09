import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/store'
import { api } from '../lib/api'
import { todaysTasks, doneOn, weeklyDiscipline } from '../lib/tasks'
import { dateKey } from '../lib/date'
import { haptic } from '../lib/haptics'
import './Coach.css'

type Msg = { role: 'user' | 'assistant'; content: string }

export default function Coach() {
  const store = useStore()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [importantMails, setImportantMails] = useState(0)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.coachHistory().then((h) => {
      setMsgs(h.messages.length ? h.messages : [{ role: 'assistant', content: 'Servus! Ich bin dein Coach. Frag mich zu Training, Ernährung oder deinem Tag — ich kenne deine Daten.' }])
    }).catch(() => setMsgs([{ role: 'assistant', content: 'Servus! (Server noch nicht verbunden — ab Phase 4 mit vollem Claude-Coach. Frag trotzdem schon mal.)' }]))
    api.mails().then((b) => setImportantMails(b.Wichtig.length)).catch(() => {})
  }, [])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, busy])

  const buildContext = () => {
    const list = todaysTasks(store.tasks)
    const done = list.filter((t) => doneOn(t, new Date())).length
    const key = dateKey()
    const foods = store.foods.filter((f) => f.date === key)
    const last = store.sessions[store.sessions.length - 1]
    return {
      profile: {
        weightKg: store.profile.weightKg, kcalGoal: store.profile.kcalGoal,
        proteinGoal: store.profile.proteinGoal, trainingDays: store.profile.trainingDays,
        maxPullups: store.profile.maxPullups,
      },
      todayTasksDone: done, todayTasksTotal: list.length,
      weeklyDiscipline: weeklyDiscipline(store.tasks),
      kcalToday: foods.reduce((s, f) => s + f.kcal, 0),
      proteinToday: foods.reduce((s, f) => s + f.protein, 0),
      lastSession: last ? `${last.dayName} am ${last.date}` : undefined,
      importantMails,
    }
  }

  const send = async () => {
    const text = input.trim()
    if (!text || busy) return
    haptic.tap()
    const next: Msg[] = [...msgs, { role: 'user', content: text }]
    setMsgs(next); setInput(''); setBusy(true)
    try {
      const { reply } = await api.coachSend(next.filter((m) => m.role === 'user' || m.role === 'assistant'), buildContext())
      setMsgs([...next, { role: 'assistant', content: reply }])
    } catch {
      setMsgs([...next, { role: 'assistant', content: 'Ich bin gerade nicht erreichbar (Server läuft noch nicht). Sobald er in Phase 4 steht, antworte ich mit vollem Kontext.' }])
    } finally { setBusy(false) }
  }

  return (
    <main className="coach">
      <header className="coach-head">
        <h1 className="title">Coach</h1>
      </header>
      <div className="coach-msgs">
        {msgs.map((m, i) => (
          <div key={i} className={'bubble ' + m.role}>{m.content}</div>
        ))}
        {busy && <div className="bubble assistant typing"><span></span><span></span><span></span></div>}
        <div ref={endRef} />
      </div>
      <div className="coach-input">
        <textarea
          className="coach-field"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Frag deinen Coach …"
          rows={1}
        />
        <button className="coach-send press" onClick={send} disabled={!input.trim() || busy} aria-label="Senden">↑</button>
      </div>
    </main>
  )
}
