import type { ReactNode } from 'react'
import { Icona, type NomeIcona } from './Icona'

/**
 * Contenitore "card" §2: superficie bordata e arrotondata.
 *
 * E' l'unico modo consentito di disegnare una superficie con intestazione.
 * Per una superficie nuda c'e' l'utility `superficie-card`; ripetere a mano
 * raggio + bordo + sfondo e' come scrivere un colore esadecimale: funziona
 * finche' nessuno cambia il raggio.
 */
export function Scheda({
  titolo,
  icona,
  descrizione,
  azione,
  children,
  imbottitura = true,
  className = '',
}: {
  titolo?: ReactNode
  icona?: NomeIcona
  /** Riga di contesto sotto al titolo, per spiegare a cosa serve la sezione. */
  descrizione?: ReactNode
  azione?: ReactNode
  children: ReactNode
  /** A `false` il contenuto tocca i bordi: serve a liste e tabelle. */
  imbottitura?: boolean
  className?: string
}) {
  return (
    <section className={`superficie-card ${className}`}>
      {(titolo || azione) && (
        <header className="flex items-start justify-between gap-3 border-b border-bordo px-4 py-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-campo font-semibold">
              {icona && (
                <Icona nome={icona} misura="sm" className="text-testo-debole" />
              )}
              {titolo}
            </h2>
            {descrizione && (
              <p className="mt-0.5 text-etichetta text-testo-debole">
                {descrizione}
              </p>
            )}
          </div>
          {azione && <div className="flex shrink-0 gap-2">{azione}</div>}
        </header>
      )}
      <div className={imbottitura ? 'p-4' : ''}>{children}</div>
    </section>
  )
}

/**
 * Titolo di sezione a livello di pagina, fuori dalle card. Tenuto qui perche'
 * ogni pagina lo ridisegnava a modo suo.
 */
export function TestataPagina({
  titolo,
  descrizione,
  azione,
}: {
  titolo: ReactNode
  descrizione?: ReactNode
  azione?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-titolo font-semibold">{titolo}</h1>
        {descrizione && (
          <p className="mt-0.5 text-etichetta text-testo-debole">
            {descrizione}
          </p>
        )}
      </div>
      {azione && <div className="flex shrink-0 gap-2">{azione}</div>}
    </div>
  )
}
