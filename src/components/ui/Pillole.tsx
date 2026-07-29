import { useState } from 'react'
import { Bottone } from './Bottone'
import { Chip } from './Chip'
import { Input } from './Campo'

/**
 * Selezione multipla a pillole (il `PillMulti` del CRM 3.0): si tocca una voce
 * per accenderla/spegnerla, e "Aggiungi" ne crea una nuova al volo.
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

  const tutte = [
    ...disponibili,
    ...scelte.filter((s) => !disponibili.includes(s)),
  ]

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
        {tutte.map((v) => (
          <Chip key={v} attivo={scelte.includes(v)} onClick={() => alterna(v)}>
            {v}
          </Chip>
        ))}
        {consentiNuove && !apriNuova && (
          <Chip tratteggiato icona="aggiungi" onClick={() => setApriNuova(true)}>
            Aggiungi
          </Chip>
        )}
      </div>
      {apriNuova && (
        <div className="animate-salita flex gap-2">
          <Input
            autoFocus
            value={nuova}
            onChange={(e) => setNuova(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                aggiungi()
              }
              /* Escape chiude senza salvare: e' il gesto che ci si aspetta,
                 e senza di esso l'unico modo di annullare e' salvare. */
              if (e.key === 'Escape') setApriNuova(false)
            }}
            placeholder="Nuova voce…"
            aria-label="Nuova voce"
            className="min-w-0 flex-1"
          />
          <Bottone onClick={aggiungi} disabled={!nuova.trim()}>
            Aggiungi
          </Bottone>
        </div>
      )}
    </div>
  )
}
