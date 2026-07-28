/**
 * Condivisione verso l'esterno — portata dal CRM 3.0, dove ogni appuntamento e
 * ogni report si spedivano da qui: file .ics per il calendario di iPhone, link
 * a Google Calendar, mailto, WhatsApp, Telegram.
 *
 * Tutto puro e testabile: queste funzioni COSTRUISCONO stringhe e non toccano
 * mai `window`. L'apertura del link e il download restano nei componenti.
 */

import { indirizzoCompleto, type Indirizzo } from './maps'

export type DatiAgente = {
  nome?: string | null
  cognome?: string | null
  cell?: string | null
  tel?: string | null
  email?: string | null
}

export type DatiMandato = {
  firma?: string | null
  codice_agente?: string | null
  ragione_sociale?: string | null
}

export type Appuntamento = {
  id?: string
  inizio: string | Date
  durata_min?: number | null
  note?: string | null
}

export type DatiCliente = {
  ragione_sociale: string
  brand?: string | null
} & Indirizzo

/** "Mario Rossi", o "Agente" se il profilo non è ancora compilato. */
export function nomeAgente(a: DatiAgente | null | undefined): string {
  const n = [a?.nome, a?.cognome].filter(Boolean).join(' ').trim()
  return n || 'Agente'
}

/**
 * Blocco firma: riga di cortesia, nome, codice mandato, recapiti.
 * Salta le righe vuote invece di stampare separatori orfani.
 */
export function firma(
  agente: DatiAgente | null | undefined,
  mandato?: DatiMandato | null,
): string {
  const righe = [
    mandato?.firma || 'Cordiali saluti,',
    nomeAgente(agente),
    mandato?.codice_agente
      ? `Cod. ${mandato.codice_agente}${mandato.ragione_sociale ? ` — ${mandato.ragione_sociale}` : ''}`
      : null,
    agente?.cell || agente?.tel || null,
    agente?.email || null,
  ]
  return righe.filter(Boolean).join('\n')
}

// ------------------------------------------------------------------ date/ICS
const due = (n: number) => String(n).padStart(2, '0')

/**
 * Timestamp ICS in UTC: 20260729T143000Z. Si usa lo Zulu invece dell'ora
 * locale perché evita di dover dichiarare una VTIMEZONE completa, che è la
 * parte del formato che i calendari interpretano in modo più incoerente.
 */
export function timestampICS(d: Date): string {
  return (
    `${d.getUTCFullYear()}${due(d.getUTCMonth() + 1)}${due(d.getUTCDate())}` +
    `T${due(d.getUTCHours())}${due(d.getUTCMinutes())}${due(d.getUTCSeconds())}Z`
  )
}

/** Nel formato ICS virgole, punti e virgola e a-capo vanno protetti. */
function escICS(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

const asDate = (v: string | Date) => (typeof v === 'string' ? new Date(v) : v)
const fine = (a: Appuntamento) =>
  new Date(asDate(a.inizio).getTime() + (a.durata_min ?? 60) * 60000)

/** Titolo dell'evento: "NEXI — Bar Centrale". */
export function titoloEvento(cliente: DatiCliente): string {
  return [cliente.brand, cliente.ragione_sociale].filter(Boolean).join(' — ')
}

/**
 * Contenuto di un file .ics con un solo evento. Le righe vanno separate da
 * CRLF: è quello che chiede la RFC 5545 e alcuni client rifiutano il resto.
 */
export function costruisciICS(app: Appuntamento, cliente: DatiCliente): string {
  const inizio = asDate(app.inizio)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AgentPro CRM//IT',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${app.id ?? timestampICS(inizio)}@agentpro`,
    `DTSTAMP:${timestampICS(new Date(inizio.getTime()))}`,
    `DTSTART:${timestampICS(inizio)}`,
    `DTEND:${timestampICS(fine(app))}`,
    `SUMMARY:${escICS(titoloEvento(cliente))}`,
    `LOCATION:${escICS(indirizzoCompleto(cliente))}`,
    `DESCRIPTION:${escICS(app.note ?? '')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

/** Link "aggiungi a Google Calendar" per lo stesso appuntamento. */
export function urlGoogleCalendar(app: Appuntamento, cliente: DatiCliente): string {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: titoloEvento(cliente),
    dates: `${timestampICS(asDate(app.inizio))}/${timestampICS(fine(app))}`,
    location: indirizzoCompleto(cliente),
    details: app.note ?? '',
  })
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}

// ------------------------------------------------------------------ messaggi
/** Link di navigazione, entrambi i provider: chi legge sceglie il suo. */
export function righeNavigazione(cliente: Indirizzo): string[] {
  const q = encodeURIComponent(indirizzoCompleto(cliente))
  if (!q) return []
  return [
    `Apple Maps: https://maps.apple.com/?q=${q}&dirflg=d`,
    `Google Maps: https://www.google.com/maps/dir/?api=1&destination=${q}`,
  ]
}

/** Testo del promemoria di un appuntamento, per mail o messaggio. */
export function testoAppuntamento(
  app: Appuntamento,
  cliente: DatiCliente,
  agente?: DatiAgente | null,
  mandato?: DatiMandato | null,
): string {
  const inizio = asDate(app.inizio)
  const data = inizio.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' })
  const ora = inizio.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome',
  })
  const righe = [
    'APPUNTAMENTO — AgentPro CRM',
    '',
    `Cliente: ${cliente.ragione_sociale}`,
    cliente.brand ? `Brand: ${cliente.brand}` : null,
    indirizzoCompleto(cliente) ? `Indirizzo: ${indirizzoCompleto(cliente)}` : null,
    `Data: ${data} alle ${ora}`,
    `Durata: ${app.durata_min ?? 60} min`,
    app.note ? `Note: ${app.note}` : null,
    '',
    ...righeNavigazione(cliente),
    '',
    firma(agente, mandato),
  ]
  return righe.filter((r) => r !== null).join('\n')
}

/** Una riga di lead nel report condiviso. */
export function rigaLeadReport(l: DatiCliente & { target?: string | null; stato?: string | null; telefono?: string | null }): string {
  return [
    `• ${l.ragione_sociale}`,
    [l.brand, l.target ? `T:${l.target}` : null, l.stato].filter(Boolean).join(' · '),
    indirizzoCompleto(l) || null,
    l.telefono ? `Tel: ${l.telefono}` : null,
    ...righeNavigazione(l),
  ]
    .filter(Boolean)
    .join('\n  ')
}

/** mailto: completo. Il body va codificato, non solo gli spazi. */
export function urlMailto(oggetto: string, corpo: string, a = ''): string {
  return `mailto:${a}?subject=${encodeURIComponent(oggetto)}&body=${encodeURIComponent(corpo)}`
}

export function urlWhatsApp(testo: string): string {
  return `https://wa.me/?text=${encodeURIComponent(testo)}`
}

export function urlTelegram(testo: string): string {
  return `https://t.me/share/url?url=&text=${encodeURIComponent(testo)}`
}
