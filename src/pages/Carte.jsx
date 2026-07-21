import { useState } from 'react'
import { Search, Zap, RefreshCw } from 'lucide-react'
import { useQuartiers } from '../hooks/useQuartiers'
import QuartierCard from '../components/QuartierCard'
import { formatRelative } from '../utils/statut'

const FILTRES = [
  { key: 'tous',      label: 'Tous'      },
  { key: 'coupure',   label: 'Coupure'   },
  { key: 'retabli',   label: 'Rétabli'   },
  { key: 'incertain', label: 'Incertain' },
]

export default function Carte() {
  const { quartiers, loading, error, lastUpdate, refresh } = useQuartiers()
  const [filtre, setFiltre]       = useState('tous')
  const [recherche, setRecherche] = useState('')

  const filtered = quartiers
    .filter(q => filtre === 'tous' || q.statut === filtre)
    .filter(q => q.nom.toLowerCase().includes(recherche.toLowerCase()))

  const nbCoupures = quartiers.filter(q => q.statut === 'coupure').length

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Header ────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 px-4 pb-3"
        style={{
          background:    'var(--bg-topbar)',
          borderBottom:  '1px solid var(--border)',
          paddingTop:    'calc(var(--safe-top) + 12px)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              Voltis
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              Ouagadougou · SONABEL
            </p>
          </div>

          <div className="flex items-center gap-2">
            {nbCoupures > 0 && (
              <span
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full"
                style={{
                  background: 'var(--red-bg)',
                  color:      'var(--red)',
                  border:     '1px solid var(--red-bd)',
                }}
              >
                <Zap size={11} strokeWidth={2.5} />
                {nbCoupures} coupure{nbCoupures > 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={refresh}
              className="w-8 h-8 flex items-center justify-center rounded-[8px]"
              style={{
                background: 'var(--bg-surface2)',
                border:     '1px solid var(--border)',
                color:      'var(--text-secondary)',
              }}
            >
              <RefreshCw
                size={14}
                strokeWidth={2}
                style={{ animation: loading ? 'spin-slow 0.8s linear infinite' : 'none' }}
              />
            </button>
          </div>
        </div>

        {/* Recherche */}
        <div className="relative mb-3">
          <Search
            size={15}
            strokeWidth={2}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-tertiary)' }}
          />
          <input
            type="text"
            placeholder="Chercher un quartier…"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            className="w-full rounded-[10px] pl-9 pr-3 py-2.5 outline-none"
            style={{
              fontSize:   '16px',
              background: 'var(--bg-surface2)',
              border:     '1px solid var(--border)',
              color:      'var(--text-primary)',
            }}
          />
        </div>

        {/* Filtres */}
        <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {FILTRES.map(f => (
            <button
              key={f.key}
              onClick={() => setFiltre(f.key)}
              className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-[8px] transition-all"
              style={{
                background: filtre === f.key ? 'var(--text-primary)' : 'var(--bg-surface)',
                color:      filtre === f.key ? 'var(--bg-main)'      : 'var(--text-secondary)',
                border:     `1px solid ${filtre === f.key ? 'transparent' : 'var(--border)'}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Liste ─────────────────────────────────────────── */}
      <div className="flex-1 px-4 py-4 space-y-2">
        {error && (
          <div
            className="rounded-[10px] p-4 text-sm text-center"
            style={{
              background: 'var(--red-bg)',
              color:      'var(--red)',
              border:     '1px solid var(--red-bd)',
            }}
          >
            {error}
          </div>
        )}

        {loading && !quartiers.length && (
          <div className="space-y-2 pt-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="skeleton rounded-[12px]"
                style={{ height: '68px', opacity: 1 - i * 0.12 }}
              />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && quartiers.length > 0 && (
          <div
            className="rounded-[12px] p-8 text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Aucun résultat
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Essayez un autre filtre ou terme de recherche.
            </p>
          </div>
        )}

        {filtered.map(q => <QuartierCard key={q.id} quartier={q} />)}

        {/* Indicateur de fraîcheur */}
        {lastUpdate && (
          <div className="flex items-center justify-center gap-1.5 py-3">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--green)' }}
            />
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Actualisé {formatRelative(lastUpdate.toISOString())} · auto 30s
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
