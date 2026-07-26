import { describe, it, expect } from 'vitest'
import {
  pivaValida,
  capValido,
  provinciaValida,
  ibanValido,
  emailValida,
} from './validazione'

describe('pivaValida', () => {
  it('accetta 11 cifre', () => expect(pivaValida('12345678901')).toBe(true))
  it('rifiuta lunghezze diverse', () => {
    expect(pivaValida('123')).toBe(false)
    expect(pivaValida('123456789012')).toBe(false)
  })
  it('rifiuta caratteri non numerici', () => expect(pivaValida('1234567890a')).toBe(false))
  it('tratta vuoto/undefined come valido (campo opzionale)', () => {
    expect(pivaValida('')).toBe(true)
    expect(pivaValida(null)).toBe(true)
    expect(pivaValida(undefined)).toBe(true)
  })
  it('ignora spazi ai bordi', () => expect(pivaValida('  12345678901  ')).toBe(true))
})

describe('capValido', () => {
  it('accetta 5 cifre', () => expect(capValido('80100')).toBe(true))
  it('rifiuta lettere e lunghezze errate', () => {
    expect(capValido('8010')).toBe(false)
    expect(capValido('8010a')).toBe(false)
  })
})

describe('provinciaValida', () => {
  it('accetta 2 lettere', () => {
    expect(provinciaValida('NA')).toBe(true)
    expect(provinciaValida('na')).toBe(true)
  })
  it('rifiuta cifre o lunghezze errate', () => {
    expect(provinciaValida('N1')).toBe(false)
    expect(provinciaValida('NAP')).toBe(false)
  })
})

describe('ibanValido', () => {
  it('accetta un IBAN IT plausibile', () =>
    expect(ibanValido('IT60X0542811101000000123456')).toBe(true))
  it('rifiuta formati palesemente errati', () => {
    expect(ibanValido('60X0542811101000000123456')).toBe(false)
    expect(ibanValido('IT60')).toBe(false)
  })
})

describe('emailValida', () => {
  it('accetta un indirizzo semplice', () => expect(emailValida('paco@example.com')).toBe(true))
  it('rifiuta senza @ o dominio', () => {
    expect(emailValida('paco')).toBe(false)
    expect(emailValida('paco@x')).toBe(false)
  })
})
