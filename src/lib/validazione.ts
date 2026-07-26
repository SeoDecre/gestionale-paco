/**
 * Validatori puri, speculari ai CHECK del DB (migrazioni 04/05). Servono per
 * dare feedback nella UI prima di toccare il server; l'autorità resta il DB.
 * Tutti trattano stringa vuota/undefined come "non compilato" = valido, perché
 * i campi sono opzionali: la validazione scatta solo su un valore presente.
 */

const vuoto = (v: string | null | undefined): v is null | undefined | '' =>
  v == null || v.trim() === ''

/** P.IVA italiana: 11 cifre (constraint lead_piva_check). */
export function pivaValida(v: string | null | undefined): boolean {
  return vuoto(v) || /^[0-9]{11}$/.test(v.trim())
}

/** CAP italiano: 5 cifre. */
export function capValido(v: string | null | undefined): boolean {
  return vuoto(v) || /^[0-9]{5}$/.test(v.trim())
}

/** Sigla provincia: 2 lettere. */
export function provinciaValida(v: string | null | undefined): boolean {
  return vuoto(v) || /^[A-Za-z]{2}$/.test(v.trim())
}

/** IBAN: 2 lettere paese + 2 cifre + 11–30 alfanumerici (constraint sedi_pos). */
export function ibanValido(v: string | null | undefined): boolean {
  return vuoto(v) || /^[A-Z]{2}[0-9]{2}[A-Za-z0-9]{11,30}$/.test(v.trim())
}

/** Email: controllo minimo, non esaustivo (l'autorità resta l'invio reale). */
export function emailValida(v: string | null | undefined): boolean {
  return vuoto(v) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}
