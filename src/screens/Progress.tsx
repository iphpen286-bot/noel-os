import { useState } from 'react'
import { useStore } from '../store/store'
import { EXERCISES } from '../lib/calc'
import Sheet from '../components/Sheet'
import { Button, Stepper } from '../components/ui'
import './Progress.css'

function avg(nums: number[]) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
}

function LineChart({ values }: { values: number[] }) {
  if (values.length < 2) return <div className="chart-empty footnote">Noch zu wenig Daten für ein Diagramm.</div>
  const W = 320, H = 110, pad = 6
  const min = Math.min(...values), max = Math.max(...values)
  const range = max - min || 1
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (W - 2 * pad)
    const y = pad + (1 - (v - min) / range) * (H - 2 * pad)
    return [x, y] as const
  })
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${H - pad} L${pts[0][0].toFixed(1)} ${H - pad} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" preserveAspectRatio="none">
      <path d={area} fill="var(--fill-track)" />
      <path d={line} fill="none" stroke="var(--fill-strong)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3.5} fill="var(--fill-strong)" />
    </svg>
  )
}

export default function Progress() {
  const weights = useStore((s) => s.weights)
  const sessions = useStore((s) => s.sessions)
  const profile = useStore((s) => s.profile)
  const addWeight = useStore((s) => s.addWeight)

  const [open, setOpen] = useState(false)
  const [kg, setKg] = useState(Math.round(profile.weightKg * 10) / 10)

  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date))
  const series = sorted.map((w) => w.kg)
  const last7 = series.slice(-7)
  const prev7 = series.slice(-14, -7)
  const avg7 = avg(last7)
  const trend = avg7 - avg(prev7.length ? prev7 : last7)

  // 7-Tage-gleitender Schnitt für das Diagramm
  const smooth = series.map((_, i) => avg(series.slice(Math.max(0, i - 6), i + 1)))

  // Kraftwerte: beste Wiederholung je Übung
  const best: Record<string, number> = {}
  for (const s of sessions)
    for (const ex of s.exercises)
      for (const set of ex.sets)
        best[ex.exerciseId] = Math.max(best[ex.exerciseId] ?? 0, set.reps)
  const strengthRows = Object.entries(best).filter(([id]) => EXERCISES[id])

  return (
    <main className="scroll">
      <header style={{ padding: 'var(--sp-5) var(--sp-1) var(--sp-4)' }}>
        <h1 className="display">Fortschritt</h1>
      </header>

      <div className="card">
        <div className="card-head">
          <p className="caption">Gewicht · 7-Tage-Schnitt</p>
          {series.length > 1 && (
            <span className={'trend num' + (trend > 0 ? ' up' : trend < 0 ? ' down' : '')}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)} kg
            </span>
          )}
        </div>
        <p className="weight-big num">{avg7 ? avg7.toFixed(1) : profile.weightKg} <span className="weight-unit">kg</span></p>
        <div className="chart-wrap"><LineChart values={smooth} /></div>
        <div style={{ marginTop: 'var(--sp-4)' }}>
          <Button variant="ghost" full onClick={() => { setKg(Math.round(profile.weightKg * 10) / 10); setOpen(true) }}>
            Gewicht eintragen
          </Button>
        </div>
      </div>

      <section className="tr-section">
        <p className="caption tr-label">Kraftwerte · beste Wiederholung</p>
        {strengthRows.length === 0 ? (
          <p className="footnote" style={{ padding: '0 var(--sp-1)' }}>Noch keine Einheit geloggt. Nach deinem ersten Training erscheinen hier deine Bestwerte.</p>
        ) : (
          <div className="strength-list">
            {strengthRows.map(([id, reps]) => (
              <div key={id} className="strength-row">
                <span>{EXERCISES[id].name}</span>
                <span className="num strength-val">{reps} {EXERCISES[id].unit === 'sec' ? 'Sek.' : 'Whd.'}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="tr-section">
        <p className="caption tr-label">Fortschrittsfotos</p>
        <div className="photo-card">
          <p className="footnote">Nur lokal auf dem Gerät gespeichert — verlässt dein iPhone nie. Kommt mit Kamera-Zugriff im nächsten Schritt.</p>
        </div>
      </section>

      <Sheet open={open} onOpenChange={setOpen} title="Gewicht eintragen">
        <p className="footnote" style={{ marginBottom: 'var(--sp-3)' }}>Am besten morgens, nüchtern. Tagesschwankungen sind normal — der 7-Tage-Schnitt glättet das.</p>
        <Stepper value={kg} onChange={(v) => setKg(Math.round(v * 10) / 10)} min={35} max={200} step={0.1} suffix="kg" />
        <div style={{ marginTop: 'var(--sp-4)' }}>
          <Button full onClick={() => { addWeight(Math.round(kg * 10) / 10); setOpen(false) }}>Speichern</Button>
        </div>
      </Sheet>
    </main>
  )
}
