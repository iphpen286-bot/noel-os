import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Profile, Task, Rhythm, FoodEntry, FavFood, WeightEntry, SessionLog, QuoteState,
} from './types'
import { dateKey } from '../lib/date'
import { computeGoals, buildPlan, EXERCISES, type PlanDay, type Target } from '../lib/calc'

const uid = () => Math.random().toString(36).slice(2, 10)

const DEFAULT_PROFILE: Profile = {
  onboarded: false,
  name: '',
  sex: 'm',
  age: 19,
  heightCm: 178,
  weightKg: 65,
  maxPushups: 25,
  maxPullups: 5,
  maxDips: 10,
  equipment: ['pullupBar', 'dipBars'],
  trainingDays: 3,
  foodLikes: '',
  foodDislikes: '',
  kcalGoal: 2850,
  proteinGoal: 125,
}

/** Trainingstage (0=So..6=Sa) je nach Anzahl. */
export function scheduleDays(trainingDays: number): number[] {
  return trainingDays >= 4 ? [1, 2, 4, 5] : [1, 3, 5]
}

function seedTasks(profile: Profile): Task[] {
  const now = new Date().toISOString()
  const train = scheduleDays(profile.trainingDays)
  const rest = [0, 1, 2, 3, 4, 5, 6].filter((d) => !train.includes(d))
  let order = 0
  const mk = (
    title: string,
    rhythm: Rhythm,
    auto: Task['auto'] = null,
    reminder: string | null = null,
  ): Task => ({
    id: uid(), title, rhythm, reminder, paused: false, order: order++, auto,
    createdAt: now, history: {},
  })

  return [
    // Disziplin-Startliste (anpassbar)
    mk('Bett machen', { type: 'daily' }),
    mk('Zimmer 10 Minuten aufräumen', { type: 'daily' }),
    mk('Schreibtisch frei', { type: 'daily' }),
    mk('Wäsche wegräumen', { type: 'xPerWeek', perWeek: 2 }),
    mk('2,5 L Wasser trinken', { type: 'daily' }),
    mk('15 Minuten lernen oder lesen', { type: 'daily' }),
    mk('Handy ab 23 Uhr weg', { type: 'daily' }, null, '23:00'),
    mk('7–8 Stunden Schlaf', { type: 'daily' }),
    // Auto-Fitness-Aufgaben
    mk('Protein-Ziel erreicht', { type: 'daily' }, 'protein'),
    mk('Training', { type: 'weekdays', days: train }, 'training'),
    mk('10 Minuten Mobility', { type: 'weekdays', days: rest }, 'mobility'),
    mk('8.000 Schritte', { type: 'weekdays', days: rest }, 'steps'),
  ]
}

type State = {
  profile: Profile
  tasks: Task[]
  foods: FoodEntry[]
  favFoods: FavFood[]
  weights: WeightEntry[]
  sessions: SessionLog[]
  plan: PlanDay[]
  targets: Record<string, Target>
  quotes: QuoteState

  // Onboarding / Profil
  completeOnboarding: (p: Partial<Profile>) => void
  updateProfile: (p: Partial<Profile>) => void

  // Aufgaben
  toggleTask: (id: string, d?: Date) => void
  addTask: (title: string, rhythm: Rhythm, reminder?: string | null) => void
  editTask: (id: string, patch: Partial<Pick<Task, 'title' | 'rhythm' | 'reminder'>>) => void
  setPaused: (id: string, paused: boolean) => void
  deleteTask: (id: string) => void
  moveTask: (id: string, dir: -1 | 1) => void

  // Ernährung
  addFood: (name: string, kcal: number, protein: number, saveFav?: boolean) => void
  removeFood: (id: string) => void
  removeFav: (id: string) => void

  // Gewicht
  addWeight: (kg: number, d?: Date) => void

  // Training
  logSession: (dayName: string, exercises: SessionLog['exercises']) => void

  // Zitate
  toggleFavQuote: (key: string) => void
  addCustomQuote: (text: string, author: string) => void
}

