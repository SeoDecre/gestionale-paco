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

/**
 * Lunedì della settimana che contiene `d`. In Italia la settimana lavorativa
 * comincia di lunedì: getDay() torna 0 per domenica, quindi (giorno+6)%7 porta
 * lunedì a 0 e domenica a 6.
 */
export function lunediDellaSettimana(d: Date = new Date()): string {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return giornoISO(x)
}

/** I sette giorni della settimana che inizia a `lunedi`. */
export function settimana(lunedi: string): string[] {
  return Array.from({ length: 7 }, (_, i) => spostaGiorno(lunedi, i))
}

/** Estremi [da, a) di una settimana, per una sola query invece di sette. */
export function estremiSettimana(lunedi: string): { daISO: string; aISO: string } {
  const da = new Date(`${lunedi}T00:00:00`)
  const a = new Date(da)
  a.setDate(a.getDate() + 7)
  return { daISO: da.toISOString(), aISO: a.toISOString() }
}
