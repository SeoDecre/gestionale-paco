import type { ReactNode } from 'react'
import { BarraChip, Chip } from './Chip'
import type { NomeIcona } from './Icona'

/**
 * Barra a schede (le "tab" del CRM 3.0), costruita sui `Chip` cosi' che una
 * scheda selezionata e un filtro selezionato abbiano lo stesso aspetto:
 * due modi diversi di disegnare "questo e' acceso" sono un modo di confondere.
 */
export type VoceScheda<T extends string> = {
  id: T
  etichetta: string
  icona?: NomeIcona
}

export function BarraSchede<T extends string>({
  voci,
  attiva,
  onCambia,
  etichetta = 'Sezioni',
}: {
  voci: VoceScheda<T>[]
  attiva: T
  onCambia: (id: T) => void
  /** Descrive il gruppo di schede agli screen reader. */
  etichetta?: string
}) {
  return (
    <BarraChip role="tablist" aria-label={etichetta} className="mb-3">
      {voci.map((v) => (
        <Chip
          key={v.id}
          ruolo="scheda"
          icona={v.icona}
          attivo={v.id === attiva}
          onClick={() => onCambia(v.id)}
        >
          {v.etichetta}
        </Chip>
      ))}
    </BarraChip>
  )
}

/** Titolo di gruppo dentro una scheda, con separatore. */
export function Gruppo({
  titolo,
  children,
}: {
  titolo?: string
  children: ReactNode
}) {
  return (
    <div className="mb-3 border-b border-bordo pb-3 last:mb-0 last:border-0 last:pb-0">
      {titolo && (
        <p className="mb-1.5 text-etichetta font-medium text-testo-debole">
          {titolo}
        </p>
      )}
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}
