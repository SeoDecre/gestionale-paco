const LOCALE = 'it-IT'
/** Tutte le fasce orarie della specifica (§6) sono ora locale italiana. */
export const FUSO = 'Europe/Rome'

const fmtData = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: FUSO,
})

const fmtOra = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: FUSO,
})

const fmtDataOra = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: FUSO,
})

const fmtEuro = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const asDate = (v: string | Date) => (typeof v === 'string' ? new Date(v) : v)

export const formattaData = (v: string | Date) => fmtData.format(asDate(v))
export const formattaOra = (v: string | Date) => fmtOra.format(asDate(v))
export const formattaDataOra = (v: string | Date) => fmtDataOra.format(asDate(v))
export const formattaEuro = (v: number | null | undefined) =>
  v == null ? '—' : fmtEuro.format(v)

/** "Chiamato Mario Rossi il 20/07/2026 alle 14:30" — nota automatica §4. */
export function testoChiamataAutomatica(nome: string, quando: Date = new Date()) {
  return `Chiamato ${nome} il ${formattaData(quando)} alle ${formattaOra(quando)}`
}

/** Durata di un memo vocale: "1:07". */
export function formattaDurata(secondi: number) {
  const m = Math.floor(secondi / 60)
  const s = Math.floor(secondi % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
