export const STATUTS = {
  coupure: {
    label:  'Coupure',
    color:  '#DC2626',
    bg:     '#FEF2F2',
    border: '#FECACA',
  },
  retabli: {
    label:  'Rétabli',
    color:  '#16A34A',
    bg:     '#F0FDF4',
    border: '#BBF7D0',
  },
  incertain: {
    label:  'Incertain',
    color:  '#D97706',
    bg:     '#FFFBEB',
    border: '#FDE68A',
  },
}

export function getStatut(key) {
  return STATUTS[key] ?? STATUTS.incertain
}

export function formatDuree(minutes) {
  if (!minutes) return null
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

export function formatRelative(isoString) {
  if (!isoString) return null
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1)  return 'à l\'instant'
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24)   return `il y a ${hours}h`
  return `il y a ${Math.floor(hours / 24)}j`
}

export function dureeDepuis(isoString) {
  if (!isoString) return null
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1)  return 'depuis à l\'instant'
  if (minutes < 60) return `depuis ${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `depuis ${h}h${String(m).padStart(2, '0')}` : `depuis ${h}h`
}

export function quartierLePlusProche(lat, lon, quartiers) {
  let best = null, bestDist = Infinity
  for (const q of quartiers) {
    const d = Math.pow(q.latitude - lat, 2) + Math.pow(q.longitude - lon, 2)
    if (d < bestDist) { bestDist = d; best = q }
  }
  return best
}
