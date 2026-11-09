import { useMemo, useState } from 'react'
import { useStore } from '../store/store'
import type { Task, Rhythm } from '../store/types'
import { todaysTasks, computeStreak, rhythmLabel, weeklyDiscipline, doneOn } from '../lib/tasks'
import { WEEKDAYS_SHORT } from '../lib/date'
import Icon from '../components/Icon'
import Ring from '../components/Ring'
import Sheet from '../components/Sheet'
import { Button, Segmented, Stepper, Chip, Field } from '../components/ui'
import { haptic } from '../lib/haptics'
import './Tasks.css'

function Check({ done, onClick }: { done: boolean; onClick: () => void }) {
  return (
    <button
      className={'task-check press' + (done ? ' on' : '')}
      aria-pressed={done}
      onClick={() => { done ? haptic.soft() : haptic.success(); onClick() }}
    >
      {done && <Icon name="check" size={18} strokeWidth={2.6} />}
    </button>
  )
}

function TaskRow({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const toggle = useStore((s) => s.toggleTask)
  const done = doneOn(task, new Date())
  const streak = computeStreak(task)
  return (
    <div className={'task-row' + (done ? ' done' : '')}>
      <Check done={done} onClick={() => toggle(task.id)} />
      <button className="task-main" onClick={onOpen}>
        <span className="task-title">{task.title}</span>
        <span className="task-sub">
          {rhythmLabel(task)}
          {streak.value > 0 && (
            <span className="streak"> · {streak.value}{streak.unit === 'w' ? ' Wochen' : '🔥'}</span>
          )}
          {task.auto && <span className="auto-badge">auto</span>}
        </span>
      </button>
    </div>
  )
}

const empty: { title: string; rhythm: Rhythm; reminder: string | null } = {
  title: '', rhythm: { type: 'daily' }, reminder: null,
}

export default function Tasks() {
  const tasks = useStore((s) => s.tasks)
  const addTask = useStore((s) => s.addTask)
  const editTask = useStore((s) => s.editTask)
  const setPaused = useStore((s) => s.setPaused)
  const deleteTask = useStore((s) => s.deleteTask)
  const moveTask = useStore((s) => s.moveTask)

  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [draft, setDraft] = useState(empty)

  const list = useMemo(() => todaysTasks(tasks), [tasks])
  const paused = tasks.filter((t) => t.paused)
  const discipline = weeklyDiscipline(tasks)
  const doneCount = list.filter((t) => doneOn(t, new Date())).length

  const openNew = () => { setEditId(null); setDraft(empty); setOpen(true) }
  const openEdit = (t: Task) => {
    setEditId(t.id)
    setDraft({ title: t.title, rhythm: t.rhythm, reminder: t.reminder })
    setOpen(true)
  }
  const save = () => {
    if (!draft.title.trim()) return
    if (editId) editTask(editId, draft)
    else addTask(draft.title.trim(), draft.rhythm, draft.reminder)
    setOpen(false)
  }

  const editing = editId ? tasks.find((t) => t.id === editId) : null

  return (
    <main className="scroll">
      <header className="tasks-head">
        <div>
          <h1 className="display">Aufgaben</h1>
          <p className="footnote">{doneCount}/{list.length} heute erledigt</p>
        </div>
        <Ring value={discipline / 100} size={62} stroke={6}>
          <span className="num disc-num">{discipline}<span className="disc-pct">%</span></span>
        </Ring>
      </header>

      <div className="task-list">
        {list.map((t) => <TaskRow key={t.id} task={t} onOpen={() => openEdit(t)} />)}
      </div>

      <button className="add-task press" onClick={openNew}>
        <span className="add-plus">+</span> Aufgabe hinzufügen
      </button>

      {paused.length > 0 && (
        <section className="paused-section">
          <p className="caption" style={{ padding: '0 var(--sp-1) var(--sp-2)' }}>Pausiert</p>
          {paused.map((t) => (
            <div key={t.id} className="task-row paused">
              <div className="task-check ghost" />
              <button className="task-main" onClick={() => openEdit(t)}>
                <span className="task-title">{t.title}</span>
                <span className="task-sub">{rhythmLabel(t)}</span>
              </button>
            </div>
          ))}
        </section>
      )}

      <Sheet open={open} onOpenChange={setOpen} title={editId ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}>
        <Field label="Titel">
          <input className="input" autoFocus value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="z. B. 10 Minuten meditieren" />
        </Field>

        <Field label="Rhythmus">
          <Segmented
            options={[{ label: 'Täglich', value: 'daily' }, { label: 'Wochentags', value: 'weekdays' }, { label: 'X/Woche', value: 'xPerWeek' }]}
            value={draft.rhythm.type}
            onChange={(type) => setDraft({
              ...draft,
              rhythm: type === 'daily' ? { type: 'daily' }
                : type === 'weekdays' ? { type: 'weekdays', days: [1, 2, 3, 4, 5] }
                : { type: 'xPerWeek', perWeek: 3 },
            })}
          />
        </Field>

        {draft.rhythm.type === 'weekdays' && (
          <div className="day-chips">
            {WEEKDAYS_SHORT.map((d, i) => {
              const days = (draft.rhythm as { type: 'weekdays'; days: number[] }).days
              const on = days.includes(i)
              return (
                <Chip key={i} label={d} active={on} onClick={() => {
                  const next = on ? days.filter((x) => x !== i) : [...days, i].sort()
                  setDraft({ ...draft, rhythm: { type: 'weekdays', days: next } })
                }} />
              )
            })}
          </div>
        )}

        {draft.rhythm.type === 'xPerWeek' && (
          <Field label="Mal pro Woche">
            <Stepper value={draft.rhythm.perWeek} min={1} max={7}
              onChange={(perWeek) => setDraft({ ...draft, rhythm: { type: 'xPerWeek', perWeek } })} />
          </Field>
        )}

        <Field label="Erinnerung (optional)">
          <input className="input" type="time" value={draft.reminder ?? ''}
            onChange={(e) => setDraft({ ...draft, reminder: e.target.value || null })} />
        </Field>

        <div style={{ marginTop: 'var(--sp-4)' }}>
          <Button full onClick={save}>{editId ? 'Speichern' : 'Hinzufügen'}</Button>
        </div>

        {editing && (
          <div className="edit-actions">
            <div className="move-row">
              <Button variant="ghost" onClick={() => moveTask(editing.id, -1)}>↑ Nach oben</Button>
              <Button variant="ghost" onClick={() => moveTask(editing.id, 1)}>↓ Nach unten</Button>
            </div>
            <Button variant="quiet" full onClick={() => { setPaused(editing.id, !editing.paused); setOpen(false) }}>
              {editing.paused ? 'Fortsetzen' : 'Pausieren'}
            </Button>
            {!editing.auto && (
              <Button variant="quiet" full onClick={() => { deleteTask(editing.id); setOpen(false) }}>
                <span className="danger">Löschen</span>
              </Button>
            )}
          </div>
        )}
      </Sheet>
    </main>
  )
}
