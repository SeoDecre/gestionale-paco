import { describe, it, expect } from 'vitest'
import {
  queryAttivita,
  urlGoogleAttivita,
  urlFacebookAttivita,
  urlGooglePiva,
} from './ricerche'

describe('queryAttivita', () => {
  it('unisce nome e comune', () => {
    expect(queryAttivita({ ragione_sociale: 'Bar Centrale', comune: 'Napoli' })).toBe(
      'Bar Centrale Napoli',
    )
  })

  it('funziona anche senza comune', () => {
    expect(queryAttivita({ ragione_sociale: 'Bar Centrale' })).toBe('Bar Centrale')
  })

  it('ignora la provincia', () => {
    expect(
      queryAttivita({ ragione_sociale: 'Bar Centrale', comune: 'Napoli', provincia: 'NA' }),
    ).toBe('Bar Centrale Napoli')
  })

  it('null senza ragione sociale utile', () => {
    expect(queryAttivita({ ragione_sociale: '   ', comune: 'Napoli' })).toBeNull()
    expect(queryAttivita({})).toBeNull()
  })
})

describe('url di ricerca', () => {
  it('codifica spazi e caratteri speciali', () => {
    const u = urlGoogleAttivita({ ragione_sociale: 'Caffè & Co.', comune: 'Roma' })
    expect(u).toBe('https://www.google.com/search?q=Caff%C3%A8%20%26%20Co.%20Roma')
  })

  it('facebook usa la ricerca "top"', () => {
    expect(urlFacebookAttivita({ ragione_sociale: 'Bar Centrale' })).toBe(
      'https://www.facebook.com/search/top?q=Bar%20Centrale',
    )
  })

  it('la p.iva viene virgolettata', () => {
    expect(urlGooglePiva('12345678901')).toBe(
      'https://www.google.com/search?q=%2212345678901%22%20partita%20iva',
    )
  })

  it('null quando non c’è nulla da cercare', () => {
    expect(urlGoogleAttivita({})).toBeNull()
    expect(urlFacebookAttivita({ ragione_sociale: '' })).toBeNull()
    expect(urlGooglePiva(null)).toBeNull()
    expect(urlGooglePiva('  ')).toBeNull()
  })
})
