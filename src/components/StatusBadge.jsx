import { Zap, CheckCircle, HelpCircle } from 'lucide-react'
import { getStatut } from '../utils/statut'

const ICONS = {
  coupure:  Zap,
  retabli:  CheckCircle,
  incertain: HelpCircle,
}

const SIZES = {
  sm: { fontSize: '11px', padding: '3px 9px',  iconSize: 11, fontWeight: 700 },
  md: { fontSize: '13px', padding: '5px 12px', iconSize: 13, fontWeight: 600 },
  lg: { fontSize: '15px', padding: '6px 14px', iconSize: 15, fontWeight: 600 },
}

export default function StatusBadge({ statut, size = 'md' }) {
  const s  = getStatut(statut)
  const Icon = ICONS[statut] ?? HelpCircle
  const sz = SIZES[size] ?? SIZES.md

  return (
    <span
      style={{
        display:     'inline-flex',
        alignItems:  'center',
        gap:         '5px',
        fontSize:    sz.fontSize,
        fontWeight:  sz.fontWeight,
        padding:     sz.padding,
        borderRadius: '100px',
        color:       s.color,
        background:  s.bg,
        border:      `1px solid ${s.border}`,
        whiteSpace:  'nowrap',
        lineHeight:  '1',
        flexShrink:  0,
      }}
    >
      <Icon
        size={sz.iconSize}
        strokeWidth={2.2}
        style={{
          animation: statut === 'coupure' ? 'pulse-glow 1.5s ease-in-out infinite' : 'none',
          flexShrink: 0,
        }}
      />
      {s.label}
    </span>
  )
}
