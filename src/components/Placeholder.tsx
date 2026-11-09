import Screen from './Screen'

/* Platzhalter für Module, die in Phase 2/3 mit Leben gefüllt werden. */
export default function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <Screen title={title}>
      <div className="card" style={{ marginTop: 'var(--sp-2)' }}>
        <p className="caption" style={{ marginBottom: 'var(--sp-2)' }}>In Arbeit</p>
        <p className="body secondary">{note}</p>
      </div>
    </Screen>
  )
}
