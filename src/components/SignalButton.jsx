import { Zap, CheckCircle, Loader } from 'lucide-react'

export default function SignalButton({ type, onClick, loading, disabled }) {
  const isCoupure = type === 'coupure'

  const color     = isCoupure ? 'var(--red)'    : 'var(--green)'
  const bg        = isCoupure ? 'var(--red-bg)' : 'var(--green-bg)'
  const border    = isCoupure ? 'var(--red-bd)' : 'var(--green-bd)'
  const iconBg    = isCoupure ? '#DC2626'        : '#16A34A'
  const Icon      = isCoupure ? Zap              : CheckCircle
  const label     = isCoupure ? 'Coupure'        : 'Rétabli'
  const desc      = isCoupure ? 'Le courant est coupé' : 'Le courant est revenu'

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center gap-4 w-full rounded-[14px] p-5 text-left transition-all active:scale-[0.97] disabled:opacity-40"
      style={{
        background: bg,
        border: `1.5px solid ${border}`,
      }}
    >
      {/* Icône dans un carré coloré */}
      <div
        className="w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0"
        style={{ background: disabled && !loading ? 'rgba(0,0,0,0.08)' : iconBg }}
      >
        {loading ? (
          <Loader size={22} strokeWidth={2} style={{ color: '#fff', animation: 'spin-slow 0.8s linear infinite' }} />
        ) : (
          <Icon size={22} strokeWidth={2} style={{ color: '#fff' }} />
        )}
      </div>

      <div>
        <p className="text-[16px] font-semibold" style={{ color }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color, opacity: 0.65 }}>{desc}</p>
      </div>
    </button>
  )
}
