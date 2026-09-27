/**
 * pwa.ts — Registrace Service Workeru pro PWA 'ВкусноПаскуда!'.
 */

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.MODE !== 'test') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker úspěšně registrován:', registration.scope);

          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] K dispozici je nová verze aplikace.');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.warn('[PWA] Registrace Service Workeru selhala:', error);
        });
    });
  }
}
