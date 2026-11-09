import { Drawer } from 'vaul'
import type { ReactNode } from 'react'
import './Sheet.css'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children: ReactNode
}

/* Bottom-Sheet auf Vaul: per Wisch schließbar, Federn, Safe Areas. */
export default function Sheet({ open, onOpenChange, title, children }: Props) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="sheet-overlay" />
        <Drawer.Content className="sheet-content">
          <div className="sheet-grab" aria-hidden="true" />
          {title && <Drawer.Title className="sheet-title">{title}</Drawer.Title>}
          <div className="sheet-body">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
