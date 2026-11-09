import type { Task } from '../store/types'
import { addDays, dateKey, weekKey } from './date'

export function doneOn(task: Task, d: Date): boolean {
  return task.history[dateKey(d)] === true
}

export function doneCountInWeek(task: Task, d: Date): number {
  const wk = weekKey(d)
  let n = 0
  for (const [key, v] of Object.entries(task.history)) {
    if (v && weekKey(new Date(key.split('-').map(Number)[0], +key.split('-')[1] - 1, +key.split('-')[2])) === wk) n++
  }
  return n
}

/** Ist die Aufgabe heute (an diesem Datum) fällig / relevant für die Liste? */
export function isDueToday(task: Task, today = new Date()): boolean {
  if (task.paused) return false
  switch (task.rhythm.type) {
    case 'daily':
      return true
    case 'weekdays':
      return task.rhythm.days.includes(today.getDay())
    case 'xPerWeek':
      return doneOn(task, today) || doneCountInWeek(task, today) < task.rhythm.perWeek
  }
}

/** Fällig an einem beliebigen Tag (für die Streak-Rückrechnung, Tages-Rhythmen). */
function isDueOn(task: Task, d: Date): boolean {
  switch (task.rhythm.type) {
    case 'daily':
      return true
    case 'weekdays':
      return task.rhythm.days.includes(d.getDay())
    case 'xPerWeek':
      return true
  }
}

/** Streak pro Aufgabe. 1 Joker pro Woche schützt einen verpassten Tag.
 *  Rückgabe in Tagen (daily/weekdays) bzw. Wochen (xPerWeek). */
export function computeStreak(task: Task, today = new Date()): { value: number; unit: 'd' | 'w' } {
  if (task.rhythm.type === 'xPerWeek') {
    const perWeek = task.rhythm.perWeek
    let streak = 0
    for (let w = 0; w < 200; w++) {
      const date = addDays(today, -7 * w)
      const cnt = doneCountInWeek(task, date)
      if (cnt >= perWeek) streak++
      else if (w === 0) continue // laufende Woche zählt noch nicht als Bruch
      else break
    }
    return { value: streak, unit: 'w' }
  }

  let streak = 0
  const jokerByWeek: Record<string, number> = {}
  for (let i = 0; i < 400; i++) {
    const date = addDays(today, -i)
    if (!isDueOn(task, date)) continue
    const done = doneOn(task, date)
    if (done) {
      streak++
      continue
    }
    if (i === 0) continue // heute noch offen → kein Bruch
    const wk = weekKey(date)
    const used = jokerByWeek[wk] ?? 0
    if (used < 1) {
      jokerByWeek[wk] = used + 1 // Joker rettet den Tag
      continue
    }
    break
  }
  return { value: streak, unit: 'd' }
}

/** Heutige Aufgaben: offene zuerst (nach order), erledigte sinken nach unten. */
export function todaysTasks(tasks: Task[], today = new Date()): Task[] {
  return tasks
    .filter((t) => isDueToday(t, today))
    .sort((a, b) => {
      const da = doneOn(a, today) ? 1 : 0
      const db = doneOn(b, today) ? 1 : 0
      if (da !== db) return da - db
      return a.order - b.order
    })
}

/** Disziplin-Wert der laufenden Woche (Mo–heute): erledigt / fällig in %. */
export function weeklyDiscipline(tasks: Task[], today = new Date()): number {
  const dow = (today.getDay() + 6) % 7 // Mo=0
  let due = 0
  let done = 0
  for (let i = 0; i <= dow; i++) {
    const date = addDays(today, -(dow - i))
    for (const t of tasks) {
      if (t.paused) continue
      if (!isDueOn(t, date)) continue
      if (t.rhythm.type === 'xPerWeek') continue // wöchentlich separat gewertet
      due++
      if (doneOn(t, date)) done++
    }
  }
  return due === 0 ? 0 : Math.round((done / due) * 100)
}

export function rhythmLabel(task: Task): string {
  const names = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
  switch (task.rhythm.type) {
    case 'daily':
      return 'Täglich'
    case 'weekdays':
      return task.rhythm.days.length === 7
        ? 'Täglich'
        : task.rhythm.days.map((d) => names[d]).join(' · ')
    case 'xPerWeek':
      return `${task.rhythm.perWeek}× pro Woche`
  }
}
