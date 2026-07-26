import { describe, it, expect } from 'vitest'
import { rigaALead, normalizzaPiva, normalizzaCap } from './excel'

// Riga con le intestazioni reali del file "lista crm_esiti".
const RIGA = {
  nm_ragione_sociale: 'CAFFE LANGOLO DI GASPERINI MANUEL',
  co_piva: '01493550501',
  target: 'E',
  te_indirizzo_best: 'VIA ROTTA 2',
  co_post_code: '56025',
  te_comune: 'PONTEDERA',
  te_provincia: 'PI',
  te_url_best: null,
  notes: null,
  telefono_cleaned: '3391234567',
}

describe('normalizzaPiva', () => {
  it('accetta 11 cifre', () => expect(normalizzaPiva('01493550501')).toBe('01493550501'))
  it('ripristina lo zero perso da Excel (10 cifre)', () =>
    expect(normalizzaPiva('1493550501')).toBe('01493550501'))
  it('scarta lunghezze impossibili', () => {
    expect(normalizzaPiva('123')).toBeNull()
    expect(normalizzaPiva(null)).toBeNull()
  })
})

describe('normalizzaCap', () => {
  it('accetta 5 cifre', () => expect(normalizzaCap('56025')).toBe('56025'))
  it('scarta il resto', () => expect(normalizzaCap('56')).toBeNull())
})

describe('rigaALead', () => {
  it('mappa le colonne reali', () => {
    const l = rigaALead(RIGA)
    expect(l).not.toBeNull()
    expect(l!.ragione_sociale).toBe('CAFFE LANGOLO DI GASPERINI MANUEL')
    expect(l!.piva).toBe('01493550501')
    expect(l!.target).toBe('E')
    expect(l!.cap).toBe('56025')
    expect(l!.comune).toBe('PONTEDERA')
    expect(l!.provincia).toBe('PI')
    expect(l!.telefono).toBe('3391234567')
  })

  it('scarta una riga senza ragione sociale', () => {
    expect(rigaALead({ ...RIGA, nm_ragione_sociale: '' })).toBeNull()
  })

  it('normalizza target sconosciuto a null', () => {
    expect(rigaALead({ ...RIGA, target: 'Z' })!.target).toBeNull()
  })
})
