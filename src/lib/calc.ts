import type { Profile, Equipment } from '../store/types'

// ---------------------------------------------------------------------------
// Ernährung — Bedarf aus Profildaten (Mifflin-St Jeor) + moderater Überschuss
// ---------------------------------------------------------------------------
export function computeGoals(p: {
  sex: 'm' | 'f'
  age: number
  heightCm: number
  weightKg: number
  trainingDays: number
}): { kcalGoal: number; proteinGoal: number } {
  const bmr =
    10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'm' ? 5 : -161)
  // Aktivitätsfaktor: leicht–moderat aktiv, skaliert mit Trainingstagen
  const activity = 1.42 + Math.min(4, p.trainingDays) * 0.03 // 3T≈1.51, 4T≈1.54
  const tdee = bmr * activity
  const kcalGoal = Math.round((tdee + 300) / 10) * 10 // moderater Aufbau-Überschuss
  const proteinGoal = Math.round((p.weightKg * 1.9) / 5) * 5 // ~1,9 g/kg
  return { kcalGoal, proteinGoal }
}

// ---------------------------------------------------------------------------
// Training — Übungsbibliothek + Plan-Generator
// ---------------------------------------------------------------------------
export type Unit = 'reps' | 'sec'
export type ExerciseDef = {
  id: string
  name: string
  cue: string
  unit: Unit
  skill?: boolean
}

export const EXERCISES: Record<string, ExerciseDef> = {
  pullups: { id: 'pullups', name: 'Klimmzüge', cue: 'Brust zur Stange, langsam ablassen', unit: 'reps' },
  rows: { id: 'rows', name: 'Ruderzüge', cue: 'Körper gerade, Schulterblätter zusammen', unit: 'reps' },
  bandRows: { id: 'bandRows', name: 'Band-Ruderzüge', cue: 'Ellbogen eng am Körper', unit: 'reps' },
  pushups: { id: 'pushups', name: 'Liegestütze', cue: 'Körperspannung, volle Range', unit: 'reps' },
  dips: { id: 'dips', name: 'Dips', cue: 'Schultern tief, Ellbogen nach hinten', unit: 'reps' },
  benchDips: { id: 'benchDips', name: 'Bank-Dips', cue: 'Hüfte nah an der Kante', unit: 'reps' },
  pike: { id: 'pike', name: 'Pike Push-ups', cue: 'Hüfte hoch, Kopf Richtung Boden', unit: 'reps' },
  squats: { id: 'squats', name: 'Kniebeugen', cue: 'Tief, Fersen am Boden', unit: 'reps' },
  splitSquat: { id: 'splitSquat', name: 'Bulgarian Split Squats', cue: 'Pro Bein, Knie stabil', unit: 'reps' },
  calf: { id: 'calf', name: 'Wadenheben', cue: 'Volle Streckung oben', unit: 'reps' },
  legRaise: { id: 'legRaise', name: 'Beinheben', cue: 'Kontrolliert, kein Schwung', unit: 'reps' },
  plank: { id: 'plank', name: 'Plank', cue: 'Gerade Linie, Bauch fest', unit: 'sec' },
  lsit: { id: 'lsit', name: 'L-Sit (Skill)', cue: 'Beine strecken, Schultern runter', unit: 'sec', skill: true },
}

export type PlanDay = { name: string; focus: string; exerciseIds: string[] }
export type Target = { sets: number; reps: number }

const has = (eq: Equipment[], ...want: Equipment[]) => want.some((w) => eq.includes(w))

/** Zielwerte je Übung aus den aktuellen Maxima ableiten. */
function targetsFor(p: Profile): Record<string, Target> {
  const rep = (max: number, factor = 0.7, min = 5) =>
    Math.max(min, Math.round(max * factor))
  return {
    pullups: { sets: 4, reps: Math.max(3, rep(p.maxPullups, 0.7, 3)) },
    rows: { sets: 4, reps: 10 },
    bandRows: { sets: 4, reps: 12 },
    pushups: { sets: 4, reps: rep(p.maxPushups, 0.7, 8) },
    dips: { sets: 3, reps: Math.max(5, rep(p.maxDips, 0.7, 5)) },
    benchDips: { sets: 3, reps: 12 },
    pike: { sets: 3, reps: 8 },
    squats: { sets: 3, reps: 20 },
    splitSquat: { sets: 3, reps: 12 },
    calf: { sets: 3, reps: 20 },
    legRaise: { sets: 3, reps: 12 },
    plank: { sets: 3, reps: 45 },
    lsit: { sets: 3, reps: 15 },
  }
}

/** Zugübung je nach Ausrüstung (Stange/Ringe → Klimmzüge, sonst Rudern). */
function pullId(eq: Equipment[]): string {
  return has(eq, 'pullupBar', 'rings') ? 'pullups' : 'bandRows'
}
function rowId(eq: Equipment[]): string {
  return has(eq, 'pullupBar', 'rings', 'bench') ? 'rows' : 'bandRows'
}
function dipId(eq: Equipment[]): string {
  return has(eq, 'dipBars', 'rings') ? 'dips' : 'benchDips'
}
function coreId(eq: Equipment[]): string {
  return has(eq, 'pullupBar', 'rings') ? 'legRaise' : 'legRaise'
}

export function buildPlan(p: Profile): { days: PlanDay[]; targets: Record<string, Target> } {
  const eq = p.equipment
  const pull = pullId(eq)
  const row = rowId(eq)
  const dip = dipId(eq)
  const core = coreId(eq)

  const dayPull: PlanDay = {
    name: 'Pull', focus: 'Rücken & Bizeps',
    exerciseIds: [pull, row, core, 'lsit'],
  }
  const dayPush: PlanDay = {
    name: 'Push', focus: 'Brust, Schultern & Trizeps',
    exerciseIds: ['pushups', dip, 'pike', 'plank'],
  }
  const dayLegs: PlanDay = {
    name: 'Beine & Core', focus: 'Beine & Rumpf',
    exerciseIds: ['squats', 'splitSquat', 'calf', core],
  }
  const dayUpper: PlanDay = {
    name: 'Upper', focus: 'Oberkörper komplett',
    exerciseIds: [pull, 'pushups', dip, 'pike'],
  }

  const days = p.trainingDays >= 4
    ? [dayPull, dayPush, dayLegs, dayUpper]
    : [dayPull, dayPush, dayLegs]

  // nur tatsächlich genutzte Übungen in die Zielwerte
  const all = targetsFor(p)
  const used = new Set(days.flatMap((d) => d.exerciseIds))
  const targets: Record<string, Target> = {}
  for (const id of used) targets[id] = all[id]
  return { days, targets }
}

/** Welche Einheit ist heute dran? (rotiert über Trainingstage der Woche) */
export function todaysSession(days: PlanDay[], dayIdxOfWeek: number, trainingDays: number): PlanDay | null {
  // Trainingstage gleichmäßig auf Mo–So verteilen
  const schedule = trainingDays >= 4 ? [1, 2, 4, 5] : [1, 3, 5] // Mo,(Di),Mi,(Do),Fr
  const pos = schedule.indexOf(dayIdxOfWeek)
  if (pos === -1) return null
  return days[pos % days.length] ?? null
}
