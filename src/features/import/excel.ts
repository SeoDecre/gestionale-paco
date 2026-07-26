import * as XLSX from 'xlsx'
import type { Enum } from '@/types/db'

/**
 * Parsing e mappatura dell'Excel aziendale (§8). Le intestazioni sono quelle del
 * file reale "lista crm_esiti". La funzione di lettura è I/O; la mappatura
 * riga → lead è pura e testata.
 */

export type DatiLeadImport = {
  ragione_sociale: string
  piva: string | null
  target: Enum<'target_lettera'> | null
  indirizzo: string | null
  cap: string | null
  comune: string | null
  provincia: string | null
  sito_web: string | null
  note: string | null
  telefono: string | null // diventa un Contatto, non un campo del lead (§1)
}

/** Intestazioni del file → campi lead. Un solo punto da aggiornare se cambiano. */
export const COLONNE = {
  ragione_sociale: 'nm_ragione_sociale',
  piva: 'co_piva',
  target: 'target',
  indirizzo: 'te_indirizzo_best',
  cap: 'co_post_code',
  comune: 'te_comune',
  provincia: 'te_provincia',
  sito_web: 'te_url_best',
  note: 'notes',
  telefono: 'telefono_cleaned',
} as const

const str = (v: unknown): string | null => {
  if (v == null) return null
  const s = String(v).trim()
  return s === '' ? null : s
}

/**
 * P.IVA a 11 cifre. Excel può perdere lo zero iniziale rendendola a 10 cifre:
 * in quel caso si ripristina lo zero. Altre lunghezze → null (non valida).
 */
export function normalizzaPiva(v: unknown): string | null {
  const s = str(v)
  if (!s) return null
  const cifre = s.replace(/\D/g, '')
  if (cifre.length === 11) return cifre
  if (cifre.length === 10) return `0${cifre}`
  return null
}

export function normalizzaCap(v: unknown): string | null {
  const s = str(v)
  if (!s) return null
  const cifre = s.replace(/\D/g, '')
  return /^\d{5}$/.test(cifre) ? cifre : null
}

function normalizzaTarget(v: unknown): Enum<'target_lettera'> | null {
  const s = str(v)?.toUpperCase()
  return s === 'E' || s === 'A' || s === 'B' || s === 'C' ? s : null
}

function normalizzaProvincia(v: unknown): string | null {
  const s = str(v)?.toUpperCase()
  return s && /^[A-Z]{2}$/.test(s) ? s : null
}

/** Mappa una riga Excel (oggetto per intestazione) a dati lead. null se manca la ragione sociale. */
export function rigaALead(row: Record<string, unknown>): DatiLeadImport | null {
  const ragione_sociale = str(row[COLONNE.ragione_sociale])
  if (!ragione_sociale) return null
  return {
    ragione_sociale,
    piva: normalizzaPiva(row[COLONNE.piva]),
    target: normalizzaTarget(row[COLONNE.target]),
    indirizzo: str(row[COLONNE.indirizzo]),
    cap: normalizzaCap(row[COLONNE.cap]),
    comune: str(row[COLONNE.comune]),
    provincia: normalizzaProvincia(row[COLONNE.provincia]),
    sito_web: str(row[COLONNE.sito_web]),
    note: str(row[COLONNE.note]),
    telefono: str(row[COLONNE.telefono]),
  }
}

/** Legge un file .xlsx e restituisce le righe mappate (scarta quelle senza nome). */
export async function leggiXlsx(file: File): Promise<DatiLeadImport[]> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const righe = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: null,
    raw: false, // stringhe formattate: preserva gli zeri iniziali di CAP/P.IVA
  })
  return righe.map(rigaALead).filter((r): r is DatiLeadImport => r !== null)
}
