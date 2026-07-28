import { supabase } from '@/lib/supabase'
import { ownerId } from '@/lib/sessione'
import type { Enum, Inserimento, Riga } from '@/types/db'

/**
 * Campi personalizzati per brand (configuratore multi-azienda del CRM 3.0).
 *
 * Serve a porre domande specifiche di un brand senza una migrazione per ogni
 * domanda nuova — tipicamente Hera Comm, che §11 lascia senza campi propri.
 * I campi STANDARD non passano di qui: restano colonne tipizzate.
 */

export type NuovoCampo = Omit<
  Inserimento<'campi_config'>,
  'owner_id' | 'id' | 'created_at' | 'updated_at'
>

export type ValoreCampo = { campo_id: string; valore: string | null }

/** Legge le opzioni jsonb come lista di stringhe, tollerando dati sporchi. */
export function leggiOpzioni(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string')
}

export const ETICHETTA_TIPO: Record<Enum<'tipo_campo'>, string> = {
  testo: 'Testo libero',
  numero: 'Numero',
  si_no: 'Sì / No',
  tendina: 'Tendina',
  data: 'Data',
}

/** Tutti i campi configurati per un brand (anche spenti, per l'editor). */
export async function listaCampi(brand?: Enum<'brand'>): Promise<Riga<'campi_config'>[]> {
  let q = supabase.from('campi_config').select('*').order('sezione').order('ordine')
  if (brand) q = q.eq('brand', brand)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

/** Solo i campi attivi, per la scheda lead. */
export async function campiAttivi(brand: Enum<'brand'>): Promise<Riga<'campi_config'>[]> {
  const { data, error } = await supabase
    .from('campi_config')
    .select('*')
    .eq('brand', brand)
    .eq('attivo', true)
    .order('sezione')
    .order('ordine')
  if (error) throw error
  return data ?? []
}

export async function creaCampo(input: NuovoCampo): Promise<void> {
  const { error } = await supabase
    .from('campi_config')
    .insert({ ...input, owner_id: await ownerId() })
  if (error) throw error
}

export async function aggiornaCampo(
  id: string,
  patch: Partial<NuovoCampo>,
): Promise<void> {
  const { error } = await supabase.from('campi_config').update(patch).eq('id', id)
  if (error) throw error
}

/**
 * Spegne il campo invece di cancellarlo: le risposte già date restano parte
 * dello storico del lead, come nel 3.0.
 */
export async function disattivaCampo(id: string): Promise<void> {
  const { error } = await supabase.from('campi_config').update({ attivo: false }).eq('id', id)
  if (error) throw error
}

export async function eliminaCampo(id: string): Promise<void> {
  const { error } = await supabase.from('campi_config').delete().eq('id', id)
  if (error) throw error
}

// ------------------------------------------------------------------- valori
export async function valoriDelLead(leadId: string): Promise<Riga<'campi_valori'>[]> {
  const { data, error } = await supabase.from('campi_valori').select('*').eq('lead_id', leadId)
  if (error) throw error
  return data ?? []
}

/**
 * Scrive le risposte in blocco. Upsert su (lead_id, campo_id): una risposta
 * svuotata resta come riga vuota, che è diverso da "mai risposto" solo per
 * l'utente — il DB non deve distinguerlo.
 */
export async function salvaValori(leadId: string, valori: ValoreCampo[]): Promise<void> {
  if (valori.length === 0) return
  const owner = await ownerId()
  const { error } = await supabase.from('campi_valori').upsert(
    valori.map((v) => ({
      lead_id: leadId,
      campo_id: v.campo_id,
      valore: v.valore,
      owner_id: owner,
    })),
    { onConflict: 'lead_id,campo_id' },
  )
  if (error) throw error
}
