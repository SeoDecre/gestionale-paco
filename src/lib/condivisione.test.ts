import { describe, it, expect } from 'vitest'
import {
  nomeAgente,
  firma,
  timestampICS,
  titoloEvento,
  costruisciICS,
  urlGoogleCalendar,
  righeNavigazione,
  testoAppuntamento,
  urlMailto,
  urlWhatsApp,
  urlTelegram,
} from './condivisione'

const CLIENTE = {
  ragione_sociale: 'Bar Centrale',
  brand: 'NEXI',
  indirizzo: 'Via Roma',
  civico: '12',
  cap: '57100',
  comune: 'Livorno',
  provincia: 'LI',
}

const APP = { id: 'abc', inizio: '2026-07-29T12:30:00.000Z', durata_min: 60, note: 'Portare POS' }

describe('nomeAgente / firma', () => {
  it('ripiega su "Agente" se il profilo è vuoto', () => {
    expect(nomeAgente(null)).toBe('Agente')
    expect(nomeAgente({ nome: '', cognome: '' })).toBe('Agente')
  })

  it('unisce nome e cognome', () => {
    expect(nomeAgente({ nome: 'Pasquale', cognome: 'De Crescenzo' })).toBe('Pasquale De Crescenzo')
  })

  it('la firma salta le righe vuote invece di lasciare separatori orfani', () => {
    const f = firma({ nome: 'Paco' }, { firma: 'A presto,' })
    expect(f).toBe('A presto,\nPaco')
  })

  it('include codice mandato e recapiti quando ci sono', () => {
    const f = firma(
      { nome: 'Paco', cell: '333', email: 'p@x.it' },
      { firma: 'Cordiali saluti,', codice_agente: 'AG1562', ragione_sociale: 'Hera Comm' },
    )
    expect(f).toBe('Cordiali saluti,\nPaco\nCod. AG1562 — Hera Comm\n333\np@x.it')
  })
})

describe('ICS', () => {
  it('timestamp in UTC Zulu', () => {
    expect(timestampICS(new Date('2026-07-29T14:30:00.000Z'))).toBe('20260729T143000Z')
  })

  it('titolo evento = brand — cliente', () => {
    expect(titoloEvento(CLIENTE)).toBe('NEXI — Bar Centrale')
  })

  it('righe separate da CRLF, come chiede la RFC 5545', () => {
    const ics = costruisciICS(APP, CLIENTE)
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR')
    expect(ics).toContain('\r\n')
    expect(ics.includes('\n\n')).toBe(false)
  })

  it('DTEND = inizio + durata', () => {
    const ics = costruisciICS(APP, CLIENTE)
    expect(ics).toContain('DTSTART:20260729T123000Z')
    expect(ics).toContain('DTEND:20260729T133000Z')
  })

  it('durata mancante = 60 minuti', () => {
    const ics = costruisciICS({ inizio: '2026-07-29T12:30:00.000Z' }, CLIENTE)
    expect(ics).toContain('DTEND:20260729T133000Z')
  })

  it('protegge le virgole nell’indirizzo', () => {
    const ics = costruisciICS(APP, CLIENTE)
    expect(ics).toContain('LOCATION:Via Roma 12\\, 57100 Livorno\\, LI')
  })
})

describe('Google Calendar', () => {
  it('costruisce dates come inizio/fine', () => {
    const u = urlGoogleCalendar(APP, CLIENTE)
    expect(u).toContain('dates=20260729T123000Z%2F20260729T133000Z')
    expect(u).toContain('text=NEXI+%E2%80%94+Bar+Centrale')
  })
})

describe('navigazione e messaggi', () => {
  it('due righe di navigazione, una per provider', () => {
    const r = righeNavigazione(CLIENTE)
    expect(r).toHaveLength(2)
    expect(r[0]).toContain('maps.apple.com')
    expect(r[1]).toContain('google.com/maps/dir')
  })

  it('nessuna riga se non c’è indirizzo', () => {
    expect(righeNavigazione({})).toEqual([])
  })

  it('il testo appuntamento riporta cliente, data e firma', () => {
    const t = testoAppuntamento(APP, CLIENTE, { nome: 'Paco' }, { firma: 'Cordiali saluti,' })
    expect(t).toContain('Cliente: Bar Centrale')
    expect(t).toContain('Brand: NEXI')
    expect(t).toContain('Note: Portare POS')
    expect(t).toContain('Cordiali saluti,\nPaco')
  })

  it('mailto/WA/TG codificano il testo', () => {
    expect(urlMailto('Ciao a tutti', 'riga1\nriga2')).toBe(
      'mailto:?subject=Ciao%20a%20tutti&body=riga1%0Ariga2',
    )
    expect(urlWhatsApp('a b')).toBe('https://wa.me/?text=a%20b')
    expect(urlTelegram('a b')).toBe('https://t.me/share/url?url=&text=a%20b')
  })
})
