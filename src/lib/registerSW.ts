// Service worker registration with update-available toast.
// Only registers in production builds (avoids dev HMR conflicts).

const SW_URL = '/sw.js'

export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return
  if (!import.meta.env.PROD) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(SW_URL).then(registration => {
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing
        if (!installing) return
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available — notify
            window.dispatchEvent(new CustomEvent('yatra360:sw-update'))
          }
        })
      })
    }).catch(err => {
      console.warn('[Yatra360] Service worker registration failed:', err)
    })

    // Reload page after the controlling SW changes (post-skipWaiting)
    let reloading = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return
      reloading = true
      window.location.reload()
    })
  })
}

/** Call this from the UI when the user clicks "Reload to update". */
export function applyServiceWorkerUpdate(): void {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.getRegistration().then(reg => {
    reg?.waiting?.postMessage({ type: 'SKIP_WAITING' })
  })
}
