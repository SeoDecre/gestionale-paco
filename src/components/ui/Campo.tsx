import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { createContext, useContext, useId } from 'react'
import { Icona } from './Icona'

/**
 * Il bordo usa `bordo-forte` (3:1 su sfondo) perche' e' l'unica cosa che
 * segnala "qui si scrive": con un grigio piu' tenue il campo sparisce sotto
 * il sole, che e' esattamente la condizione d'uso di quest'app.
 */
const BASE =
  'w-full rounded-card border border-bordo-forte bg-superficie px-3 py-2.5 text-campo ' +
  'transizione-colore placeholder:text-testo-tenue ' +
  'hover:border-testo-tenue ' +
  'disabled:cursor-not-allowed disabled:bg-superficie-alt disabled:text-testo-debole ' +
  'aria-[invalid=true]:border-danger-soft-text'

/**
 * Contesto compilato da `Campo`: i controlli figli ne ricavano id, stato di
 * errore e id della descrizione senza che chi scrive la form debba
 * ricordarsi di collegare a mano `aria-describedby`. Cablare questo a mano e'
 * il pezzo di accessibilita' che salta per primo quando si va di fretta.
 */
type ContestoCampo = {
  id: string
  idAiuto?: string
  invalido: boolean
  obbligatorio: boolean
}
const CampoCtx = createContext<ContestoCampo | null>(null)

function attributi(ctx: ContestoCampo | null) {
  if (!ctx) return {}
  return {
    id: ctx.id,
    'aria-invalid': ctx.invalido || undefined,
    'aria-describedby': ctx.idAiuto,
    required: ctx.obbligatorio || undefined,
  }
}

/** Input di base con lo stile dei campi §2 (17px: iOS non zooma al focus). */
export function Input({
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  const ctx = useContext(CampoCtx)
  return <input {...attributi(ctx)} className={`${BASE} ${className}`} {...rest} />
}

export function Textarea({
  className = '',
  rows = 3,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ctx = useContext(CampoCtx)
  return (
    <textarea
      {...attributi(ctx)}
      rows={rows}
      className={`${BASE} ${className}`}
      {...rest}
    />
  )
}

export function Select({
  className = '',
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const ctx = useContext(CampoCtx)
  /* Freccia lasciata al sistema operativo di proposito: `color-scheme` la fa
     gia' seguire il tema, e la tendina nativa su iPhone e' piu' comoda di
     qualunque riscrittura (HIG: preferire i controlli di sistema). */
  return (
    <select
      {...attributi(ctx)}
      className={`${BASE} cursor-pointer ${className}`}
      {...rest}
    >
      {children}
    </select>
  )
}

/**
 * Campo etichettato: label + controllo + aiuto/errore.
 *
 * L'etichetta e' sempre visibile: un placeholder usato come etichetta sparisce
 * appena si inizia a scrivere, e chi compila non ricorda piu' che campo sia.
 *
 * Il controllo si passa come children — o come funzione, per i casi in cui
 * serve l'id (retro-compatibile con l'uso precedente), o direttamente, e in
 * quel caso id/aria vengono agganciati via contesto.
 */
export function Campo({
  etichetta,
  errore,
  aiuto,
  obbligatorio = false,
  children,
  className = '',
}: {
  etichetta: string
  errore?: string | null
  /** Testo di aiuto persistente sotto al campo (non un placeholder). */
  aiuto?: string
  obbligatorio?: boolean
  className?: string
  children: ReactNode | ((id: string) => ReactNode)
}) {
  const id = useId()
  const idAiuto = `${id}-aiuto`
  const invalido = Boolean(errore)
  const descrizione = errore ?? aiuto

  return (
    <CampoCtx.Provider
      value={{
        id,
        idAiuto: descrizione ? idAiuto : undefined,
        invalido,
        obbligatorio,
      }}
    >
      <div className={className}>
        <label
          htmlFor={id}
          className="mb-1 block text-etichetta font-medium text-testo-debole"
        >
          {etichetta}
          {obbligatorio && (
            <span className="ml-0.5 text-danger-soft-text" aria-hidden>
              *
            </span>
          )}
        </label>

        {typeof children === 'function' ? children(id) : children}

        {descrizione && (
          <p
            id={idAiuto}
            /* `alert` solo sull'errore: un aiuto statico non deve
               interrompere lo screen reader ogni volta che compare. */
            role={errore ? 'alert' : undefined}
            className={`mt-1 flex items-start gap-1 text-etichetta ${
              errore ? 'text-danger-soft-text' : 'text-testo-debole'
            }`}
          >
            {errore && <Icona nome="errore" misura="sm" className="mt-0.5" />}
            {descrizione}
          </p>
        )}
      </div>
    </CampoCtx.Provider>
  )
}
