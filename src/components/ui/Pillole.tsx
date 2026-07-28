import { useState } from 'react'

/**
 * Selezione multipla a pillole (il `PillMulti` del CRM 3.0): si tocca una voce
 * per accenderla/spegnerla, e "＋ Aggiungi" ne crea una nuova al volo.
 *
 * Le voci scelte che non sono più fra quelle proposte restano comunque
 * visibili e selezionate: un valore scritto sei mesi fa non deve sparire
 * perché nel frattempo è cambiato l'elenco.
 */
export function PilloleMultiple({
  disponibili,
  scelte,
  onChange,
  consentiNuove = true,
}: {
  disponibili: string[]
  scelte: string[]
  onChange: (v: string[]) => void
  consentiNuove?: boolean
}) {
  const [nuova, setNuova] = useState('')
  const [apriNuova, setApriNuova] = useState(false)

  const tutte = [...disponibili, ...scelte.filter((s) => !disponibili.includes(s))]

  function alterna(v: string) {
    onChange(scelte.includes(v) ? scelte.filter((x) => x !== v) : [...scelte, v])
  }

  function aggiungi() {
    const v = nuova.trim()
    if (!v) return
    if (!scelte.includes(v)) onChange([...scelte, v])
    setNuova('')
    setApriNuova(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {tutte.map((v) => {
          const on = scelte.includes(v)
          return (
            <button
              key={v}
              type="button"
              onClick={() => alterna(v)}
              aria-pressed={on}
              className={`min-h-11 rounded-pillola border px-3 py-1.5 text-etichetta font-medium ${
                on
                  ? 'border-info-soft-border bg-info-soft text-info-soft-text'
                  : 'border-bordo bg-superficie text-testo-debole'
              }`}
            >
              {v}
            </button>
          )
        })}
        {consentiNuove && !apriNuova && (
          <button
            type="button"
            onClick={() => setApriNuova(true)}
            className="min-h-11 rounded-pillola border border-dashed border-bordo px-3 py-1.5 text-etichetta text-testo-debole"
          >
            ＋ Aggiungi
          </button>
        )}
      </div>
      {apriNuova && (
        <div className="flex gap-2">
          <input
            autoFocus
            value={nuova}
            onChange={(e) => setNuova(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                aggiungi()
              }
              if (e.key === 'Escape') setApriNuova(false)
            }}
            placeholder="Nuova voce…"
            className="min-w-0 flex-1 rounded-card border border-bordo bg-superficie px-3 py-2 text-campo"
          />
          <button
            type="button"
            onClick={aggiungi}
            className="rounded-card bg-info-soft-text px-4 text-campo font-medium text-white"
          >
            Aggiungi
          </button>
        </div>
      )}
    </div>
  )
}
