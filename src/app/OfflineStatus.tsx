import { useEffect, useState } from 'react'
import { flushSave } from '../features/invoices/store'
import { t } from '../locales/dictionary'
import { Button } from '../components/ui/button'
export function OfflineStatus({ lang, editing }: { lang: 'en' | 'ar'; editing: boolean }) {
  const [waiting, setWaiting] = useState<ServiceWorkerRegistration>()
  const [cached, setCached] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
    let alive = true
    void navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registration) => {
        if (!alive) return
        const inspect = () => {
          if (alive)
            setWaiting(
              registration.waiting && navigator.serviceWorker.controller ? registration : undefined,
            )
        }
        inspect()
        registration.addEventListener('updatefound', () =>
          registration.installing?.addEventListener('statechange', inspect),
        )
        void navigator.serviceWorker.ready.then(() => {
          if (alive) setCached(true)
        })
      })
      .catch(() => {
        if (alive) setError(t('offlineError', lang))
      })
    return () => {
      alive = false
    }
  }, [lang])
  if (error) return <span className="offline-status">{error}</span>
  return waiting ? (
    <Button
      size="sm"
      variant="outline"
      disabled={editing}
      title={editing ? t('leaveToUpdate', lang) : undefined}
      onClick={async () => {
        try {
          await flushSave()
          navigator.serviceWorker.addEventListener(
            'controllerchange',
            () => window.location.reload(),
            { once: true },
          )
          waiting.waiting?.postMessage('SKIP_WAITING')
        } catch {
          setError(t('error', lang))
        }
      }}
    >
      {t('updateApp', lang)}
    </Button>
  ) : cached ? (
    <span className="offline-status">{t('offlineReady', lang)}</span>
  ) : null
}
