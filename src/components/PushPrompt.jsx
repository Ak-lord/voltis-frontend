import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import { usePush } from '../hooks/usePush'

export default function PushPrompt({ quartierId, quartierNom }) {
  const { endpoint, status, subscribe } = usePush()
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('voltis_push_dismissed') === '1'
  )

  if (dismissed || !quartierId || endpoint) return null

  const handleSubscribe = async () => {
    const ok = await subscribe(quartierId)
    if (!ok && status === 'unsupported') setDismissed(true)
  }

  const handleDismiss = () => {
    localStorage.setItem('voltis_push_dismissed', '1')
    setDismissed(true)
  }

  return (
    <div
      className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 mb-3"
      style={{ background: 'var(--brand-bg)', border: '1px solid var(--brand-bd)' }}
    >
      <Bell size={14} strokeWidth={2} style={{ color: 'var(--brand)', flexShrink: 0 }} />
      <p className="flex-1 text-xs leading-snug" style={{ color: 'var(--text-secondary)' }}>
        Recevoir les alertes pour{' '}
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{quartierNom}</span>
      </p>
      <button
        onClick={handleSubscribe}
        disabled={status === 'loading'}
        className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
        style={{ background: 'var(--brand)', color: '#fff' }}
      >
        {status === 'loading' ? '…' : 'Activer'}
      </button>
      <button
        onClick={handleDismiss}
        className="w-8 h-8 flex items-center justify-center shrink-0 rounded-full"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  )
}
