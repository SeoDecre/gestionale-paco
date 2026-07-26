import { describe, it, expect } from 'vitest'
import {
  sovrappongono,
  slotLiberi,
  zonaComoda,
  minutiInOra,
  FASCE_DEFAULT,
  type IntervalloMin,
} from './slot'

describe('sovrappongono (half-open)', () => {
  it('back-to-back non si sovrappongono', () => {
    // 10–11 e 11–12
    expect(sovrappongono(600, 660, 660, 720)).toBe(false)
  })
  it('intersezione reale', () => {
    expect(sovrappongono(600, 660, 630, 690)).toBe(true)
  })
  it('contenimento', () => {
    expect(sovrappongono(600, 720, 630, 660)).toBe(true)
  })
})

describe('slotLiberi', () => {
  it('resta dentro le fasce preferite', () => {
    const slot = slotLiberi(60, [], FASCE_DEFAULT, 30)
    // Nessuno slot inizia fuori da: [0,600) [780,870) [1200,1440)
    for (const s of slot) {
      const dentro =
        (s >= 0 && s + 60 <= 600) ||
        (s >= 780 && s + 60 <= 870) ||
        (s >= 1200 && s + 60 <= 1440)
      expect(dentro).toBe(true)
    }
    // Fascia 13:00–14:30 (90 min), slot 60 passo 30: 13:00 e 13:30 stanno,
    // 14:00 no (finirebbe alle 15:00).
    expect(slot).toContain(780) // 13:00
    expect(slot).toContain(810) // 13:30 -> 14:30, entra
    expect(slot).not.toContain(840) // 14:00 -> 15:00, esce
  })

  it('esclude gli slot che intersecano gli occupati', () => {
    const occupati: IntervalloMin[] = [{ inizio: 540, fine: 600 }] // 09:00–10:00
    const slot = slotLiberi(60, occupati, [{ daMin: 480, aMin: 660 }], 30)
    // 08:00 ok (08–09), 08:30 interseca (08:30–09:30 vs 09:00–10:00) -> escluso,
    // 09:00 interseca, 09:30 interseca, 10:00 ok (10–11)
    expect(slot).toContain(480)
    expect(slot).toContain(600)
    expect(slot).not.toContain(510)
    expect(slot).not.toContain(540)
  })

  it('nessuno slot se la durata non entra nella fascia', () => {
    const slot = slotLiberi(120, [], [{ daMin: 780, aMin: 870 }], 15) // fascia 90 min
    expect(slot).toEqual([])
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
