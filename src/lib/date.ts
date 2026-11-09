const WEEKDAYS = [
  'Sonntag', 'Montag', 'Dienstag', 'Mittwoch',
  'Donnerstag', 'Freitag', 'Samstag',
]
export const WEEKDAYS_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli',
  'August', 'September', 'Oktober', 'November', 'Dezember',
]

/** Fortlaufende Tageszahl (lokal) — Grundlage für „ändert sich um 0 Uhr". */
export function dayNumber(d = new Date()): number {
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.floor(local.getTime() / 86_400_000)
}

/** Lokaler Datums-Schlüssel YYYY-MM-DD (Grundlage für History/Logs). */
export function dateKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Montag-basierter Wochenschlüssel, z. B. "2026-W46". */
export function weekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = (date.getUTCDay() + 6) % 7 // Mo=0
  date.setUTCDate(date.getUTCDate() - dayNum + 3) // Donnerstag der Woche
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4))
  const week =
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / 86_400_000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    )
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export function formatToday(d = new Date()): string {
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`
}

export function greeting(d = new Date()): string {
  const h = d.getHours()
  if (h < 5) return 'Gute Nacht'
  if (h < 11) return 'Guten Morgen'
  if (h < 17) return 'Guten Tag'
  if (h < 22) return 'Guten Abend'
  return 'Gute Nacht'
}
