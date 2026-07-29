import { useState, type FormEvent } from 'react'
import { Scheda } from '@/components/ui/Scheda'
import { Bottone, BottoneIcona } from '@/components/ui/Bottone'
import { Input } from '@/components/ui/Campo'
import { Pillola } from '@/components/ui/Pillola'
import { Caricamento, Errore } from '@/components/ui/Stato'
import {
  useTutteLeVoci,
  useCreaVoce,
  useAggiornaVoce,
  useEliminaVoce,
} from '@/features/vocabolari/queries'

type Esito = {
  id: string
  nome: string
  attivo: boolean
  ordine: number
  is_chiusura: boolean
  esito_positivo: boolean | null
}

/**
 * Editor degli esiti (§9). is_chiusura + esito_positivo guidano lo stato
 * derivato del lead (trigger 08); cambiarli qui ricalcola gli stati. Il vincolo
 * DB impedisce esito_positivo senza is_chiusura, perciò la UI azzera
 * esito_positivo quando si toglie la chiusura.
 */
export function EditorEsiti() {
  const esiti = useTutteLeVoci<Esito>('esiti_lavorazione')
  const crea = useCreaVoce('esiti_lavorazione')
  const [nuovo, setNuovo] = useState('')

  async function aggiungi(e: FormEvent) {
    e.preventDefault()
    if (!nuovo.trim()) return
    const ordine = (esiti.data?.reduce((m, v) => Math.max(m, v.ordine), 0) ?? 0) + 10
    await crea.mutateAsync({ nome: nuovo.trim(), ordine, is_chiusura: false })
    setNuovo('')
  }

  return (
    <Scheda titolo="Esiti lavorazione" className="mb-4">
      {esiti.isLoading && <Caricamento />}
      {esiti.isError && <Errore errore={esiti.error} />}

      <ul className="mb-3 flex flex-col gap-2">
        {esiti.data?.map((e) => (
          <RigaEsito key={e.id} esito={e} />
        ))}
      </ul>

      <form onSubmit={aggiungi} className="flex gap-2">
        <Input placeholder="Nuovo esito…" value={nuovo} onChange={(e) => setNuovo(e.target.value)} />
        <Bottone type="submit" disabled={crea.isPending || !nuovo.trim()}>
          Aggiungi
        </Bottone>
      </form>
      {crea.isError && <div className="mt-2"><Errore errore={crea.error} /></div>}
    </Scheda>
  )
}

function RigaEsito({ esito }: { esito: Esito }) {
  const aggiorna = useAggiornaVoce('esiti_lavorazione')
  const elimina = useEliminaVoce('esiti_lavorazione')

  const patch = (p: Record<string, unknown>) => aggiorna.mutate({ id: esito.id, patch: p })

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-card border border-bordo px-3 py-2">
      <span className="min-w-0 flex-1 truncate text-campo">{esito.nome}</span>

      <label className="flex items-center gap-1 text-etichetta text-testo-debole">
        <input
          type="checkbox"
          checked={esito.is_chiusura}
          onChange={(e) =>
            // Togliendo la chiusura, azzera anche esito_positivo (vincolo DB).
            patch(
              e.target.checked
                ? { is_chiusura: true }
                : { is_chiusura: false, esito_positivo: null },
            )
          }
        />
        Chiude
      </label>

      {esito.is_chiusura && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => patch({ esito_positivo: true })}
            className={esito.esito_positivo === true ? '' : 'opacity-40'}
            aria-label="Vinto"
          >
            <Pillola tinta="successo">Vinto</Pillola>
          </button>
          <button
            type="button"
            onClick={() => patch({ esito_positivo: false })}
            className={esito.esito_positivo === false ? '' : 'opacity-40'}
            aria-label="Perso"
          >
            <Pillola tinta="pericolo">Perso</Pillola>
          </button>
        </div>
      )}

      <label className="flex items-center gap-1 text-etichetta text-testo-debole">
        <input
          type="checkbox"
          checked={esito.attivo}
          onChange={(e) => patch({ attivo: e.target.checked })}
        />
        Attivo
      </label>
      <BottoneIcona
          nome="elimina"
          etichetta="Elimina esito"
          className="text-danger-soft-text"
          onClick={() => elimina.mutate(esito.id)}
          disabled={elimina.isPending}
        />
    </li>
  )
}
