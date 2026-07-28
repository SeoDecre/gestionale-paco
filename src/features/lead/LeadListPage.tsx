import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Bottone } from '@/components/ui/Bottone'
import { Input, Select } from '@/components/ui/Campo'
import { Pillola } from '@/components/ui/Pillola'
import { PillolaColorata } from '@/components/ui/PillolaColorata'
import { Caricamento, Errore, Vuoto } from '@/components/ui/Stato'
import { formattaEuro } from '@/lib/format'
import { messaggioErrore } from '@/lib/errors'
import { urlMappa, indirizzoCompleto } from '@/lib/maps'
import { urlGoogleAttivita, urlFacebookAttivita } from '@/lib/ricerche'
import { useZone, useStatiVerifica } from '@/features/vocabolari/queries'
import type { Enum } from '@/types/db'
import { useListaLead, useCreaLead } from './queries'
import type { LeadConBrand } from './api'
import { BADGE_BRAND, BADGE_STATO, TUTTI_I_BRAND } from './brand'
import {
  filtra,
  ordina,
  comuniPresenti,
  filtriAttivi,
  FILTRI_VUOTI,
  type Filtri,
  type Ordine,
  type ColonnaOrdine,
} from './filtri'

const STATI: Enum<'stato_lead'>[] = [
  'da_contattare',
  'in_lavorazione',
  'chiuso_vinto',
  'chiuso_perso',
]
const LETTERE: Enum<'target_lettera'>[] = ['E', 'A', 'B', 'C']

const COLONNE: { chiave: ColonnaOrdine; etichetta: string }[] = [
  { chiave: 'ragione_sociale', etichetta: 'Azienda' },
  { chiave: 'comune', etichetta: 'Comune' },
  { chiave: 'target', etichetta: 'T' },
  { chiave: 'fatturato_mensile', etichetta: 'Fatturato' },
  { chiave: 'piva', etichetta: 'P.IVA' },
]

/**
 * Lista lead — porting delle funzioni del CRM 3.0 (filtri rapidi, ricerca per
 * P.IVA, ordinamento per colonna, scorciatoie Maps/Google/Facebook) su un
 * impianto responsive: tabella da `lg` in su, schede su telefono.
 *
 * Filtri e ordinamento stanno in `filtri.ts`, puri e testati.
 */
