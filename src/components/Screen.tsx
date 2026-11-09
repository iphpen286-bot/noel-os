import type { ReactNode } from 'react'

/* Standard-Gerüst für Unter-Screens: großer Titel + Inhalt, Safe Areas. */
export default function Screen({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <main className="scroll">
      <header style={{ padding: 'var(--sp-5) var(--sp-1) var(--sp-4)' }}>
        <h1 className="display">{title}</h1>
      </header>
      {children}
    </main>
  )
}
