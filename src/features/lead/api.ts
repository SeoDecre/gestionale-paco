import { supabase } from '@/lib/supabase'
import { ownerId } from '@/lib/sessione'
import type { Aggiornamento, Enum, Inserimento, Riga } from '@/types/db'

/**
 * Data layer del lead. Ogni funzione lancia in caso di errore (come
 * features/auth/api.ts); la traduzione in italiano la fa lib/errors.ts a monte.
 *
 * owner_id non si passa mai dal client: lo impone il trigger tg_set_owner dal
 * JWT. I tipi "Nuovo*" lo omettono insieme a id/created_at/updated_at, e viene
 * riagganciato qui internamente per soddisfare il tipo Insert generato.
 */

type SenzaMeta<T> = Omit<T, 'owner_id' | 'id' | 'created_at' | 'updated_at'>

// ---------------------------------------------------------------- view-model
export type LeadConBrand = Riga<'lead'> & {
  lead_brand: Pick<Riga<'lead_brand'>, 'brand' | 'stato'>[]
  zone: { nome: string } | null
}
export type ContattoConRuolo = Riga<'contatti'> & {
  ruoli_contatto: { nome: string } | null
}
export type PosConTipo = Riga<'sedi_pos'> & {
  tipi_pos: { nome: string; richiede_iban: boolean } | null
}
export type SedeConPos = Riga<'sedi'> & {
  etichette_sede: { nome: string } | null
  sedi_pos: PosConTipo[]
}
export type LeadConcorrente = Riga<'lead_concorrenti'> & {
  concorrenti_pos: { nome: string } | null
}

// ---------------------------------------------------------------------- lead
export type NuovoLead = SenzaMeta<Inserimento<'lead'>>
export type PatchLead = Aggiornamento<'lead'>
export type PatchContatto = Aggiornamento<'contatti'>
export type PatchSede = Aggiornamento<'sedi'>
export type PatchPos = Aggiornamento<'sedi_pos'>

export async function listaLead(cerca?: string): Promise<LeadConBrand[]> {
  let q = supabase
    .from('lead')
    .select('*, lead_brand(brand, stato), zone(nome)')
    .order('ragione_sociale')
  if (cerca && cerca.trim()) q = q.ilike('ragione_sociale', `%${cerca.trim()}%`)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as LeadConBrand[]
}

