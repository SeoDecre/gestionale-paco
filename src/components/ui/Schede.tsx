import type { ReactNode } from 'react'

/**
 * Barra a schede (le "tab" del CRM 3.0). Le voci scorrono orizzontalmente su
 * telefono invece di andare a capo su tre righe: in piedi davanti al cliente
 * una fila sola che si scorre col pollice è più veloce da colpire.
 *
 * `-mx-4 px-4` fa arrivare lo scorrimento fino al bordo della scheda, così non
 * sembra che le voci finiscano prima del margine.
 */
export type VoceScheda<T extends string> = { id: T; etichetta: string; icona?: string }

export function BarraSchede<T extends string>({
  voci,
  attiva,
  onCambia,
}: {
  voci: VoceScheda<T>[]
  attiva: T
  onCambia: (id: T) => void
}) {
  return (
    <div
      role="tablist"
      className="-mx-4 mb-3 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {voci.map((v) => {
        const on = v.id === attiva
        return (
          <button
            key={v.id}
            role="tab"
            aria-selected={on}
            type="button"
            onClick={() => onCambia(v.id)}
            className={`flex-shrink-0 whitespace-nowrap rounded-pillola border px-3 py-1.5 text-etichetta font-medium ${
              on
                ? 'border-info-soft-border bg-info-soft text-info-soft-text'
                : 'border-bordo bg-superficie text-testo-debole'
            }`}
          >
            {v.icona && <span className="mr-1">{v.icona}</span>}
            {v.etichetta}
          </button>
        )
      })}
    </div>
  )
}

/** Titolo di gruppo dentro una scheda, con separatore. */
export function Gruppo({ titolo, children }: { titolo?: string; children: ReactNode }) {
  return (
    <div className="mb-3 border-b border-bordo pb-3 last:mb-0 last:border-0 last:pb-0">
      {titolo && <p className="mb-1.5 text-etichetta font-medium text-testo-debole">{titolo}</p>}
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}
