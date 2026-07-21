import { useState, useEffect, useRef } from 'react'
import { quartierLePlusProche } from '../utils/statut'

export function useGeolocation(quartiers) {
  const [quartierDetecte, setQuartierDetecte] = useState(null)
  const [status, setStatus] = useState('idle') // idle | loading | ok | denied | unsupported
  const hasTriedRef = useRef(false)

  useEffect(() => {
    if (!quartiers?.length || hasTriedRef.current) return
    hasTriedRef.current = true
    if (!navigator.geolocation) {
      setStatus('unsupported')
      return
    }
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const q = quartierLePlusProche(coords.latitude, coords.longitude, quartiers)
        setQuartierDetecte(q)
        setStatus('ok')
      },
      () => setStatus('denied'),
      { timeout: 8000, maximumAge: 60000 }
    )
  }, [quartiers])

  return { quartierDetecte, status }
}
