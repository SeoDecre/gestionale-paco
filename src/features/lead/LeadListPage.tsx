import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Bottone } from '@/components/ui/Bottone'
import { Campo, Input, Select } from '@/components/ui/Campo'
import { Pillola } from '@/components/ui/Pillola'
import { PillolaColorata } from '@/components/ui/PillolaColorata'
import { BarraChip, Chip } from '@/components/ui/Chip'
import { Icona, type NomeIcona } from '@/components/ui/Icona'
import { TestataPagina } from '@/components/ui/Scheda'
import { Errore, Scheletro, Vuoto } from '@/components/ui/Stato'
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
      <TestataPagina
        titolo="Lead"
        descrizione={
          <span className="cifre">
            {visibili.length}
            {visibili.length !== tutti.length && ` di ${tutti.length}`} lead
          </span>
        }
      />

      <NuovoLead />

      {/* ------------------------------------------------------ filtri rapidi */}
      <BarraChip className="mb-2" role="group" aria-label="Filtri rapidi">
        <Chip attivo={!filtri.stato} onClick={() => imposta({ stato: '' })}>
          Tutti
        </Chip>
        {STATI.map((s) => (
          <Chip
            key={s}
            attivo={filtri.stato === s}
            onClick={() => imposta({ stato: filtri.stato === s ? '' : s })}
          >
            {BADGE_STATO[s].etichetta}
          </Chip>
        ))}
        <Chip
          icona="autonomo"
          attivo={filtri.soloSelfGen}
          onClick={() => imposta({ soloSelfGen: !filtri.soloSelfGen })}
        >
          Self gen
        </Chip>
      </BarraChip>

      {/* ----------------------------------------------------- filtri completi */}
      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {/* `aria-label` e non solo `placeholder`: qui l'etichetta visibile
            ruberebbe due righe al filtro, ma senza nulla il campo e' muto
            per chi usa VoiceOver. */}
        <Input
          type="search"
          aria-label="Cerca azienda o comune"
          placeholder="Cerca azienda o comune…"
          value={filtri.cerca}
          onChange={(e) => imposta({ cerca: e.target.value })}
        />
        <Input
          type="search"
          inputMode="numeric"
          aria-label="Cerca partita IVA"
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
          <Bottone
            variante="secondario"
            icona="chiudi"
            onClick={() => setParams(new URLSearchParams())}
          >
            Azzera filtri
          </Bottone>
        )}
      </div>

      {lista.isLoading && <Scheletro righe={6} className="mt-4" />}
      {lista.isError && <Errore errore={lista.error} />}
      {lista.data && visibili.length === 0 && (
        <Vuoto
          icona={attivi ? 'filtra' : 'lead'}
          testo={
            attivi ? 'Nessun lead con questi filtri.' : 'Ancora nessun lead.'
          }
          azione={
            attivi ? (
              <Bottone
                variante="secondario"
                misura="sm"
                icona="chiudi"
                onClick={() => setParams(new URLSearchParams())}
              >
                Azzera filtri
              </Bottone>
            ) : undefined
          }
        />
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
          <div className="superficie-card hidden overflow-x-auto lg:block">
            <table className="w-full border-collapse">
              <thead>
                {/* Intestazione appiccicata in alto: su 160 lead si perde di
                    vista quale colonna si sta leggendo dopo poche righe. */}
                <tr className="z-sticky sticky top-0 border-b border-bordo bg-superficie">
                  {COLONNE.map((c) => {
                    const ordinata = ordinamento.colonna === c.chiave
                    return (
                    <th
                      key={c.chiave}
                      className="px-3 py-2 text-left"
                      /* `aria-sort` e' il modo standard di annunciare
                         l'ordinamento corrente (WCAG): la freccia da sola
                         non arriva agli screen reader. */
                      aria-sort={
                        ordinata
                          ? ordinamento.discendente
                            ? 'descending'
                            : 'ascending'
                          : 'none'
                      }
                    >
                      <button
                        onClick={() => alternaOrdine(c.chiave)}
                        className={`transizione-colore inline-flex items-center gap-1 text-etichetta font-semibold hover:text-testo ${
                          ordinata ? 'text-info-soft-text' : 'text-testo-debole'
                        }`}
                      >
                        {c.etichetta}
                        <Icona
                          nome={ordinata ? 'espandi' : 'ordina'}
                          misura="sm"
                          className={`transizione-opacita ${
                            ordinata
                              ? ordinamento.discendente
                                ? ''
                                : 'rotate-180'
                              : 'opacity-40'
                          }`}
                        />
                      </button>
                    </th>
                    )
                  })}
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
    mappa && { href: mappa, icona: 'mappa', titolo: 'Apri in mappa' },
    google && { href: google, icona: 'cerca', titolo: 'Cerca su Google' },
    facebook && {
      href: facebook,
      icona: 'azienda',
      titolo: 'Cerca su Facebook',
    },
  ].filter(Boolean) as { href: string; icona: NomeIcona; titolo: string }[]

  return (
    <span className="flex shrink-0 items-center gap-1">
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
          className="premibile inline-flex h-11 w-11 items-center justify-center rounded-card border border-bordo text-testo-debole hover:border-bordo-forte hover:text-testo"
        >
          <Icona nome={l.icona} misura="sm" />
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
      className={`transizione-colore rounded-card border bg-superficie ${
        verificato
          ? 'border-success-soft-border'
          : 'border-bordo hover:border-bordo-forte'
      }`}
    >
      <Link
        to={`/lead/${lead.id}`}
        className="premibile-ampio block px-4 py-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="flex items-center gap-1 truncate text-campo font-medium">
              {verificato && (
                <Icona
                  nome="successo"
                  misura="sm"
                  titolo="Lead verificato"
                  className="text-success-soft-text"
                />
              )}
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
            <span className="cifre text-etichetta text-testo-debole">
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
    <tr
      className={`transizione-colore border-b border-bordo last:border-0 hover:bg-superficie-alt ${
        verificato ? 'bg-success-soft/40' : ''
      }`}
    >
      <td className="px-3 py-2">
        <Link
          to={`/lead/${lead.id}`}
          className="transizione-colore text-campo font-medium text-info-soft-text hover:underline"
        >
          {lead.ragione_sociale}
        </Link>
      </td>
      <td className="px-3 py-2 text-etichetta text-testo-debole">
        {lead.comune ?? '—'}
      </td>
      <td className="px-3 py-2">
        {lead.target ? <Pillola tinta="avviso">{lead.target}</Pillola> : '—'}
      </td>
      <td className="cifre px-3 py-2 text-etichetta text-testo-debole">
        {lead.fatturato_mensile != null
          ? formattaEuro(lead.fatturato_mensile)
          : '—'}
      </td>
      <td className="cifre px-3 py-2 text-etichetta text-testo-debole">
        {lead.piva ?? '—'}
      </td>
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
      <Bottone piena icona="aggiungi" className="mb-3" onClick={() => setAperto(true)}>
        Nuovo lead
      </Bottone>
    )
  }

  return (
    <form onSubmit={onSubmit} className="animate-salita mb-3 flex flex-col gap-2">
      <Campo etichetta="Ragione sociale" obbligatorio errore={crea.isError ? messaggioErrore(crea.error) : null}>
        <Input
          autoFocus
          autoComplete="organization"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </Campo>
      <div className="flex gap-2">
        <Bottone
          type="submit"
          icona="conferma"
          disabled={!nome.trim()}
          caricamento={crea.isPending}
        >
          {crea.isPending ? 'Creazione…' : 'Crea e apri'}
        </Bottone>
        <Bottone variante="secondario" onClick={() => setAperto(false)}>
          Annulla
        </Bottone>
      </div>
    </form>
  )
}
