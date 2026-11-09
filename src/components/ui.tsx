import type { ReactNode } from 'react'
import { haptic } from '../lib/haptics'
import './ui.css'

export function Button({
  children, onClick, variant = 'primary', type = 'button', disabled, full,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'quiet'
  type?: 'button' | 'submit'
  disabled?: boolean
  full?: boolean
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={() => { haptic.tap(); onClick?.() }}
      className={`btn btn-${variant} press${full ? ' btn-full' : ''}`}
    >
      {children}
    </button>
  )
}

export function Stepper({
  value, onChange, min = 0, max = 999, step = 1, suffix,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
}) {
  const set = (v: number) => { haptic.soft(); onChange(Math.max(min, Math.min(max, v))) }
  return (
    <div className="stepper">
      <button className="stepper-btn press" onClick={() => set(value - step)} aria-label="weniger">−</button>
      <span className="stepper-val num">{value}{suffix ? ` ${suffix}` : ''}</span>
      <button className="stepper-btn press" onClick={() => set(value + step)} aria-label="mehr">+</button>
    </div>
  )
}

export function Segmented<T extends string | number>({
  options, value, onChange,
}: {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button
          key={String(o.value)}
          className={'seg press' + (o.value === value ? ' seg-active' : '')}
          onClick={() => { haptic.soft(); onChange(o.value) }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Chip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      className={'chip-toggle press' + (active ? ' chip-active' : '')}
      onClick={() => { haptic.soft(); onClick() }}
    >
      {label}
    </button>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}
