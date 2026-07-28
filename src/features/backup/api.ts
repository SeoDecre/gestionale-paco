import { supabase } from '@/lib/supabase'
import { ownerId } from '@/lib/sessione'

/**
 * Backup e ripristino (dal CRM 3.0, dove erano l'unica rete di sicurezza:
 * il database era un file sul Mac). Qui i dati stanno su Postgres gestito, con
 * i suoi backup, quindi questo serve soprattutto a portarsi via una copia
 * leggibile e a rimettere in piedi un progetto nuovo.
 *
 * NON esporta i file dello Storage (foto, memo, PDF): sono binari e vivono
 * fuori dal database. Il JSON ne conserva i metadati e il path, così restano
 * ricollegabili se il bucket è ancora quello.
 */

/** Tabelle esportate, in ordine di dipendenza: prima i padri, poi i figli. */
export const TABELLE_BACKUP = [
  'profilo_agente',
  'mandati',
  'zone',
  'zone_cap',
  'zone_comune',
  'ruoli_contatto',
  'etichette_sede',
  'azioni_successive',
  'concorrenti_pos',
  'esigenze_pos',
  'stati_verifica',
  'tipi_pos',
  'esiti_lavorazione',
  'parametri_target',
  'parametri_app',
  'offerte',
  'campi_config',
  'lead',
  'lead_brand',
  'lead_nexi',
  'lead_concorrenti',
  'lead_esigenze',
  'campi_valori',
  'contatti',
  'sedi',
  'sedi_pos',
  'lavorazioni',
  'appuntamenti',
  'allegati',
  'liste_salvate',
] as const

export type TabellaBackup = (typeof TABELLE_BACKUP)[number]

export type Backup = {
  versione: 1
  creato: string
  tabelle: Record<string, unknown[]>
}

export async function esportaTutto(): Promise<Backup> {
  const tabelle: Record<string, unknown[]> = {}
  for (const t of TABELLE_BACKUP) {
    const { data, error } = await supabase.from(t).select('*')
    // Una tabella che non esiste ancora (migrazione non applicata) non deve
    // far fallire l'intero backup: si annota vuota e si prosegue.
    if (error) {
      tabelle[t] = []
      continue
    }
    tabelle[t] = data ?? []
  }
  return { versione: 1, creato: new Date().toISOString(), tabelle }
}

export type EsitoRipristino = { tabella: string; righe: number; errore?: string }

/**
 * Rimette i dati di un backup. NON cancella nulla prima: fa upsert per chiave
 * primaria, così un ripristino su un progetto già popolato aggiorna invece di
 * svuotare. Cancellare e reinserire sarebbe irreversibile se il file fosse
 * parziale, ed è esattamente la situazione in cui uno usa un backup.
 *
 * owner_id viene riscritto con l'utente corrente: un backup fatto da un altro
 * account sarebbe altrimenti invisibile alla RLS.
 */
export async function ripristina(backup: Backup): Promise<EsitoRipristino[]> {
  const owner = await ownerId()
  const esiti: EsitoRipristino[] = []

  for (const t of TABELLE_BACKUP) {
    const righe = backup.tabelle?.[t]
    if (!Array.isArray(righe) || righe.length === 0) continue

    const conOwner = righe.map((r) => ({ ...(r as object), owner_id: owner }))
    const { error } = await supabase.from(t).upsert(conOwner as never)
    esiti.push({
      tabella: t,
      righe: righe.length,
      errore: error ? error.message : undefined,
    })
  }
  return esiti
}
