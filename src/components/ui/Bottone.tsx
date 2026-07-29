import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icona, Rotellina, type NomeIcona } from './Icona'

/**
 * Varianti semantiche §2 — si sceglie il RUOLO del bottone, non il colore.
 *
 * 'registrazione' usa il rosso PIENO (danger-fill), eccezione §2 riservata ai
 * tasti Memo vocale / Foto: convenzione universale di registrazione.
 *
 * Regola di gerarchia: una sola azione `primario` per schermata. Se due
 * bottoni sono entrambi primari, nessuno dei due lo e'.
 */
export type VarianteBottone =
  | 'primario'
  | 'secondario'
  | 'fantasma'
  | 'pericolo'
  | 'registrazione'

const VARIANTI: Record<VarianteBottone, string> = {
  primario:
    'bg-primario text-primario-testo hover:bg-primario-forte shadow-basso',
  // `bordo-forte` e non `bordo`: qui il bordo e' l'unica cosa che dice
  // "questo e' un controllo", quindi deve reggere il 3:1 di WCAG 1.4.11.
  secondario:
    'border border-bordo-forte bg-superficie text-testo hover:bg-superficie-alt',
  fantasma: 'text-testo-debole hover:bg-superficie-alt hover:text-testo',
  pericolo:
    'border border-danger-soft-border bg-danger-soft text-danger-soft-text hover:border-danger-soft-text',
  registrazione:
    'bg-danger-fill text-danger-fill-text shadow-basso hover:opacity-90',
}

/** Solo imbottitura e corpo cambiano: l'altezza minima resta 44px ovunque. */
const MISURE = {
  sm: 'px-3 py-1.5 text-etichetta gap-1.5',
  md: 'px-4 py-2.5 text-campo gap-2',
} as const

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBottone
  misura?: keyof typeof MISURE
  piena?: boolean
  /** Icona a sinistra dell'etichetta. */
  icona?: NomeIcona
  /**
   * Mostra la rotellina e blocca il bottone. L'etichetta resta al suo posto
   * cosi' il bottone non cambia larghezza a meta' del salvataggio.
   */
  caricamento?: boolean
  children: ReactNode
}

export function Bottone({
  variante = 'primario',
  misura = 'md',
  piena = false,
  icona,
  caricamento = false,
  className = '',
  type = 'button',
  disabled,
  children,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || caricamento}
      aria-busy={caricamento || undefined}
      className={[
        'premibile inline-flex items-center justify-center rounded-card font-medium',
        'disabled:pointer-events-none disabled:opacity-45',
        MISURE[misura],
        VARIANTI[variante],
        piena ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {caricamento ? (
        <Rotellina misura="sm" />
      ) : (
        icona && <Icona nome={icona} misura="sm" />
      )}
      {children}
    </button>
  )
}

/**
 * Bottone di sola icona. Esiste come componente a se' perche' obbliga a
 * passare `etichetta`: un bersaglio senza testo e senza `aria-label` e'
 * invisibile a chi usa VoiceOver, ed e' l'errore piu' facile da commettere.
 */
export function BottoneIcona({
  nome,
  etichetta,
  variante = 'fantasma',
  className = '',
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  nome: NomeIcona
  etichetta: string
  variante?: VarianteBottone
}) {
  return (
    <button
      type={type}
      aria-label={etichetta}
      title={etichetta}
      className={[
        'premibile inline-flex min-w-11 items-center justify-center rounded-card px-2',
        'disabled:pointer-events-none disabled:opacity-45',
        VARIANTI[variante],
        className,
      ].join(' ')}
      {...rest}
    >
      <Icona nome={nome} misura="md" />
    </button>
  )
}
