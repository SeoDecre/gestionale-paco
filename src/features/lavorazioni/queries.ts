import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chiaviLead } from '@/features/lead/queries'
import * as api from './api'

export const chiaviLavorazioni = {
  lista: (leadId: string) => ['lavorazioni', leadId] as const,
}

export const useLavorazioni = (leadId: string) =>
  useQuery({
    queryKey: chiaviLavorazioni.lista(leadId),
    queryFn: () => api.listaLavorazioni(leadId),
  })

/** Invalida lavorazioni + dettaglio lead (lo stato è derivato) + agenda. */
function useInvalidaDopoLavorazione(leadId: string) {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: chiaviLavorazioni.lista(leadId) })
    qc.invalidateQueries({ queryKey: chiaviLead.dettaglio(leadId) })
    qc.invalidateQueries({ queryKey: ['lead', 'lista'] })
    qc.invalidateQueries({ queryKey: ['appuntamenti'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }
}

export function useRegistraLavorazione(leadId: string) {
  const invalida = useInvalidaDopoLavorazione(leadId)
  return useMutation({
    mutationFn: (v: { lav: api.NuovaLavorazione; appuntamento?: api.AppuntamentoContestuale }) =>
      api.registraLavorazione(v.lav, v.appuntamento),
    onSuccess: invalida,
  })
}

export function useEliminaLavorazione(leadId: string) {
  const invalida = useInvalidaDopoLavorazione(leadId)
  return useMutation({ mutationFn: api.eliminaLavorazione, onSuccess: invalida })
}
