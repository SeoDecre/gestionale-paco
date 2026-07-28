import { describe, it, expect } from 'vitest'
import {
  filtra,
  ordina,
  comuniPresenti,
  filtriAttivi,
  FILTRI_VUOTI,
  type LeadFiltrabile,
  type Filtri,
} from './filtri'

const base = (p: Partial<LeadFiltrabile> & { id: string }): LeadFiltrabile => ({
  ragione_sociale: 'Azienda',
  comune: null,
  piva: null,
  target: null,
  fatturato_mensile: null,
  fonte: 'import_excel',
  verifica_id: null,
  zona_id: null,
  lead_brand: [],
  ...p,
})

const f = (p: Partial<Filtri>): Filtri => ({ ...FILTRI_VUOTI, ...p })

describe('filtriAttivi', () => {
  it('falso sui filtri vuoti', () => {
    expect(filtriAttivi(FILTRI_VUOTI)).toBe(false)
  })
  it('vero appena se ne tocca uno', () => {
    expect(filtriAttivi(f({ target: 'A' }))).toBe(true)
    expect(filtriAttivi(f({ soloSelfGen: true }))).toBe(true)
  })
})

describe('filtra', () => {
  const lead = [
    base({ id: '1', ragione_sociale: 'Bar Centrale', comune: 'Livorno', target: 'A', piva: '12345678901', lead_brand: [{ brand: 'NEXI', stato: 'da_contattare' }] }),
    base({ id: '2', ragione_sociale: 'Pizzeria Napoli', comune: 'Pisa', target: 'C', fonte: 'self_gen', lead_brand: [{ brand: 'HERA_COMM', stato: 'chiuso_vinto' }] }),
    base({ id: '3', ragione_sociale: 'Hotel Mare', comune: 'Livorno', lead_brand: [{ brand: 'NEXI', stato: 'chiuso_vinto' }, { brand: 'HERA_COMM', stato: 'da_contattare' }] }),
  ]

  it('cerca su ragione sociale e comune', () => {
    expect(filtra(lead, f({ cerca: 'bar' })).map((l) => l.id)).toEqual(['1'])
    expect(filtra(lead, f({ cerca: 'livorno' })).map((l) => l.id)).toEqual(['1', '3'])
  })

  it('la P.IVA cerca per sottostringa e ignora gli spazi digitati', () => {
    expect(filtra(lead, f({ piva: '456' })).map((l) => l.id)).toEqual(['1'])
    // Chi legge la P.IVA da una visura la digita a gruppi: gli spazi non
    // devono impedire il match.
    expect(filtra(lead, f({ piva: '123 456' })).map((l) => l.id)).toEqual(['1'])
    expect(filtra(lead, f({ piva: '999' })).map((l) => l.id)).toEqual([])
  })

  it('filtra per brand', () => {
    expect(filtra(lead, f({ brand: 'HERA_COMM' })).map((l) => l.id)).toEqual(['2', '3'])
  })

  it('lo stato combacia se ALMENO UN brand è in quello stato', () => {
    // Il lead 3 è vinto su NEXI e da contattare su Hera: deve uscire in entrambi.
    expect(filtra(lead, f({ stato: 'chiuso_vinto' })).map((l) => l.id)).toEqual(['2', '3'])
    expect(filtra(lead, f({ stato: 'da_contattare' })).map((l) => l.id)).toEqual(['1', '3'])
  })

  it('stato + brand insieme guardano lo stesso brand, non due diversi', () => {
    // Vinto SU HERA: il 3 è vinto su NEXI, non deve uscire.
    expect(filtra(lead, f({ stato: 'chiuso_vinto', brand: 'HERA_COMM' })).map((l) => l.id)).toEqual(['2'])
  })

  it('filtra self gen', () => {
    expect(filtra(lead, f({ soloSelfGen: true })).map((l) => l.id)).toEqual(['2'])
  })

  it('i filtri si sommano', () => {
    expect(filtra(lead, f({ comune: 'Livorno', target: 'A' })).map((l) => l.id)).toEqual(['1'])
  })

  it('nessun filtro = tutto', () => {
    expect(filtra(lead, FILTRI_VUOTI)).toHaveLength(3)
  })
})

describe('ordina', () => {
  const lead = [
    base({ id: '1', ragione_sociale: 'Ci', target: 'C', fatturato_mensile: 900 }),
    base({ id: '2', ragione_sociale: 'Al', target: 'E', fatturato_mensile: 100 }),
    base({ id: '3', ragione_sociale: 'Be', target: 'B', fatturato_mensile: null }),
  ]

  it('per nome, crescente e decrescente', () => {
    expect(ordina(lead, { colonna: 'ragione_sociale', discendente: false }).map((l) => l.id)).toEqual(['2', '3', '1'])
    expect(ordina(lead, { colonna: 'ragione_sociale', discendente: true }).map((l) => l.id)).toEqual(['1', '3', '2'])
  })

  it('il target segue la fascia di fatturato (C < B < A < E), non l’alfabeto', () => {
    expect(ordina(lead, { colonna: 'target', discendente: false }).map((l) => l.target)).toEqual(['C', 'B', 'E'])
  })

  it('per fatturato, i nulli in fondo in ordine crescente', () => {
    expect(ordina(lead, { colonna: 'fatturato_mensile', discendente: false }).map((l) => l.id)).toEqual(['3', '2', '1'])
  })

  it('a parità di chiave ordina per nome, così l’ordine è stabile', () => {
    const pari = [base({ id: 'z', ragione_sociale: 'Zeta' }), base({ id: 'a', ragione_sociale: 'Alfa' })]
    expect(ordina(pari, { colonna: 'target', discendente: false }).map((l) => l.id)).toEqual(['a', 'z'])
  })

  it('non muta l’array di partenza', () => {
    const orig = lead.map((l) => l.id)
    ordina(lead, { colonna: 'ragione_sociale', discendente: true })
    expect(lead.map((l) => l.id)).toEqual(orig)
  })
})

describe('comuniPresenti', () => {
  it('unici e ordinati, senza nulli', () => {
    const lead = [
      base({ id: '1', comune: 'Pisa' }),
      base({ id: '2', comune: 'Livorno' }),
      base({ id: '3', comune: 'Pisa' }),
      base({ id: '4', comune: null }),
    ]
    expect(comuniPresenti(lead)).toEqual(['Livorno', 'Pisa'])
  })
})
