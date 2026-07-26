import type { ReactNode } from 'react'
import { messaggioErrore } from '@/lib/errors'

/** Riga di caricamento discreta, coerente col gate di RequireAuth. */
export function Caricamento({ testo = 'Caricamento…' }: { testo?: string }) {
  return <p className="py-8 text-center text-testo-debole">{testo}</p>
}

/** Blocco d'errore leggibile: traduce qualunque errore via lib/errors. */
export function Errore({ errore }: { errore: unknown }) {
  return (
    <p
      role="alert"
      className="rounded-card border border-danger-soft-border bg-danger-soft px-3 py-2 text-etichetta text-danger-soft-text"
    >
      {messaggioErrore(errore)}
    </p>
  )
}

/** Stato vuoto: messaggio centrato e, se serve, un'azione (es. "Nuovo lead"). */
export function Vuoto({
  testo,
  azione,
}: {
  testo: string
  azione?: ReactNode
}) {
  return (
    <div className="py-10 text-center">
      <p className="mb-3 text-testo-debole">{testo}</p>
      {azione}
    </div>
  )
}
