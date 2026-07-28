import { describe, it, expect } from 'vitest'
import { testoReport, type LeadTesto } from './testoReport'

const LEAD: LeadTesto[] = [
  {
    ragione_sociale: 'Bar Centrale',
    indirizzo: 'Via Roma',
    civico: '12',
    cap: '57100',
    comune: 'Livorno',
    provincia: 'LI',
    telefono: '0586 123',
    target: 'A',
    brand: ['NEXI'],
    stato: 'In lavorazione',
  },
  { ragione_sociale: 'Pizzeria Napoli' },
]

const INTEST = { totale: 2, vinti: 1, tasso: 50, data: new Date('2026-07-29T10:00:00Z') }

describe('testoReport', () => {
  it('WhatsApp mette il nome in grassetto, mail no', () => {
    const wa = testoReport(LEAD, INTEST, 'whatsapp', null, null, false)
    const mail = testoReport(LEAD, INTEST, 'mail', null, null, false)
    expect(wa).toContain('*Bar Centrale*')
    expect(mail).toContain('Bar Centrale')
    expect(mail).not.toContain('*Bar Centrale*')
  })

  it('riporta intestazione con totale, vinti e tasso', () => {
    const t = testoReport(LEAD, INTEST, 'mail', null, null, false)
    expect(t).toContain('Data: 29/07/2026')
    expect(t).toContain('Lead: 2 · Vinti: 1 · Tasso: 50%')
  })

  it('include indirizzo, telefono, brand e target', () => {
    const t = testoReport(LEAD, INTEST, 'mail', null, null, false)
    expect(t).toContain('NEXI · T:A · In lavorazione')
    expect(t).toContain('Via Roma 12, 57100 Livorno, LI')
    expect(t).toContain('Tel: 0586 123')
  })

  it('un lead senza dati non produce righe vuote', () => {
    const t = testoReport([LEAD[1]], { totale: 1 }, 'mail', null, null, false)
    expect(t).not.toMatch(/\n\n\n/)
    expect(t).toContain('Pizzeria Napoli')
  })

  it('i link di navigazione si possono escludere', () => {
    expect(testoReport(LEAD, INTEST, 'mail', null, null, true)).toContain('maps.apple.com')
    expect(testoReport(LEAD, INTEST, 'mail', null, null, false)).not.toContain('maps.apple.com')
  })

  it('chiude con la firma del mandato', () => {
    const t = testoReport(LEAD, INTEST, 'mail', { nome: 'Paco' }, { firma: 'A presto,' }, false)
    expect(t.endsWith('A presto,\nPaco')).toBe(true)
  })

  it('senza agente ripiega su "Agente"', () => {
    expect(testoReport(LEAD, INTEST, 'mail', null, null, false)).toContain('Agente: Agente')
  })
})
