import { supabase } from '@/lib/supabase'
import { ownerId } from '@/lib/sessione'
import type { Aggiornamento, Enum, Riga } from '@/types/db'

/**
 * Profilo agente e mandati commerciali (dal CRM 3.0). Sono i dati che firmano
 * mail, report e promemoria: senza, ogni condivisione esce anonima.
 *
 * Entrambe le entità sono seminate alla creazione dell'utente (migrazione 25),
 * quindi la riga esiste sempre e si aggiorna in upsert — la UI non deve
 * distinguere fra "crea" e "modifica".
 */

export type PatchAgente = Omit<Aggiornamento<'profilo_agente'>, 'owner_id'>

export async function getAgente(): Promise<Riga<'profilo_agente'> | null> {
  const { data, error } = await supabase.from('profilo_agente').select('*').maybeSingle()
  if (error) throw error
  return data
}

export async function salvaAgente(patch: PatchAgente): Promise<void> {
  const { error } = await supabase
    .from('profilo_agente')
    .upsert({ ...patch, owner_id: await ownerId() }, { onConflict: 'owner_id' })
  if (error) throw error
}

export async function listaMandati(): Promise<Riga<'mandati'>[]> {
  const { data, error } = await supabase.from('mandati').select('*').order('brand')
  if (error) throw error
  return data ?? []
}

export type PatchMandato = Omit<Aggiornamento<'mandati'>, 'owner_id' | 'brand' | 'id'>

export async function salvaMandato(
  brand: Enum<'brand'>,
  patch: PatchMandato,
): Promise<void> {
  const { error } = await supabase
    .from('mandati')
    .upsert({ ...patch, brand, owner_id: await ownerId() }, { onConflict: 'owner_id,brand' })
  if (error) throw error
}
