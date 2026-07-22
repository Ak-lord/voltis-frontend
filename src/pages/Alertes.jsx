import { useState } from 'react'
import { Bell, BellOff, Shield, Clock, CheckCircle, Zap, Sun, Moon } from 'lucide-react'
import { useQuartiers } from '../hooks/useQuartiers'
import { usePush } from '../hooks/usePush'
import { useTheme } from '../hooks/useTheme'

const CONDITIONS = [
  {
    icon:  <Zap size={14} strokeWidth={2} />,
    color: 'var(--red)',
    bg:    'var(--red-bg)',
    bd:    'var(--red-bd)',
    titre: 'Coupure confirmée',
    desc:  '≥ 5 signalements dans les 30 dernières minutes',
  },
  {
    icon:  <CheckCircle size={14} strokeWidth={2} />,
    color: 'var(--green)',
    bg:    'var(--green-bg)',
    bd:    'var(--green-bd)',
    titre: 'Rétablissement confirmé',
    desc:  '≥ 3 signalements de retour du courant',
  },
  {
    icon:  <Clock size={14} strokeWidth={2} />,
    color: 'var(--yellow)',
    bg:    'var(--yellow-bg)',
    bd:    'var(--yellow-bd)',
    titre: 'Incertitude prolongée',
    desc:  'Situation incertaine depuis + de 2 heures',
  },
  {
    icon:  <Shield size={14} strokeWidth={2} />,
    color: 'var(--text-tertiary)',
    bg:    'var(--bg-surface2)',
    bd:    'var(--border)',
    titre: 'Signalement anonyme',
    desc:  'Aucune donnée personnelle collectée',
  },
]

export default function Alertes() {
  const { quartiers } = useQuartiers()
  const { token, status, subscribe, unsubscribe } = usePush()
  const { theme, toggle: toggleTheme } = useTheme()
  const [quartierId, setQuartierId] = useState(
    () => localStorage.getItem('voltis_mon_quartier') ?? ''
  )
  const [feedback, setFeedback] = useState(null)

  const handleSubscribe = async () => {
    if (!quartierId) {
      setFeedback({ type: 'error', message: 'Sélectionnez un quartier.' })
      return
    }
    setFeedback(null)
    const ok = await subscribe(quartierId)
    if (ok) {
      setFeedback({ type: 'success', message: 'Notifications activées pour ce quartier.' })
    } else {
      setFeedback({
        type:    'error',
        message: status === 'denied'
          ? 'Permission refusée. Autorisez les notifications dans les paramètres du navigateur.'
          : 'Notifications non disponibles sur cet appareil.',
      })
    }
  }

  const handleUnsubscribe = async () => {
    await unsubscribe()
    setFeedback({ type: 'success', message: 'Désabonnement effectué.' })
  }

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
          Alertes
        </h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          Gérez vos notifications push
        </p>
      </header>

      <div className="px-4 py-4 space-y-3">
        {/* Statut actuel */}
        <div
          className="rounded-[12px] p-4 flex items-center gap-4"
          style={{
            background: token ? 'var(--green-bg)' : 'var(--bg-surface)',
            border:     `1px solid ${token ? 'var(--green-bd)' : 'var(--border)'}`,
          }}
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: token ? 'var(--green-bg)' : 'var(--bg-surface2)',
              border:     `1px solid ${token ? 'var(--green-bd)' : 'var(--border)'}`,
            }}
          >
            {token
              ? <Bell    size={20} strokeWidth={1.8} style={{ color: 'var(--green)' }} />
              : <BellOff size={20} strokeWidth={1.8} style={{ color: 'var(--text-tertiary)' }} />
            }
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {token ? 'Notifications activées' : 'Notifications désactivées'}
            </p>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {token
                ? 'Vous serez alerté dès qu\'une coupure est confirmée.'
                : 'Activez pour recevoir des alertes en temps réel.'}
            </p>
          </div>
        </div>

        {/* Sélecteur quartier (si pas encore abonné) */}
        {!token && (
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
              Quartier à surveiller
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
                border:     '1px solid var(--border)',
                color:      quartierId ? 'var(--text-primary)' : 'var(--text-tertiary)',
              }}
            >
              <option value="">Choisir un quartier</option>
              {quartiers
                .slice()
                .sort((a, b) => a.nom.localeCompare(b.nom))
                .map(q => (
                  <option key={q.id} value={q.id}>{q.nom} — Secteur {q.secteur}</option>
                ))}
            </select>
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
          </div>
        )}

        {/* Bouton d'action */}
        {token ? (
          <button
            onClick={handleUnsubscribe}
            className="w-full py-3 rounded-[8px] text-sm font-semibold flex items-center justify-center gap-2"
            style={{
              background: 'var(--red-bg)',
              color:      'var(--red)',
              border:     '1px solid var(--red-bd)',
            }}
          >
            <BellOff size={16} strokeWidth={2} />
            Désactiver les notifications
          </button>
        ) : (
          <button
            onClick={handleSubscribe}
            disabled={status === 'loading'}
            className="w-full py-3 rounded-[8px] text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: 'var(--brand)', color: '#fff' }}
          >
            <Bell size={16} strokeWidth={2.2} />
            {status === 'loading' ? 'Activation…' : 'Activer les notifications'}
          </button>
        )}

        {/* Thème */}
        <div
          className="rounded-[12px] p-4 flex items-center justify-between"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--bg-surface2)', border: '1px solid var(--border)' }}
            >
              {theme === 'dark'
                ? <Moon size={16} strokeWidth={1.8} style={{ color: 'var(--brand)' }} />
                : <Sun  size={16} strokeWidth={1.8} style={{ color: 'var(--yellow)' }} />
              }
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {theme === 'dark' ? 'Mode sombre' : 'Mode clair'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Apparence de l'application
              </p>
            </div>
          </div>

          {/* Toggle switch */}
          <button
            onClick={toggleTheme}
            className="relative shrink-0"
            style={{ width: '44px', height: '26px' }}
            aria-label="Basculer le thème"
          >
            <div
              className="w-full h-full rounded-full transition-colors duration-200"
              style={{ background: theme === 'dark' ? 'var(--brand)' : 'var(--bg-surface2)', border: '1px solid var(--border)' }}
            />
            <div
              className="absolute top-[3px] rounded-full transition-transform duration-200"
              style={{
                width: '20px', height: '20px',
                background: theme === 'dark' ? '#fff' : 'var(--text-tertiary)',
                transform: theme === 'dark' ? 'translateX(21px)' : 'translateX(3px)',
              }}
            />
          </button>
        </div>

        {/* Conditions d'alerte */}
        <div
          className="rounded-[12px] overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <div className="px-4 pt-4 pb-3">
            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Conditions d'alerte
            </p>
          </div>
          {CONDITIONS.map(({ icon, color, bg, bd, titre, desc }, i) => (
            <div
              key={titre}
              className="flex items-start gap-3 px-4 py-3"
              style={{ borderTop: i === 0 ? '1px solid var(--border)' : '1px solid var(--border-sub)' }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: bg, border: `1px solid ${bd}`, color }}
              >
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{titre}</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Signature */}
        <p className="text-center py-2" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
          Conçu par SAWADOGO Abdoul Aziz
        </p>
      </div>
    </div>
  )
}
