import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Zap, CheckCircle, Users, Timer, Clock } from 'lucide-react'
import { useQuartier } from '../hooks/useQuartiers'
import StatusBadge from '../components/StatusBadge'
import PushPrompt from '../components/PushPrompt'
import { formatDuree, formatRelative, dureeDepuis, getStatut } from '../utils/statut'

const PUSH_THRESHOLD = 5

export default function QuartierDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { quartier, loading } = useQuartier(id)

  return (
    <div className="flex flex-col min-h-full">
      <header
        className="sticky top-0 z-40 flex items-center gap-3 px-4 pb-4"
        style={{
          background:   'var(--bg-topbar)',
          borderBottom: '1px solid var(--border)',
          paddingTop:   'calc(var(--safe-top) + 12px)',
        }}
      >
        <button
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
          className="flex items-center justify-center rounded-[10px] shrink-0"
          style={{ width: '44px', height: '44px', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {loading ? '…' : quartier?.nom ?? 'Quartier'}
          </h1>
          {quartier && (
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Secteur {quartier.secteur}
            </p>
          )}
        </div>
        {quartier && <StatusBadge statut={quartier.statut} size="sm" />}
      </header>

      <div className="px-4 py-4 space-y-3">
        {loading && (
          <div className="flex justify-center py-16">
            <div
              className="w-6 h-6 rounded-full border-2 border-t-transparent"
              style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent', animation: 'spin-slow 0.8s linear infinite' }}
            />
          </div>
        )}

        {quartier && (
          <>
            <PushPrompt quartierId={quartier.id} quartierNom={quartier.nom} />
            <StatutBloc quartier={quartier} />
            <HistoriqueSection historique={quartier.historique} />
          </>
        )}
      </div>
    </div>
  )
}

function StatutBloc({ quartier }) {
  const s = getStatut(quartier.statut)
  const isCoupure   = quartier.statut === 'coupure'
  const confidence  = Math.min((quartier.nb_signalements ?? 0) / PUSH_THRESHOLD, 1)
  const nbManquants = Math.max(0, PUSH_THRESHOLD - (quartier.nb_signalements ?? 0))

  return (
    <div
      className="rounded-[12px] overflow-hidden"
      style={{ background: 'var(--bg-surface)', border: `1px solid ${isCoupure ? 'var(--red-bd)' : 'var(--border)'}` }}
    >
      {/* Bande colorée en haut */}
      <div style={{ height: '5px', background: s.color }} />

      <div className="p-4 space-y-4">
        {/* Ligne statut + durée */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
              État actuel
            </p>
            <StatusBadge statut={quartier.statut} size="md" />
            {isCoupure && quartier.debut_coupure && (
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                {dureeDepuis(quartier.debut_coupure)}
              </p>
            )}
          </div>
          {quartier.derniere_maj && (
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Mis à jour</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {formatRelative(quartier.derniere_maj)}
              </p>
            </div>
          )}
        </div>

        {/* Barre de confiance */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Confirmations reçues
            </p>
            <p className="text-[10px] font-semibold" style={{ color: s.color }}>
              {quartier.nb_signalements ?? 0} / {PUSH_THRESHOLD}
            </p>
          </div>
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: '6px', background: 'var(--bg-surface2)' }}
          >
            <div
              style={{
                height: '100%',
                width:  `${confidence * 100}%`,
                background: s.color,
                borderRadius: '9999px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
            {confidence >= 1
              ? 'Confirmé — les abonnés ont été alertés'
              : nbManquants === 0
                ? 'En cours de vérification…'
                : `Encore ${nbManquants} confirmation${nbManquants > 1 ? 's' : ''} pour alerter tout le monde`}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatItem
            icon={<Users size={13} strokeWidth={2} />}
            label="Signalements"
            value={quartier.nb_signalements > 0 ? String(quartier.nb_signalements) : '—'}
            active={quartier.nb_signalements > 0}
          />
          <StatItem
            icon={<Clock size={13} strokeWidth={2} />}
            label="Début"
            value={quartier.debut_coupure ? formatRelative(quartier.debut_coupure) : '—'}
            active={!!quartier.debut_coupure}
          />
          <StatItem
            icon={<Timer size={13} strokeWidth={2} />}
            label="Durée moy."
            value={formatDuree(quartier.duree_moyenne) ?? '—'}
            active={!!quartier.duree_moyenne}
          />
        </div>
      </div>
    </div>
  )
}

function StatItem({ icon, label, value, active }) {
  return (
    <div
      className="rounded-[8px] p-2.5 flex flex-col gap-1.5"
      style={{
        background: 'var(--bg-surface2)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
      </div>
      <p
        className="text-sm font-semibold"
        style={{ color: active ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
      >
        {value}
      </p>
    </div>
  )
}

function HistoriqueSection({ historique }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider mb-2 px-0.5" style={{ color: 'var(--text-tertiary)' }}>
        Historique récent
      </p>

      {(!historique || historique.length === 0) ? (
        <div
          className="rounded-[12px] p-6 text-center"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Aucun événement enregistré
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Soyez le premier à signaler pour ce quartier.
          </p>
        </div>
      ) : (
        <div
          className="rounded-[12px] overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          {historique.map((h, i) => {
            const isCoupure = h.type === 'coupure'
            return (
              <div
                key={h.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderTop: i > 0 ? '1px solid var(--border-sub)' : 'none' }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: isCoupure ? 'var(--red-bg)' : 'var(--green-bg)' }}
                >
                  {isCoupure
                    ? <Zap size={13} strokeWidth={2.2} style={{ color: 'var(--red)' }} />
                    : <CheckCircle size={13} strokeWidth={2.2} style={{ color: 'var(--green)' }} />
                  }
                </div>
                <span className="text-sm flex-1 font-medium" style={{ color: isCoupure ? 'var(--red)' : 'var(--green)' }}>
                  {isCoupure ? 'Courant coupé' : 'Courant revenu'}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {formatRelative(h.created_at)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
