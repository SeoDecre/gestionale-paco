import { supabase } from '@/lib/supabase'
import { ownerId } from '@/lib/sessione'
import type { Enum } from '@/types/db'
import { creaContatto } from '@/features/lead/api'
import { creaAppuntamento } from '@/features/planning/api'
import type { DatiLeadImport } from './excel'
import type { DatiMail } from './mail'

/**
 * Data layer dell'import (§8). Regola d'oro: un import può creare o aggiornare
 * l'ANAGRAFICA del lead e creare Contatti; non tocca MAI lavorazioni,
 * appuntamenti o contatti già esistenti di un lead duplicato.
 */

export type LeadEsistente = { id: string; piva: string; ragione_sociale: string }

/** Lead già presenti con una delle P.IVA date (dedupe esatto §8). */
export async function esistentiPerPiva(pive: string[]): Promise<LeadEsistente[]> {
  const uniche = [...new Set(pive.filter(Boolean))]
  if (uniche.length === 0) return []
  const { data, error } = await supabase
    .from('lead')
    .select('id, piva, ragione_sociale')
    .in('piva', uniche)
  if (error) throw error
  return (data ?? []) as LeadEsistente[]
}

/** Match fuzzy nome+CAP per le righe senza P.IVA (RPC pg_trgm, §8). */
export async function simili(
  nome: string,
  cap: string | null,
): Promise<{ id: string; ragione_sociale: string; similarita: number }[]> {
  const { data, error } = await supabase.rpc('lead_simili', {
    p_nome: nome,
    p_cap: cap ?? undefined,
  })
  if (error) throw error
  return (data ?? []) as { id: string; ragione_sociale: string; similarita: number }[]
}

const campiLead = (d: DatiLeadImport) => ({
  ragione_sociale: d.ragione_sociale,
  piva: d.piva,
  target: d.target,
  indirizzo: d.indirizzo,
  cap: d.cap,
  comune: d.comune,
  provincia: d.provincia,
  sito_web: d.sito_web,
  note: d.note,
})

/** Crea un nuovo lead da import + eventuale Contatto dal telefono (§1). */
export async function creaLeadImport(
  d: DatiLeadImport,
  fonte: Enum<'fonte_lead'> = 'import_excel',
): Promise<string> {
  const { data, error } = await supabase
    .from('lead')
    .insert({ ...campiLead(d), fonte, owner_id: await ownerId() })
    .select('id')
    .single()
  if (error) throw error
  if (d.telefono) {
    await creaContatto({
      lead_id: data.id,
      nome: 'Riferimento',
      telefono: d.telefono,
      provenienza: 'import_excel',
    })
  }
  return data.id
}

/**
 * Applica una modalità di merge a un lead duplicato (§8). Tocca solo
 * l'anagrafica, mai contatti/lavorazioni.
 *   sovrascrivi → tutti i campi mappati
 *   lascia      → niente
 *   integra     → solo i campi valorizzati nel file
 */
export async function applicaMerge(
  leadId: string,
  d: DatiLeadImport,
  modo: Enum<'merge_mode'>,
): Promise<void> {
  if (modo === 'lascia') return
  const tutti = campiLead(d)
  const patch =
    modo === 'sovrascrivi'
      ? tutti
      : Object.fromEntries(Object.entries(tutti).filter(([, v]) => v != null))
  const { error } = await supabase.from('lead').update(patch).eq('id', leadId)
  if (error) throw error
}

/**
 * Import da mail call center (§8): crea il lead (fonte call_center_nexi), il
 * Contatto Principale dal referente e — se c'è una data — l'appuntamento.
 */
export async function creaLeadDaMail(d: DatiMail, appuntamentoISO?: string): Promise<string> {
  const { data, error } = await supabase
    .from('lead')
    .insert({
      ragione_sociale: d.ragione_sociale ?? 'Da mail call center',
      piva: d.piva,
      indirizzo: d.indirizzo,
      cap: d.cap,
      comune: d.comune,
      provincia: d.provincia,
      note: d.note,
      fonte: 'call_center_nexi',
      owner_id: await ownerId(),
    })
    .select('id')
    .single()
  if (error) throw error

  if (d.referente || d.telefono) {
    await creaContatto({
      lead_id: data.id,
      nome: d.referente ?? 'Riferimento',
      telefono: d.telefono,
      principale: true,
      provenienza: 'mail_call_center',
    })
  }
  if (appuntamentoISO) {
    await creaAppuntamento({ lead_id: data.id, brand: 'NEXI', inizio: appuntamentoISO, durata_min: 60 })
  }
  return data.id
}
