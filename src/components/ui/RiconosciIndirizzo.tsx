import { useEffect, useRef, useState } from 'react'
import { Bottone } from './Bottone'
import { Input } from './Campo'
import { Icona, Rotellina } from './Icona'
import {
  analizzaIndirizzo,
  haQualcosa,
  cercaIndirizzi,
  type IndirizzoAnalizzato,
  type SuggerimentoIndirizzo,
} from '@/lib/indirizzo'

/**
 * "Incolla e riconosci" + autocompletamento OSM (CRM 3.0).
 *
 * Due modi di compilare un indirizzo senza digitarlo campo per campo:
 * incollare la riga presa da una visura, oppure scrivere due parole e
 * scegliere fra i suggerimenti. Entrambi riempiono gli stessi campi, che
 * restano modificabili a mano: nulla è vincolato al risultato automatico.
 */
export function RiconosciIndirizzo({ onApplica }: { onApplica: (a: IndirizzoAnalizzato) => void }) {
  const [testo, setTesto] = useState('')
  const [suggerimenti, setSuggerimenti] = useState<SuggerimentoIndirizzo[]>([])
  const [cercando, setCercando] = useState(false)
  const abort = useRef<AbortController | null>(null)

  // Ricerca ritardata: si cerca quando si smette di scrivere, non a ogni
  // tasto, altrimenti si martella un servizio pubblico gratuito.
  useEffect(() => {
    const q = testo.trim()
    if (q.length < 4) {
      setSuggerimenti([])
      return
    }
    const t = setTimeout(async () => {
      abort.current?.abort()
      const ctrl = new AbortController()
      abort.current = ctrl
      setCercando(true)
      const r = await cercaIndirizzi(q, ctrl.signal)
      setCercando(false)
      setSuggerimenti(r)
    }, 450)
    return () => clearTimeout(t)
  }, [testo])

  function applica(a: IndirizzoAnalizzato) {
    onApplica(a)
    setTesto('')
    setSuggerimenti([])
  }

  const analisi = analizzaIndirizzo(testo)

  return (
    <div className="mb-2 flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          aria-label="Incolla o cerca un indirizzo"
          placeholder="Incolla o cerca: Via Roma 31 - 57016 - Rosignano (LI)"
          className="min-w-0 flex-1"
        />
        <Bottone
          variante="secondario"
          icona="magia"
          disabled={!haQualcosa(analisi)}
          onClick={() => applica(analisi)}
        >
          Riconosci
        </Bottone>
      </div>

      {cercando && (
        <p
          role="status"
          className="flex items-center gap-2 text-etichetta text-testo-debole"
        >
          <Rotellina misura="sm" />
          Ricerca…
        </p>
      )}

      {suggerimenti.length > 0 && (
        <ul className="superficie-card animate-salita flex flex-col gap-1 p-1">
          {suggerimenti.map((s, i) => (
            <li key={`${s.etichetta}-${i}`}>
              <button
                type="button"
                onClick={() => applica(s)}
                className="transizione-colore flex min-h-11 w-full items-center gap-2 rounded-card px-3 text-left text-campo hover:bg-superficie-alt"
              >
                <Icona
                  nome="mappa"
                  misura="sm"
                  className="text-testo-debole"
                />
                {s.etichetta || 'Indirizzo'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
