import { describe, it, expect } from 'vitest'
import { suggerisciTarget, type BandaTarget } from './target'

// Le soglie ufficiali di partenza (migrazione 16), in forma annua.
const BANDE: BandaTarget[] = [
  { target: 'E', soglia_min_annua: 140000, soglia_max_annua: null },
  { target: 'A', soglia_min_annua: 60000, soglia_max_annua: 140000 },
  { target: 'B', soglia_min_annua: 40000, soglia_max_annua: 60000 },
  { target: 'C', soglia_min_annua: null, soglia_max_annua: 40000 },
]

describe('suggerisciTarget', () => {
  it('mappa il fatturato mensile sulla banda annua (× 12)', () => {
    expect(suggerisciTarget(1000, BANDE)).toBe('C') // 12k/anno
    expect(suggerisciTarget(4000, BANDE)).toBe('B') // 48k/anno
    expect(suggerisciTarget(6000, BANDE)).toBe('A') // 72k/anno
    expect(suggerisciTarget(20000, BANDE)).toBe('E') // 240k/anno
  })

  it('usa il confine come [min, max): il limite superiore appartiene alla banda sopra', () => {
    // 40000/anno -> mensile 3333.33: < 40000 => C
    expect(suggerisciTarget(40000 / 12 - 0.01, BANDE)).toBe('C')
    // esattamente 40000/anno -> B (min inclusivo di B)
    expect(suggerisciTarget(40000 / 12, BANDE)).toBe('B')
    // esattamente 140000/anno -> E (min inclusivo di E), non A
    expect(suggerisciTarget(140000 / 12, BANDE)).toBe('E')
  })

  it('restituisce null senza fatturato', () => {
    expect(suggerisciTarget(null, BANDE)).toBeNull()
    expect(suggerisciTarget(undefined, BANDE)).toBeNull()
  })

  it('restituisce null per valori negativi', () => {
    expect(suggerisciTarget(-5, BANDE)).toBeNull()
  })

  it('zero cade nella banda più bassa', () => {
    expect(suggerisciTarget(0, BANDE)).toBe('C')
  })
})
