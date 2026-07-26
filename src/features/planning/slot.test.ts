import { describe, it, expect } from 'vitest'
import {
  sovrappongono,
  fuoriFasceEscluse,
  suggerisciSlot,
  zonaComoda,
  minutiInOra,
  type IntervalloMin,
} from './slot'

describe('sovrappongono (half-open)', () => {
  it('back-to-back non si sovrappongono', () => {
    expect(sovrappongono(600, 660, 660, 720)).toBe(false)
  })
  it('intersezione reale', () => {
    expect(sovrappongono(600, 660, 630, 690)).toBe(true)
  })
  it('contenimento', () => {
    expect(sovrappongono(600, 720, 630, 660)).toBe(true)
  })
})

describe('fuoriFasceEscluse (§6)', () => {
  it('slot 11:00–12:00 è fuori dalle fasce escluse', () => {
    expect(fuoriFasceEscluse(660, 720)).toBe(true)
  })
  it('slot 09:00–10:00 tocca la fascia "prima delle 10" -> escluso', () => {
    expect(fuoriFasceEscluse(540, 600)).toBe(false)
  })
  it('slot 13:30–14:30 dentro la pausa pranzo -> escluso', () => {
    expect(fuoriFasceEscluse(810, 870)).toBe(false)
  })
  it('slot 20:00–21:00 dopo le 20 -> escluso', () => {
    expect(fuoriFasceEscluse(1200, 1260)).toBe(false)
  })
})

describe('suggerisciSlot (§6: prima e dopo un appuntamento in zona comoda)', () => {
  it('propone lo slot subito prima e subito dopo', () => {
    // appuntamento comodo 11:00–12:00; durata 60
    const comodi: IntervalloMin[] = [{ inizio: 660, fine: 720 }]
    const slot = suggerisciSlot(60, comodi, comodi)
    expect(slot).toContain(600) // 10:00 subito prima (10–11, fuori fasce escluse)
    expect(slot).toContain(720) // 12:00 subito dopo (12–13, ok)
  })

  it('scarta i candidati dentro una fascia esclusa', () => {
    // appuntamento 10:00–11:00: "prima" = 09:00 (escluso), "dopo" = 11:00 (ok)
    const comodi: IntervalloMin[] = [{ inizio: 600, fine: 660 }]
    const slot = suggerisciSlot(60, comodi, comodi)
    expect(slot).not.toContain(540) // 09:00 nella fascia esclusa
    expect(slot).toContain(660) // 11:00 ok
  })

  it('scarta i candidati che si sovrappongono ad altri appuntamenti', () => {
    // comodo 11:00–12:00; ma 12:00–13:00 già occupato -> "dopo" salta
    const comodo: IntervalloMin = { inizio: 660, fine: 720 }
    const occupati: IntervalloMin[] = [comodo, { inizio: 720, fine: 780 }]
    const slot = suggerisciSlot(60, [comodo], occupati)
    expect(slot).toContain(600) // 10:00 prima, libero
    expect(slot).not.toContain(720) // 12:00 dopo, occupato
  })

  it('nessun appuntamento comodo -> nessun suggerimento', () => {
    expect(suggerisciSlot(60, [], [{ inizio: 660, fine: 720 }])).toEqual([])
  })
})

describe('zonaComoda', () => {
  it('stessa zona = comoda', () => expect(zonaComoda('z1', 'z1')).toBe(true))
  it('zone diverse = non comoda', () => expect(zonaComoda('z1', 'z2')).toBe(false))
  it('zona sconosciuta = non comoda', () => {
    expect(zonaComoda(null, 'z1')).toBe(false)
    expect(zonaComoda('z1', undefined)).toBe(false)
  })
})

describe('minutiInOra', () => {
  it('formatta HH:MM', () => {
    expect(minutiInOra(570)).toBe('09:30')
    expect(minutiInOra(0)).toBe('00:00')
    expect(minutiInOra(1230)).toBe('20:30')
  })
})
