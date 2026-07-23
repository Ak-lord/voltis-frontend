import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Zap, CheckCircle, Users, Timer, Clock } from 'lucide-react'
import { useQuartier } from '../hooks/useQuartiers'
import StatusBadge from '../components/StatusBadge'
import PushPrompt from '../components/PushPrompt'
import { formatDuree, formatRelative, dureeDepuis, getStatut } from '../utils/statut'
import api from '../api/client'

const PUSH_THRESHOLD = 5

export default function QuartierDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { quartier, loading } = useQuartier(id)

  const [signalLoading, setSignalLoading] = useState(null)
  const [feedback, setFeedback]           = useState(null)
  const [cooldown, setCooldown]           = useState(false)

  async function signal(type) {
    setSignalLoading(type)
    setFeedback(null)
    try {
      await api.post('/signalements', {
        quartier_id: id,
        type,
        latitude:  null,
        longitude: null,
      })
      setFeedback({ type: 'success', text: type === 'coupure' ? 'Coupure enregistrée. Merci !' : 'Rétablissement enregistré. Merci !' })
      setCooldown(true)
      setTimeout(() => { setCooldown(false); setFeedback(null) }, 5 * 60 * 1000)
    } catch (e) {
      setFeedback({ type: 'error', text: e.response?.data?.message ?? "Erreur lors de l'envoi." })
    } finally {
      setSignalLoading(null)
    }
  }

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

      <div className="flex-1 flex flex-col px-4 py-4 gap-3">
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

            {/* Boutons de signalement */}
            <div className="mt-auto pt-2 flex flex-col gap-2">
              {feedback && (
                <div
                  className="rounded-[10px] px-4 py-3 text-sm font-semibold text-center"
                  style={{
                    background: feedback.type === 'success' ? 'var(--green-bg)' : 'var(--red-bg)',
                    border:     `1px solid ${feedback.type === 'success' ? 'var(--green-bd)' : 'var(--red-bd)'}`,
                    color:      feedback.type === 'success' ? 'var(--green)' : 'var(--red)',
                  }}
                >
                  {feedback.text}
                </div>
              )}

              {cooldown ? (
                <p className="text-xs text-center py-2" style={{ color: 'var(--text-tertiary)' }}>
                  Signalement envoyé. Vous pourrez signaler à nouveau dans quelques minutes.
                </p>
              ) : (
                <>
                  <p className="text-xs text-center font-medium" style={{ color: 'var(--text-tertiary)' }}>
                    Que voyez-vous en ce moment ?
                  </p>
                  <button
                    onClick={() => signal('coupure')}
                    disabled={!!signalLoading}
                    className="w-full py-4 rounded-[12px] flex items-center justify-center gap-2 font-bold text-sm"
                    style={{ background: '#DC2626', color: '#fff', opacity: signalLoading && signalLoading !== 'coupure' ? 0.5 : 1 }}
                  >
                    <Zap size={17} strokeWidth={2.2} />
                    {signalLoading === 'coupure' ? 'Envoi…' : 'Le courant est coupé'}
                  </button>
                  <button
                    onClick={() => signal('retabli')}
                    disabled={!!signalLoading}
                    className="w-full py-4 rounded-[12px] flex items-center justify-center gap-2 font-bold text-sm"
                    style={{ background: '#16A34A', color: '#fff', opacity: signalLoading && signalLoading !== 'retabli' ? 0.5 : 1 }}
                  >
                    <CheckCircle size={17} strokeWidth={2.2} />
                    {signalLoading === 'retabli' ? 'Envoi…' : 'Le courant est présent'}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatutBloc({ quartier }) {
  const s = getStatut(quartier.statut)
  const isCoupure   = quartier.statut === 'coupure'
  const isIncertain = quartier.statut === 'incertain'
  const confidence  = Math.min((quartier.nb_signalements ?? 0) / PUSH_THRESHOLD, 1)
  const nbManquants = Math.max(0, PUSH_THRESHOLD - (quartier.nb_signalements ?? 0))

  // Seulement les stats qui ont une valeur réelle
  const stats = [
    quartier.nb_signalements > 0 && { icon: <Users size={13} strokeWidth={2} />, label: 'Signalements', value: String(quartier.nb_signalements) },
    quartier.debut_coupure        && { icon: <Clock size={13} strokeWidth={2} />,  label: 'Début',         value: formatRelative(quartier.debut_coupure) },
    quartier.duree_moyenne        && { icon: <Timer size={13} strokeWidth={2} />,  label: 'Durée moy.',    value: formatDuree(quartier.duree_moyenne) },
  ].filter(Boolean)

  return (
    <div
      className="rounded-[12px] overflow-hidden"
      style={{ background: 'var(--bg-surface)', border: `1px solid ${isCoupure ? 'var(--red-bd)' : 'var(--border)'}` }}
    >
      <div style={{ height: '5px', background: s.color }} />

      <div className="p-4 space-y-4">
        {/* Statut + date */}
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
            {isIncertain && quartier.nb_signalements > 0 && (
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
                En attente de {nbManquants} confirmation{nbManquants > 1 ? 's' : ''} supplémentaire{nbManquants > 1 ? 's' : ''}
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

        {/* Barre de confirmations */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Confirmations reçues
            </p>
            <p className="text-[10px] font-semibold" style={{ color: s.color }}>
              {quartier.nb_signalements ?? 0} / {PUSH_THRESHOLD}
            </p>
          </div>
          <div className="w-full rounded-full overflow-hidden" style={{ height: '6px', background: 'var(--bg-surface2)' }}>
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
              : `Encore ${nbManquants} confirmation${nbManquants > 1 ? 's' : ''} pour alerter tout le monde`}
          </p>
        </div>

        {/* Stats (uniquement si données disponibles) */}
        {stats.length > 0 && (
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
            {stats.map((st, i) => (
              <div key={i} className="rounded-[8px] p-2.5 flex flex-col gap-1.5"
                style={{ background: 'var(--bg-surface2)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                  {st.icon}
                  <span className="text-[10px] font-medium">{st.label}</span>
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{st.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
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
        <div className="rounded-[12px] p-6 text-center"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Aucun événement enregistré</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Soyez le premier à signaler pour ce quartier.</p>
        </div>
      ) : (
        <div className="rounded-[12px] overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          {historique.map((h, i) => {
            const isCoupure = h.type === 'coupure'
            return (
              <div key={h.id} className="flex items-center gap-3 px-4 py-3"
                style={{ borderTop: i > 0 ? '1px solid var(--border-sub)' : 'none' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: isCoupure ? 'var(--red-bg)' : 'var(--green-bg)' }}>
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
