import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icona, type NomeIcona } from './Icona'
import { classiChip } from './chipStile'

/**
 * Pillola selezionabile: la forma di scelta piu' usata dell'app (schede NEXI,
 * esigenze, filtri della lista lead, voci multiple).
 *
 * Prima ogni punto la ridisegnava con la propria stringa di classi, e i tre
 * risultati non erano identici. Un solo componente qui significa che "cosa
 * vuol dire selezionato" e' definito una volta.
 */
export function Chip({
  attivo = false,
  icona,
  ruolo = 'interruttore',
  tratteggiato = false,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  attivo?: boolean
  icona?: NomeIcona
  /**
   * 'interruttore' = si accende e si spegne (aria-pressed).
   * 'scheda'       = una sola attiva in un gruppo (aria-selected + role=tab).
   */
  ruolo?: 'interruttore' | 'scheda'
  /** Bordo tratteggiato: convenzione per "aggiungi qualcosa che non c'e'". */
  tratteggiato?: boolean
  children: ReactNode
}) {
  const scheda = ruolo === 'scheda'
  return (
    <button
      type={type}
      role={scheda ? 'tab' : undefined}
      aria-selected={scheda ? attivo : undefined}
      aria-pressed={scheda ? undefined : attivo}
      className={`${classiChip({ attivo, tratteggiato })} ${className}`}
      {...rest}
    >
      {icona && <Icona nome={icona} misura="sm" />}
      {children}
    </button>
  )
}

/**
 * Riga di chip che scorre in orizzontale invece di andare a capo. In piedi
 * davanti al cliente una fila sola da scorrere col pollice si colpisce piu'
 * in fretta di tre righe che riflowano a ogni selezione.
 *
 * `-mx-4 px-4` porta lo scorrimento fino al bordo del contenitore, cosi' non
 * sembra che le voci finiscano prima del margine.
 */
export function BarraChip({
  children,
  className = '',
  ...rest
}: { children: ReactNode; className?: string } & Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children'
>) {
  return (
    <div
      className={`scorrevole-x -mx-4 flex gap-1.5 px-4 pb-1 ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
