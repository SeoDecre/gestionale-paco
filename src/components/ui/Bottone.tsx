import type { ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * Varianti semantiche §2 — si sceglie il ruolo del bottone, non il colore.
 * 'registrazione' usa il rosso PIENO (danger-fill), eccezione §2 riservata ai
 * tasti Memo vocale / Foto: convenzione universale di registrazione.
 */
export type VarianteBottone =
  | 'primario'
  | 'secondario'
  | 'pericolo'
  | 'registrazione'

const VARIANTI: Record<VarianteBottone, string> = {
  primario: 'bg-info-soft-text text-white disabled:opacity-50',
  secondario:
    'border border-bordo bg-superficie text-testo disabled:opacity-50',
  pericolo:
    'border border-danger-soft-border bg-danger-soft text-danger-soft-text disabled:opacity-50',
  registrazione: 'bg-danger-fill text-danger-fill-text disabled:opacity-50',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBottone
  piena?: boolean
  children: ReactNode
}

export function Bottone({
  variante = 'primario',
  piena = false,
  className = '',
  type = 'button',
  children,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-card px-4 py-2.5 text-campo font-medium ${
        VARIANTI[variante]
      } ${piena ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
