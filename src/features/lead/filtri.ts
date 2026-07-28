import type { Enum } from '@/types/db'

/**
 * Filtri e ordinamento della lista lead — la parte pura, testata a parte dalla
 * UI. Nel CRM 3.0 questa logica viveva dentro il componente e non era
 * verificabile in nessun modo.
 */

export type LeadFiltrabile = {
  id: string
  ragione_sociale: string
  comune: string | null
  piva: string | null
  target: Enum<'target_lettera'> | null
  fatturato_mensile: number | null
  fonte: Enum<'fonte_lead'>
  verifica_id: string | null
  zona_id: string | null
  lead_brand: { brand: Enum<'brand'>; stato: Enum<'stato_lead'> }[]
}

export type Filtri = {
  cerca: string
  piva: string
  brand: Enum<'brand'> | ''
  stato: Enum<'stato_lead'> | ''
  target: Enum<'target_lettera'> | ''
  comune: string
  zonaId: string
  verificaId: string
  soloSelfGen: boolean
}

export const FILTRI_VUOTI: Filtri = {
  cerca: '',
  piva: '',
  brand: '',
  stato: '',
  target: '',
  comune: '',
  zonaId: '',
  verificaId: '',
  soloSelfGen: false,
}

export function filtriAttivi(f: Filtri): boolean {
  return JSON.stringify(f) !== JSON.stringify(FILTRI_VUOTI)
}

/**
 * Uno stato combacia se ALMENO UN brand del lead è in quello stato: lo stato
 * è tenuto per (lead, brand), quindi un lead chiuso su NEXI e aperto su Hera
 * deve comparire in entrambi i filtri.
 */
function statoCombacia(l: LeadFiltrabile, stato: Enum<'stato_lead'>, brand: Enum<'brand'> | '') {
  return l.lead_brand.some((b) => b.stato === stato && (!brand || b.brand === brand))
}

export function filtra<T extends LeadFiltrabile>(lead: T[], f: Filtri): T[] {
  const q = f.cerca.trim().toLowerCase()
  const piva = f.piva.replace(/\s/g, '')

  return lead.filter((l) => {
    if (piva && !(l.piva ?? '').includes(piva)) return false
    if (f.brand && !l.lead_brand.some((b) => b.brand === f.brand)) return false
    if (f.stato && !statoCombacia(l, f.stato, f.brand)) return false
    if (f.target && l.target !== f.target) return false
    if (f.comune && (l.comune ?? '') !== f.comune) return false
    if (f.zonaId && l.zona_id !== f.zonaId) return false
    if (f.verificaId && l.verifica_id !== f.verificaId) return false
    if (f.soloSelfGen && l.fonte !== 'self_gen') return false
    if (q) {
      const inNome = l.ragione_sociale.toLowerCase().includes(q)
      const inComune = (l.comune ?? '').toLowerCase().includes(q)
      if (!inNome && !inComune) return false
    }
    return true
  })
}

// ------------------------------------------------------------- ordinamento
export type ColonnaOrdine = 'ragione_sociale' | 'comune' | 'target' | 'fatturato_mensile' | 'piva'
export type Ordine = { colonna: ColonnaOrdine; discendente: boolean }

/** Le lettere di target sono fasce di fatturato, non alfabetiche (mig. 03). */
const RANGO_TARGET: Record<string, number> = { C: 0, B: 1, A: 2, E: 3 }

function chiave(l: LeadFiltrabile, c: ColonnaOrdine): string | number {
  switch (c) {
    case 'target':
      return l.target ? RANGO_TARGET[l.target] : -1
    case 'fatturato_mensile':
      return l.fatturato_mensile ?? -1
    case 'comune':
      return (l.comune ?? '').toLowerCase()
    case 'piva':
      return l.piva ?? ''
    default:
      return l.ragione_sociale.toLowerCase()
  }
}

export function ordina<T extends LeadFiltrabile>(lead: T[], o: Ordine): T[] {
  const segno = o.discendente ? -1 : 1
  return lead.slice().sort((a, b) => {
    const ka = chiave(a, o.colonna)
    const kb = chiave(b, o.colonna)
    if (ka === kb) return a.ragione_sociale.localeCompare(b.ragione_sociale)
    if (typeof ka === 'number' && typeof kb === 'number') return (ka - kb) * segno
    return String(ka).localeCompare(String(kb)) * segno
  })
}

/** Elenco dei comuni presenti, per popolare la tendina del filtro. */
export function comuniPresenti(lead: LeadFiltrabile[]): string[] {
  return Array.from(new Set(lead.map((l) => l.comune).filter((c): c is string => Boolean(c)))).sort()
}
