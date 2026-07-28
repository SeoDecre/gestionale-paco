/**
 * §4 "Verifica dati online" — costruzione dei link di ricerca esterna a partire
 * dall'anagrafica del lead. Pura: nessun accesso a rete o DOM, così è testabile
 * e i bottoni restano dei semplici <a>.
 *
 * Ogni funzione restituisce null quando non c'è abbastanza per cercare: la UI
 * usa quel null per non mostrare affatto il bottone, invece di aprire una
 * ricerca vuota.
 */

export type DatiRicerca = {
  ragione_sociale?: string | null
  comune?: string | null
  provincia?: string | null
}

const google = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`

/**
 * "Bar Centrale Napoli" — il comune disambigua le insegne ripetute, che in
 * questo mestiere sono la norma. La provincia no: allunga la query senza
 * aggiungere segnale, i motori la ignorano.
 */
export function queryAttivita(l: DatiRicerca): string | null {
  const nome = l.ragione_sociale?.trim()
  if (!nome) return null
  return [nome, l.comune?.trim()].filter(Boolean).join(' ')
}

export function urlGoogleAttivita(l: DatiRicerca): string | null {
  const q = queryAttivita(l)
  return q ? google(q) : null
}

/**
 * Ricerca Facebook "Tutti": è la pagina che risponde anche senza sessione, ed è
 * lì che stanno orari e telefono delle attività piccole.
 */
export function urlFacebookAttivita(l: DatiRicerca): string | null {
  const q = queryAttivita(l)
  return q ? `https://www.facebook.com/search/top?q=${encodeURIComponent(q)}` : null
}

/**
 * Ricerca della P.IVA. Virgolettata perché è un numero lungo: senza le
 * virgolette il motore lo spezza e restituisce rumore.
 */
export function urlGooglePiva(piva: string | null | undefined): string | null {
  const p = piva?.trim()
  return p ? google(`"${p}" partita iva`) : null
}
