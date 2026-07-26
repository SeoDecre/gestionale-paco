import { useState, type FormEvent } from 'react'
import { Scheda } from '@/components/ui/Scheda'
import { Bottone } from '@/components/ui/Bottone'
import { Campo, Input, Select, Textarea } from '@/components/ui/Campo'
import { Pillola } from '@/components/ui/Pillola'
import { Caricamento, Errore, Vuoto } from '@/components/ui/Stato'
import { formattaEuro } from '@/lib/format'
import type { Enum, Riga } from '@/types/db'
import { TUTTI_I_BRAND, BADGE_BRAND } from '@/features/lead/brand'
import {
  useOfferte,
  useCreaOfferta,
  useAggiornaOfferta,
  useArchiviaOfferta,
  useEliminaOfferta,
} from '@/features/offerte/queries'
import type { NuovaOfferta } from '@/features/offerte/api'

const LETTERE: Enum<'target_lettera'>[] = ['E', 'A', 'B', 'C']

export function EditorOfferte() {
  const offerte = useOfferte()
  const [nuovo, setNuovo] = useState(false)

  return (
    <Scheda
      titolo="Offerte"
      azione={
        <button className="text-etichetta text-info-soft-text" onClick={() => setNuovo((v) => !v)}>
          {nuovo ? 'Chiudi' : '＋ Nuova'}
        </button>
      }
      className="mb-4"
    >
      {nuovo && <FormOfferta onFatto={() => setNuovo(false)} />}

      {offerte.isLoading && <Caricamento />}
      {offerte.isError && <Errore errore={offerte.error} />}
      {offerte.data && offerte.data.length === 0 && !nuovo && <Vuoto testo="Nessuna offerta." />}

      <ul className="flex flex-col gap-2">
        {offerte.data?.map((o) => (
          <RigaOfferta key={o.id} offerta={o} />
        ))}
      </ul>
    </Scheda>
  )
}

function RigaOfferta({ offerta }: { offerta: Riga<'offerte'> }) {
  const archivia = useArchiviaOfferta()
  const elimina = useEliminaOfferta()
  const [modifica, setModifica] = useState(false)
  const b = BADGE_BRAND[offerta.brand]
  const range = [offerta.target_min, offerta.target_max].filter(Boolean).join('–')

  if (modifica) {
    return <FormOfferta offerta={offerta} onFatto={() => setModifica(false)} />
  }

  return (
    <li className="rounded-card border border-bordo px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Pillola tinta={b.tinta}>{b.etichetta}</Pillola>
            <span className="text-campo font-medium">{offerta.nome}</span>
            {range && <Pillola tinta="avviso">Target {range}</Pillola>}
            {offerta.stato === 'archiviata' && <Pillola tinta="neutro">Archiviata</Pillola>}
          </div>
          {offerta.canone != null && (
            <p className="text-etichetta text-testo-debole">Canone {formattaEuro(offerta.canone)}</p>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button className="text-etichetta text-info-soft-text" onClick={() => setModifica(true)}>
            Modifica
          </button>
          {offerta.stato === 'attiva' && (
            <button
              className="text-etichetta text-testo-debole"
              onClick={() => archivia.mutate(offerta.id)}
            >
              Archivia
            </button>
          )}
          <button
            aria-label="Elimina offerta"
            className="text-danger-soft-text"
            onClick={() => elimina.mutate(offerta.id)}
          >
            ✕
          </button>
        </div>
      </div>
    </li>
  )
}

function FormOfferta({
  offerta,
  onFatto,
}: {
  offerta?: Riga<'offerte'>
  onFatto: () => void
}) {
  const crea = useCreaOfferta()
  const aggiorna = useAggiornaOfferta()
  const [brand, setBrand] = useState<Enum<'brand'>>(offerta?.brand ?? 'NEXI')
  const [nome, setNome] = useState(offerta?.nome ?? '')
  const [descrizione, setDescrizione] = useState(offerta?.descrizione ?? '')
  const [targetMin, setTargetMin] = useState(offerta?.target_min ?? '')
  const [targetMax, setTargetMax] = useState(offerta?.target_max ?? '')
  const [canone, setCanone] = useState(offerta?.canone?.toString() ?? '')

  const salva = offerta ? aggiorna : crea
  const inCorso = salva.isPending

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    const dati: NuovaOfferta = {
      brand,
      nome: nome.trim(),
      descrizione: descrizione.trim() || null,
      target_min: (targetMin || null) as Enum<'target_lettera'> | null,
      target_max: (targetMax || null) as Enum<'target_lettera'> | null,
      canone: canone.trim() === '' ? null : Number(canone.replace(',', '.')),
    }
    if (offerta) await aggiorna.mutateAsync({ id: offerta.id, patch: dati })
    else await crea.mutateAsync(dati)
    onFatto()
  }

  return (
    <form onSubmit={onSubmit} className="mb-3 flex flex-col gap-2 rounded-card bg-sfondo p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Campo etichetta="Brand">
          {(id) => (
            <Select id={id} value={brand} onChange={(e) => setBrand(e.target.value as Enum<'brand'>)}>
              {TUTTI_I_BRAND.map((x) => (
                <option key={x} value={x}>
                  {BADGE_BRAND[x].etichetta}
                </option>
              ))}
            </Select>
          )}
        </Campo>
        <Campo etichetta="Nome">
          {(id) => <Input id={id} value={nome} onChange={(e) => setNome(e.target.value)} />}
        </Campo>
        <Campo etichetta="Target min">
          {(id) => (
            <Select id={id} value={targetMin} onChange={(e) => setTargetMin(e.target.value as typeof targetMin)}>
              <option value="">—</option>
              {LETTERE.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </Select>
          )}
        </Campo>
        <Campo etichetta="Target max">
          {(id) => (
            <Select id={id} value={targetMax} onChange={(e) => setTargetMax(e.target.value as typeof targetMax)}>
              <option value="">—</option>
              {LETTERE.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </Select>
          )}
        </Campo>
        <Campo etichetta="Canone (€)">
          {(id) => (
            <Input
              id={id}
              inputMode="decimal"
              value={canone}
              onChange={(e) => setCanone(e.target.value)}
            />
          )}
        </Campo>
      </div>
      <Campo etichetta="Descrizione">
        {(id) => (
          <Textarea id={id} value={descrizione} onChange={(e) => setDescrizione(e.target.value)} />
        )}
      </Campo>
      {salva.isError && <Errore errore={salva.error} />}
      <div className="flex gap-2">
        <Bottone type="submit" disabled={inCorso || !nome.trim()}>
          {inCorso ? 'Salvataggio…' : offerta ? 'Salva' : 'Crea offerta'}
        </Bottone>
        <Bottone variante="secondario" onClick={onFatto}>
          Annulla
        </Bottone>
      </div>
    </form>
  )
}
