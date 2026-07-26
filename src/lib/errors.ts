import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Codici Postgres che l'app traduce in messaggi comprensibili.
 * Il DB è l'autorità: i vincoli stanno lì, qui si traduce soltanto.
 */
const MESSAGGI_PER_CODICE: Record<string, string> = {
  // EXCLUDE USING gist su appuntamenti — §6 anti-accavallamento.
  // Il piano prevede che questo diventi il "409" dell'app.
  '23P01': 'Slot già occupato: esiste un altro appuntamento in questa fascia oraria.',
  '23505': 'Valore duplicato: esiste già un record con questi dati.',
  '23503': 'Operazione non possibile: il record è collegato ad altri dati.',
  '23514': 'Valore non valido per questo campo.',
  '42501': 'Non hai i permessi per questa operazione.',
}

/** Vincoli con un messaggio più specifico del codice generico. */
const MESSAGGI_PER_VINCOLO: Record<string, string> = {
  contatti_un_solo_principale: 'Esiste già un contatto Principale per questo lead.',
  sedi_lead_id_slot_key: 'Massimo 4 sedi per lead (§4).',
  lead_piva_check: 'La P.IVA deve essere di 11 cifre.',
  zone_cap_uk: 'Questo CAP è già assegnato a un\'altra zona.',
}

export function isPostgrestError(e: unknown): e is PostgrestError {
  return typeof e === 'object' && e !== null && 'code' in e && 'message' in e
}

/** Messaggio in italiano da mostrare all'utente per un errore qualsiasi. */
export function messaggioErrore(e: unknown): string {
  if (isPostgrestError(e)) {
    for (const [vincolo, messaggio] of Object.entries(MESSAGGI_PER_VINCOLO)) {
      // PostgREST mette il nome del vincolo in message o details.
      if (e.message?.includes(vincolo) || e.details?.includes(vincolo)) {
        return messaggio
      }
    }
    if (e.code && MESSAGGI_PER_CODICE[e.code]) return MESSAGGI_PER_CODICE[e.code]
    return e.message || 'Errore imprevisto.'
  }
  if (e instanceof Error) return e.message
  return 'Errore imprevisto.'
}

/** true se l'errore è un conflitto di slot: la UI lo evidenzia in rosso (§2). */
export function isConflittoSlot(e: unknown): boolean {
  return isPostgrestError(e) && e.code === '23P01'
}
