import { supabase } from '@/lib/supabase'
import { ownerId } from '@/lib/sessione'
import type { Inserimento, Riga } from '@/types/db'

/**
 * Data layer delle lavorazioni. Registrare una lavorazione fa scattare il
 * ricalcolo dello stato del lead (trigger 08): dopo una mutation va invalidato
 * il dettaglio del lead, non solo la lista lavorazioni.
 */

type SenzaMeta<T> = Omit<T, 'owner_id' | 'id' | 'created_at' | 'updated_at'>

export type LavorazioneEstesa = Riga<'lavorazioni'> & {
  esiti_lavorazione: { nome: string; is_chiusura: boolean; esito_positivo: boolean | null } | null
  azioni_successive: { nome: string } | null
  contatti: { nome: string } | null
}

export type NuovaLavorazione = SenzaMeta<Inserimento<'lavorazioni'>>

/** Dati minimi per fissare l'appuntamento contestuale alla lavorazione (§6). */
export type AppuntamentoContestuale = {
  inizio: string // ISO
  durata_min: number
  luogo?: string | null
}

export async function listaLavorazioni(leadId: string): Promise<LavorazioneEstesa[]> {
  const { data, error } = await supabase
    .from('lavorazioni')
    .select(
      '*, esiti_lavorazione(nome, is_chiusura, esito_positivo), azioni_successive(nome), contatti(nome)',
    )
    .eq('lead_id', leadId)
    .order('data_ora', { ascending: false })
  if (error) throw error
  return (data ?? []) as LavorazioneEstesa[]
}

/**
 * Registra la lavorazione e, se richiesto, l'appuntamento collegato, in un
 * solo gesto (§6). Se lo slot è occupato (23P01) la lavorazione appena creata
 * viene rimossa, così non resta orfana e l'utente può ritentare con altro orario.
 */
export async function registraLavorazione(
  lav: NuovaLavorazione,
  appuntamento?: AppuntamentoContestuale,
): Promise<void> {
  const owner = await ownerId()
  const { data, error } = await supabase
    .from('lavorazioni')
    .insert({ ...lav, owner_id: owner })
    .select('id')
    .single()
  if (error) throw error

  if (appuntamento) {
    // fine la calcola il trigger dal (inizio, durata): omessa + cast, come in
    // planning/api.ts.
    const payloadApp = {
      owner_id: owner,
      lead_id: lav.lead_id,
      brand: lav.brand,
      inizio: appuntamento.inizio,
      durata_min: appuntamento.durata_min,
      luogo: appuntamento.luogo ?? null,
      lavorazione_id: data.id,
    }
    const { error: eApp } = await supabase
      .from('appuntamenti')
      .insert(payloadApp as unknown as Inserimento<'appuntamenti'>)
    if (eApp) {
      await supabase.from('lavorazioni').delete().eq('id', data.id)
      throw eApp
    }
  }
}

export async function eliminaLavorazione(id: string): Promise<void> {
  const { error } = await supabase.from('lavorazioni').delete().eq('id', id)
  if (error) throw error
}
