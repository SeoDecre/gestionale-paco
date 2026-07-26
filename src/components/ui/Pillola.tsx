import type { ReactNode } from 'react'

/** Tinte semantiche §2. Si sceglie il SIGNIFICATO, mai il colore. */
export type Tinta =
  | 'neutro' // etichette campi, badge fonte lead
  | 'info' // brand NEXI, link, "Oggi"
  | 'successo' // stati positivi, Hera Comm, badge Principale
  | 'avviso' // target, avvisi soft
  | 'pericolo' // concorrenti/POS attuale, conflitti, elimina

const TINTE: Record<Tinta, string> = {
  neutro: 'bg-neutral-soft text-neutral-soft-text border-neutral-soft-border',
  info: 'bg-info-soft text-info-soft-text border-info-soft-border',
  successo: 'bg-success-soft text-success-soft-text border-success-soft-border',
  avviso: 'bg-warning-soft text-warning-soft-text border-warning-soft-border',
  pericolo: 'bg-danger-soft text-danger-soft-text border-danger-soft-border',
}

/**
 * Etichetta "pillola" §2: rettangolo arrotondato, testo centrato.
 * Su iPhone occupa piena larghezza (`piena`), su schermi larghi si stringe.
 */
export function Pillola({
  children,
  tinta = 'neutro',
  piena = false,
  className = '',
}: {
  children: ReactNode
  tinta?: Tinta
  piena?: boolean
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-pillola border px-3 py-1 text-etichetta font-medium ${
        TINTE[tinta]
      } ${piena ? 'w-full' : ''} ${className}`}
    >
      {children}
    </span>
  )
}
