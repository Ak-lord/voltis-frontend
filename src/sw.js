import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// Injected by VitePWA at build time
precacheAndRoute(self.__WB_MANIFEST)

// Cache API statuts with NetworkFirst
registerRoute(
  ({ url }) => url.pathname.includes('/api/quartiers'),
  new NetworkFirst({
    cacheName: 'api-quartiers',
    plugins: [new ExpirationPlugin({ maxAgeSeconds: 60 })],
  })
)

// Push notification received
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: 'Voltis', body: event.data.text() }
  }

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Voltis', {
      body:    data.body,
      icon:    data.icon  ?? '/icon-192.png',
      badge:   data.badge ?? '/icon-192.png',
      tag:     data.tag,
      data:    data.data,
    })
  )
})

// Tap on notification → open/focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url ?? '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
