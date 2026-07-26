import { supabase } from '@/lib/supabase'
import { ownerId } from '@/lib/sessione'
import type { Enum, Riga } from '@/types/db'
import type { LeadReport } from './aggregazioni'

/**
 * Dataset per report ed export (§12/§13). Un'unica query ricca, poi filtri e
 * aggregazioni girano lato client (utente singolo, volumi contenuti).
 */
export type LeadRicco = Riga<'lead'> & {
  zone: { nome: string } | null
  lead_brand: { brand: Enum<'brand'>; stato: Enum<'stato_lead'> }[]
  lead_concorrenti: { concorrenti_pos: { nome: string } | null }[]
}

const SELECT =
  '*, zone(nome), lead_brand(brand, stato), lead_concorrenti(concorrenti_pos(nome))'

export async function datasetReport(): Promise<LeadRicco[]> {
  const { data, error } = await supabase.from('lead').select(SELECT).order('ragione_sociale')
  if (error) throw error
  return (data ?? []) as LeadRicco[]
}

export const concorrentiDi = (l: LeadRicco): string[] =>
  l.lead_concorrenti.map((c) => c.concorrenti_pos?.nome).filter((n): n is string => !!n)

/** Normalizza per le aggregazioni pure. */
export const aLeadReport = (l: LeadRicco): LeadReport => ({
  fonte: l.fonte,
  zona: l.zone?.nome ?? null,
  brand: l.lead_brand,
  concorrenti: concorrentiDi(l),
})

// --------------------------------------------------------------------- filtri
export type FiltriLead = {
  zona_id?: string
  target?: Enum<'target_lettera'>
  brand?: Enum<'brand'>
  stato?: Enum<'stato_lead'>
  fonte?: Enum<'fonte_lead'>
  concorrente?: string
}

/** Applica i filtri combinabili (§13). Vuoto/undefined = nessun vincolo. */
export function applicaFiltri(leads: LeadRicco[], f: FiltriLead): LeadRicco[] {
  return leads.filter((l) => {
    if (f.zona_id && l.zona_id !== f.zona_id) return false
    if (f.target && l.target !== f.target) return false
    if (f.fonte && l.fonte !== f.fonte) return false
    if (f.brand && !l.lead_brand.some((b) => b.brand === f.brand)) return false
    if (f.stato && !l.lead_brand.some((b) => b.stato === f.stato)) return false
    if (f.concorrente && !concorrentiDi(l).includes(f.concorrente)) return false
    return true
  })
}

// -------------------------------------------------------------- liste salvate
export async function listaListe(): Promise<Riga<'liste_salvate'>[]> {
  const { data, error } = await supabase.from('liste_salvate').select('*').order('nome')
  if (error) throw error
  return data ?? []
}

export async function salvaLista(
  nome: string,
  filtri: FiltriLead,
  colonne: string[],
): Promise<void> {
  const { error } = await supabase.from('liste_salvate').upsert(
    { nome, filtri, colonne_export: colonne, owner_id: await ownerId() },
    { onConflict: 'owner_id,nome' },
  )
  if (error) throw error
}

export async function eliminaLista(id: string): Promise<void> {
  const { error } = await supabase.from('liste_salvate').delete().eq('id', id)
  if (error) throw error
}
