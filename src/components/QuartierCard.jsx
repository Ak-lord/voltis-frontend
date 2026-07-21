import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { formatRelative, getStatut } from '../utils/statut'

export default function QuartierCard({ quartier }) {
  const navigate = useNavigate()
  const s = getStatut(quartier.statut)
  const isCoupure  = quartier.statut === 'coupure'
  const isIncertain = quartier.statut === 'incertain'

  return (
    <button
      onClick={() => navigate(`/quartier/${quartier.id}`)}
      className="w-full text-left flex items-stretch overflow-hidden transition-all active:scale-[0.99]"
      style={{
        background:   isCoupure ? 'var(--red-bg)' : 'var(--bg-surface)',
        border:       `1px solid ${isCoupure ? 'var(--red-bd)' : 'var(--border)'}`,
        borderRadius: '12px',
        boxShadow:    'var(--sh-sm)',
      }}
    >
      {/* Barre colorée gauche */}
      <div
        style={{
          width:      '4px',
          flexShrink: 0,
          background: s.color,
          opacity:    isIncertain ? 0.35 : 1,
        }}
      />

      <div className="flex items-center gap-3 px-4 py-3.5 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <p
            className="font-semibold text-[15px] leading-tight truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {quartier.nom}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Secteur {quartier.secteur}
            {quartier.nb_signalements > 0 && (
              <span>
                {' '}· {quartier.nb_signalements} signalement{quartier.nb_signalements > 1 ? 's' : ''}
              </span>
            )}
            {isCoupure && quartier.debut_coupure && (
              <span> · {formatRelative(quartier.debut_coupure)}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge statut={quartier.statut} size="sm" />
          <ChevronRight size={14} strokeWidth={2} style={{ color: 'var(--text-tertiary)' }} />
        </div>
      </div>
    </button>
  )
}
