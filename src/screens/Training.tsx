import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/store'
import { EXERCISES, todaysSession, type PlanDay } from '../lib/calc'
import type { SetLog } from '../store/types'
import { dateKey } from '../lib/date'
import Sheet from '../components/Sheet'
import { Button, Segmented } from '../components/ui'
import { haptic } from '../lib/haptics'
import './Training.css'

const RPE = [{ label: 'Leicht', value: 7 }, { label: 'Mittel', value: 8 }, { label: 'Schwer', value: 9 }]

function RestTimer() {
  const [left, setLeft] = useState(0)
  const ref = useRef<number | null>(null)
  useEffect(() => () => { if (ref.current) clearInterval(ref.current) }, [])
  const start = (sec: number) => {
    haptic.tap()
    if (ref.current) clearInterval(ref.current)
    setLeft(sec)
    ref.current = window.setInterval(() => {
      setLeft((l) => {
        if (l <= 1) { if (ref.current) clearInterval(ref.current); haptic.success(); return 0 }
        return l - 1
      })
    }, 1000)
  }
  return (
    <div className="rest">
      <div className="rest-display num">{left > 0 ? `${left}s` : 'Pause'}</div>
      <div className="rest-btns">
        <button className="rest-b press" onClick={() => start(60)}>60s</button>
        <button className="rest-b press" onClick={() => start(90)}>90s</button>
        <button className="rest-b press" onClick={() => start(120)}>120s</button>
      </div>
    </div>
  )
}

export default function Training() {
  const plan = useStore((s) => s.plan)
  const targets = useStore((s) => s.targets)
  const profile = useStore((s) => s.profile)
  const sessions = useStore((s) => s.sessions)
  const logSession = useStore((s) => s.logSession)

  const today = new Date()
  const session = todaysSession(plan, today.getDay(), profile.trainingDays)
  const loggedToday = sessions.some((s) => s.date === dateKey() && s.dayName === session?.name)

  const [logging, setLogging] = useState(false)
  const [logs, setLogs] = useState<Record<string, SetLog[]>>({})

  const startLogging = (day: PlanDay) => {
    const init: Record<string, SetLog[]> = {}
    for (const id of day.exerciseIds) {
      const t = targets[id] ?? { sets: 3, reps: 10 }
      init[id] = Array.from({ length: t.sets }, () => ({ reps: t.reps, rpe: 8 }))
    }
    setLogs(init)
    setLogging(true)
  }

  const setRep = (id: string, i: number, delta: number) => {
    haptic.soft()
    setLogs((l) => ({ ...l, [id]: l[id].map((s, j) => j === i ? { ...s, reps: Math.max(0, s.reps + delta) } : s) }))
  }
  const setRpe = (id: string, i: number, rpe: number) =>
    setLogs((l) => ({ ...l, [id]: l[id].map((s, j) => j === i ? { ...s, rpe } : s) }))

  const finish = () => {
    if (!session) return
    const exercises = session.exerciseIds.map((id) => ({
      exerciseId: id, name: EXERCISES[id]?.name ?? id, sets: logs[id] ?? [],
    }))
    logSession(session.name, exercises)
    haptic.success()
    setLogging(false)
  }

  // Skill-Ziele
  const skills = [
    { name: '10 Klimmzüge', cur: profile.maxPullups, goal: 10 },
    { name: '15 Klimmzüge', cur: profile.maxPullups, goal: 15 },
    { name: 'L-Sit 20 Sek.', cur: targets['lsit']?.reps ?? 0, goal: 20 },
    { name: 'Muscle-up', cur: profile.maxPullups >= 12 ? 1 : 0, goal: 1 },
  ]

  return (
    <main className="scroll">
      <header style={{ padding: 'var(--sp-5) var(--sp-1) var(--sp-4)' }}>
        <h1 className="display">Training</h1>
      </header>

      {session ? (
        <div className={'card today-session' + (loggedToday ? ' done' : '')}>
          <div className="card-head">
            <p className="caption">Heute · {session.focus}</p>
            {loggedToday && <span className="chip num">✓ erledigt</span>}
          </div>
          <p className="title" style={{ marginBottom: 'var(--sp-3)' }}>{session.name}</p>
          <div className="ex-preview">
            {session.exerciseIds.map((id) => {
              const t = targets[id] ?? { sets: 3, reps: 10 }
              const unit = EXERCISES[id]?.unit === 'sec' ? 's' : ''
              return (
                <div key={id} className="ex-line">
                  <span>{EXERCISES[id]?.name ?? id}</span>
                  <span className="num ex-scheme">{t.sets}×{t.reps}{unit}</span>
                </div>
              )
            })}
          </div>
          {!loggedToday && (
            <div style={{ marginTop: 'var(--sp-4)' }}>
              <Button full onClick={() => startLogging(session)}>Training starten</Button>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <p className="caption" style={{ marginBottom: 6 }}>Heute</p>
          <p className="title" style={{ marginBottom: 6 }}>Ruhetag</p>
          <p className="body secondary">10 Minuten Mobility + 8.000 Schritte. Erholung ist Teil des Plans.</p>
        </div>
      )}

      <section className="tr-section">
        <p className="caption tr-label">Dein Plan · {profile.trainingDays}× / Woche</p>
        <div className="plan-list">
          {plan.map((d) => (
            <div key={d.name} className="plan-day">
              <div className="plan-day-head">
                <span className="plan-name">{d.name}</span>
                <span className="footnote">{d.focus}</span>
              </div>
              <p className="plan-ex secondary">
                {d.exerciseIds.map((id) => EXERCISES[id]?.name ?? id).join(' · ')}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="tr-section">
        <p className="caption tr-label">Skill-Ziele</p>
        <div className="skill-list">
          {skills.map((s) => {
            const pct = Math.min(1, s.cur / s.goal)
            const reached = s.cur >= s.goal
            return (
              <div key={s.name} className="skill">
                <div className="skill-top">
                  <span className="skill-name">{s.name}</span>
                  <span className="num skill-val">{reached ? '✓' : `${s.cur}/${s.goal}`}</span>
                </div>
                <div className="bar"><span style={{ width: `${pct * 100}%` }} /></div>
              </div>
            )
          })}
        </div>
      </section>

      <Sheet open={logging} onOpenChange={setLogging} title={session ? `${session.name} loggen` : 'Training'}>
        <RestTimer />
        {session?.exerciseIds.map((id) => {
          const def = EXERCISES[id]
          const unit = def?.unit === 'sec' ? 'Sek.' : 'Whd.'
          return (
            <div key={id} className="log-ex">
              <div className="log-ex-head">
                <span className="log-ex-name">{def?.name ?? id}</span>
                <span className="footnote">{def?.cue}</span>
              </div>
              {(logs[id] ?? []).map((set, i) => (
                <div key={i} className="log-set">
                  <span className="log-set-no caption">Satz {i + 1}</span>
                  <div className="log-reps">
                    <button className="log-step press" onClick={() => setRep(id, i, -1)}>−</button>
                    <span className="num log-reps-val">{set.reps} <span className="log-unit">{unit}</span></span>
                    <button className="log-step press" onClick={() => setRep(id, i, 1)}>+</button>
                  </div>
                  <div className="log-rpe">
                    <Segmented options={RPE} value={set.rpe} onChange={(v) => setRpe(id, i, v)} />
                  </div>
                </div>
              ))}
            </div>
          )
        })}
        <div style={{ marginTop: 'var(--sp-4)' }}>
          <Button full onClick={finish}>Training abschließen</Button>
        </div>
      </Sheet>
    </main>
  )
}
