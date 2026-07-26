import { supabase } from '@/lib/supabase'
import { ownerId } from '@/lib/sessione'
import type { Aggiornamento, Riga } from '@/types/db'

/** Le sette tabelle-vocabolario gestibili dall'utente (§9). */
export type TabellaVocab =
  | 'ruoli_contatto'
  | 'etichette_sede'
  | 'azioni_successive'
  | 'concorrenti_pos'
  | 'tipi_pos'
  | 'esiti_lavorazione'
  | 'zone'

/**
 * Lettura dei vocabolari gestibili da Paco (§9) e dei parametri target.
 * Questi dati alimentano le select e i chip dell'anagrafica lead; gli editor
 * di scrittura arrivano con la Configurazione azienda (milestone 4).
 *
 * Le liste per le select restituiscono solo le voci ATTIVE, ordinate come le
 * ha ordinate l'utente (campo `ordine`, poi nome).
 */

async function attivi<T>(
  tabella:
    | 'ruoli_contatto'
    | 'etichette_sede'
    | 'concorrenti_pos'
    | 'tipi_pos'
    | 'esiti_lavorazione'
    | 'azioni_successive'
    | 'zone',
): Promise<T[]> {
  const { data, error } = await supabase
    .from(tabella)
    .select('*')
    .eq('attivo', true)
    .order('ordine')
    .order('nome')
  if (error) throw error
  return (data ?? []) as T[]
}

export const listaRuoliContatto = () => attivi<Riga<'ruoli_contatto'>>('ruoli_contatto')
export const listaEtichetteSede = () => attivi<Riga<'etichette_sede'>>('etichette_sede')
export const listaConcorrenti = () => attivi<Riga<'concorrenti_pos'>>('concorrenti_pos')
export const listaTipiPos = () => attivi<Riga<'tipi_pos'>>('tipi_pos')
export const listaEsiti = () => attivi<Riga<'esiti_lavorazione'>>('esiti_lavorazione')
export const listaAzioniSuccessive = () =>
  attivi<Riga<'azioni_successive'>>('azioni_successive')
export const listaZone = () => attivi<Riga<'zone'>>('zone')

export async function listaParametriTarget(): Promise<Riga<'parametri_target'>[]> {
  const { data, error } = await supabase
    .from('parametri_target')
    .select('*')
    .order('soglia_min_annua', { nullsFirst: true })
  if (error) throw error
  return data ?? []
}

// ---------------------------------------------------------- scrittura (§9 editor)
// Le funzioni sotto operano su tabella dinamica: i cast bypassano la tipizzazione
// stretta di supabase-js sull'unione di nomi tabella. owner_id lo mette comunque
// il trigger, ma i tipi Insert lo pretendono, quindi lo si passa esplicito.

/** Tutte le voci (anche non attive), per gli editor di Configurazione. */
export async function tutteLeVoci<T>(tabella: TabellaVocab): Promise<T[]> {
  const { data, error } = await supabase
    .from(tabella)
    .select('*')
    .order('ordine')
    .order('nome')
  if (error) throw error
  return (data ?? []) as T[]
}

export async function creaVoce(
  tabella: TabellaVocab,
  valori: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase
    .from(tabella)
    .insert({ ...valori, owner_id: await ownerId() } as never)
  if (error) throw error
}

export async function aggiornaVoce(
  tabella: TabellaVocab,
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from(tabella).update(patch as never).eq('id', id)
  if (error) throw error
}

export async function eliminaVoce(tabella: TabellaVocab, id: string): Promise<void> {
  const { error } = await supabase.from(tabella).delete().eq('id', id)
  if (error) throw error
}

export async function aggiornaParametroTarget(
  id: string,
  patch: Aggiornamento<'parametri_target'>,
): Promise<void> {
  const { error } = await supabase.from('parametri_target').update(patch).eq('id', id)
  if (error) throw error
}

// ------------------------------------------------------------------- zone_cap
export async function capDiZona(zonaId: string): Promise<Riga<'zone_cap'>[]> {
  const { data, error } = await supabase
    .from('zone_cap')
    .select('*')
    .eq('zona_id', zonaId)
    .order('cap')
  if (error) throw error
  return data ?? []
}

export async function creaCap(
  zonaId: string,
  cap: string,
  comune: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('zone_cap')
    .insert({ zona_id: zonaId, cap, comune, owner_id: await ownerId() })
  if (error) throw error
}

export async function eliminaCap(id: string): Promise<void> {
  const { error } = await supabase.from('zone_cap').delete().eq('id', id)
  if (error) throw error
}
