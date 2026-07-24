import { useState, useEffect, useCallback } from 'react'
import api from '../api/client'

const POLL_INTERVAL = 30_000
const CACHE_TTL     = 60_000

// Cache module-level : survit aux navigations React Router
let _cache     = null
let _cacheTime = 0

export function useQuartiers() {
  const hasCache = _cache && (Date.now() - _cacheTime < CACHE_TTL)

  const [quartiers, setQuartiers]   = useState(hasCache ? _cache : [])
  const [loading, setLoading]       = useState(!hasCache)
  const [error, setError]           = useState(null)
  const [isOffline, setIsOffline]   = useState(false)
  const [lastUpdate, setLastUpdate] = useState(hasCache ? new Date(_cacheTime) : null)

  const fetch = useCallback(async () => {
    try {
      const { data } = await api.get('/quartiers/statuts')
      _cache     = data
      _cacheTime = Date.now()
      setQuartiers(data)
      setLastUpdate(new Date())
      setError(null)
      setIsOffline(false)
    } catch {
      if (!_cache) {
        setError('Pas de connexion. Vérifiez votre réseau.')
      }
      setIsOffline(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
    const id = setInterval(fetch, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetch])

  return { quartiers, loading, error, isOffline, lastUpdate, refresh: fetch }
}

export function useQuartier(id) {
  const [quartier, setQuartier] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const fetch = useCallback(async () => {
    if (!id) return
    try {
      const { data } = await api.get(`/quartiers/${id}`)
      setQuartier(data)
      setError(null)
    } catch {
      setError('Quartier introuvable.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetch()
    const id2 = setInterval(fetch, POLL_INTERVAL)
    return () => clearInterval(id2)
  }, [fetch])

  return { quartier, loading, error, refresh: fetch }
}
