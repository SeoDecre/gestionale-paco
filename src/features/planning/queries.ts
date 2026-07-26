import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import { estremiGiorno, giornoISO, spostaGiorno } from './giorni'
import { calcolaSuggerimenti } from './suggerimenti'

export const chiaviAppuntamenti = {
  tutto: ['appuntamenti'] as const,
  giorno: (giorno: string) => ['appuntamenti', 'giorno', giorno] as const,
  prossimi: (giorni: number) => ['appuntamenti', 'prossimi', giorni] as const,
}

export const useAppuntamentiGiorno = (giorno: string) =>
  useQuery({
    queryKey: chiaviAppuntamenti.giorno(giorno),
    queryFn: () => {
      const { daISO, aISO } = estremiGiorno(giorno)
      return api.appuntamentiTra(daISO, aISO)
    },
  })

/**
 * Slot suggeriti §6 per un lead, sui prossimi `giorni`. Restituisce la query
 * (per stato loading/errore) più i suggerimenti già calcolati per la durata.
 */
export function useSlotSuggeriti(
  leadZonaId: string | null | undefined,
  durataMin: number,
  giorni = 14,
) {
  const oggi = giornoISO()
  const daISO = new Date(`${oggi}T00:00:00`).toISOString()
  const aISO = new Date(`${spostaGiorno(oggi, giorni)}T00:00:00`).toISOString()

  const query = useQuery({
    queryKey: chiaviAppuntamenti.prossimi(giorni),
    queryFn: () => api.appuntamentiTra(daISO, aISO),
    enabled: leadZonaId != null,
  })

  const suggerimenti = useMemo(
    () => calcolaSuggerimenti(query.data ?? [], leadZonaId, durataMin),
    [query.data, leadZonaId, durataMin],
  )

  return { ...query, suggerimenti }
}

function useInvalida() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: chiaviAppuntamenti.tutto })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }
}

export function useCreaAppuntamento() {
  const invalida = useInvalida()
  return useMutation({ mutationFn: api.creaAppuntamento, onSuccess: invalida })
}

export function useAnnullaAppuntamento() {
  const invalida = useInvalida()
  return useMutation({ mutationFn: api.annullaAppuntamento, onSuccess: invalida })
}

export function useSegnaFatto() {
  const invalida = useInvalida()
  return useMutation({ mutationFn: api.segnaFatto, onSuccess: invalida })
}

export function useEliminaAppuntamento() {
  const invalida = useInvalida()
  return useMutation({ mutationFn: api.eliminaAppuntamento, onSuccess: invalida })
}
