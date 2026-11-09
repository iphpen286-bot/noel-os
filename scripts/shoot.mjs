import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const BASE = 'http://localhost:4173'
const OUT = '/tmp/claude-0/-home-user/8a30d838-ba0f-57e0-9322-dbbfce3451de/scratchpad/shots'
await mkdir(OUT, { recursive: true })

const device = { viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const ctx = await browser.newContext({ ...device, colorScheme: 'dark' })
// fixe Zeit: Montag (Trainingstag), damit Logging sichtbar ist
await ctx.clock.install({ time: new Date('2026-11-09T10:30:00') })
const page = await ctx.newPage()
const shot = async (f) => { await page.waitForTimeout(650); await page.screenshot({ path: `${OUT}/${f}.png` }) }
const click = (name) => page.getByRole('button', { name, exact: false }).first().click()

// 1) Onboarding
await page.goto(BASE + '/', { waitUntil: 'networkidle' })
await shot('p2-onboarding')

// durchklicken (Standard-Werte übernehmen)
for (let i = 0; i < 5; i++) { await click('Weiter'); await page.waitForTimeout(250) }
await click('Plan erstellen')
await page.waitForSelector('.dash', { timeout: 5000 })

// 2) Trainings-Logging-Sheet zeigen (Montag)
await page.goto(BASE + '/training', { waitUntil: 'networkidle' })
await click('Training starten')
await shot('p2-training-log')

// 3) Daten anreichern (Gewichtsverlauf, Essen, Streaks, eine Einheit)
await page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('noel-os'))
  const s = raw.state
  const today = new Date('2026-11-09T10:30:00')
  const dk = (off) => { const x = new Date(today); x.setDate(x.getDate() + off); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}` }
  s.weights = []
  for (let i = 13; i >= 0; i--) s.weights.push({ date: dk(-i), kg: Math.round((64.2 + (13 - i) * 0.06) * 10) / 10 })
  s.foods = [
    { id: 'a1', date: dk(0), name: 'Haferflocken mit Magerquark', kcal: 430, protein: 34 },
    { id: 'a2', date: dk(0), name: 'Hähnchen, Reis & Gemüse', kcal: 660, protein: 52 },
    { id: 'a3', date: dk(0), name: 'Magerquark mit Beeren', kcal: 220, protein: 28 },
  ]
  s.favFoods = [{ id: 'f1', name: 'Magerquark mit Beeren', kcal: 220, protein: 28 }]
  let done = 0
  for (const t of s.tasks) {
    if (t.rhythm.type === 'daily') { for (let i = 1; i <= 6; i++) t.history[dk(-i)] = true; if (done < 3) { t.history[dk(0)] = true; done++ } }
  }
  s.sessions = [{ id: 's1', date: dk(0), dayName: 'Pull', exercises: [
    { exerciseId: 'pullups', name: 'Klimmzüge', sets: [{ reps: 5, rpe: 8 }, { reps: 5, rpe: 8 }, { reps: 4, rpe: 9 }, { reps: 4, rpe: 9 }] },
    { exerciseId: 'rows', name: 'Ruderzüge', sets: [{ reps: 11, rpe: 7 }, { reps: 10, rpe: 8 }, { reps: 10, rpe: 8 }] },
  ] }]
  for (const t of s.tasks) if (t.auto === 'training') t.history[dk(0)] = true
  localStorage.setItem('noel-os', JSON.stringify(raw))
})

// 4) alle Screens
await page.goto(BASE + '/', { waitUntil: 'networkidle' }); await shot('p2-dashboard')
await page.goto(BASE + '/aufgaben', { waitUntil: 'networkidle' }); await shot('p2-tasks')
await page.goto(BASE + '/essen', { waitUntil: 'networkidle' }); await shot('p2-nutrition')
await page.goto(BASE + '/training', { waitUntil: 'networkidle' }); await shot('p2-training')
await page.goto(BASE + '/fortschritt', { waitUntil: 'networkidle' }); await shot('p2-progress')

console.log('done')
await browser.close()
