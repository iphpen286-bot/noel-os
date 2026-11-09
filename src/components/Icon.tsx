/* Monochrome Linien-Icons, erben currentColor. Bewusst schlicht (S/W). */
type Props = { name: IconName; size?: number; strokeWidth?: number }
export type IconName =
  | 'home' | 'training' | 'nutrition' | 'mail' | 'coach'
  | 'flame' | 'check' | 'chevron' | 'bolt' | 'drop'

const paths: Record<IconName, JSX.Element> = {
  home: (
    <path d="M3 10.5 12 3l9 7.5M5 9.5V20h5v-6h4v6h5V9.5" />
  ),
  training: (
    <>
      <path d="M4 9.5v5M7 7.5v9M17 7.5v9M20 9.5v5" />
      <path d="M7 12h10" />
    </>
  ),
  nutrition: (
    <>
      <path d="M12 8.6c-1.1-1.3-2.9-1.7-4.4-.8-1.7 1-2.3 3.2-1.5 5.4.6 1.8 1.8 3.9 3.3 5.3.9.8 2.3.8 3.2 0 1.5-1.4 2.7-3.5 3.3-5.3.8-2.2.2-4.4-1.5-5.4-1.5-.9-3.3-.5-4.4.8Z" />
      <path d="M12 8.6V6c0-1.2 1-2.2 2.3-2.2" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  coach: (
    <>
      <path d="M4 5.5h16a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1H9l-4 3.5V17H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z" />
    </>
  ),
  flame: (
    <path d="M12 3c.5 3-2 4-2 7a2 2 0 1 0 4 0c0 2 2 2.5 2 5a4 4 0 1 1-8 0c0-4 4-5 4-12Z" />
  ),
  check: <path d="m4.5 12.5 4.5 4.5L19.5 6.5" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  drop: <path d="M12 3c3.5 4.5 6 7.5 6 11a6 6 0 1 1-12 0c0-3.5 2.5-6.5 6-11Z" />,
}

export default function Icon({ name, size = 24, strokeWidth = 1.9 }: Props) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
