import { describe, it, expect } from 'vitest'
import { analizzaIndirizzo, haQualcosa } from './indirizzo'

describe('analizzaIndirizzo', () => {
  it('la forma con trattini della visura', () => {
    expect(analizzaIndirizzo('VIA ROMA 31 - 57016 - ROSIGNANO (LI)')).toEqual({
      indirizzo: 'VIA ROMA',
      civico: '31',
      cap: '57016',
      comune: 'ROSIGNANO',
      provincia: 'LI',
    })
  })

  it('la forma con virgole', () => {
    expect(analizzaIndirizzo('Via Roma 31, 57016 Rosignano (LI)')).toEqual({
      indirizzo: 'Via Roma',
      civico: '31',
      cap: '57016',
      comune: 'Rosignano',
      provincia: 'LI',
    })
  })

  it('sigla provincia in coda senza parentesi', () => {
    expect(analizzaIndirizzo('Via Roma 31, 57016 Rosignano LI')).toMatchObject({
      comune: 'Rosignano',
      provincia: 'LI',
    })
  })

  it('civico con lettera o barra', () => {
    expect(analizzaIndirizzo('Via Verdi 12/A, 57100 Livorno')).toMatchObject({
      indirizzo: 'Via Verdi',
      civico: '12/A',
    })
    expect(analizzaIndirizzo('Via Verdi 12 bis, 57100 Livorno')).toMatchObject({
      civico: '12bis',
    })
  })

  it('non stacca un numero che fa parte del nome della via', () => {
    // "4 Novembre" non è un civico: il civico sta in fondo.
    expect(analizzaIndirizzo('Via 4 Novembre, 57100 Livorno')).toMatchObject({
      indirizzo: 'Via 4 Novembre',
      civico: null,
    })
  })

  it('solo la via, senza altro', () => {
    expect(analizzaIndirizzo('Via Roma 31')).toEqual({
      indirizzo: 'Via Roma',
      civico: '31',
      cap: null,
      comune: null,
      provincia: null,
    })
  })

  it('stringa vuota = tutto null, niente invenzioni', () => {
    const a = analizzaIndirizzo('')
    expect(a).toEqual({
      indirizzo: null,
      civico: null,
      cap: null,
      comune: null,
      provincia: null,
    })
    expect(haQualcosa(a)).toBe(false)
  })

  it('riconosce il CAP anche senza provincia', () => {
    expect(analizzaIndirizzo('Corso Italia 5 - 56125 - Pisa')).toMatchObject({
      cap: '56125',
      comune: 'Pisa',
      civico: '5',
    })
  })

  it('un numero di 5 cifre attaccato al civico non diventa CAP', () => {
    // "Via Roma 31" non ha CAP: 31 è il civico e basta.
    expect(analizzaIndirizzo('Via Roma 31').cap).toBeNull()
  })

  it('haQualcosa è vero appena un campo è valorizzato', () => {
    expect(haQualcosa(analizzaIndirizzo('Via Roma'))).toBe(true)
  })
})
