/**
 * Confini di giornata per le query sugli appuntamenti. L'utente è in Italia:
 * si usa il fuso della macchina (Europe/Rome), coerente con lib/format.
 */

/** 'yyyy-mm-dd' di una data (default: oggi), ora locale. */
export function giornoISO(d: Date = new Date()): string {
  const anno = d.getFullYear()
  const mese = String(d.getMonth() + 1).padStart(2, '0')
  const giorno = String(d.getDate()).padStart(2, '0')
  return `${anno}-${mese}-${giorno}`
}

/** Estremi [da, a) di un giorno in ISO UTC, per filtrare timestamptz. */
export function estremiGiorno(giorno: string): { daISO: string; aISO: string } {
  const da = new Date(`${giorno}T00:00:00`)
  const a = new Date(da)
  a.setDate(a.getDate() + 1)
  return { daISO: da.toISOString(), aISO: a.toISOString() }
}

/** Sposta un 'yyyy-mm-dd' di N giorni. */
export function spostaGiorno(giorno: string, delta: number): string {
  const d = new Date(`${giorno}T00:00:00`)
  d.setDate(d.getDate() + delta)
  return giornoISO(d)
}

/** Estremi del mese corrente in ISO UTC (per "Chiusi (mese)" §3). */
export function estremiMeseCorrente(ora: Date = new Date()): { daISO: string; aISO: string } {
  const da = new Date(ora.getFullYear(), ora.getMonth(), 1)
  const a = new Date(ora.getFullYear(), ora.getMonth() + 1, 1)
  return { daISO: da.toISOString(), aISO: a.toISOString() }
}
