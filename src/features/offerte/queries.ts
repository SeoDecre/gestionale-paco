import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Enum } from '@/types/db'
import * as api from './api'

export const chiaviOfferte = {
  tutte: ['offerte'] as const,
  attive: (brand?: string) => ['offerte', 'attive', brand ?? 'tutti'] as const,
}

export const useOfferte = () =>
  useQuery({ queryKey: chiaviOfferte.tutte, queryFn: api.listaOfferte })

export const useOfferteAttive = (brand?: Enum<'brand'>) =>
  useQuery({ queryKey: chiaviOfferte.attive(brand), queryFn: () => api.offerteAttive(brand) })

function useMutazioneOfferte<V>(fn: (v: V) => Promise<void>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: chiaviOfferte.tutte }),
  })
}

export const useCreaOfferta = () => useMutazioneOfferte(api.creaOfferta)
export const useAggiornaOfferta = () =>
  useMutazioneOfferte((v: { id: string; patch: api.PatchOfferta }) =>
    api.aggiornaOfferta(v.id, v.patch),
  )
export const useArchiviaOfferta = () => useMutazioneOfferte(api.archiviaOfferta)
export const useEliminaOfferta = () => useMutazioneOfferte(api.eliminaOfferta)
