import { useState, type FormEvent } from 'react'
import { Scheda } from '@/components/ui/Scheda'
import { Bottone, BottoneIcona } from '@/components/ui/Bottone'
import { Input } from '@/components/ui/Campo'
import { Caricamento, Errore, Vuoto } from '@/components/ui/Stato'
import {
  useTutteLeVoci,
  useCreaVoce,
  useAggiornaVoce,
  useEliminaVoce,
} from '@/features/vocabolari/queries'
import type { TabellaVocab } from '@/features/vocabolari/api'

type Voce = { id: string; nome: string; attivo: boolean; ordine: number } & Record<string, unknown>
export type CampoExtra = { chiave: string; etichetta: string }

/**
 * Editor generico di un vocabolario (§9): rinomina in linea, attiva/disattiva,
 * elimina, aggiunge. `extra` sono colonne booleane specifiche (es.
 * tipi_pos.richiede_iban) rese come checkbox.
 */
export function EditorVocabolario({
  tabella,
  titolo,
  extra = [],
}: {
  tabella: TabellaVocab
  titolo: string
  extra?: CampoExtra[]
}) {
  const voci = useTutteLeVoci<Voce>(tabella)
  const crea = useCreaVoce(tabella)
  const [nuovo, setNuovo] = useState('')

  async function aggiungi(e: FormEvent) {
    e.preventDefault()
    if (!nuovo.trim()) return
    const ordine = (voci.data?.reduce((m, v) => Math.max(m, v.ordine), 0) ?? 0) + 10
    await crea.mutateAsync({ nome: nuovo.trim(), ordine })
    setNuovo('')
  }

  return (
    <Scheda titolo={titolo} className="mb-4">
      {voci.isLoading && <Caricamento />}
      {voci.isError && <Errore errore={voci.error} />}
      {voci.data && voci.data.length === 0 && <Vuoto testo="Nessuna voce." />}

      <ul className="mb-3 flex flex-col gap-2">
        {voci.data?.map((v) => (
          <RigaVoce key={v.id} tabella={tabella} voce={v} extra={extra} />
        ))}
      </ul>

      <form onSubmit={aggiungi} className="flex gap-2">
        <Input placeholder="Nuova voce…" value={nuovo} onChange={(e) => setNuovo(e.target.value)} />
        <Bottone type="submit" disabled={crea.isPending || !nuovo.trim()}>
          Aggiungi
        </Bottone>
      </form>
      {crea.isError && <div className="mt-2"><Errore errore={crea.error} /></div>}
    </Scheda>
  )
}

function RigaVoce({
  tabella,
  voce,
  extra,
}: {
  tabella: TabellaVocab
  voce: Voce
  extra: CampoExtra[]
}) {
  const aggiorna = useAggiornaVoce(tabella)
  const elimina = useEliminaVoce(tabella)
  const [nome, setNome] = useState(voce.nome)

  const salvaNome = () => {
    if (nome.trim() && nome !== voce.nome) {
      aggiorna.mutate({ id: voce.id, patch: { nome: nome.trim() } })
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-card border border-bordo px-3 py-2">
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        onBlur={salvaNome}
        className="min-w-0 flex-1 rounded-card border border-bordo px-2 py-1.5 text-campo"
      />
      {extra.map((c) => (
        <label key={c.chiave} className="flex items-center gap-1 text-etichetta text-testo-debole">
          <input
            type="checkbox"
            checked={Boolean(voce[c.chiave])}
            onChange={(e) =>
              aggiorna.mutate({ id: voce.id, patch: { [c.chiave]: e.target.checked } })
            }
          />
          {c.etichetta}
        </label>
      ))}
      <label className="flex items-center gap-1 text-etichetta text-testo-debole">
        <input
          type="checkbox"
          checked={voce.attivo}
          onChange={(e) => aggiorna.mutate({ id: voce.id, patch: { attivo: e.target.checked } })}
        />
        Attivo
      </label>
      <BottoneIcona
          nome="elimina"
          etichetta="Elimina voce"
          className="text-danger-soft-text"
          onClick={() => elimina.mutate(voce.id)}
          disabled={elimina.isPending}
        />
    </li>
  )
}
