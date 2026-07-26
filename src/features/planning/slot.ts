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

/** Fasce preferite §6: prima delle 10:00, 13:00–14:30, dopo le 20:00. */
export const FASCE_DEFAULT: FasciaOraria[] = [
  { daMin: 0, aMin: 10 * 60 },
  { daMin: 13 * 60, aMin: 14 * 60 + 30 },
  { daMin: 20 * 60, aMin: 24 * 60 },
]

/** true se [aIn,aFi) e [bIn,bFi) si intersecano (half-open). */
export function sovrappongono(aIn: number, aFi: number, bIn: number, bFi: number): boolean {
  return aIn < bFi && bIn < aFi
}

/**
 * Inizi liberi (in minuti) per un appuntamento di `durataMin`, dentro le fasce
 * preferite, che non intersecano nessuno degli intervalli `occupati`. `passoMin`
 * è la granularità dei suggerimenti.
 */
export function slotLiberi(
  durataMin: number,
  occupati: IntervalloMin[],
  fasce: FasciaOraria[] = FASCE_DEFAULT,
  passoMin = 15,
): number[] {
  const liberi: number[] = []
  for (const f of fasce) {
    for (let inizio = f.daMin; inizio + durataMin <= f.aMin; inizio += passoMin) {
      const fine = inizio + durataMin
      const libero = !occupati.some((o) => sovrappongono(inizio, fine, o.inizio, o.fine))
      if (libero) liberi.push(inizio)
    }
  }
  return liberi
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

/** Converte gli appuntamenti di un giorno in intervalli-minuti per slotLiberi. */
export function occupatiDaAppuntamenti(
  appuntamenti: { inizio: string; fine: string }[],
): IntervalloMin[] {
  return appuntamenti.map((a) => ({
    inizio: oraRomaInMinuti(new Date(a.inizio)),
    fine: oraRomaInMinuti(new Date(a.fine)),
  }))
}
