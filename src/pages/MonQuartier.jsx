import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, ChevronRight, Zap } from 'lucide-react'
import { useQuartiers } from '../hooks/useQuartiers'
import { useGeolocation } from '../hooks/useGeolocation'
import QuartierCard from '../components/QuartierCard'

export default function MonQuartier() {
  const navigate = useNavigate()
  const { quartiers, loading } = useQuartiers()
  const { quartierDetecte, status: geoStatus } = useGeolocation(quartiers)

  const [quartierId, setQuartierId] = useState(
    () => localStorage.getItem('voltis_mon_quartier') ?? ''
  )

  useEffect(() => {
    if (quartierDetecte && !quartierId) {
      setQuartierId(quartierDetecte.id)
      localStorage.setItem('voltis_mon_quartier', quartierDetecte.id)
    }
  }, [quartierDetecte, quartierId])

  const quartierSelectionne = quartiers.find(q => q.id === quartierId)

  return (
    <div className="flex flex-col min-h-full">
      <header
        className="sticky top-0 z-40 px-4 pb-4"
        style={{
          background:   'var(--bg-topbar)',
          borderBottom: '1px solid var(--border)',
          paddingTop:   'calc(var(--safe-top) + 12px)',
        }}
      >
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Mon quartier
        </h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          Suivez l'état du courant en temps réel
        </p>
      </header>

      <div className="px-4 py-4 space-y-3">
        {/* Sélecteur */}
        <div
          className="rounded-[12px] p-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          {geoStatus === 'ok' && quartierDetecte && (
            <div
              className="flex items-center gap-2 mb-3 pb-3"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <MapPin size={13} strokeWidth={2} style={{ color: 'var(--brand)', flexShrink: 0 }} />
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Détecté automatiquement :{' '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {quartierDetecte.nom}
                </span>
              </p>
            </div>
          )}

          <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
            Quartier
          </label>
          <select
            value={quartierId}
            onChange={e => {
              setQuartierId(e.target.value)
              localStorage.setItem('voltis_mon_quartier', e.target.value)
            }}
            className="w-full rounded-[8px] px-3 py-2.5 text-sm outline-none appearance-none"
            style={{
              background: 'var(--bg-surface2)',
              border:     '1px solid var(--border)',
              color:      quartierId ? 'var(--text-primary)' : 'var(--text-tertiary)',
            }}
          >
            <option value="">Sélectionnez votre quartier</option>
            {quartiers
              .slice()
              .sort((a, b) => a.nom.localeCompare(b.nom))
              .map(q => (
                <option key={q.id} value={q.id}>{q.nom} — Secteur {q.secteur}</option>
              ))}
          </select>
        </div>

        {loading && !quartiers.length && (
          <div className="flex justify-center py-12">
            <div
              className="w-6 h-6 rounded-full border-2 border-t-transparent"
              style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent', animation: 'spin-slow 0.8s linear infinite' }}
            />
          </div>
        )}

        {quartierSelectionne && (
          <>
            <QuartierCard quartier={quartierSelectionne} />

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate(`/quartier/${quartierSelectionne.id}`)}
                className="flex items-center justify-center gap-2 py-3 rounded-[8px] text-sm font-medium"
                style={{
                  background: 'var(--bg-surface)',
                  color:      'var(--text-secondary)',
                  border:     '1px solid var(--border)',
                }}
              >
                Historique
                <ChevronRight size={14} strokeWidth={2} />
              </button>
              <button
                onClick={() => navigate(`/signaler?quartier=${quartierSelectionne.id}`)}
                className="flex items-center justify-center gap-2 py-3 rounded-[8px] text-sm font-semibold"
                style={{ background: 'var(--brand)', color: '#fff' }}
              >
                <Zap size={15} strokeWidth={2.2} />
                Signaler
              </button>
            </div>
          </>
        )}

        {!quartierId && !loading && (
          <div
            className="rounded-[12px] p-8 text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--brand-bg)', border: '1px solid var(--brand-bd)' }}
            >
              <MapPin size={22} strokeWidth={1.8} style={{ color: 'var(--brand)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Aucun quartier sélectionné
            </p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Choisissez votre quartier ci-dessus pour suivre son statut en temps réel.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
