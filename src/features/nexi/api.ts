import { supabase } from '@/lib/supabase'
import { ownerId } from '@/lib/sessione'
import type { Riga } from '@/types/db'

/**
 * Data layer dell'intervista commerciale NEXI (§10 + intervista completa del
 * CRM 3.0). Relazione 1:1 col lead (lead_id è PK): si legge con maybeSingle e
 * si scrive in upsert.
 */

export type CampiNexi = Omit<
  Riga<'lead_nexi'>,
  'lead_id' | 'owner_id' | 'created_at' | 'updated_at'
>

/** Tipi delle due colonne jsonb, così la UI non maneggia `Json` grezzo. */
export type CommissioniDettaglio = Record<string, string>

/** Le voci della tabellina commissioni del 3.0, nell'ordine in cui le chiedeva. */
export const TIPI_CARTA = [
  'Carte di credito',
  'Carte di debito',
  'Carte di credito business',
  'Carte di debito business',
  'Pagobancomat',
] as const

export const MODALITA_POS = ['Pre-autorizzazione', 'PAN manuale'] as const
export const CONNETTIVITA = ['WiFi', 'SIM dati', 'Nessuna'] as const

/** Valori tutti "non chiesti": bozza di partenza quando non esiste la riga. */
export const NEXI_VUOTO: CampiNexi = {
  // Anagrafica POS
  sicuro_no_nexi: null,
  mai_stato_nexi: null,
  piva_stessa_punti: null,
  // Multi-POS & pagamenti
  rateale_interessato: null,
  due_iban: null,
  differenzia_pagamenti: null,
  tasso_interesse: null,
  extra_ue_valuta_estera: null,
  dcc_attivo: null,
  // Amex
  amex_attivo: null,
  amex_continuare: null,
  amex_attivare: null,
  // Costi
  canone_attuale: null,
  commissioni_attuali: null,
  commissioni_dettaglio: {},
  // Operatività
  difficolta_agenzia: null,
  storni: null,
  interruzioni_servizio: null,
  transazioni_sotto_30: null,
  transazioni_fuori_sede: null,
  modalita_attuali: [],
  connettivita: null,
  // Banca & Business
  soddisfatto_banca: null,
  cambio_banca: null,
  vende_online: null,
  ordini_telefonici: null,
}

/** Legge il jsonb come mappa tipo-carta -> percentuale, tollerando dati sporchi. */
export function leggiCommissioni(v: unknown): CommissioniDettaglio {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {}
  const out: CommissioniDettaglio = {}
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (val != null) out[k] = String(val)
  }
  return out
}

/** Legge il jsonb come lista di modalità, tollerando dati sporchi. */
export function leggiModalita(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string')
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