export function LeadListPage() {
  const lista = useListaLead()
  const zone = useZone()
  const verifiche = useStatiVerifica()
  const [params, setParams] = useSearchParams()

  // I filtri arrivano anche dalle piastrelle della dashboard, via querystring:
  // così "Da contattare" sulla home apre la lista già filtrata, e il link è
  // condivisibile e sopravvive al ricaricamento.
  const filtri: Filtri = useMemo(
    () => ({
      ...FILTRI_VUOTI,
      cerca: params.get('cerca') ?? '',
      piva: params.get('piva') ?? '',
      brand: (params.get('brand') as Filtri['brand']) ?? '',
      stato: (params.get('stato') as Filtri['stato']) ?? '',
      target: (params.get('target') as Filtri['target']) ?? '',
      comune: params.get('comune') ?? '',
      zonaId: params.get('zona') ?? '',
      verificaId: params.get('verifica') ?? '',
      soloSelfGen: params.get('selfgen') === '1',
    }),
    [params],
  )

  const [ordinamento, setOrdinamento] = useState<Ordine>({
    colonna: 'ragione_sociale',
    discendente: false,
  })

  function imposta(patch: Partial<Filtri>) {
    const next = { ...filtri, ...patch }
    const p = new URLSearchParams()
    if (next.cerca) p.set('cerca', next.cerca)
    if (next.piva) p.set('piva', next.piva)
    if (next.brand) p.set('brand', next.brand)
    if (next.stato) p.set('stato', next.stato)
    if (next.target) p.set('target', next.target)
    if (next.comune) p.set('comune', next.comune)
    if (next.zonaId) p.set('zona', next.zonaId)
    if (next.verificaId) p.set('verifica', next.verificaId)
    if (next.soloSelfGen) p.set('selfgen', '1')
    setParams(p, { replace: true })
  }

  const tutti = lista.data ?? []
  const visibili = ordina(filtra(tutti, filtri), ordinamento)
  const comuni = comuniPresenti(tutti)
  const attivi = filtriAttivi(filtri)

  function alternaOrdine(c: ColonnaOrdine) {
    setOrdinamento((o) =>
      o.colonna === c ? { colonna: c, discendente: !o.discendente } : { colonna: c, discendente: false },
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-titolo font-semibold">Lead</h1>
        <p className="text-etichetta text-testo-debole">
          {visibili.length}
          {visibili.length !== tutti.length && ` di ${tutti.length}`} lead
        </p>
      </div>

      <NuovoLead />

      {/* ------------------------------------------------------ filtri rapidi */}
      <div className="-mx-4 mb-2 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FiltroRapido attivo={!filtri.stato} onClick={() => imposta({ stato: '' })}>
          Tutti
        </FiltroRapido>
        {STATI.map((s) => (
          <FiltroRapido
            key={s}
            attivo={filtri.stato === s}
            onClick={() => imposta({ stato: filtri.stato === s ? '' : s })}
          >
            {BADGE_STATO[s].etichetta}
          </FiltroRapido>
        ))}
        <FiltroRapido
          attivo={filtri.soloSelfGen}
          onClick={() => imposta({ soloSelfGen: !filtri.soloSelfGen })}
        >
          ✋ Self gen
        </FiltroRapido>
      </div>

      {/* ----------------------------------------------------- filtri completi */}
      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          type="search"
          placeholder="Cerca azienda o comune…"
          value={filtri.cerca}
          onChange={(e) => imposta({ cerca: e.target.value })}
        />
        <Input
          type="search"
          inputMode="numeric"
          placeholder="Cerca P.IVA…"
          value={filtri.piva}
          onChange={(e) => imposta({ piva: e.target.value })}
        />
        <Select
          value={filtri.brand}
          onChange={(e) => imposta({ brand: e.target.value as Filtri['brand'] })}
        >
          <option value="">Tutti i brand</option>
          {TUTTI_I_BRAND.map((b) => (
            <option key={b} value={b}>
              {BADGE_BRAND[b].etichetta}
            </option>
          ))}
        </Select>
        <Select
          value={filtri.target}
          onChange={(e) => imposta({ target: e.target.value as Filtri['target'] })}
        >
          <option value="">Tutti i target</option>
          {LETTERE.map((l) => (
            <option key={l} value={l}>
              Target {l}
            </option>
          ))}
        </Select>
        <Select value={filtri.comune} onChange={(e) => imposta({ comune: e.target.value })}>
          <option value="">Tutti i comuni</option>
          {comuni.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select value={filtri.zonaId} onChange={(e) => imposta({ zonaId: e.target.value })}>
          <option value="">Tutte le zone</option>
          {(zone.data ?? []).map((z) => (
            <option key={z.id} value={z.id}>
              {z.nome}
            </option>
          ))}
        </Select>
        <Select
          value={filtri.verificaId}
          onChange={(e) => imposta({ verificaId: e.target.value })}
        >
          <option value="">Tutte le verifiche</option>
          {(verifiche.data ?? []).map((v) => (
            <option key={v.id} value={v.id}>
              {v.nome}
            </option>
          ))}
        </Select>
        {attivi && (
          <Bottone variante="secondario" onClick={() => setParams(new URLSearchParams())}>
            ✕ Azzera filtri
          </Bottone>
        )}
      </div>

      {lista.isLoading && <Caricamento />}
      {lista.isError && <Errore errore={lista.error} />}
      {lista.data && visibili.length === 0 && (
        <Vuoto testo={attivi ? 'Nessun lead con questi filtri.' : 'Ancora nessun lead.'} />
      )}

      {visibili.length > 0 && (
        <>
          {/* Telefono/tablet: schede. Una tabella a otto colonne su 390px
              costringerebbe a scorrere in orizzontale per ogni riga. */}
          <ul className="flex flex-col gap-2 lg:hidden">
            {visibili.map((l) => (
              <SchedaLead key={l.id} lead={l} />
            ))}
          </ul>

          {/* Desktop: tabella ordinabile, come il 3.0. */}
          <div className="hidden overflow-x-auto rounded-card border border-bordo bg-superficie lg:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-bordo">
                  {COLONNE.map((c) => (
                    <th key={c.chiave} className="px-3 py-2 text-left">
                      <button
                        onClick={() => alternaOrdine(c.chiave)}
                        className={`text-etichetta font-semibold ${
                          ordinamento.colonna === c.chiave
                            ? 'text-info-soft-text'
                            : 'text-testo-debole'
                        }`}
                      >
                        {c.etichetta}
                        {ordinamento.colonna === c.chiave && (ordinamento.discendente ? ' ↓' : ' ↑')}
                      </button>
                    </th>
                  ))}
                  <th className="px-3 py-2 text-left text-etichetta font-semibold text-testo-debole">
                    Stato
                  </th>
                  <th className="px-3 py-2 text-left text-etichetta font-semibold text-testo-debole">
                    Verifica
                  </th>
                  <th className="px-3 py-2 text-left text-etichetta font-semibold text-testo-debole">
                    Link
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibili.map((l) => (
                  <RigaTabella key={l.id} lead={l} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function FiltroRapido({
  attivo,
  onClick,
  children,
}: {
  attivo: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`min-h-11 flex-shrink-0 whitespace-nowrap rounded-pillola border px-3 text-etichetta font-medium ${
        attivo
          ? 'border-info-soft-border bg-info-soft text-info-soft-text'
          : 'border-bordo bg-superficie text-testo-debole'
      }`}
    >
      {children}
    </button>
  )
}

/** Badge di stato per ogni brand del lead: lo stato è per (lead, brand). */
function StatiBrand({ lead }: { lead: LeadConBrand }) {
  return (
    <>
      {lead.lead_brand.map((b) => (
        <span key={b.brand} className="inline-flex items-center gap-1">
          <Pillola tinta={BADGE_BRAND[b.brand].tinta}>{BADGE_BRAND[b.brand].etichetta}</Pillola>
          <Pillola tinta={BADGE_STATO[b.stato].tinta}>{BADGE_STATO[b.stato].etichetta}</Pillola>
        </span>
      ))}
    </>
  )
}

/** Scorciatoie esterne: mappa, ricerca Google, pagina Facebook. */
function Scorciatoie({ lead }: { lead: LeadConBrand }) {
  const mappa = urlMappa(lead)
  const google = urlGoogleAttivita(lead)
  const facebook = urlFacebookAttivita(lead)
  const link = [
    mappa && { href: mappa, testo: '📍', titolo: 'Apri in mappa' },
    google && { href: google, testo: '🔍', titolo: 'Cerca su Google' },
    facebook && { href: facebook, testo: 'f', titolo: 'Cerca su Facebook' },
  ].filter(Boolean) as { href: string; testo: string; titolo: string }[]

  return (
    <span className="flex flex-shrink-0 items-center gap-1">
      {link.map((l) => (
        <a
          key={l.titolo}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          title={l.titolo}
          aria-label={l.titolo}
          // stopPropagation: la riga è dentro un Link al dettaglio.
          onClick={(e) => e.stopPropagation()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-card border border-bordo text-etichetta text-testo-debole"
        >
          {l.testo}
        </a>
      ))}
    </span>
  )
}

function SchedaLead({ lead }: { lead: LeadConBrand }) {
  const luogo = [lead.comune, lead.zone?.nome].filter(Boolean).join(' · ')
  const verificato = lead.stati_verifica?.confermato
  return (
    <li
      className={`rounded-card border bg-superficie ${
        verificato ? 'border-success-soft-border' : 'border-bordo'
      }`}
    >
      <Link to={`/lead/${lead.id}`} className="block px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-campo font-medium">
              {verificato && <span className="mr-1 text-success-soft-text">✓</span>}
              {lead.ragione_sociale}
            </p>
            {luogo && <p className="truncate text-etichetta text-testo-debole">{luogo}</p>}
          </div>
          {lead.target && <Pillola tinta="avviso">{lead.target}</Pillola>}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <StatiBrand lead={lead} />
          {lead.stati_verifica && (
            <PillolaColorata
              testo={lead.stati_verifica.nome}
              coloreBg={lead.stati_verifica.colore_bg}
              coloreFg={lead.stati_verifica.colore_fg}
              coloreDot={lead.stati_verifica.colore_dot}
            />
          )}
          {lead.fatturato_mensile != null && (
            <span className="text-etichetta text-testo-debole">
              {formattaEuro(lead.fatturato_mensile)}/mese
            </span>
          )}
        </div>
      </Link>
      <div className="flex items-center justify-between gap-2 border-t border-bordo px-4 py-2">
        <span className="truncate text-etichetta text-testo-debole">
          {lead.telefono || lead.cellulare || indirizzoCompleto(lead) || '—'}
        </span>
        <Scorciatoie lead={lead} />
      </div>
    </li>
  )
}

function RigaTabella({ lead }: { lead: LeadConBrand }) {
  const verificato = lead.stati_verifica?.confermato
  return (
    <tr className={`border-b border-bordo last:border-0 ${verificato ? 'bg-success-soft/40' : ''}`}>
      <td className="px-3 py-2">
        <Link to={`/lead/${lead.id}`} className="text-campo font-medium text-info-soft-text">
          {lead.ragione_sociale}
        </Link>
      </td>
      <td className="px-3 py-2 text-etichetta text-testo-debole">{lead.comune ?? '—'}</td>
      <td className="px-3 py-2">
        {lead.target ? <Pillola tinta="avviso">{lead.target}</Pillola> : '—'}
      </td>
      <td className="px-3 py-2 text-etichetta text-testo-debole">
        {lead.fatturato_mensile != null ? formattaEuro(lead.fatturato_mensile) : '—'}
      </td>
      <td className="px-3 py-2 font-mono text-etichetta text-testo-debole">{lead.piva ?? '—'}</td>
      <td className="px-3 py-2">
        <span className="flex flex-wrap items-center gap-1">
          <StatiBrand lead={lead} />
        </span>
      </td>
      <td className="px-3 py-2">
        {lead.stati_verifica ? (
          <PillolaColorata
            testo={lead.stati_verifica.nome}
            coloreBg={lead.stati_verifica.colore_bg}
            coloreFg={lead.stati_verifica.colore_fg}
            coloreDot={lead.stati_verifica.colore_dot}
          />
        ) : (
          <span className="text-etichetta text-testo-debole">—</span>
        )}
      </td>
      <td className="px-3 py-2">
        <Scorciatoie lead={lead} />
      </td>
    </tr>
  )
}

/** Creazione rapida: basta la ragione sociale, poi si apre il dettaglio. */
function NuovoLead() {
  const [aperto, setAperto] = useState(false)
  const [nome, setNome] = useState('')
  const crea = useCreaLead()
  const navigate = useNavigate()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    const lead = await crea.mutateAsync({ ragione_sociale: nome.trim() })
    navigate(`/lead/${lead.id}`)
  }

  if (!aperto) {
    return (
      <Bottone piena className="mb-3" onClick={() => setAperto(true)}>
        ＋ Nuovo lead
      </Bottone>
    )
  }

  return (
    <form onSubmit={onSubmit} className="mb-3 flex flex-col gap-2">
      <Input
        autoFocus
        placeholder="Ragione sociale"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />
      {crea.isError && (
        <p className="text-etichetta text-danger-soft-text">{messaggioErrore(crea.error)}</p>
      )}
      <div className="flex gap-2">
        <Bottone type="submit" disabled={crea.isPending || !nome.trim()}>
          {crea.isPending ? 'Creazione…' : 'Crea e apri'}
        </Bottone>
        <Bottone variante="secondario" onClick={() => setAperto(false)}>
          Annulla
        </Bottone>
      </div>
    </form>
  )
}
