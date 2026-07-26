import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { useId } from 'react'

const BASE =
  'w-full rounded-card border border-bordo bg-superficie px-3 py-2.5 text-campo ' +
  'disabled:opacity-60 disabled:bg-sfondo'

/** Input di base con lo stile dei campi §2 (17px: iOS non zooma al focus). */
export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${BASE} ${className}`} {...rest} />
}

export function Textarea({
  className = '',
  rows = 3,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} className={`${BASE} ${className}`} {...rest} />
}

export function Select({
  className = '',
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${BASE} ${className}`} {...rest}>
      {children}
    </select>
  )
}

/**
 * Campo etichettato: label + controllo + eventuale errore. `htmlFor`/`id` sono
 * collegati automaticamente così il tap sull'etichetta porta al controllo.
 * Il controllo si passa come children ricevendo l'id via render-prop.
 */
export function Campo({
  etichetta,
  errore,
  children,
  className = '',
}: {
  etichetta: string
  errore?: string | null
  className?: string
  children: (id: string) => ReactNode
}) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-etichetta text-testo-debole">
        {etichetta}
      </label>
      {children(id)}
      {errore && (
        <p className="mt-1 text-etichetta text-danger-soft-text">{errore}</p>
      )}
    </div>
  )
}
