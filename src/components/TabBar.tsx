import { NavLink } from 'react-router-dom'
import Icon, { type IconName } from './Icon'
import './TabBar.css'

const tabs: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Start', icon: 'home' },
  { to: '/training', label: 'Training', icon: 'training' },
  { to: '/essen', label: 'Essen', icon: 'nutrition' },
  { to: '/mail', label: 'Mail', icon: 'mail' },
  { to: '/coach', label: 'Coach', icon: 'coach' },
]

export default function TabBar() {
  return (
    <nav className="tabbar" aria-label="Hauptnavigation">
      <div className="tabbar-inner">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) => 'tab press' + (isActive ? ' tab-active' : '')}
          >
            <Icon name={t.icon} size={25} />
            <span className="tab-label">{t.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
