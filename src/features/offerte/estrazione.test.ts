import { describe, it, expect } from 'vitest'
import { numeroItaliano, estraiParametriOfferta, ordinaPerTransato } from './estrazione'

describe('numeroItaliano', () => {
  it('punto = migliaia, virgola = decimali', () => {
    expect(numeroItaliano('1.234,56')).toBe(1234.56)
    expect(numeroItaliano('1.200')).toBe(1200)
    expect(numeroItaliano('0,90')).toBe(0.9)
  })
  it('null su testo non numerico', () => {
    expect(numeroItaliano('abc')).toBeNull()
    expect(numeroItaliano('')).toBeNull()
  })
})

describe('estraiParametriOfferta', () => {
  it('canone prima o dopo l’importo', () => {
    expect(estraiParametriOfferta('Canone mensile € 19,90').canone).toBe(19.9)
    expect(estraiParametriOfferta('€ 19,90 di canone').canone).toBe(19.9)
  })

  it('commissione: richiede i decimali, così non cattura l’IVA', () => {
    expect(estraiParametriOfferta('commissione 0,90%').commissione).toBe(0.9)
    expect(estraiParametriOfferta('IVA 22% esclusa').commissione).toBeNull()
  })

  it('fascia "da X a Y"', () => {
    const p = estraiParametriOfferta('valido da € 10.000 a € 50.000 di transato')
    expect(p.transato_min).toBe(10000)
    expect(p.transato_max).toBe(50000)
  })

  it('"fino a" imposta solo il massimo', () => {
    const p = estraiParametriOfferta('fino a 50.000 € di transato annuo')
    expect(p.transato_min).toBeNull()
    expect(p.transato_max).toBe(50000)
  })

  it('testo vuoto = tutto null, nessuna invenzione', () => {
    expect(estraiParametriOfferta('')).toEqual({
      canone: null,
      commissione: null,
      transato_min: null,
      transato_max: null,
    })
  })

  it('estrae piu parametri dallo stesso testo', () => {
    const p = estraiParametriOfferta(
      'Offerta GOLD ZERO — canone € 9,90 al mese, commissione 1,20% da € 12.000 a € 36.000',
    )
    expect(p).toEqual({
      canone: 9.9,
      commissione: 1.2,
      transato_min: 12000,
      transato_max: 36000,
    })
  })
})

describe('ordinaPerTransato', () => {
  const offerte = [
    { id: 'bassa', nome: 'Gold', transato_min: 0, transato_max: 12000 },
    { id: 'media', nome: 'Power', transato_min: 12000, transato_max: 90000 },
    { id: 'alta', nome: 'Elite', transato_min: 90000, transato_max: null },
    { id: 'libera', nome: 'Sempre', transato_min: null, transato_max: null },
  ]

  it('mette in cima quella nella fascia', () => {
    expect(ordinaPerTransato(offerte, 50000)[0].offerta.id).toBe('media')
    expect(ordinaPerTransato(offerte, 200000)[0].offerta.id).toBe('alta')
    expect(ordinaPerTransato(offerte, 5000)[0].offerta.id).toBe('bassa')
  })

  it('spiega perché', () => {
    expect(ordinaPerTransato(offerte, 50000)[0].motivo).toBe('Nella fascia di transato')
  })

  it('le fuori fascia restano in lista, ordinate per vicinanza', () => {
    const r = ordinaPerTransato(offerte, 50000)
    expect(r).toHaveLength(4)
    const fuori = r.filter((x) => x.motivo.includes('fascia') && x.punteggio < 100)
    expect(fuori.length).toBeGreaterThan(0)
  })

  it('senza transato del lead nessuna è sbagliata e l’ordine resta stabile', () => {
    const r = ordinaPerTransato(offerte, null)
    expect(r.map((x) => x.offerta.id)).toEqual(['bassa', 'media', 'alta', 'libera'])
    expect(r.every((x) => x.punteggio === 0)).toBe(true)
  })

  it('transato zero è trattato come non indicato', () => {
    expect(ordinaPerTransato(offerte, 0).every((x) => x.punteggio === 0)).toBe(true)
  })

  it('non muta l’array di partenza', () => {
    const copia = offerte.map((o) => o.id)
    ordinaPerTransato(offerte, 50000)
    expect(offerte.map((o) => o.id)).toEqual(copia)
  })
})
