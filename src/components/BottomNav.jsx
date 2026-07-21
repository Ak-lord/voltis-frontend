import { NavLink } from 'react-router-dom'
import { Map, MapPin, Zap, Bell } from 'lucide-react'

const NAV = [
  { to: '/',         Icon: Map,    label: 'Carte'        },
  { to: '/quartier', Icon: MapPin, label: 'Mon quartier' },
  { to: '/signaler', Icon: Zap,    label: 'Signaler'     },
  { to: '/alertes',  Icon: Bell,   label: 'Alertes'      },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex"
      style={{
        background:    'var(--bg-topbar)',
        borderTop:     '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {NAV.map(({ to, Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className="flex-1 flex flex-col items-center justify-center pt-3 pb-2 gap-1 transition-colors"
          style={({ isActive }) => ({
            color: isActive ? 'var(--brand)' : 'var(--text-tertiary)',
          })}
        >
          {({ isActive }) => (
            <>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
