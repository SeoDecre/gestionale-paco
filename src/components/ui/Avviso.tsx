import type { ReactNode } from 'react'
import { Icona, type NomeIcona } from './Icona'
import type { Tinta } from './Pillola'

const TINTE: Record<Tinta, string> = {
  neutro: 'border-neutral-soft-border bg-neutral-soft text-neutral-soft-text',
  info: 'border-info-soft-border bg-info-soft text-info-soft-text',
  successo:
    'border-success-soft-border bg-success-soft text-success-soft-text',
  avviso: 'border-warning-soft-border bg-warning-soft text-warning-soft-text',
  pericolo: 'border-danger-soft-border bg-danger-soft text-danger-soft-text',
}

/** Icona di default per tinta: il significato non deve stare solo nel colore. */
const ICONE: Record<Tinta, NomeIcona> = {
  neutro: 'info',
  info: 'info',
  successo: 'successo',
  avviso: 'avviso',
  pericolo: 'errore',
}

/**
 * Riquadro di nota: suggerimenti di vendita, condizioni economiche, avvisi.
 *
 * Nasce dall'aver trovato lo stesso riquadro riscritto a mano in undici punti,
 * ognuno con imbottitura e icona (emoji) diverse. Qui la decisione e' una:
 * tinta = significato, icona sempre presente, spaziatura sempre uguale.
 */
export function Avviso({
  tinta = 'info',
  icona,
  titolo,
  assertivo = false,
  children,
  className = '',
}: {
  tinta?: Tinta
  /** Sovrascrive l'icona implicita della tinta. */
  icona?: NomeIcona
  titolo?: string
  /**
   * Interrompe lo screen reader per annunciare subito il messaggio. Va usato
   * solo per cio' che compare in risposta a un'azione andata male (un login
   * rifiutato), mai per una nota sempre presente in pagina.
   */
  assertivo?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div
      role={assertivo ? 'alert' : undefined}
      className={`flex items-start gap-2 rounded-card border px-3 py-2 text-etichetta ${TINTE[tinta]} ${className}`}
    >
      <Icona nome={icona ?? ICONE[tinta]} misura="sm" className="mt-0.5" />
      <div className="min-w-0 flex-1">
        {titolo && <p className="font-semibold">{titolo}</p>}
        <div>{children}</div>
      </div>
    </div>
  )
}
