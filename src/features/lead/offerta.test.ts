import { describe, it, expect } from 'vitest'
import { offertaAdattaAlTarget, dividiPerTarget, ORDINE_TARGET } from './offerta'

describe('ORDINE_TARGET', () => {
  it('è per fatturato crescente, non alfabetico', () => {
    expect(ORDINE_TARGET).toEqual(['C', 'B', 'A', 'E'])
  })
})

describe('offertaAdattaAlTarget', () => {
  it('offerta senza limiti vale per tutti, anche senza target', () => {
    const o = { target_min: null, target_max: null }
    expect(offertaAdattaAlTarget(o, 'C')).toBe(true)
    expect(offertaAdattaAlTarget(o, 'E')).toBe(true)
    expect(offertaAdattaAlTarget(o, null)).toBe(true)
  })

  it('rispetta l’intervallo, estremi inclusi', () => {
    const o = { target_min: 'B', target_max: 'A' } as const
    expect(offertaAdattaAlTarget(o, 'C')).toBe(false) // sotto il minimo
    expect(offertaAdattaAlTarget(o, 'B')).toBe(true)
    expect(offertaAdattaAlTarget(o, 'A')).toBe(true)
    expect(offertaAdattaAlTarget(o, 'E')).toBe(false) // sopra il massimo
  })

  it('solo minimo: aperta verso l’alto', () => {
    const o = { target_min: 'A', target_max: null } as const
    expect(offertaAdattaAlTarget(o, 'B')).toBe(false)
    expect(offertaAdattaAlTarget(o, 'A')).toBe(true)
    expect(offertaAdattaAlTarget(o, 'E')).toBe(true)
  })

  it('solo massimo: aperta verso il basso', () => {
    const o = { target_min: null, target_max: 'B' } as const
    expect(offertaAdattaAlTarget(o, 'C')).toBe(true)
    expect(offertaAdattaAlTarget(o, 'B')).toBe(true)
    expect(offertaAdattaAlTarget(o, 'A')).toBe(false)
  })

  it('lead senza target non matcha un’offerta con range', () => {
    expect(offertaAdattaAlTarget({ target_min: 'C', target_max: 'E' }, null)).toBe(false)
  })
})

describe('dividiPerTarget', () => {
  it('separa mantenendo l’ordine di partenza', () => {
    const offerte = [
      { nome: 'alta', target_min: 'A' as const, target_max: null },
      { nome: 'tutte', target_min: null, target_max: null },
      { nome: 'bassa', target_min: null, target_max: 'C' as const },
    ]
    const { consigliate, altre } = dividiPerTarget(offerte, 'A')
    expect(consigliate.map((o) => o.nome)).toEqual(['alta', 'tutte'])
    expect(altre.map((o) => o.nome)).toEqual(['bassa'])
  })

  it('nessuna offerta: due liste vuote', () => {
    expect(dividiPerTarget([], 'B')).toEqual({ consigliate: [], altre: [] })
  })
})
