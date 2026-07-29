import { Icona, type NomeIcona } from './Icona'
import type { Tinta } from './Pillola'

/** Riempimenti per il segmento attivo, uno per tinta semantica §2. */
const ATTIVO: Record<Tinta, string> = {
  neutro: 'bg-neutral-soft-text text-superficie',
  info: 'bg-info-soft-text text-superficie',
  successo: 'bg-success-soft-text text-superficie',
  avviso: 'bg-warning-soft-text text-superficie',
  pericolo: 'bg-danger-soft-text text-superficie',
}

export type Opzione<T> = {
  valore: T
  etichetta: string
  icona?: NomeIcona
  /** Tinta del segmento quando e' quello scelto. Default: info. */
  tinta?: Tinta
}

/**
 * Controllo segmentato: N opzioni affiancate, una sola scelta. E' il pattern
 * giusto quando le opzioni sono poche e vanno confrontate a colpo d'occhio —
 * una `select` le nasconderebbe dietro un tap in piu'.
 *
 * Usa `radiogroup` e non un gruppo di bottoni: cosi' le frecce funzionano da
 * tastiera e VoiceOver annuncia "1 di 3".
 */
export function Segmentato<T extends string | boolean | null>({
  opzioni,
  valore,
  onChange,
  etichetta,
  piena = false,
  className = '',
}: {
  opzioni: Opzione<T>[]
  valore: T
  onChange: (v: T) => void
  /** Descrive il gruppo agli screen reader (es. "Accetta Amex"). */
  etichetta: string
  /** Occupa tutta la larghezza, con segmenti di uguale ampiezza. */
  piena?: boolean
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={etichetta}
      className={`overflow-hidden rounded-card border border-bordo-forte ${
        piena ? 'flex w-full' : 'inline-flex shrink-0'
      } ${className}`}
    >
      {opzioni.map((o, i) => {
        const attivo = valore === o.valore
        return (
          <button
            key={String(o.valore)}
            type="button"
            role="radio"
            aria-checked={attivo}
            onClick={() => onChange(o.valore)}
            className={[
              'transizione-colore inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-etichetta font-medium',
              piena ? 'flex-1' : '',
              i > 0 ? 'border-l border-bordo-forte' : '',
              attivo
                ? ATTIVO[o.tinta ?? 'info']
                : 'bg-superficie text-testo-debole hover:bg-superficie-alt hover:text-testo',
            ].join(' ')}
          >
            {o.icona && <Icona nome={o.icona} misura="sm" />}
            {o.etichetta}
          </button>
        )
      })}
    </div>
  )
}
