import { giornoISO } from './giorni'
import {
  oraRomaInMinuti,
  suggerisciSlot,
  zonaComoda,
  minutiInOra,
  type IntervalloMin,
} from './slot'
import type { AppuntamentoConLead } from './api'

/**
 * Trasforma gli appuntamenti dei prossimi giorni nei suggerimenti §6 per un
 * lead: per ogni giorno che ha almeno un appuntamento in zona comoda al lead,
 * propone gli slot subito prima/dopo. Giorni senza zona comoda: nessun
 * suggerimento (niente fallback generico).
 *
 * `value` è già nel formato di un <input type="datetime-local"> (ora locale).
 */
export type SlotSuggerito = { min: number; ora: string; value: string }
export type GiornoSuggerito = { giorno: string; slot: SlotSuggerito[] }

export function calcolaSuggerimenti(
  appuntamenti: AppuntamentoConLead[],
  leadZonaId: string | null | undefined,
  durataMin: number,
): GiornoSuggerito[] {
  if (!leadZonaId) return []

  const perGiorno = new Map<string, AppuntamentoConLead[]>()
  for (const a of appuntamenti) {
    if (a.stato === 'annullato') continue
    const g = giornoISO(new Date(a.inizio))
    const lista = perGiorno.get(g)
    if (lista) lista.push(a)
    else perGiorno.set(g, [a])
  }

  const risultato: GiornoSuggerito[] = []
  for (const [giorno, lista] of [...perGiorno.entries()].sort()) {
    const comodi: IntervalloMin[] = lista
      .filter((a) => zonaComoda(a.lead?.zona_id, leadZonaId))
      .map(intervallo)
    if (comodi.length === 0) continue

    const occupati = lista.map(intervallo)
    const min = suggerisciSlot(durataMin, comodi, occupati)
    if (min.length === 0) continue

    risultato.push({
      giorno,
      slot: min.map((m) => ({ min: m, ora: minutiInOra(m), value: `${giorno}T${minutiInOra(m)}` })),
    })
  }
  return risultato
}

const intervallo = (a: AppuntamentoConLead): IntervalloMin => ({
  inizio: oraRomaInMinuti(new Date(a.inizio)),
  fine: oraRomaInMinuti(new Date(a.fine)),
})