export async function getLead(id: string): Promise<LeadConBrand> {
  const { data, error } = await supabase
    .from('lead')
    .select('*, lead_brand(brand, stato), zone(nome)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as LeadConBrand
}

export async function creaLead(input: NuovoLead): Promise<Riga<'lead'>> {
  const { data, error } = await supabase
    .from('lead')
    .insert({ ...input, owner_id: await ownerId() })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function aggiornaLead(id: string, patch: PatchLead): Promise<Riga<'lead'>> {
  const { data, error } = await supabase
    .from('lead')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function eliminaLead(id: string): Promise<void> {
  const { error } = await supabase.from('lead').delete().eq('id', id)
  if (error) throw error
}

// --------------------------------------------------------------- lead_brand
export async function aggiungiBrand(leadId: string, brand: Enum<'brand'>): Promise<void> {
  const { error } = await supabase
    .from('lead_brand')
    .insert({ lead_id: leadId, brand, owner_id: await ownerId() })
  if (error) throw error
}

export async function rimuoviBrand(leadId: string, brand: Enum<'brand'>): Promise<void> {
  const { error } = await supabase
    .from('lead_brand')
    .delete()
    .eq('lead_id', leadId)
    .eq('brand', brand)
  if (error) throw error
}

// ------------------------------------------------------------------ contatti
export type NuovoContatto = SenzaMeta<Inserimento<'contatti'>>

export async function listaContatti(leadId: string): Promise<ContattoConRuolo[]> {
  const { data, error } = await supabase
    .from('contatti')
    .select('*, ruoli_contatto(nome)')
    .eq('lead_id', leadId)
    .order('principale', { ascending: false })
    .order('nome')
  if (error) throw error
  return (data ?? []) as ContattoConRuolo[]
}

export async function creaContatto(input: NuovoContatto): Promise<void> {
  const { error } = await supabase
    .from('contatti')
    .insert({ ...input, owner_id: await ownerId() })
  if (error) throw error
}

export async function aggiornaContatto(
  id: string,
  patch: Aggiornamento<'contatti'>,
): Promise<void> {
  const { error } = await supabase.from('contatti').update(patch).eq('id', id)
  if (error) throw error
}

export async function eliminaContatto(id: string): Promise<void> {
  const { error } = await supabase.from('contatti').delete().eq('id', id)
  if (error) throw error
}

/**
 * Rende un contatto l'unico Principale del lead. Azzera prima gli altri, poi
 * imposta questo: il vincolo contatti_un_solo_principale non tollera due veri
 * contemporaneamente. Due passi, ma con utente singolo la finestra è nulla.
 */
export async function impostaPrincipale(leadId: string, contattoId: string): Promise<void> {
  const az = await supabase
    .from('contatti')
    .update({ principale: false })
    .eq('lead_id', leadId)
    .neq('id', contattoId)
  if (az.error) throw az.error
  const set = await supabase
    .from('contatti')
    .update({ principale: true })
    .eq('id', contattoId)
  if (set.error) throw set.error
}

// ---------------------------------------------------------------------- sedi
export type NuovaSede = SenzaMeta<Omit<Inserimento<'sedi'>, 'slot'>>

export async function listaSedi(leadId: string): Promise<SedeConPos[]> {
  const { data, error } = await supabase
    .from('sedi')
    .select('*, etichette_sede(nome), sedi_pos(*, tipi_pos(nome, richiede_iban))')
    .eq('lead_id', leadId)
    .order('slot')
  if (error) throw error
  return (data ?? []) as SedeConPos[]
}

export async function creaSede(input: NuovaSede): Promise<void> {
  // slot: null -> lo assegna il trigger tg_sede_assegna_slot. Il tipo Insert
  // generato lo vuole obbligatorio (colonna NOT NULL senza default): cast.
  const payload = { ...input, owner_id: await ownerId(), slot: null }
  const { error } = await supabase
    .from('sedi')
    .insert(payload as unknown as Inserimento<'sedi'>)
  if (error) throw error
}

export async function aggiornaSede(id: string, patch: Aggiornamento<'sedi'>): Promise<void> {
  const { error } = await supabase.from('sedi').update(patch).eq('id', id)
  if (error) throw error
}

export async function eliminaSede(id: string): Promise<void> {
  const { error } = await supabase.from('sedi').delete().eq('id', id)
  if (error) throw error
}

// ------------------------------------------------------------------ sedi_pos
export type NuovoPos = SenzaMeta<Inserimento<'sedi_pos'>>

export async function creaPos(input: NuovoPos): Promise<void> {
  const { error } = await supabase
    .from('sedi_pos')
    .insert({ ...input, owner_id: await ownerId() })
  if (error) throw error
}

export async function aggiornaPos(id: string, patch: Aggiornamento<'sedi_pos'>): Promise<void> {
  const { error } = await supabase.from('sedi_pos').update(patch).eq('id', id)
  if (error) throw error
}

export async function eliminaPos(id: string): Promise<void> {
  const { error } = await supabase.from('sedi_pos').delete().eq('id', id)
  if (error) throw error
}

// ------------------------------------------------------------ lead_concorrenti
export async function listaLeadConcorrenti(leadId: string): Promise<LeadConcorrente[]> {
  const { data, error } = await supabase
    .from('lead_concorrenti')
    .select('*, concorrenti_pos(nome)')
    .eq('lead_id', leadId)
  if (error) throw error
  return (data ?? []) as LeadConcorrente[]
}

export async function aggiungiConcorrente(leadId: string, concorrenteId: string): Promise<void> {
  const { error } = await supabase
    .from('lead_concorrenti')
    .insert({ lead_id: leadId, concorrente_id: concorrenteId, owner_id: await ownerId() })
  if (error) throw error
}

export async function rimuoviConcorrente(leadId: string, concorrenteId: string): Promise<void> {
  const { error } = await supabase
    .from('lead_concorrenti')
    .delete()
    .eq('lead_id', leadId)
    .eq('concorrente_id', concorrenteId)
  if (error) throw error
}

// ------------------------------------------------------------------ allegati
export async function listaAllegati(leadId: string): Promise<Riga<'allegati'>[]> {
  const { data, error } = await supabase
    .from('allegati')
    .select('*')
    .eq('lead_id', leadId)
    .is('file_eliminato_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export type NuovoAllegato = SenzaMeta<Inserimento<'allegati'>>

export async function creaAllegato(input: NuovoAllegato): Promise<void> {
  const { error } = await supabase
    .from('allegati')
    .insert({ ...input, owner_id: await ownerId() })
  if (error) throw error
}

export async function eliminaAllegato(id: string): Promise<void> {
  const { error } = await supabase.from('allegati').delete().eq('id', id)
  if (error) throw error
}
