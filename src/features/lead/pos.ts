/**
 * Contatore "POS dichiarati (a voce) / censiti (nelle sedi)" — §4/§5.
 *
 * Mette a confronto due dei tre concetti POS, che restano distinti ovunque:
 *  - DICHIARATI: lavorazioni.pos_richiesti, cioè quanti POS il cliente ha detto
 *    di avere durante una chiamata. È una parola, non un dato verificato.
 *  - CENSITI: le righe sedi_pos, cioè i terminali davvero rilevati sul posto.
 * (Il terzo, lead_concorrenti, è di marca ed è a livello azienda: non entra qui.)
 *
 * Puro e testato: la UI si limita a mostrarne il risultato.
 */

/** Solo i campi che servono: così il modulo non dipende dai tipi generati. */
type LavorazionePos = { pos_richiesti: number | null; data_ora: string }
type SedePos = { sedi_pos: unknown[] }

/**
 * L'ULTIMA cifra dichiarata, non la somma. Se Paco sente "ho 3 POS" in due
 * telefonate diverse il parco terminali resta di 3, non diventa 6: ogni
 * dichiarazione fotografa la stessa realtà, quindi la più recente supera le
 * precedenti. Le lavorazioni senza dichiarazione non contano.
 *
 * Non si fida dell'ordinamento della query: ordina per data_ora da sé.
 */
export function posDichiarati(lavorazioni: LavorazionePos[]): number | null {
  const conDichiarazione = lavorazioni.filter((l) => l.pos_richiesti != null)
  if (conDichiarazione.length === 0) return null
  const piuRecente = conDichiarazione.reduce((a, b) =>
    new Date(b.data_ora).getTime() > new Date(a.data_ora).getTime() ? b : a,
  )
  return piuRecente.pos_richiesti
}

/** Quanti terminali sono stati censiti in totale, su tutte le sedi del lead. */
export function posCensiti(sedi: SedePos[]): number {
  return sedi.reduce((n, s) => n + s.sedi_pos.length, 0)
}

/**
 * Stato del confronto, per scegliere la tinta senza ripetere la logica nella UI.
 * 'ignoto' = nessuna dichiarazione a voce: non c'è nulla da confrontare, e un
 * censimento a zero non è un problema finché nessuno ha promesso niente.
 */
export type StatoCensimento = 'ignoto' | 'incompleto' | 'completo' | 'oltre'

export function statoCensimento(
  dichiarati: number | null,
  censiti: number,
): StatoCensimento {
  if (dichiarati == null) return 'ignoto'
  if (censiti < dichiarati) return 'incompleto'
  if (censiti > dichiarati) return 'oltre'
  return 'completo'
}
