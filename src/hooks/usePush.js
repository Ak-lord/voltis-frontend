import { useState, useCallback } from 'react'
import api from '../api/client'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export function usePush() {
  const [endpoint, setEndpoint] = useState(() => localStorage.getItem('voltis_push_endpoint'))
  const [status, setStatus] = useState('idle') // idle | loading | granted | denied | unsupported

  const subscribe = useCallback(async (quartierId) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return false
    }
    if (!VAPID_PUBLIC_KEY) {
      setStatus('unsupported')
      return false
    }

    setStatus('loading')
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') { setStatus('denied'); return false }

    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const json = sub.toJSON()
      await api.post('/push/subscribe', {
        quartier_id: quartierId,
        endpoint:    json.endpoint,
        p256dh:      json.keys.p256dh,
        auth:        json.keys.auth,
      })

      localStorage.setItem('voltis_push_endpoint', json.endpoint)
      setEndpoint(json.endpoint)
      setStatus('granted')
      return true
    } catch {
      setStatus('denied')
      return false
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    const ep = localStorage.getItem('voltis_push_endpoint')
    if (!ep) return
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) await sub.unsubscribe()
      await api.delete('/push/unsubscribe', { data: { endpoint: ep } })
      localStorage.removeItem('voltis_push_endpoint')
      setEndpoint(null)
      setStatus('idle')
    } catch {}
  }, [])

  return { endpoint, status, subscribe, unsubscribe }
}
