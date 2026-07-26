import { supabase } from '@/lib/supabase'
import { ownerId } from '@/lib/sessione'
import type { Riga } from '@/types/db'

/**
 * Data layer delle sezioni tecniche NEXI (§10). Relazione 1:1 col lead
 * (lead_id è PK): si legge con maybeSingle e si scrive in upsert.
 */

export type CampiNexi = Omit<Riga<'lead_nexi'>, 'lead_id' | 'owner_id' | 'created_at' | 'updated_at'>

/** Valori tutti "non chiesti": bozza di partenza quando non esiste ancora la riga. */
export const NEXI_VUOTO: CampiNexi = {
  rateale_interessato: null,
  extra_ue_valuta_estera: null,
  dcc_attivo: null,
  amex_attivo: null,
  amex_continuare: null,
  amex_attivare: null,
  canone_attuale: null,
  commissioni_attuali: null,
  transazioni_sotto_30: null,
  transazioni_fuori_sede: null,
  vende_online: null,
  ordini_telefonici: null,
}

export async function getLeadNexi(leadId: string): Promise<Riga<'lead_nexi'> | null> {
  const { data, error } = await supabase
    .from('lead_nexi')
    .select('*')
    .eq('lead_id', leadId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function salvaLeadNexi(leadId: string, campi: CampiNexi): Promise<void> {
  const { error } = await supabase
    .from('lead_nexi')
    .upsert({ lead_id: leadId, owner_id: await ownerId(), ...campi }, { onConflict: 'lead_id' })
  if (error) throw error
}
