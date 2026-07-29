import { useState, type FormEvent } from 'react'
import { Avviso } from '@/components/ui/Avviso'
import { Segmentato } from '@/components/ui/Segmentato'
import { Scheda } from '@/components/ui/Scheda'
import { Bottone, BottoneIcona } from '@/components/ui/Bottone'
import { Campo, Input, Select } from '@/components/ui/Campo'
import { Pillola } from '@/components/ui/Pillola'
import { Caricamento, Errore, Vuoto } from '@/components/ui/Stato'
import { TUTTI_I_BRAND, BADGE_BRAND } from '@/features/lead/brand'
import type { Enum, Riga } from '@/types/db'
import {
  useCampi,
  useCreaCampo,
  useAggiornaCampo,
  useDisattivaCampo,
  useEliminaCampo,
} from '@/features/campi/queries'
import { ETICHETTA_TIPO, leggiOpzioni } from '@/features/campi/api'

const TIPI: Enum<'tipo_campo'>[] = ['testo', 'numero', 'si_no', 'tendina', 'data']

/**
 * Configuratore dei campi per brand (dal CRM 3.0). Le domande definite qui
 * compaiono nella scheda dei lead di quel brand, in una sezione dedicata.
 *
 * NEXI e Hera Comm restano profili separati: non condividono questi campi.
 */
export function EditorCampiPersonalizzati() {
  const [brand, setBrand] = useState<Enum<'brand'>>('HERA_COMM')
  const campi = useCampi(brand)

  const sezioni = Array.from(new Set((campi.data ?? []).map((c) => c.sezione)))

  return (
    <Scheda titolo="Campi personalizzati per brand" className="mb-4">
      <Avviso className="mb-3">
        Le domande definite qui compaiono nella scheda dei lead del brand
        scelto. Servono per le domande che cambiano con la campagna
        commerciale: i campi standard restano dove sono.
      </Avviso>

      <Segmentato
        piena
        className="mb-3"
        etichetta="Brand dei campi personalizzati"
        valore={brand}
        onChange={setBrand}
        opzioni={TUTTI_I_BRAND.map((b) => ({
          valore: b,
          etichetta: BADGE_BRAND[b].etichetta,
        }))}
      />

      <FormNuovoCampo brand={brand} ordineIniziale={(campi.data?.length ?? 0) * 10} />

      {campi.isLoading && <Caricamento />}
      {campi.isError && <Errore errore={campi.error} />}
      {campi.data && campi.data.length === 0 && (
        <Vuoto testo={`Nessun campo per ${BADGE_BRAND[brand].etichetta}.`} />
      )}

      {sezioni.map((sez) => (
        <div key={sez} className="mt-3">
          <p className="mb-1.5 text-etichetta font-medium text-testo-debole">{sez}</p>
          <ul className="flex flex-col gap-2">
            {(campi.data ?? [])
              .filter((c) => c.sezione === sez)
              .map((c) => (
                <RigaCampo key={c.id} campo={c} />
              ))}
          </ul>
        </div>
      ))}
    </Scheda>
  )
}

function FormNuovoCampo({
  brand,
  ordineIniziale,
}: {
  brand: Enum<'brand'>
  ordineIniziale: number
}) {
  const crea = useCreaCampo()
  const [etichetta, setEtichetta] = useState('')
  const [tipo, setTipo] = useState<Enum<'tipo_campo'>>('testo')
  const [sezione, setSezione] = useState('Domande aggiuntive')
  const [opzioni, setOpzioni] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!etichetta.trim()) return
    await crea.mutateAsync({
      brand,
      etichetta: etichetta.trim(),
      tipo,
      sezione: sezione.trim() || 'Domande aggiuntive',
      ordine: ordineIniziale,
      opzioni:
        tipo === 'tendina'
          ? opzioni
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
    })
    setEtichetta('')
    setOpzioni('')
  }

  return (
    <form onSubmit={onSubmit} className="mb-3 flex flex-col gap-2 rounded-card bg-sfondo p-3">
      <Campo etichetta="Etichetta / domanda">
        {(id) => (
          <Input
            id={id}
            value={etichetta}
            onChange={(e) => setEtichetta(e.target.value)}
            placeholder="Es. Ha un impianto fotovoltaico esistente?"
          />
        )}
      </Campo>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Campo etichetta="Sezione">
          {(id) => (
            <Input id={id} value={sezione} onChange={(e) => setSezione(e.target.value)} />
          )}
        </Campo>
        <Campo etichetta="Tipo di campo">
          {(id) => (
            <Select
              id={id}
              value={tipo}
              onChange={(e) => setTipo(e.target.value as Enum<'tipo_campo'>)}
            >
              {TIPI.map((t) => (
                <option key={t} value={t}>
                  {ETICHETTA_TIPO[t]}
                </option>
              ))}
            </Select>
          )}
        </Campo>
      </div>
      {tipo === 'tendina' && (
        <Campo etichetta="Opzioni (separate da virgola)">
          {(id) => (
            <Input
              id={id}
              value={opzioni}
              onChange={(e) => setOpzioni(e.target.value)}
              placeholder="Monofase, Trifase, Non presente"
            />
          )}
        </Campo>
      )}
      {crea.isError && <Errore errore={crea.error} />}
      <Bottone type="submit" disabled={crea.isPending || !etichetta.trim()}>
        {crea.isPending ? 'Salvataggio…' : 'Aggiungi campo'}
      </Bottone>
    </form>
  )
}

function RigaCampo({ campo }: { campo: Riga<'campi_config'> }) {
  const aggiorna = useAggiornaCampo()
  const disattiva = useDisattivaCampo()
  const elimina = useEliminaCampo()
  const opzioni = leggiOpzioni(campo.opzioni)

  return (
    <li className="rounded-card border border-bordo px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-campo font-medium">{campo.etichetta}</p>
          <p className="text-etichetta text-testo-debole">
            {ETICHETTA_TIPO[campo.tipo]}
            {opzioni.length > 0 && ` · ${opzioni.join(', ')}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!campo.attivo && <Pillola tinta="neutro">Spento</Pillola>}
          {campo.attivo ? (
            <Bottone
              variante="fantasma"
              misura="sm"
              onClick={() => disattiva.mutate(campo.id)}
            >
              Spegni
            </Bottone>
          ) : (
            <Bottone
              variante="fantasma"
              misura="sm"
              className="text-info-soft-text"
              onClick={() =>
                aggiorna.mutate({ id: campo.id, patch: { attivo: true } })
              }
            >
              Riattiva
            </Bottone>
          )}
          <BottoneIcona
            nome="elimina"
            etichetta={`Elimina il campo "${campo.etichetta}"`}
            className="text-danger-soft-text"
            onClick={() => {
              if (
                confirm(
                  'Eliminare il campo e TUTTE le risposte già date? Per conservarle usa "Spegni".',
                )
              ) {
                elimina.mutate(campo.id)
              }
            }}
          />
        </div>
      </div>
    </li>
  )
}
