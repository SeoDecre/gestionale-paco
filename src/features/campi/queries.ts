import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Enum } from '@/types/db'
import * as api from './api'

export const chiaviCampi = {
  config: (brand?: string) => ['campi', 'config', brand ?? 'tutti'] as const,
  attivi: (brand: string) => ['campi', 'attivi', brand] as const,
  valori: (leadId: string) => ['campi', 'valori', leadId] as const,
}

export const useCampi = (brand?: Enum<'brand'>) =>
  useQuery({ queryKey: chiaviCampi.config(brand), queryFn: () => api.listaCampi(brand) })

export const useCampiAttivi = (brand: Enum<'brand'>) =>
  useQuery({ queryKey: chiaviCampi.attivi(brand), queryFn: () => api.campiAttivi(brand) })

export const useValoriCampi = (leadId: string) =>
  useQuery({ queryKey: chiaviCampi.valori(leadId), queryFn: () => api.valoriDelLead(leadId) })

function useMutazioneCampi<V>(fn: (v: V) => Promise<void>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campi'] }),
  })
}

export const useCreaCampo = () => useMutazioneCampi(api.creaCampo)
export const useAggiornaCampo = () =>
  useMutazioneCampi((v: { id: string; patch: Partial<api.NuovoCampo> }) =>
    api.aggiornaCampo(v.id, v.patch),
  )
export const useDisattivaCampo = () => useMutazioneCampi(api.disattivaCampo)
export const useEliminaCampo = () => useMutazioneCampi(api.eliminaCampo)

export function useSalvaValoriCampi(leadId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (valori: api.ValoreCampo[]) => api.salvaValori(leadId, valori),
    onSuccess: () => qc.invalidateQueries({ queryKey: chiaviCampi.valori(leadId) }),
  })
}
