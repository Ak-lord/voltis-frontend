import { useState, useEffect, useCallback } from 'react'
import api from '../api/client'

const POLL_INTERVAL = 30_000

export function useQuartiers() {
  const [quartiers, setQuartiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetch = useCallback(async () => {
    try {
      const { data } = await api.get('/quartiers/statuts')
      setQuartiers(data)
      setLastUpdate(new Date())
      setError(null)
    } catch (e) {
      setError('Impossible de récupérer les statuts.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
    const id = setInterval(fetch, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetch])

  return { quartiers, loading, error, lastUpdate, refresh: fetch }
}

export function useQuartier(id) {
  const [quartier, setQuartier] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
