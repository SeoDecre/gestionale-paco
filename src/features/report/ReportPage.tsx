import { useMemo, useState } from 'react'
import { Scheda } from '@/components/ui/Scheda'
import { Bottone } from '@/components/ui/Bottone'
import { Input, Select } from '@/components/ui/Campo'
import { Pillola } from '@/components/ui/Pillola'
import { Caricamento, Errore } from '@/components/ui/Stato'
import type { Enum } from '@/types/db'
import { useZone, useConcorrenti } from '@/features/vocabolari/queries'
import { BADGE_BRAND, BADGE_STATO } from '@/features/lead/brand'
import {
  aLeadReport,
  applicaFiltri,
  type FiltriLead,
} from './api'
import { useDatasetReport, useListeSalvate, useSalvaLista, useEliminaLista } from './queries'
import { COLONNE_EXPORT, esportaXlsx } from './export'
import { CondividiReport } from './CondividiReport'
import {
  efficaciaPerFonte,
  conversionePerZona,
  statiPerBrand,
  concorrentiPerZona,
} from './aggregazioni'

const FONTE_LABEL: Record<Enum<'fonte_lead'>, string> = {
  import_excel: 'Excel',
  self_gen: 'Self gen',
  call_center_nexi: 'Call center',
}
const pct = (x: number) => `${Math.round(x * 100)}%`

