import { Link } from 'react-router-dom'
import { useStore } from '../store/store'
import Ring from '../components/Ring'
import Icon from '../components/Icon'
import QuoteHero from '../components/QuoteHero'
import { todaysTasks, doneOn } from '../lib/tasks'
import { todaysSession } from '../lib/calc'
import { EXERCISES } from '../lib/calc'
import { dateKey } from '../lib/date'
import { haptic } from '../lib/haptics'
import './Dashboard.css'

// Beispiel-Mails bis Phase 3 (Server/IMAP)
const mails = [
  { from: 'Hochschule', subject: 'Zusage Immatrikulation — Rückmeldung bis Fr.', why: 'Frist diese Woche' },
  { from: 'Dr. Weber', subject: 'Terminbestätigung Montag 14:30', why: 'Bestätigung nötig' },
]

export default function Dashboard() {
  const tasks = useStore((s) => s.tasks)
  const toggleTask = useStore((s) => s.toggleTask)
  const profile = useStore((s) => s.profile)
  const foods = useStore((s) => s.foods)
  const plan = useStore((s) => s.plan)

  const list = todaysTasks(tasks)
  const total = list.length
  const done = list.filter((t) => doneOn(t, new Date())).length
  const open = list.filter((t) => !doneOn(t, new Date())).slice(0, 4)
  const taskPct = total ? done / total : 0

  const session = todaysSession(plan, new Date().getDay(), profile.trainingDays)

  const key = dateKey()
  const todayFoods = foods.filter((f) => f.date === key)
  const kcal = todayFoods.reduce((s, f) => s + f.kcal, 0)
  const protein = todayFoods.reduce((s, f) => s + f.protein, 0)
  const kcalPct = Math.min(1, kcal / profile.kcalGoal)
  const proteinPct = Math.min(1, protein / profile.proteinGoal)

  const coachLine =
    done >= total && total > 0
      ? 'Alle Aufgaben erledigt. Starker Tag — genau so baust du das auf.'
      : `Noch ${total - done} ${total - done === 1 ? 'Aufgabe' : 'Aufgaben'} offen${protein < profile.proteinGoal ? ' und dein Protein — dann ist der Tag sauber.' : '. Protein sitzt schon.'}`

  return (
    <main className="scroll">
      <div className="dash stagger">
        <QuoteHero />

        {/* Tagesaufgaben — mit Fortschrittsring, direkt abhakbar */}
        <div className="card">
          <Link to="/aufgaben" className="row-card press" style={{ marginBottom: open.length ? 'var(--sp-4)' : 0 }}>
            <Ring value={taskPct} size={72}>
              <div className="ring-center">
                <span className="num ring-num">{done}</span>
                <span className="num ring-denom secondary">/{total}</span>
              </div>
            </Ring>
            <div className="row-body">
              <p className="caption">Tagesaufgaben</p>
              <p className="headline">{total - done === 0 ? 'Alles erledigt' : `Noch ${total - done} offen heute`}</p>
              <p className="footnote">Alle anzeigen</p>
            </div>
            <Icon name="chevron" size={20} />
          </Link>

          {open.length > 0 && (
            <div className="dash-tasks">
              {open.map((t) => (
                <div key={t.id} className="dash-task">
                  <button
                    className="task-check press"
                    onClick={() => { haptic.success(); toggleTask(t.id) }}
                    aria-label={`${t.title} abhaken`}
                  />
                  <span className="dash-task-title">{t.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Heutiges Training */}
        <Link to="/training" className="card press training-card">
          <div className="card-head">
            <p className="caption">Heutiges Training</p>
            {session ? <span className="chip num">{session.name}</span> : <span className="chip">Ruhetag</span>}
          </div>
          {session ? (
            <>
              <p className="title training-title">{session.focus}</p>
              <div className="exercise-list">
                {session.exerciseIds.slice(0, 3).map((id, i) => (
                  <span key={id} className="exercise" style={{ display: 'inline-flex', gap: 2 }}>
                    {i > 0 && <span className="dot" style={{ marginRight: 6 }} />}
                    {EXERCISES[id]?.name ?? id}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="body secondary" style={{ marginTop: 4 }}>10 Min Mobility + 8.000 Schritte. Erholung zählt.</p>
          )}
        </Link>

        {/* Kalorien & Protein */}
        <div className="two-col">
          <Link to="/essen" className="card press stat">
            <div className="stat-head"><Icon name="flame" size={18} /><span className="caption">Kalorien</span></div>
            <p className="num stat-num">{kcal.toLocaleString('de-DE')}</p>
            <p className="footnote">von {profile.kcalGoal.toLocaleString('de-DE')} kcal</p>
            <div className="bar"><span style={{ width: `${kcalPct * 100}%` }} /></div>
          </Link>
          <Link to="/essen" className="card press stat">
            <div className="stat-head"><Icon name="bolt" size={18} /><span className="caption">Protein</span></div>
            <p className="num stat-num">{protein} g</p>
            <p className="footnote">von {profile.proteinGoal} g</p>
            <div className="bar"><span style={{ width: `${proteinPct * 100}%` }} /></div>
          </Link>
        </div>

        {/* Wichtige Mails (Beispiel bis Phase 3) */}
        <Link to="/mail" className="card press mail-card">
          <div className="card-head">
            <p className="caption">Wichtige Mails</p>
            <span className="chip num">Beispiel</span>
          </div>
          <ul className="mail-list">
            {mails.map((m, i) => (
              <li key={i} className="mail-item">
                <span className="mail-dot" />
                <div className="mail-body">
                  <p className="mail-subject">{m.subject}</p>
                  <p className="footnote">{m.from} · {m.why}</p>
                </div>
              </li>
            ))}
          </ul>
        </Link>

        {/* Coach-Satz */}
        <Link to="/coach" className="coach-line press">
          <Icon name="coach" size={19} />
          <p className="body">{coachLine}</p>
        </Link>
      </div>
    </main>
  )
}
