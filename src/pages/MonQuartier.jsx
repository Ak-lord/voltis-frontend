import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, CheckCircle, HelpCircle, MapPin, ChevronRight, ChevronDown } from 'lucide-react'
import { useQuartiers } from '../hooks/useQuartiers'
import { useGeolocation } from '../hooks/useGeolocation'
import { dureeDepuis } from '../utils/statut'
import api from '../api/client'

const BIG_STATUS = {
  coupure:  { Icon: Zap,         label: 'Courant coupé',             color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  retabli:  { Icon: CheckCircle, label: 'Courant revenu',            color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  incertain:{ Icon: HelpCircle,  label: "Pas d'info pour l'instant", color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
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

export default function MonQuartier() {
  const navigate = useNavigate()
  const { quartiers, loading } = useQuartiers()
  const { quartierDetecte, status: geoStatus } = useGeolocation(quartiers)

  const [quartierId, setQuartierId] = useState(
    () => localStorage.getItem('voltis_mon_quartier') ?? ''
  )
  const [showSelector, setShowSelector] = useState(false)
  const [signalLoading, setSignalLoading] = useState(null)
  const [feedback, setFeedback]           = useState(null)
  const [cooldown, setCooldown]           = useState(false)

  const quartier = quartiers.find(q => q.id === quartierId)
  const s = BIG_STATUS[quartier?.statut] ?? BIG_STATUS.incertain

  function choisir(id) {
    setQuartierId(id)
    localStorage.setItem('voltis_mon_quartier', id)
    setShowSelector(false)
    setFeedback(null)
  }

  async function signal(type) {
    if (!quartierId) return
    setSignalLoading(type)
    setFeedback(null)
    try {
      const position = await getPosition()
      await api.post('/signalements', {
        quartier_id: quartierId,
        type,
        latitude:  position?.latitude  ?? null,
        longitude: position?.longitude ?? null,
      })
      setFeedback({ type: 'success', text: type === 'coupure' ? 'Coupure enregistrée. Merci !' : 'Rétablissement enregistré. Merci !' })
      setCooldown(true)
      setTimeout(() => { setCooldown(false); setFeedback(null) }, 5 * 60 * 1000)
    } catch (e) {
      setFeedback({ type: 'error', text: e.response?.data?.message ?? 'Erreur lors de l\'envoi.' })
    } finally {
      setSignalLoading(null)
    }
  }

  /* ── Écran vide : aucun quartier choisi ─────────────────────────── */
  if (!quartierId && !loading) {
    return (
      <div className="flex flex-col min-h-full">
        <div
          className="sticky top-0 z-40 px-4 pb-4"
          style={{ background: 'var(--bg-topbar)', borderBottom: '1px solid var(--border)', paddingTop: 'calc(var(--safe-top) + 12px)' }}
        >
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Accueil</h1>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 gap-6 pb-12">
          {/* Icône */}
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-[20px] flex items-center justify-center" style={{ background: 'var(--brand-bg)', border: '1px solid var(--brand-bd)' }}>
              <MapPin size={28} strokeWidth={1.8} style={{ color: 'var(--brand)' }} />
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Quel est votre quartier ?</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Suivez l'état du courant en temps réel</p>
            </div>
          </div>

          {/* Sélecteur */}
          <div className="flex flex-col gap-3">
            {geoStatus === 'ok' && quartierDetecte && (
              <button
                onClick={() => choisir(quartierDetecte.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[12px] text-left"
                style={{ background: 'var(--brand-bg)', border: '1px solid var(--brand-bd)' }}
              >
                <MapPin size={16} strokeWidth={2} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>Utiliser ma position GPS</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{quartierDetecte.nom} — Secteur {quartierDetecte.secteur}</p>
                </div>
                <ChevronRight size={14} strokeWidth={2} style={{ color: 'var(--brand)', flexShrink: 0 }} />
              </button>
            )}
            <select
              value=""
              onChange={e => choisir(e.target.value)}
              className="w-full rounded-[12px] px-4 py-3.5 outline-none appearance-none font-medium"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-tertiary)', fontSize: '16px' }}
            >
              <option value="">Choisir dans la liste…</option>
              {quartiers.slice().sort((a, b) => a.nom.localeCompare(b.nom)).map(q => (
                <option key={q.id} value={q.id}>{q.nom} — Secteur {q.secteur}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    )
  }

  /* ── Spinner initial ────────────────────────────────────────────── */
  if (loading && !quartiers.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 px-6"
        style={{ minHeight: 'calc(100dvh - 80px)', paddingTop: 'calc(var(--safe-top) + 12px)' }}>
        <div className="w-16 h-16 rounded-[20px] flex items-center justify-center"
          style={{ background: 'var(--brand-bg)', border: '1px solid var(--brand-bd)' }}>
          <Zap size={26} strokeWidth={1.8} style={{ color: 'var(--brand)' }} />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Voltis</p>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-tertiary)' }}>Connexion en cours…</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)', opacity: 0.6 }}>Le serveur se réveille, attendez quelques secondes</p>
        </div>
        <div className="w-7 h-7 rounded-full border-2 border-t-transparent"
          style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent', animation: 'spin-slow 0.8s linear infinite' }} />
      </div>
    )
  }

  /* ── Vue principale : quartier sélectionné ──────────────────────── */
  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 pb-4 flex items-end justify-between gap-3"
        style={{ background: 'var(--bg-topbar)', borderBottom: '1px solid var(--border)', paddingTop: 'calc(var(--safe-top) + 12px)' }}
      >
        <div className="min-w-0">
          <h1 className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {quartier?.nom ?? '—'}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Secteur {quartier?.secteur} · Ouagadougou
          </p>
        </div>
        <button
          onClick={() => setShowSelector(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold shrink-0"
          style={{ background: 'var(--bg-surface2)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          Changer <ChevronDown size={11} strokeWidth={2.5} style={{ transform: showSelector ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
        </button>
      </header>

      <div className="px-4 py-4 flex flex-col gap-3">

        {/* Sélecteur déroulant */}
        {showSelector && (
          <div className="rounded-[12px] overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
            {geoStatus === 'ok' && quartierDetecte && (
              <button
                onClick={() => choisir(quartierDetecte.id)}
                className="w-full flex items-center gap-3 px-4 py-3 border-b text-left"
                style={{ borderColor: 'var(--border)' }}
              >
                <MapPin size={14} strokeWidth={2} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--brand)' }}>Position GPS</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{quartierDetecte.nom}</p>
                </div>
              </button>
            )}
            <select
              value={quartierId}
              onChange={e => choisir(e.target.value)}
              className="w-full px-4 py-3 outline-none appearance-none text-sm"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '16px' }}
            >
              {quartiers.slice().sort((a, b) => a.nom.localeCompare(b.nom)).map(q => (
                <option key={q.id} value={q.id}>{q.nom} — Secteur {q.secteur}</option>
              ))}
            </select>
          </div>
        )}

        {/* Grand statut */}
        <div
          className="rounded-[16px] py-8 px-4 flex flex-col items-center text-center gap-3"
          style={{ background: s.bg, border: `1px solid ${s.border}` }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.7)' }}>
            <s.Icon size={30} strokeWidth={1.8} style={{ color: s.color }} />
          </div>
          <p className="text-[22px] font-extrabold leading-tight" style={{ color: s.color, letterSpacing: '-0.03em' }}>
            {s.label}
          </p>
          {quartier?.statut === 'coupure' && quartier?.debut_coupure && (
            <p className="text-sm font-medium" style={{ color: s.color, opacity: 0.7 }}>
              {dureeDepuis(quartier.debut_coupure)}
            </p>
          )}
          {(quartier?.nb_signalements ?? 0) > 0 && (
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {quartier.nb_signalements} personne{quartier.nb_signalements > 1 ? 's ont' : ' a'} signalé
            </p>
          )}
        </div>

        {/* Feedback signalement */}
        {feedback && (
          <div
            className="rounded-[10px] px-4 py-3 text-sm font-semibold text-center"
            style={{
              background: feedback.type === 'success' ? '#F0FDF4' : '#FEF2F2',
              border:     `1px solid ${feedback.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
              color:      feedback.type === 'success' ? '#16A34A' : '#DC2626',
            }}
          >
            {feedback.text}
          </div>
        )}

        {/* Boutons signalement */}
        {!cooldown && (
          <div className="flex flex-col gap-2">
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
          </div>
        )}

        {cooldown && (
          <p className="text-xs text-center py-2" style={{ color: 'var(--text-tertiary)' }}>
            Signalement envoyé. Vous pourrez signaler à nouveau dans quelques minutes.
          </p>
        )}

        {/* Lien détail */}
        {quartier && (
          <button
            onClick={() => navigate(`/quartier/${quartier.id}`)}
            className="w-full py-3 rounded-[10px] flex items-center justify-center gap-1.5 text-sm font-medium"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            Voir l'historique complet
            <ChevronRight size={14} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  )
}
