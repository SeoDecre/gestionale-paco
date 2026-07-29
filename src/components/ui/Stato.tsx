import type { ReactNode } from 'react'
import { messaggioErrore } from '@/lib/errors'
import { Icona, Rotellina, type NomeIcona } from './Icona'

/** Riga di caricamento discreta, coerente col gate di RequireAuth. */
export function Caricamento({ testo = 'Caricamento…' }: { testo?: string }) {
  return (
    <p
      role="status"
      className="flex items-center justify-center gap-2 py-8 text-testo-debole"
    >
      <Rotellina misura="sm" />
      {testo}
    </p>
  )
}

/**
 * Sagoma di attesa. Meglio della rotellina quando si sa gia' che forma avra'
 * il contenuto: la pagina non salta quando i dati arrivano, perche' lo spazio
 * era gia' riservato.
 */
export function Scheletro({
  righe = 3,
  className = '',
}: {
  righe?: number
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label="Caricamento in corso"
      className={`flex flex-col gap-2 ${className}`}
    >
      {Array.from({ length: righe }, (_, i) => (
        <div
          key={i}
          className="animate-scheletro h-4 rounded-piccolo bg-superficie-alt"
          /* L'ultima riga piu' corta: un blocco di righe tutte uguali legge
             come una tabella vuota, non come testo in arrivo. */
          style={{ width: i === righe - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  )
}

/** Blocco d'errore leggibile: traduce qualunque errore via lib/errors. */
export function Errore({ errore }: { errore: unknown }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-card border border-danger-soft-border bg-danger-soft px-3 py-2 text-etichetta text-danger-soft-text"
    >
      {/* Icona oltre al colore: il rosso da solo non e' un'informazione per
          chi non distingue i colori (WCAG 1.4.1). */}
      <Icona nome="errore" misura="sm" className="mt-0.5" />
      {messaggioErrore(errore)}
    </p>
  )
}

/** Stato vuoto: messaggio centrato e, se serve, un'azione (es. "Nuovo lead"). */
export function Vuoto({
  testo,
  icona,
  azione,
}: {
  testo: string
  icona?: NomeIcona
  azione?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      {icona && (
        <Icona
          nome={icona}
          misura="lg"
          className="mb-2 text-testo-tenue"
        />
      )}
      <p className="mb-3 text-testo-debole">{testo}</p>
      {azione}
    </div>
  )
}
