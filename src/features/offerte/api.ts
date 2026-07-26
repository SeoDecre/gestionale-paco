import { supabase } from '@/lib/supabase'
import { ownerId } from '@/lib/sessione'
import type { Aggiornamento, Enum, Inserimento, Riga } from '@/types/db'

/**
 * Data layer delle offerte (§9). Le offerte proposte a un lead si ARCHIVIANO,
 * non si cancellano (vedi archiviaOfferta): così resta traccia di cosa è stato
 * proposto anche quando le condizioni commerciali cambiano.
 */

export type NuovaOfferta = Omit<
  Inserimento<'offerte'>,
  'owner_id' | 'id' | 'created_at' | 'updated_at'
>
export type PatchOfferta = Aggiornamento<'offerte'>

export async function listaOfferte(): Promise<Riga<'offerte'>[]> {
  const { data, error } = await supabase
    .from('offerte')
    .select('*')
    .order('brand')
    .order('nome')
  if (error) throw error
  return data ?? []
}

/** Solo offerte attive, opzionalmente di un brand — per la scelta sul lead (§4). */
export async function offerteAttive(brand?: Enum<'brand'>): Promise<Riga<'offerte'>[]> {
  let q = supabase.from('offerte').select('*').eq('stato', 'attiva').order('nome')
  if (brand) q = q.eq('brand', brand)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export async function creaOfferta(input: NuovaOfferta): Promise<void> {
  const { error } = await supabase
    .from('offerte')
    .insert({ ...input, owner_id: await ownerId() })
  if (error) throw error
}

export async function aggiornaOfferta(id: string, patch: PatchOfferta): Promise<void> {
  const { error } = await supabase.from('offerte').update(patch).eq('id', id)
  if (error) throw error
}

/** Archivia invece di cancellare: preserva "quale offerta è stata proposta". */
export async function archiviaOfferta(id: string): Promise<void> {
  const { error } = await supabase
    .from('offerte')
    .update({ stato: 'archiviata' })
    .eq('id', id)
  if (error) throw error
}

export async function eliminaOfferta(id: string): Promise<void> {
  const { error } = await supabase.from('offerte').delete().eq('id', id)
  if (error) throw error
}