function syncProtein(state: State): Task[] {
  const key = dateKey()
  const todayProtein = state.foods
    .filter((f) => f.date === key)
    .reduce((s, f) => s + f.protein, 0)
  return state.tasks.map((t) =>
    t.auto === 'protein'
      ? { ...t, history: { ...t.history, [key]: todayProtein >= state.profile.proteinGoal } }
      : t,
  )
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PROFILE,
      tasks: [],
      foods: [],
      favFoods: [],
      weights: [],
      sessions: [],
      plan: [],
      targets: {},
      quotes: { favorites: [], custom: [] },

      completeOnboarding: (p) => {
        const profile: Profile = { ...get().profile, ...p, onboarded: true }
        const goals = computeGoals(profile)
        profile.kcalGoal = goals.kcalGoal
        profile.proteinGoal = goals.proteinGoal
        const { days, targets } = buildPlan(profile)
        set({
          profile,
          plan: days,
          targets,
          tasks: get().tasks.length ? get().tasks : seedTasks(profile),
          weights: get().weights.length ? get().weights : [{ date: dateKey(), kg: profile.weightKg }],
        })
      },

      updateProfile: (p) => {
        const profile = { ...get().profile, ...p }
        const goals = computeGoals(profile)
        profile.kcalGoal = goals.kcalGoal
        profile.proteinGoal = goals.proteinGoal
        set({ profile })
      },

      toggleTask: (id, d = new Date()) => {
        const key = dateKey(d)
        set({
          tasks: get().tasks.map((t) =>
            t.id === id ? { ...t, history: { ...t.history, [key]: !t.history[key] } } : t,
          ),
        })
      },

      addTask: (title, rhythm, reminder = null) => {
        const order = get().tasks.reduce((m, t) => Math.max(m, t.order), -1) + 1
        const task: Task = {
          id: uid(), title, rhythm, reminder, paused: false, order, auto: null,
          createdAt: new Date().toISOString(), history: {},
        }
        set({ tasks: [...get().tasks, task] })
      },

      editTask: (id, patch) =>
        set({ tasks: get().tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }),

      setPaused: (id, paused) =>
        set({ tasks: get().tasks.map((t) => (t.id === id ? { ...t, paused } : t)) }),

      deleteTask: (id) => set({ tasks: get().tasks.filter((t) => t.id !== id) }),

      moveTask: (id, dir) => {
        const tasks = [...get().tasks].sort((a, b) => a.order - b.order)
        const i = tasks.findIndex((t) => t.id === id)
        const j = i + dir
        if (i < 0 || j < 0 || j >= tasks.length) return
        const oi = tasks[i].order
        tasks[i] = { ...tasks[i], order: tasks[j].order }
        tasks[j] = { ...tasks[j], order: oi }
        set({ tasks })
      },

      addFood: (name, kcal, protein, saveFav) => {
        const entry: FoodEntry = { id: uid(), date: dateKey(), name, kcal, protein }
        const favFoods = saveFav
          ? [...get().favFoods, { id: uid(), name, kcal, protein } as FavFood]
          : get().favFoods
        set({ foods: [...get().foods, entry], favFoods })
        set({ tasks: syncProtein(get()) })
      },

      removeFood: (id) => {
        set({ foods: get().foods.filter((f) => f.id !== id) })
        set({ tasks: syncProtein(get()) })
      },

      removeFav: (id) => set({ favFoods: get().favFoods.filter((f) => f.id !== id) }),

      addWeight: (kg, d = new Date()) => {
        const key = dateKey(d)
        const weights = get().weights.filter((w) => w.date !== key)
        weights.push({ date: key, kg })
        weights.sort((a, b) => a.date.localeCompare(b.date))
        set({ weights })
        get().updateProfile({ weightKg: kg })
      },

      logSession: (dayName, exercises) => {
        const key = dateKey()
        const session: SessionLog = { id: uid(), date: key, dayName, exercises }
        // automatische Progression: alle Sätze >= Ziel → Ziel +1 (reps) / +5 (sec)
        const targets = { ...get().targets }
        for (const ex of exercises) {
          const t = targets[ex.exerciseId]
          if (!t || ex.sets.length === 0) continue
          const allHit = ex.sets.every((s) => s.reps >= t.reps)
          if (allHit) {
            const unit = EXERCISES[ex.exerciseId]?.unit ?? 'reps'
            targets[ex.exerciseId] = { ...t, reps: t.reps + (unit === 'sec' ? 5 : 1) }
          }
        }
        // Trainings-Aufgabe heute automatisch abhaken
        const tasks = get().tasks.map((t) =>
          t.auto === 'training' ? { ...t, history: { ...t.history, [key]: true } } : t,
        )
        set({ sessions: [...get().sessions, session], targets, tasks })
      },

      toggleFavQuote: (keyStr) => {
        const favs = get().quotes.favorites
        set({
          quotes: {
            ...get().quotes,
            favorites: favs.includes(keyStr) ? favs.filter((f) => f !== keyStr) : [...favs, keyStr],
          },
        })
      },

      addCustomQuote: (text, author) =>
        set({ quotes: { ...get().quotes, custom: [...get().quotes.custom, { text, author }] } }),
    }),
    { name: 'noel-os', version: 2 },
  ),
)