export function ReportPage() {
  const dataset = useDatasetReport()
  const zone = useZone()
  const concorrenti = useConcorrenti()
  const [filtri, setFiltri] = useState<FiltriLead>({})
  const [colonne, setColonne] = useState<string[]>(COLONNE_EXPORT.map((c) => c.chiave))

  const filtrati = useMemo(
    () => (dataset.data ? applicaFiltri(dataset.data, filtri) : []),
    [dataset.data, filtri],
  )
  const report = useMemo(() => filtrati.map(aLeadReport), [filtrati])

  const set = (k: keyof FiltriLead, v: string) =>
    setFiltri((f) => ({ ...f, [k]: v || undefined }))

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-titolo font-semibold">Report</h1>

      {dataset.isLoading && <Caricamento />}
      {dataset.isError && <Errore errore={dataset.error} />}

      {/* Filtri combinabili (§13) */}
      <Scheda titolo={`Filtri — ${filtrati.length} lead`} className="mb-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Select value={filtri.zona_id ?? ''} onChange={(e) => set('zona_id', e.target.value)}>
            <option value="">Tutte le zone</option>
            {(zone.data ?? []).map((z) => (
              <option key={z.id} value={z.id}>{z.nome}</option>
            ))}
          </Select>
          <Select value={filtri.target ?? ''} onChange={(e) => set('target', e.target.value)}>
            <option value="">Ogni target</option>
            {(['E', 'A', 'B', 'C'] as const).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
          <Select value={filtri.brand ?? ''} onChange={(e) => set('brand', e.target.value)}>
            <option value="">Ogni brand</option>
            <option value="NEXI">NEXI</option>
            <option value="HERA_COMM">Hera Comm</option>
          </Select>
          <Select value={filtri.stato ?? ''} onChange={(e) => set('stato', e.target.value)}>
            <option value="">Ogni stato</option>
            {Object.entries(BADGE_STATO).map(([k, v]) => (
              <option key={k} value={k}>{v.etichetta}</option>
            ))}
          </Select>
          <Select value={filtri.fonte ?? ''} onChange={(e) => set('fonte', e.target.value)}>
            <option value="">Ogni fonte</option>
            {Object.entries(FONTE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Select value={filtri.concorrente ?? ''} onChange={(e) => set('concorrente', e.target.value)}>
            <option value="">Ogni concorrente</option>
            {(concorrenti.data ?? []).map((c) => (
              <option key={c.id} value={c.nome}>{c.nome}</option>
            ))}
          </Select>
        </div>
        {Object.keys(filtri).length > 0 && (
          <button className="mt-2 text-etichetta text-info-soft-text" onClick={() => setFiltri({})}>
            Azzera filtri
          </button>
        )}
      </Scheda>

      {/* §12 Funnel per brand */}
      <Scheda titolo="Funnel per brand" className="mb-4">
        {[...statiPerBrand(report).entries()].map(([brand, f]) => (
          <div key={brand} className="mb-2 flex flex-wrap items-center gap-1.5">
            <Pillola tinta={BADGE_BRAND[brand].tinta}>{BADGE_BRAND[brand].etichetta}</Pillola>
            {(Object.keys(BADGE_STATO) as Enum<'stato_lead'>[]).map((s) => (
              <span key={s} className="text-etichetta text-testo-debole">
                {BADGE_STATO[s].etichetta}: <b className="text-testo">{f[s]}</b>
              </span>
            ))}
          </div>
        ))}
      </Scheda>

      {/* §12 Efficacia per fonte / conversione per zona */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TabellaEfficacia titolo="Efficacia per fonte" righe={efficaciaPerFonte(report).map((r) => ({ ...r, chiave: FONTE_LABEL[r.chiave as Enum<'fonte_lead'>] ?? r.chiave }))} />
        <TabellaEfficacia titolo="Conversione per zona" righe={conversionePerZona(report)} />
      </div>

      {/* §12 Concorrenti per zona */}
      <Scheda titolo="Concorrenti dominanti per zona" className="mb-4">
        {[...concorrentiPerZona(report).entries()].map(([zona, m]) => {
          const top = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
          return (
            <div key={zona} className="mb-1 text-etichetta">
              <b>{zona}</b>: {top.map(([c, n]) => `${c} (${n})`).join(', ')}
            </div>
          )
        })}
        {concorrentiPerZona(report).size === 0 && (
          <p className="text-testo-debole">Nessun concorrente registrato nei lead filtrati.</p>
        )}
      </Scheda>

      <PannelloExport
        leads={filtrati}
        colonne={colonne}
        setColonne={setColonne}
        filtri={filtri}
        setFiltri={setFiltri}
      />
    </div>
  )
}

function TabellaEfficacia({
  titolo,
  righe,
}: {
  titolo: string
  righe: { chiave: string; totale: number; vinti: number; tasso: number }[]
}) {
  return (
    <Scheda titolo={titolo}>
      <table className="w-full text-etichetta">
        <thead>
          <tr className="text-testo-debole">
            <th className="text-left font-normal">—</th>
            <th className="text-right font-normal">Tot</th>
            <th className="text-right font-normal">Vinti</th>
            <th className="text-right font-normal">%</th>
          </tr>
        </thead>
        <tbody>
          {righe.map((r) => (
            <tr key={r.chiave}>
              <td className="truncate">{r.chiave}</td>
              <td className="text-right">{r.totale}</td>
              <td className="text-right">{r.vinti}</td>
              <td className="text-right">{pct(r.tasso)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {righe.length === 0 && <p className="text-testo-debole">Nessun dato.</p>}
    </Scheda>
  )
}

function PannelloExport({
  leads,
  colonne,
  setColonne,
  filtri,
  setFiltri,
}: {
  leads: import('./api').LeadRicco[]
  colonne: string[]
  setColonne: (c: string[]) => void
  filtri: FiltriLead
  setFiltri: (f: FiltriLead) => void
}) {
  const liste = useListeSalvate()
  const salva = useSalvaLista()
  const elimina = useEliminaLista()
  const [nome, setNome] = useState('')

  const toggle = (chiave: string) =>
    setColonne(colonne.includes(chiave) ? colonne.filter((c) => c !== chiave) : [...colonne, chiave])

  return (
    <Scheda titolo="Export & liste salvate">
      <p className="mb-1 text-etichetta text-testo-debole">Colonne da esportare:</p>
      <div className="mb-3 flex flex-wrap gap-2">
        {COLONNE_EXPORT.map((c) => (
          <label key={c.chiave} className="flex items-center gap-1 text-etichetta">
            <input type="checkbox" checked={colonne.includes(c.chiave)} onChange={() => toggle(c.chiave)} />
            {c.etichetta}
          </label>
        ))}
      </div>
      <Bottone
        onClick={() => esportaXlsx(leads, colonne)}
        disabled={leads.length === 0 || colonne.length === 0}
      >
        Esporta Excel ({leads.length})
      </Bottone>

      {/* Condivisione del CRM 3.0: mail, WhatsApp, Telegram, copia, PDF. */}
      <div className="mt-3 border-t border-bordo pt-3">
        <p className="mb-2 text-etichetta text-testo-debole">
          Condividi i {leads.length} lead filtrati:
        </p>
        <CondividiReport lead={leads} />
      </div>

      <div className="mt-4 border-t border-bordo pt-3">
        <p className="mb-1 text-etichetta text-testo-debole">Salva i filtri + colonne come lista:</p>
        <div className="flex gap-2">
          <Input placeholder="Nome lista…" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Bottone
            disabled={!nome.trim() || salva.isPending}
            onClick={async () => {
              await salva.mutateAsync({ nome: nome.trim(), filtri, colonne })
              setNome('')
            }}
          >
            Salva
          </Bottone>
        </div>
        <ul className="mt-2 flex flex-col gap-1">
          {liste.data?.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-2 text-etichetta">
              <button
                className="text-info-soft-text"
                onClick={() => {
                  setFiltri((l.filtri ?? {}) as FiltriLead)
                  if (Array.isArray(l.colonne_export)) setColonne(l.colonne_export as string[])
                }}
              >
                {l.nome}
              </button>
              <button className="text-danger-soft-text" onClick={() => elimina.mutate(l.id)}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Scheda>
  )
}
