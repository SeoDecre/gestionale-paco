import { FUSO } from '@/lib/format'

/**
 * Logica di pianificazione pura (§6). Tutto in MINUTI da mezzanotte, ora locale
 * italiana, per restare testabile senza aritmetica di fuso: gli adattatori da
 * Date stanno in fondo.
 *
 * Intervalli half-open [inizio, fine): 10–11 e 11–12 NON si sovrappongono, come
 * il vincolo appuntamenti_no_overlap nel DB.
 */

export type FasciaOraria = { daMin: number; aMin: number }
export type IntervalloMin = { inizio: number; fine: number }

/**
 * §6: fasce ESCLUSE dai suggerimenti automatici (NON bloccanti se l'utente
 * inserisce a mano): prima delle 10:00, 13:00–14:30, dopo le 20:00.
 */
export const FASCE_ESCLUSE_DEFAULT: FasciaOraria[] = [
  { daMin: 0, aMin: 10 * 60 },
  { daMin: 13 * 60, aMin: 14 * 60 + 30 },
  { daMin: 20 * 60, aMin: 24 * 60 },
]

/** true se [aIn,aFi) e [bIn,bFi) si intersecano (half-open). */
export function sovrappongono(aIn: number, aFi: number, bIn: number, bFi: number): boolean {
  return aIn < bFi && bIn < aFi
}

/** true se lo slot [inizio,fine) non tocca NESSUNA fascia esclusa. */
export function fuoriFasceEscluse(
  inizio: number,
  fine: number,
  escluse: FasciaOraria[] = FASCE_ESCLUSE_DEFAULT,
): boolean {
  return !escluse.some((f) => sovrappongono(inizio, fine, f.daMin, f.aMin))
}

/**
 * "Zona comoda" (§6): oggi = stessa zona. Scritta come predicato apposta, così
 * un giorno l'adiacenza tra zone potrà diventare un dato senza toccare i
 * chiamanti. null/null non è comodo (zona sconosciuta).
 */
export function zonaComoda(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  return a != null && b != null && a === b
}

/**
 * Suggerimenti §6: per ogni appuntamento già fissato in zona comoda, propone lo
 * slot subito PRIMA (inizio − durata) e subito DOPO (fine). Scarta i candidati
 * fuori giornata, dentro una fascia esclusa, o sovrapposti a un appuntamento
 * esistente. Se non c'è nessun appuntamento comodo, nessun suggerimento (niente
 * fallback generico): la scelta del chiamante di quali passare come `comodi`.
 */
export function suggerisciSlot(
  durataMin: number,
  comodi: IntervalloMin[],
  occupati: IntervalloMin[],
  escluse: FasciaOraria[] = FASCE_ESCLUSE_DEFAULT,
): number[] {
  const candidati = new Set<number>()
  for (const a of comodi) {
    candidati.add(a.inizio - durataMin) // subito prima
    candidati.add(a.fine) // subito dopo
  }
  const validi: number[] = []
  for (const inizio of [...candidati].sort((x, y) => x - y)) {
    const fine = inizio + durataMin
    if (inizio < 0 || fine > 24 * 60) continue
    if (!fuoriFasceEscluse(inizio, fine, escluse)) continue
    if (occupati.some((o) => sovrappongono(inizio, fine, o.inizio, o.fine))) continue
    validi.push(inizio)
  }
  return validi
}

/** "570" -> "09:30". */
export function minutiInOra(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

// ------------------------------------------------------------- adattatori Date
/** Minuti da mezzanotte in ora locale italiana per una Date. */
export function oraRomaInMinuti(d: Date): number {
  const parti = new Intl.DateTimeFormat('it-IT', {
    timeZone: FUSO,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)
  const h = Number(parti.find((p) => p.type === 'hour')?.value ?? '0')
  const m = Number(parti.find((p) => p.type === 'minute')?.value ?? '0')
  return h * 60 + m
}

/** Converte appuntamenti (ISO) in intervalli-minuti per la logica di slot. */
export function occupatiDaAppuntamenti(
  appuntamenti: { inizio: string; fine: string }[],
): IntervalloMin[] {
  return appuntamenti.map((a) => ({
    inizio: oraRomaInMinuti(new Date(a.inizio)),
    fine: oraRomaInMinuti(new Date(a.fine)),
  }))
}
