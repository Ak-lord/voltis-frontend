import { useState, useCallback } from 'react'
import api from '../api/client'

// Firebase est initialisé dans firebase.js — importé conditionnellement
// pour éviter les erreurs si les clés ne sont pas configurées
let getTokenFn = null
let messagingInstance = null

async function loadFirebase() {
  if (getTokenFn) return { getToken: getTokenFn, messaging: messagingInstance }
  try {
    const { initializeApp } = await import('firebase/app')
    const { getMessaging, getToken } = await import('firebase/messaging')
    const firebaseConfig = {
      apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId:             import.meta.env.VITE_FIREBASE_APP_ID,
    }
    const app = initializeApp(firebaseConfig, 'voltis')
    messagingInstance = getMessaging(app)
    getTokenFn = getToken
    return { getToken, messaging: messagingInstance }
  } catch {
    return null
  }
}

export function usePush() {
  const [token, setToken] = useState(() => localStorage.getItem('voltis_fcm_token'))
  const [status, setStatus] = useState('idle') // idle | loading | granted | denied | unsupported

  const subscribe = useCallback(async (quartierId) => {
    if (!('Notification' in window)) { setStatus('unsupported'); return false }

    setStatus('loading')
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') { setStatus('denied'); return false }

    const firebase = await loadFirebase()
    if (!firebase || !import.meta.env.VITE_VAPID_KEY) {
      // Firebase pas configuré — on ignore silencieusement
      setStatus('unsupported')
      return false
    }

    try {
      const fcmToken = await firebase.getToken(firebase.messaging, {
        vapidKey: import.meta.env.VITE_VAPID_KEY,
      })
      await api.post('/push/subscribe', { quartier_id: quartierId, fcm_token: fcmToken })
      localStorage.setItem('voltis_fcm_token', fcmToken)
      setToken(fcmToken)
      setStatus('granted')
      return true
    } catch {
      setStatus('denied')
      return false
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    const t = localStorage.getItem('voltis_fcm_token')
    if (!t) return
    try {
      await api.delete('/push/unsubscribe', { data: { fcm_token: t } })
      localStorage.removeItem('voltis_fcm_token')
      setToken(null)
      setStatus('idle')
    } catch {}
  }, [])

  return { token, status, subscribe, unsubscribe }
}
