import { useState } from 'react'
import { useStore } from '../store/store'
import type { Equipment } from '../store/types'
import { Button, Stepper, Segmented, Chip, Field } from '../components/ui'
import { computeGoals } from '../lib/calc'
import './Onboarding.css'

const EQUIP: { id: Equipment; label: string }[] = [
  { id: 'pullupBar', label: 'Klimmzugstange' },
  { id: 'dipBars', label: 'Dip-Barren' },
  { id: 'rings', label: 'Turnringe' },
  { id: 'bands', label: 'Widerstandsbänder' },
  { id: 'bench', label: 'Bank/Stuhl' },
  { id: 'floorOnly', label: 'Nur Boden' },
]

export default function Onboarding() {
  const complete = useStore((s) => s.completeOnboarding)
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [age, setAge] = useState(19)
  const [heightCm, setHeightCm] = useState(178)
  const [weightKg, setWeightKg] = useState(65)
  const [maxPushups, setMaxPushups] = useState(25)
  const [maxPullups, setMaxPullups] = useState(5)
  const [maxDips, setMaxDips] = useState(10)
  const [equipment, setEquipment] = useState<Equipment[]>(['pullupBar', 'dipBars'])
  const [trainingDays, setTrainingDays] = useState(3)
  const [foodLikes, setFoodLikes] = useState('')
  const [foodDislikes, setFoodDislikes] = useState('')

  const toggleEq = (id: Equipment) =>
    setEquipment((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]))

  const goals = computeGoals({ sex: 'm', age, heightCm, weightKg, trainingDays })

  const steps = [
    {
      title: 'Willkommen',
      sub: 'Dein Assistent für Training, Ernährung und Disziplin. Ein paar Fragen, dann bauen wir deinen Plan.',
      body: (
        <Field label="Wie heißt du? (optional)">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dein Name" />
        </Field>
      ),
    },
    {
      title: 'Dein Körper',
      sub: 'Daraus berechne ich deinen Kalorien- und Proteinbedarf.',
      body: (
        <>
          <Field label="Alter"><Stepper value={age} onChange={setAge} min={14} max={99} /></Field>
          <Field label="Größe (cm)"><Stepper value={heightCm} onChange={setHeightCm} min={130} max={220} /></Field>
          <Field label="Gewicht (kg)"><Stepper value={weightKg} onChange={setWeightKg} min={35} max={200} /></Field>
        </>
      ),
    },
    {
      title: 'Deine Kraft',
      sub: 'Ehrliche Maximalwerte, sauber ausgeführt. Daraus baue ich die Progression.',
      body: (
        <>
          <Field label="Max. Liegestütze am Stück"><Stepper value={maxPushups} onChange={setMaxPushups} min={0} max={150} /></Field>
          <Field label="Max. Klimmzüge am Stück"><Stepper value={maxPullups} onChange={setMaxPullups} min={0} max={60} /></Field>
          <Field label="Max. Dips am Stück"><Stepper value={maxDips} onChange={setMaxDips} min={0} max={80} /></Field>
        </>
      ),
    },
    {
      title: 'Ausrüstung',
      sub: 'Was hast du zur Verfügung? Danach wähle ich die Übungen.',
      body: (
        <div className="chip-grid">
          {EQUIP.map((e) => (
            <Chip key={e.id} label={e.label} active={equipment.includes(e.id)} onClick={() => toggleEq(e.id)} />
          ))}
        </div>
      ),
    },
    {
      title: 'Trainingstage',
      sub: 'Wie oft pro Woche willst du trainieren?',
      body: (
        <Segmented
          options={[{ label: '3× / Woche', value: 3 }, { label: '4× / Woche', value: 4 }]}
          value={trainingDays}
          onChange={setTrainingDays}
        />
      ),
    },
    {
      title: 'Essen',
      sub: 'Was magst du, was isst du nicht? (frei beschreiben)',
      body: (
        <>
          <Field label="Mag ich / esse ich oft">
            <textarea className="input" value={foodLikes} onChange={(e) => setFoodLikes(e.target.value)} placeholder="z. B. Hähnchen, Reis, Quark, Haferflocken …" />
          </Field>
          <Field label="Esse ich nicht">
            <textarea className="input" value={foodDislikes} onChange={(e) => setFoodDislikes(e.target.value)} placeholder="z. B. kein Schweinefleisch, keine Pilze …" />
          </Field>
          <div className="goal-preview card">
            <p className="caption">Dein berechnetes Ziel</p>
            <p className="body" style={{ marginTop: 6 }}>
              <b className="num">{goals.kcalGoal.toLocaleString('de-DE')}</b> kcal · <b className="num">{goals.proteinGoal} g</b> Protein pro Tag
            </p>
          </div>
        </>
      ),
    },
  ]

  const isLast = step === steps.length - 1
  const cur = steps[step]

  const finish = () =>
    complete({ name, age, heightCm, weightKg, maxPushups, maxPullups, maxDips, equipment, trainingDays, foodLikes, foodDislikes, sex: 'm' })

  return (
    <main className="onb">
      <div className="onb-progress">
        {steps.map((_, i) => (
          <span key={i} className={'onb-dot' + (i <= step ? ' on' : '')} />
        ))}
      </div>
      <div className="onb-head">
        <h1 className="display">{cur.title}</h1>
        <p className="body secondary onb-sub">{cur.sub}</p>
      </div>
      <div className="onb-body">{cur.body}</div>
      <div className="onb-foot">
        {step > 0 && <Button variant="quiet" onClick={() => setStep((s) => s - 1)}>Zurück</Button>}
        <div style={{ flex: 1 }} />
        {isLast ? (
          <Button onClick={finish}>Plan erstellen</Button>
        ) : (
          <Button onClick={() => setStep((s) => s + 1)}>Weiter</Button>
        )}
      </div>
    </main>
  )
}
