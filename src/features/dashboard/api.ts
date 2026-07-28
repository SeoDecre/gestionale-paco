import { supabase } from '@/lib/supabase'
import type { Enum } from '@/types/db'
import { estremiMeseCorrente } from '@/features/planning/giorni'

/**
 * Aggregati per la dashboard §3 + le metriche del CRM 3.0 (tasso di chiusura,
 * lead lavorati nel periodo, media lavorazioni per lead).
 *
 * Con utente singolo e volumi modesti si aggregano poche righe lato client:
 * niente viste materializzate premature.
 */

export type ContatoriStato = Record<Enum<'stato_lead'>, number>

export async function contatoriStato(): Promise<ContatoriStato> {
  const { data, error } = await supabase.from('lead_brand').select('stato')
  if (error) throw error
  const acc: ContatoriStato = {
    da_contattare: 0,
    in_lavorazione: 0,
    chiuso_vinto: 0,
    chiuso_perso: 0,
  }
  for (const r of data ?? []) acc[r.stato] += 1
  return acc
}

export type ChiusiMese = { vinti: number; persi: number }

/**
 * §3 "Chiusi (mese)": conteggia le lavorazioni di CHIUSURA registrate nel mese
 * corrente, separando vinti e persi (sono grandezze diverse, mai da sommare).
 */
export async function chiusiMese(): Promise<ChiusiMese> {
  const { daISO, aISO } = estremiMeseCorrente()
  const { data, error } = await supabase
    .from('lavorazioni')
    .select('esiti_lavorazione!inner(is_chiusura, esito_positivo)')
    .gte('data_ora', daISO)
    .lt('data_ora', aISO)
    .eq('esiti_lavorazione.is_chiusura', true)
  if (error) throw error
  let vinti = 0
  let persi = 0
  for (const r of data ?? []) {
    const e = r.esiti_lavorazione as unknown as { esito_positivo: boolean | null }
    if (e?.esito_positivo) vinti += 1
    else persi += 1
  }
  return { vinti, persi }
}

// ---------------------------------------------------- metriche del CRM 3.0
export type Panoramica = {
  totaleLead: number
  perTarget: Record<string, number>
  perFonte: Record<Enum<'fonte_lead'>, number>
  verificati: number
  /** Lead con almeno una lavorazione: il denominatore del tasso di chiusura. */
  contattati: number
  vintiTotali: number
  /** % di chiusura sui contattati, arrotondata. */
  tassoChiusura: number
  lavorazioniTotali: number
  mediaLavorazioni: number
  lavSettimana: number
  lavMese: number
}

/**
 * Il tasso di chiusura si calcola sui CONTATTATI, non sul totale dei lead:
 * dividere per una lista appena importata darebbe una percentuale che scende
 * ogni volta che si importa, il che non dice nulla sul lavoro fatto.
 */
export async function panoramica(): Promise<Panoramica> {
  const [lead, brand, lavorazioni] = await Promise.all([
    supabase.from('lead').select('id, target, fonte, verifica_id'),
    supabase.from('lead_brand').select('lead_id, stato'),
    supabase.from('lavorazioni').select('lead_id, data_ora'),
  ])
  if (lead.error) throw lead.error
  if (brand.error) throw brand.error
  if (lavorazioni.error) throw lavorazioni.error

  const righeLead = lead.data ?? []
  const righeLav = lavorazioni.data ?? []

  const perTarget: Record<string, number> = { E: 0, A: 0, B: 0, C: 0 }
  const perFonte: Record<Enum<'fonte_lead'>, number> = {
    import_excel: 0,
    self_gen: 0,
    call_center_nexi: 0,
  }
  let verificati = 0
  for (const l of righeLead) {
    if (l.target) perTarget[l.target] = (perTarget[l.target] ?? 0) + 1
    perFonte[l.fonte] += 1
    if (l.verifica_id) verificati += 1
  }

  const conLavorazione = new Set(righeLav.map((l) => l.lead_id))
  const vintiTotali = new Set(
    (brand.data ?? []).filter((b) => b.stato === 'chiuso_vinto').map((b) => b.lead_id),
  ).size

  const ora = Date.now()
  const settimanaFa = ora - 7 * 24 * 3600_000
  const { daISO } = estremiMeseCorrente()
  const inizioMese = new Date(daISO).getTime()

  let lavSettimana = 0
  let lavMese = 0
  for (const l of righeLav) {
    const t = new Date(l.data_ora).getTime()
    if (t >= settimanaFa) lavSettimana += 1
    if (t >= inizioMese) lavMese += 1
  }

  return {
    totaleLead: righeLead.length,
    perTarget,
    perFonte,
    verificati,
    contattati: conLavorazione.size,
    vintiTotali,
    tassoChiusura:
      conLavorazione.size > 0 ? Math.round((vintiTotali / conLavorazione.size) * 100) : 0,
    lavorazioniTotali: righeLav.length,
    mediaLavorazioni:
      righeLead.length > 0
        ? Math.round((righeLav.length / righeLead.length) * 10) / 10
        : 0,
    lavSettimana,
    lavMese,
  }
}

/** Ultime lavorazioni registrate, per la colonna "attività recente" del 3.0. */
export type UltimaLavorazione = {
  id: string
  data_ora: string
  lead_id: string
  lead: { ragione_sociale: string } | null
  esiti_lavorazione: { nome: string; is_chiusura: boolean; esito_positivo: boolean | null } | null
}

export async function ultimeLavorazioni(limite = 8): Promise<UltimaLavorazione[]> {
  const { data, error } = await supabase
    .from('lavorazioni')
    .select(
      'id, data_ora, lead_id, lead(ragione_sociale), esiti_lavorazione(nome, is_chiusura, esito_positivo)',
    )
    .order('data_ora', { ascending: false })
    .limit(limite)
  if (error) throw error
  return (data ?? []) as unknown as UltimaLavorazione[]
}
