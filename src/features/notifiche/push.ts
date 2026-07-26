/**
 * Helper Web Push lato client (§7). Registra il service worker, chiede il
 * permesso, si iscrive con la chiave VAPID pubblica. Su iOS funziona SOLO se
 * l'app è installata alla Home Screen (standalone).
 */

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

export function pushSupportato(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/** true se l'app gira come PWA installata (requisito iOS per il push). */
export function installataStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export async function registraServiceWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register('/sw.js')
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export async function iscrizioneCorrente(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.getSubscription()
}

export async function iscrivi(): Promise<PushSubscription> {
  if (!VAPID_PUBLIC) throw new Error('VITE_VAPID_PUBLIC_KEY mancante.')
  const permesso = await Notification.requestPermission()
  if (permesso !== 'granted') throw new Error('Permesso notifiche negato.')
  const reg = await navigator.serviceWorker.ready
  const esistente = await reg.pushManager.getSubscription()
  if (esistente) return esistente
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
  })
}
