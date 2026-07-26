import * as XLSX from 'xlsx'
import { concorrentiDi, type LeadRicco } from './api'

/**
 * Export Excel (§13) con colonne selezionabili. Ogni colonna ha un getter che
 * appiattisce anche i dati annidati (zona, stati per brand, concorrenti).
 */
export type ColonnaExport = { chiave: string; etichetta: string; valore: (l: LeadRicco) => unknown }

export const COLONNE_EXPORT: ColonnaExport[] = [
  { chiave: 'ragione_sociale', etichetta: 'Ragione sociale', valore: (l) => l.ragione_sociale },
  { chiave: 'piva', etichetta: 'P.IVA', valore: (l) => l.piva ?? '' },
  { chiave: 'target', etichetta: 'Target', valore: (l) => l.target ?? '' },
  { chiave: 'fatturato_mensile', etichetta: 'Fatturato mensile', valore: (l) => l.fatturato_mensile ?? '' },
  { chiave: 'email', etichetta: 'Email', valore: (l) => l.email ?? '' },
  { chiave: 'sito_web', etichetta: 'Sito web', valore: (l) => l.sito_web ?? '' },
  { chiave: 'indirizzo', etichetta: 'Indirizzo', valore: (l) => [l.indirizzo, l.civico].filter(Boolean).join(' ') },
  { chiave: 'cap', etichetta: 'CAP', valore: (l) => l.cap ?? '' },
  { chiave: 'comune', etichetta: 'Comune', valore: (l) => l.comune ?? '' },
  { chiave: 'provincia', etichetta: 'Provincia', valore: (l) => l.provincia ?? '' },
  { chiave: 'zona', etichetta: 'Zona', valore: (l) => l.zone?.nome ?? '' },
  { chiave: 'fonte', etichetta: 'Fonte', valore: (l) => l.fonte },
  { chiave: 'stati', etichetta: 'Stati per brand', valore: (l) => l.lead_brand.map((b) => `${b.brand}:${b.stato}`).join(', ') },
  { chiave: 'concorrenti', etichetta: 'Concorrenti', valore: (l) => concorrentiDi(l).join(', ') },
]

/** Costruisce e scarica un .xlsx con le sole colonne scelte. */
export function esportaXlsx(leads: LeadRicco[], chiaviColonne: string[], nomeFile = 'export-lead.xlsx') {
  const colonne = COLONNE_EXPORT.filter((c) => chiaviColonne.includes(c.chiave))
  const righe = leads.map((l) => {
    const r: Record<string, unknown> = {}
    for (const c of colonne) r[c.etichetta] = c.valore(l)
    return r
  })
  const ws = XLSX.utils.json_to_sheet(righe)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Lead')
  XLSX.writeFile(wb, nomeFile)
}
