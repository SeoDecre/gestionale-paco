import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import { estremiGiorno } from './giorni'

export const chiaviAppuntamenti = {
  tutto: ['appuntamenti'] as const,
  giorno: (giorno: string) => ['appuntamenti', 'giorno', giorno] as const,
}

export const useAppuntamentiGiorno = (giorno: string) =>
  useQuery({
    queryKey: chiaviAppuntamenti.giorno(giorno),
    queryFn: () => {
      const { daISO, aISO } = estremiGiorno(giorno)
      return api.appuntamentiTra(daISO, aISO)
    },
  })

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
