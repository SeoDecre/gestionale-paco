import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Scheda } from '@/components/ui/Scheda'
import { Bottone } from '@/components/ui/Bottone'
import { Campo, Input, Select, Textarea } from '@/components/ui/Campo'
import { Pillola } from '@/components/ui/Pillola'
import { Caricamento, Errore, Vuoto } from '@/components/ui/Stato'
import { formattaEuro } from '@/lib/format'
import { messaggioErrore } from '@/lib/errors'
import { caricaPdfOfferta } from '@/lib/media'
import type { Enum, Riga } from '@/types/db'
import { TUTTI_I_BRAND, BADGE_BRAND } from '@/features/lead/brand'
import {
  useOfferte,
  useCreaOfferta,
  useAggiornaOfferta,
  useArchiviaOfferta,
  useEliminaOfferta,
} from '@/features/offerte/queries'
import { BottonePdfOfferta } from '@/features/offerte/BottonePdfOfferta'
import type { NuovaOfferta } from '@/features/offerte/api'
import { estraiParametriOfferta } from '@/features/offerte/estrazione'

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
          <p className="flex flex-wrap items-center gap-2 text-etichetta text-testo-debole">
            {offerta.categoria && <span>{offerta.categoria}</span>}
            {offerta.canone != null && <span>Canone {formattaEuro(offerta.canone)}</span>}
            {offerta.commissione != null && <span>Comm. {offerta.commissione}%</span>}
            {(offerta.transato_min != null || offerta.transato_max != null) && (
              <span>
                Transato {offerta.transato_min != null ? formattaEuro(offerta.transato_min) : '0'} –{' '}
                {offerta.transato_max != null ? formattaEuro(offerta.transato_max) : '∞'}
              </span>
            )}
            <BottonePdfOfferta path={offerta.pdf_path} />
          </p>
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
  const [categoria, setCategoria] = useState(offerta?.categoria ?? '')
  const [transatoMin, setTransatoMin] = useState(offerta?.transato_min?.toString() ?? '')
  const [transatoMax, setTransatoMax] = useState(offerta?.transato_max?.toString() ?? '')
  const [commissione, setCommissione] = useState(offerta?.commissione?.toString() ?? '')
  const [targetCliente, setTargetCliente] = useState(offerta?.target_cliente ?? '')
  const [note, setNote] = useState(offerta?.note ?? '')
  const [testoEstratto, setTestoEstratto] = useState(offerta?.testo_estratto ?? '')

  // PDF originale (§9). Si carica subito su Storage alla scelta del file; qui
  // resta solo il path, che viene scritto insieme al resto dell'offerta.
  const [pdfPath, setPdfPath] = useState(offerta?.pdf_path ?? null)
  const [nomePdf, setNomePdf] = useState<string | null>(null)
  const [caricando, setCaricando] = useState(false)
  const [errorePdf, setErrorePdf] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const salva = offerta ? aggiorna : crea
  const inCorso = salva.isPending

  async function onFilePdf(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // consente di riselezionare lo stesso file
    if (!file) return
    setErrorePdf(null)
    setCaricando(true)
    try {
      const f = await caricaPdfOfferta(file)
      setPdfPath(f.storage_path)
      setNomePdf(f.nome_file)
    } catch (err) {
      setErrorePdf(messaggioErrore(err))
    } finally {
      setCaricando(false)
    }
  }

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
      pdf_path: pdfPath,
      categoria: categoria.trim() || null,
      transato_min: transatoMin.trim() === '' ? null : Number(transatoMin.replace(',', '.')),
      transato_max: transatoMax.trim() === '' ? null : Number(transatoMax.replace(',', '.')),
      commissione: commissione.trim() === '' ? null : Number(commissione.replace(',', '.')),
      target_cliente: targetCliente.trim() || null,
      note: note.trim() || null,
      testo_estratto: testoEstratto.trim() || null,
      nome_file: nomePdf,
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
        <Campo etichetta="Categoria">
          {(id) => (
            <Input
              id={id}
              placeholder="POS, Energia, Fotovoltaico…"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            />
          )}
        </Campo>
        <Campo etichetta="Commissione (%)">
          {(id) => (
            <Input
              id={id}
              inputMode="decimal"
              value={commissione}
              onChange={(e) => setCommissione(e.target.value)}
            />
          )}
        </Campo>
        {/* Fascia di transato ANNUO: e' l'asse su cui gira il motore di
            proposta. Diverso dalle lettere di target, che sono il compenso. */}
        <Campo etichetta="Transato min (€/anno)">
          {(id) => (
            <Input
              id={id}
              inputMode="decimal"
              value={transatoMin}
              onChange={(e) => setTransatoMin(e.target.value)}
            />
          )}
        </Campo>
        <Campo etichetta="Transato max (€/anno)">
          {(id) => (
            <Input
              id={id}
              inputMode="decimal"
              value={transatoMax}
              onChange={(e) => setTransatoMax(e.target.value)}
            />
          )}
        </Campo>
        <Campo etichetta="Target cliente">
          {(id) => (
            <Input
              id={id}
              placeholder="Es. bar e ristoranti"
              value={targetCliente}
              onChange={(e) => setTargetCliente(e.target.value)}
            />
          )}
        </Campo>
      </div>
      <Campo etichetta="Descrizione">
        {(id) => (
          <Textarea id={id} value={descrizione} onChange={(e) => setDescrizione(e.target.value)} />
        )}
      </Campo>
      <Campo etichetta="Note interne">
        {(id) => (
          <Textarea id={id} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        )}
      </Campo>

      {/* Il 3.0 leggeva il PDF lato server e precompilava questi campi.
          Qui si incolla il testo dell'offerta e si ottiene lo stesso, senza
          trascinarsi dietro un lettore PDF nel bundle. */}
      <Campo etichetta="Testo dell'offerta (incolla dal PDF)">
        {(id) => (
          <Textarea
            id={id}
            rows={3}
            value={testoEstratto}
            onChange={(e) => setTestoEstratto(e.target.value)}
            placeholder="Incolla qui il testo del PDF per precompilare canone, commissione e fascia di transato…"
          />
        )}
      </Campo>
      <Bottone
        variante="secondario"
        disabled={!testoEstratto.trim()}
        onClick={() => {
          const p = estraiParametriOfferta(testoEstratto)
          if (p.canone != null) setCanone(String(p.canone))
          if (p.commissione != null) setCommissione(String(p.commissione))
          if (p.transato_min != null) setTransatoMin(String(p.transato_min))
          if (p.transato_max != null) setTransatoMax(String(p.transato_max))
        }}
      >
        ✨ Ricava i parametri dal testo
      </Bottone>

      <Campo etichetta="PDF originale">
        {() => (
          <div className="flex flex-wrap items-center gap-2">
            <Bottone
              variante="secondario"
              onClick={() => fileRef.current?.click()}
              disabled={caricando}
            >
              {caricando ? 'Caricamento…' : pdfPath ? 'Sostituisci PDF' : 'Carica PDF'}
            </Bottone>
            <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={onFilePdf} />
            {nomePdf && <span className="text-etichetta text-testo-debole">{nomePdf}</span>}
            <BottonePdfOfferta path={pdfPath} etichetta="Apri PDF" />
            {pdfPath && (
              <button
                type="button"
                className="text-etichetta text-danger-soft-text"
                onClick={() => {
                  setPdfPath(null)
                  setNomePdf(null)
                }}
              >
                Rimuovi
              </button>
            )}
            {errorePdf && <span className="text-etichetta text-danger-soft-text">{errorePdf}</span>}
          </div>
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
