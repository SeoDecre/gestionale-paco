import { describe, it, expect } from 'vitest'
import { posDichiarati, posCensiti, statoCensimento } from './pos'

const lav = (pos_richiesti: number | null, data_ora: string) => ({ pos_richiesti, data_ora })
const sede = (n: number) => ({ sedi_pos: Array.from({ length: n }, (_, i) => i) })

describe('posDichiarati', () => {
  it('null se nessuna lavorazione ha dichiarato nulla', () => {
    expect(posDichiarati([])).toBeNull()
    expect(posDichiarati([lav(null, '2026-07-01T10:00:00Z')])).toBeNull()
  })

  it('prende l’ultima dichiarazione, non la somma', () => {
    const l = [lav(3, '2026-07-01T10:00:00Z'), lav(3, '2026-07-20T10:00:00Z')]
    expect(posDichiarati(l)).toBe(3)
  })

  it('la dichiarazione più recente supera la precedente', () => {
    const l = [lav(2, '2026-07-01T10:00:00Z'), lav(5, '2026-07-20T10:00:00Z')]
    expect(posDichiarati(l)).toBe(5)
  })

  it('non dipende dall’ordine in cui arrivano le righe', () => {
    const l = [lav(5, '2026-07-20T10:00:00Z'), lav(2, '2026-07-01T10:00:00Z')]
    expect(posDichiarati(l)).toBe(5)
  })

  it('salta le lavorazioni senza dichiarazione anche se più recenti', () => {
    const l = [lav(4, '2026-07-01T10:00:00Z'), lav(null, '2026-07-25T10:00:00Z')]
    expect(posDichiarati(l)).toBe(4)
  })

  it('zero dichiarati è una dichiarazione valida, non un’assenza', () => {
    expect(posDichiarati([lav(0, '2026-07-01T10:00:00Z')])).toBe(0)
  })
})

describe('posCensiti', () => {
  it('somma i POS di tutte le sedi', () => {
    expect(posCensiti([sede(2), sede(1), sede(0)])).toBe(3)
  })

  it('zero senza sedi', () => {
    expect(posCensiti([])).toBe(0)
  })
})

describe('statoCensimento', () => {
  it('ignoto senza dichiarazione', () => {
    expect(statoCensimento(null, 0)).toBe('ignoto')
    expect(statoCensimento(null, 4)).toBe('ignoto')
  })

  it('incompleto, completo, oltre', () => {
    expect(statoCensimento(3, 1)).toBe('incompleto')
    expect(statoCensimento(3, 3)).toBe('completo')
    expect(statoCensimento(3, 5)).toBe('oltre')
  })

  it('0 dichiarati e 0 censiti è completo', () => {
    expect(statoCensimento(0, 0)).toBe('completo')
  })
})
