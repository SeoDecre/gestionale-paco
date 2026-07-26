import { supabase } from '@/lib/supabase'
import type { Riga } from '@/types/db'

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
