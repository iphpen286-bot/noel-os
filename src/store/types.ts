// ---------- Profil ----------
export type Equipment = 'pullupBar' | 'dipBars' | 'rings' | 'bands' | 'bench' | 'floorOnly'

export type Profile = {
  onboarded: boolean
  name: string
  sex: 'm' | 'f'
  age: number
  heightCm: number
  weightKg: number
  maxPushups: number
  maxPullups: number
  maxDips: number
  equipment: Equipment[]
  trainingDays: number // 3–4
  foodLikes: string
  foodDislikes: string
  // berechnet
  kcalGoal: number
  proteinGoal: number
}

// ---------- Aufgaben ----------
export type Rhythm =
  | { type: 'daily' }
  | { type: 'weekdays'; days: number[] } // 0=So … 6=Sa
  | { type: 'xPerWeek'; perWeek: number }

export type AutoKind = 'training' | 'mobility' | 'steps' | 'protein'

export type Task = {
  id: string
  title: string
  rhythm: Rhythm
  reminder: string | null // "HH:MM" oder null
  paused: boolean
  order: number
  auto: AutoKind | null // automatisch verwaltete Fitness-Aufgaben
  createdAt: string
  history: Record<string, boolean> // dateKey -> erledigt
}

// ---------- Ernährung ----------
export type FoodEntry = {
  id: string
  date: string // dateKey
  name: string
  kcal: number
  protein: number
}
export type FavFood = { id: string; name: string; kcal: number; protein: number }

// ---------- Gewicht ----------
export type WeightEntry = { date: string; kg: number }

// ---------- Training ----------
export type SetLog = { reps: number; rpe: number }
export type ExerciseLog = { exerciseId: string; name: string; sets: SetLog[] }
export type SessionLog = {
  id: string
  date: string
  dayName: string // z. B. "Pull"
  exercises: ExerciseLog[]
}

// ---------- Zitate ----------
export type QuoteState = {
  favorites: string[] // "author|text"
  custom: { text: string; author: string }[]
}
