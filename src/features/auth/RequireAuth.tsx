import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from './useSession'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, caricamento } = useSession()
  const location = useLocation()

  // Senza questa attesa un reload rimbalzerebbe al login prima che la
  // sessione salvata venga riletta da localStorage.
  if (caricamento) {
    return (
      <div className="flex min-h-svh items-center justify-center text-testo-debole">
        Caricamento…
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
