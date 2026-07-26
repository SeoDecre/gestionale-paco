import type { ReactNode } from 'react'

/**
 * Contenitore "card" §2: superficie bordata e arrotondata. Titolo opzionale con
 * eventuale azione a destra (es. "＋ Aggiungi").
 */
export function Scheda({
  titolo,
  azione,
  children,
  className = '',
}: {
  titolo?: ReactNode
  azione?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-card border border-bordo bg-superficie ${className}`}
    >
      {(titolo || azione) && (
        <header className="flex items-center justify-between border-b border-bordo px-4 py-3">
          <h2 className="text-campo font-semibold">{titolo}</h2>
          {azione}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}
