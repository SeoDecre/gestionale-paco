import { supabase } from '@/lib/supabase'
import type { Enum } from '@/types/db'
import { estremiMeseCorrente } from '@/features/planning/giorni'

/**
 * Aggregati per la dashboard §3. Con utente singolo e volumi modesti si
 * aggregano poche righe lato client: niente viste materializzate premature.
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
