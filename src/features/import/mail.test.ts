import { describe, it, expect } from 'vitest'
import { estraiDaMail } from './mail'

// Campione sintetico (nessuna mail reale disponibile): serve a fissare il
// comportamento del parser. Da estendere quando arriva un esempio vero.
const MAIL = `
Buongiorno,
nuovo contatto dal call center.

Ragione sociale: Bar Centrale di Rossi Mario
P.IVA: 01493550501
Indirizzo: Via Roma 12
CAP: 80100
Comune: Napoli
Provincia: NA
Referente: Mario Rossi
Telefono: 339 123 4567
POS attuale: SumUp
Appuntamento: 05/08/2026 10:30
Note: cliente interessato al rateale
`

describe('estraiDaMail', () => {
  const d = estraiDaMail(MAIL)

  it('estrae la ragione sociale', () => expect(d.ragione_sociale).toBe('Bar Centrale di Rossi Mario'))
  it('estrae la P.IVA', () => expect(d.piva).toBe('01493550501'))
  it('estrae indirizzo/cap/comune/provincia', () => {
    expect(d.indirizzo).toBe('Via Roma 12')
    expect(d.cap).toBe('80100')
    expect(d.comune).toBe('Napoli')
    expect(d.provincia).toBe('NA')
  })
  it('estrae referente e telefono (solo cifre)', () => {
    expect(d.referente).toBe('Mario Rossi')
    expect(d.telefono).toBe('3391234567')
  })
  it('estrae POS attuale, appuntamento e note', () => {
    expect(d.pos_attuale).toBe('SumUp')
    expect(d.appuntamento).toContain('05/08/2026')
    expect(d.note).toContain('rateale')
  })

  it('trova la P.IVA anche senza etichetta (11 cifre nel testo)', () => {
    expect(estraiDaMail('Azienda X\n01493550501\n').piva).toBe('01493550501')
  })

  it('campi assenti -> null', () => {
    const vuoto = estraiDaMail('testo senza nulla di utile')
    expect(vuoto.ragione_sociale).toBeNull()
    expect(vuoto.piva).toBeNull()
  })
})
