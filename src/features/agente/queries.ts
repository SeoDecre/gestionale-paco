import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Enum } from '@/types/db'
import * as api from './api'

export const chiaviAgente = {
  profilo: ['agente', 'profilo'] as const,
  mandati: ['agente', 'mandati'] as const,
}

export const useAgente = () =>
  useQuery({ queryKey: chiaviAgente.profilo, queryFn: api.getAgente })

export const useMandati = () =>
  useQuery({ queryKey: chiaviAgente.mandati, queryFn: api.listaMandati })

/** Il mandato del brand richiesto, o undefined se non ancora seminato. */
export function useMandato(brand: Enum<'brand'> | undefined) {
  const mandati = useMandati()
  return brand ? mandati.data?.find((m) => m.brand === brand) : undefined
}

export function useSalvaAgente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.salvaAgente,
    onSuccess: () => qc.invalidateQueries({ queryKey: chiaviAgente.profilo }),
  })
}

export function useSalvaMandato() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { brand: Enum<'brand'>; patch: api.PatchMandato }) =>
      api.salvaMandato(v.brand, v.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: chiaviAgente.mandati }),
  })
}
