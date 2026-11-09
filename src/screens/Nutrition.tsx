import { useState } from 'react'
import { useStore } from '../store/store'
import { dateKey } from '../lib/date'
import Sheet from '../components/Sheet'
import { Button, Field } from '../components/ui'
import { haptic } from '../lib/haptics'
import './Nutrition.css'

export default function Nutrition() {
  const profile = useStore((s) => s.profile)
  const foods = useStore((s) => s.foods)
  const favs = useStore((s) => s.favFoods)
  const addFood = useStore((s) => s.addFood)
  const removeFood = useStore((s) => s.removeFood)

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [kcal, setKcal] = useState('')
  const [protein, setProtein] = useState('')
  const [saveFav, setSaveFav] = useState(false)

  const key = dateKey()
  const today = foods.filter((f) => f.date === key)
  const kcalSum = today.reduce((s, f) => s + f.kcal, 0)
  const proteinSum = today.reduce((s, f) => s + f.protein, 0)
  const kcalPct = Math.min(1, kcalSum / profile.kcalGoal)
  const proteinPct = Math.min(1, proteinSum / profile.proteinGoal)

  const submit = () => {
    const k = parseInt(kcal, 10) || 0
    const p = parseInt(protein, 10) || 0
    if (!name.trim() || (k === 0 && p === 0)) return
    addFood(name.trim(), k, p, saveFav)
    setName(''); setKcal(''); setProtein(''); setSaveFav(false); setOpen(false)
  }

  return (
    <main className="scroll">
      <header style={{ padding: 'var(--sp-5) var(--sp-1) var(--sp-4)' }}>
        <h1 className="display">Essen</h1>
      </header>

      <div className="card nut-goals">
        <div className="nut-metric">
          <div className="nut-metric-top">
            <span className="caption">Kalorien</span>
            <span className="num nut-val">{kcalSum.toLocaleString('de-DE')} <span className="nut-goal">/ {profile.kcalGoal.toLocaleString('de-DE')}</span></span>
          </div>
          <div className="bar"><span style={{ width: `${kcalPct * 100}%` }} /></div>
        </div>
        <div className="nut-metric">
          <div className="nut-metric-top">
            <span className="caption">Protein</span>
            <span className="num nut-val">{proteinSum} g <span className="nut-goal">/ {profile.proteinGoal} g</span></span>
          </div>
          <div className="bar"><span style={{ width: `${proteinPct * 100}%` }} /></div>
        </div>
      </div>

      {favs.length > 0 && (
        <section className="nut-section">
          <p className="caption nut-label">Favoriten</p>
          <div className="fav-grid">
            {favs.map((f) => (
              <button key={f.id} className="fav-chip press"
                onClick={() => { haptic.success(); addFood(f.name, f.kcal, f.protein) }}>
                <span className="fav-name">{f.name}</span>
                <span className="fav-macro num">{f.kcal} kcal · {f.protein} g</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <Button full onClick={() => setOpen(true)}>+ Essen eintragen</Button>

      <section className="nut-section">
        <p className="caption nut-label">Heute</p>
        {today.length === 0 ? (
          <p className="footnote" style={{ padding: '0 var(--sp-1)' }}>Noch nichts eingetragen.</p>
        ) : (
          <div className="entry-list">
            {today.map((f) => (
              <div key={f.id} className="entry">
                <div className="entry-body">
                  <span className="entry-name">{f.name}</span>
                  <span className="entry-macro num">{f.kcal} kcal · {f.protein} g Protein</span>
                </div>
                <button className="entry-del press" onClick={() => { haptic.soft(); removeFood(f.id) }} aria-label="Entfernen">×</button>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="ki-hint footnote">💬 Freitext-Schätzung durch Claude („2 Eier und Haferflocken") kommt in Phase 3 mit dem Server.</p>

      <Sheet open={open} onOpenChange={setOpen} title="Essen eintragen">
        <Field label="Was hast du gegessen?">
          <input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Magerquark mit Beeren" />
        </Field>
        <div className="row-2">
          <Field label="Kalorien (kcal)">
            <input className="input num" inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value.replace(/\D/g, ''))} placeholder="0" />
          </Field>
          <Field label="Protein (g)">
            <input className="input num" inputMode="numeric" value={protein} onChange={(e) => setProtein(e.target.value.replace(/\D/g, ''))} placeholder="0" />
          </Field>
        </div>
        <label className="fav-check" onClick={() => setSaveFav((v) => !v)}>
          <span className={'task-check' + (saveFav ? ' on' : '')} style={{ width: 24, height: 24 }}>
            {saveFav && '✓'}
          </span>
          Als Favorit speichern
        </label>
        <div style={{ marginTop: 'var(--sp-4)' }}>
          <Button full onClick={submit}>Eintragen</Button>
        </div>
      </Sheet>
    </main>
  )
}
