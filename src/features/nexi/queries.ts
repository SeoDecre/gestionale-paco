import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'

export const chiaviNexi = {
  dettaglio: (leadId: string) => ['nexi', leadId] as const,
}

export const useLeadNexi = (leadId: string) =>
  useQuery({ queryKey: chiaviNexi.dettaglio(leadId), queryFn: () => api.getLeadNexi(leadId) })

export function useSalvaLeadNexi(leadId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (campi: api.CampiNexi) => api.salvaLeadNexi(leadId, campi),
    onSuccess: () => qc.invalidateQueries({ queryKey: chiaviNexi.dettaglio(leadId) }),
  })
}
