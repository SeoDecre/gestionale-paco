import { supabase } from '@/lib/supabase'
import { ownerId } from '@/lib/sessione'
import type { Inserimento, Riga } from '@/types/db'

/**
 * Data layer degli appuntamenti. `fine` la calcola il trigger dal (inizio,
 * durata_min): l'insert la omette e casta, come per lo slot delle sedi.
 */

export type AppuntamentoConLead = Riga<'appuntamenti'> & {
  lead: {
    ragione_sociale: string
    indirizzo: string | null
    civico: string | null
    cap: string | null
    comune: string | null
    provincia: string | null
    zona_id: string | null
  } | null
}

export type NuovoAppuntamento = Omit<
  Inserimento<'appuntamenti'>,
  'owner_id' | 'id' | 'created_at' | 'updated_at' | 'fine'
>

const SELECT =
  '*, lead(ragione_sociale, indirizzo, civico, cap, comune, provincia, zona_id)'

/** Appuntamenti nell'intervallo [daISO, aISO), ordinati per inizio. */
export async function appuntamentiTra(daISO: string, aISO: string): Promise<AppuntamentoConLead[]> {
  const { data, error } = await supabase
    .from('appuntamenti')
    .select(SELECT)
    .gte('inizio', daISO)
    .lt('inizio', aISO)
    .order('inizio')
  if (error) throw error
  return (data ?? []) as AppuntamentoConLead[]
}

export async function creaAppuntamento(input: NuovoAppuntamento): Promise<void> {
  const payload = { ...input, owner_id: await ownerId() }
  const { error } = await supabase
    .from('appuntamenti')
    .insert(payload as unknown as Inserimento<'appuntamenti'>)
  if (error) throw error
}

export async function annullaAppuntamento(id: string): Promise<void> {
  const { error } = await supabase
    .from('appuntamenti')
    .update({ stato: 'annullato' })
    .eq('id', id)
  if (error) throw error
}

export async function segnaFatto(id: string): Promise<void> {
  const { error } = await supabase.from('appuntamenti').update({ stato: 'fatto' }).eq('id', id)
  if (error) throw error
}

export async function eliminaAppuntamento(id: string): Promise<void> {
  const { error } = await supabase.from('appuntamenti').delete().eq('id', id)
  if (error) throw error
}
