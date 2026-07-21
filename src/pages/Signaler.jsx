import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Info, Users } from 'lucide-react'
import { useQuartiers } from '../hooks/useQuartiers'
import { useGeolocation } from '../hooks/useGeolocation'
import SignalButton from '../components/SignalButton'
import api from '../api/client'

const PUSH_THRESHOLD = 5

export default function Signaler() {
  const [searchParams] = useSearchParams()
  const { quartiers } = useQuartiers()
  const { quartierDetecte } = useGeolocation(quartiers)

  const [quartierId, setQuartierId] = useState(
    () => searchParams.get('quartier') ?? localStorage.getItem('voltis_mon_quartier') ?? ''
  )
  const [loading, setLoading]   = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [cooldown, setCooldown] = useState(false)

  useEffect(() => {
    if (quartierDetecte && !quartierId) setQuartierId(quartierDetecte.id)
  }, [quartierDetecte, quartierId])

  const signal = async (type) => {
    if (!quartierId) {
      setFeedback({ type: 'error', message: 'Veuillez sélectionner un quartier.' })
      return
    }
    setLoading(type)
    setFeedback(null)
    try {
      const position = await getPosition()
      const { data } = await api.post('/signalements', {
        quartier_id: quartierId,
        type,
        latitude:  position?.latitude  ?? null,
        longitude: position?.longitude ?? null,
      })
      setFeedback({
        type:    'success',
        message: type === 'coupure' ? 'Coupure enregistrée. Merci !' : 'Rétablissement enregistré. Merci !',
        statut:  data.statut,
      })
      setCooldown(true)
      setTimeout(() => setCooldown(false), 5 * 60 * 1000)
    } catch (e) {
      setFeedback({ type: 'error', message: e.response?.data?.message ?? 'Erreur lors de l\'envoi.' })
    } finally {
      setLoading(null)
    }
  }

  const selectedQuartier = quartiers.find(q => String(q.id) === String(quartierId))
  const nbSignalements   = selectedQuartier?.nb_signalements ?? 0
  const nbManquants      = Math.max(0, PUSH_THRESHOLD - nbSignalements)
  const confidence       = Math.min(nbSignalements / PUSH_THRESHOLD, 1)
  const isCoupure        = selectedQuartier?.statut === 'coupure'

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
          Signaler
        </h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          Informez vos voisins de l'état du courant
        </p>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Sélecteur quartier */}
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
            Quartier concerné
          </label>
          <select
            value={quartierId}
            onChange={e => {
              setQuartierId(e.target.value)
              localStorage.setItem('voltis_mon_quartier', e.target.value)
            }}
            className="w-full rounded-[8px] px-3 py-2.5 text-sm outline-none appearance-none"
            style={{
              background: 'var(--bg-surface)',
              border:     `1px solid ${!quartierId && feedback?.type === 'error' ? 'var(--red-bd)' : 'var(--border)'}`,
              color:      quartierId ? 'var(--text-primary)' : 'var(--text-tertiary)',
            }}
          >
            <option value="">Sélectionnez un quartier</option>
            {quartiers
              .slice()
              .sort((a, b) => a.nom.localeCompare(b.nom))
              .map(q => (
                <option key={q.id} value={q.id}>{q.nom} — Secteur {q.secteur}</option>
              ))}
          </select>
        </div>

        {/* Proof social — état actuel du quartier sélectionné */}
        {selectedQuartier && (
          <div
            className="rounded-[12px] p-4"
            style={{
              background: isCoupure ? 'var(--red-bg)' : 'var(--bg-surface)',
              border:     `1px solid ${isCoupure ? 'var(--red-bd)' : 'var(--border)'}`,
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} strokeWidth={2} style={{ color: isCoupure ? 'var(--red)' : 'var(--text-tertiary)' }} />
              <p className="text-xs font-semibold" style={{ color: isCoupure ? 'var(--red)' : 'var(--text-secondary)' }}>
                {nbSignalements > 0
                  ? `${nbSignalements} voisin${nbSignalements > 1 ? 's ont' : ' a'} déjà signalé`
                  : 'Aucun signalement récent'}
              </p>
            </div>

            {/* Barre de progression */}
            <div
              className="w-full rounded-full overflow-hidden mb-2"
              style={{ height: '6px', background: 'var(--bg-surface2)' }}
            >
              <div
                style={{
                  height:       '100%',
                  width:        `${confidence * 100}%`,
                  background:   isCoupure ? 'var(--red)' : 'var(--green)',
                  borderRadius: '9999px',
                  transition:   'width 0.4s ease',
                }}
              />
            </div>
            <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
              {confidence >= 1
                ? 'Seuil atteint — notifications push envoyées aux abonnés'
                : nbManquants > 0
                  ? `${nbManquants} signalement${nbManquants > 1 ? 's' : ''} de plus déclencheront les notifications push`
                  : 'En cours de vérification…'}
            </p>
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div
            className="rounded-[10px] p-4 text-sm font-medium"
            style={{
              background: feedback.type === 'success' ? 'var(--green-bg)' : 'var(--red-bg)',
              border:     `1px solid ${feedback.type === 'success' ? 'var(--green-bd)' : 'var(--red-bd)'}`,
              color:      feedback.type === 'success' ? 'var(--green)' : 'var(--red)',
            }}
          >
            {feedback.message}
            {feedback.statut && (
              <p className="text-xs mt-1 opacity-70 font-normal">
                Statut actuel : {feedback.statut}
              </p>
            )}
          </div>
        )}

        {/* Boutons principaux */}
        <div
          className="rounded-[12px] p-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs font-medium text-center mb-4" style={{ color: 'var(--text-secondary)' }}>
            Quel est l'état du courant{selectedQuartier ? ` à ${selectedQuartier.nom}` : ''} ?
          </p>
          <div className="flex flex-col gap-3">
            <SignalButton type="coupure" onClick={() => signal('coupure')} loading={loading === 'coupure'} disabled={cooldown || !!loading} />
            <SignalButton type="retabli" onClick={() => signal('retabli')} loading={loading === 'retabli'} disabled={cooldown || !!loading} />
          </div>
          {cooldown && (
            <p className="text-xs text-center mt-3" style={{ color: 'var(--text-tertiary)' }}>
              Vous pourrez signaler à nouveau dans quelques minutes.
            </p>
          )}
        </div>

        {/* Info */}
        <div
          className="rounded-[12px] p-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Info size={14} strokeWidth={2} style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Comment ça marche</p>
          </div>
          <ul className="space-y-2.5">
            {[
              ['Signalement anonyme',  'Aucun compte requis, identification par IP uniquement'],
              ['Seuil de confirmation','3 signalements min. pour déclencher une alerte coupure'],
              ['Notification push',    '5 confirmations pour notifier tous les abonnés du quartier'],
              ['Rétablissement',       '3 signalements suffisent pour confirmer le retour du courant'],
            ].map(([titre, desc]) => (
              <li key={titre} className="flex flex-col gap-0.5">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{titre}</span>
                <span className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{desc}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function getPosition() {
  return new Promise(resolve => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      () => resolve(null),
      { timeout: 5000 }
    )
  })
}
