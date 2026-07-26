import { describe, it, expect } from 'vitest'
import {
  efficaciaPerFonte,
  conversionePerZona,
  statiPerBrand,
  concorrentiPerZona,
  type LeadReport,
} from './aggregazioni'

const LEADS: LeadReport[] = [
  { fonte: 'import_excel', zona: 'Nord', brand: [{ brand: 'NEXI', stato: 'chiuso_vinto' }], concorrenti: ['SumUp'] },
  { fonte: 'import_excel', zona: 'Nord', brand: [{ brand: 'NEXI', stato: 'chiuso_perso' }], concorrenti: ['SumUp', 'Satispay'] },
  { fonte: 'self_gen', zona: 'Sud', brand: [{ brand: 'HERA_COMM', stato: 'in_lavorazione' }], concorrenti: [] },
  { fonte: 'self_gen', zona: null, brand: [
      { brand: 'NEXI', stato: 'chiuso_vinto' },
      { brand: 'HERA_COMM', stato: 'da_contattare' },
    ], concorrenti: ['SumUp'] },
]

describe('efficaciaPerFonte', () => {
  const r = efficaciaPerFonte(LEADS)
  it('conta totali e vinti per fonte', () => {
    const excel = r.find((x) => x.chiave === 'import_excel')!
    expect(excel.totale).toBe(2)
    expect(excel.vinti).toBe(1)
    expect(excel.tasso).toBeCloseTo(0.5)
    const self = r.find((x) => x.chiave === 'self_gen')!
    expect(self.totale).toBe(2)
    expect(self.vinti).toBe(1) // il lead con un brand vinto conta come vinto
  })
})

describe('conversionePerZona', () => {
  it('raggruppa per zona, con etichetta per i senza zona', () => {
    const r = conversionePerZona(LEADS)
    expect(r.find((x) => x.chiave === 'Nord')!.totale).toBe(2)
    expect(r.find((x) => x.chiave === 'Senza zona')!.totale).toBe(1)
  })
})

describe('statiPerBrand', () => {
  it('conta gli stati per ciascun brand', () => {
    const m = statiPerBrand(LEADS)
    expect(m.get('NEXI')).toEqual({ da_contattare: 0, in_lavorazione: 0, chiuso_vinto: 2, chiuso_perso: 1 })
    expect(m.get('HERA_COMM')!.in_lavorazione).toBe(1)
    expect(m.get('HERA_COMM')!.da_contattare).toBe(1)
  })
})

describe('concorrentiPerZona', () => {
  it('conta i concorrenti per zona', () => {
    const m = concorrentiPerZona(LEADS)
    expect(m.get('Nord')!.get('SumUp')).toBe(2)
    expect(m.get('Nord')!.get('Satispay')).toBe(1)
  })
})
