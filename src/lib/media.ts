import { supabase } from './supabase'
import { ownerId } from './sessione'

/**
 * Accesso al bucket privato 'allegati' (migrazione 09). I file NON sono
 * pubblici: si caricano sotto {owner_id}/{lead_id}/... (le policy su
 * storage.objects vincolano l'utente alla propria cartella) e si leggono con
 * URL firmati a scadenza breve.
 */
const BUCKET = 'allegati'

export type FileCaricato = { storage_path: string; nome_file: string }

/** Carica un blob e restituisce il path da salvare in allegati.storage_path. */
export async function caricaAllegato(
  leadId: string,
  blob: Blob,
  estensione: string,
  nomeVisibile?: string,
): Promise<FileCaricato> {
  const owner = await ownerId()
  const nomeFile = `${crypto.randomUUID()}.${estensione}`
  const path = `${owner}/${leadId}/${nomeFile}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || undefined,
    upsert: false,
  })
  if (error) throw error
  return { storage_path: path, nome_file: nomeVisibile ?? nomeFile }
}

/** URL firmato per aprire/scaricare un allegato. Scadenza breve (default 1h). */
export async function urlFirmato(path: string, scadenzaSec = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, scadenzaSec)
  if (error) throw error
  return data.signedUrl
}

/** Rimuove il file fisico. La riga in allegati resta (tombstone, §5). */
export async function rimuoviFileAllegato(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw error
}
