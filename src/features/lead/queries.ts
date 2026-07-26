import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Enum } from '@/types/db'
import * as api from './api'

/** Fabbrica delle chiavi di cache del lead: un solo posto da cui invalidare. */
export const chiaviLead = {
  tutto: ['lead'] as const,
  lista: (cerca?: string) => ['lead', 'lista', cerca ?? ''] as const,
  dettaglio: (id: string) => ['lead', 'dettaglio', id] as const,
  contatti: (leadId: string) => ['lead', leadId, 'contatti'] as const,
  sedi: (leadId: string) => ['lead', leadId, 'sedi'] as const,
  concorrenti: (leadId: string) => ['lead', leadId, 'concorrenti'] as const,
  allegati: (leadId: string) => ['lead', leadId, 'allegati'] as const,
}

// ------------------------------------------------------------------- queries
export const useListaLead = (cerca?: string) =>
  useQuery({
    queryKey: chiaviLead.lista(cerca),
    queryFn: () => api.listaLead(cerca),
  })

export const useLead = (id: string) =>
  useQuery({ queryKey: chiaviLead.dettaglio(id), queryFn: () => api.getLead(id) })

export const useContatti = (leadId: string) =>
  useQuery({ queryKey: chiaviLead.contatti(leadId), queryFn: () => api.listaContatti(leadId) })

export const useSedi = (leadId: string) =>
  useQuery({ queryKey: chiaviLead.sedi(leadId), queryFn: () => api.listaSedi(leadId) })

export const useLeadConcorrenti = (leadId: string) =>
  useQuery({
    queryKey: chiaviLead.concorrenti(leadId),
    queryFn: () => api.listaLeadConcorrenti(leadId),
  })

export const useAllegati = (leadId: string) =>
  useQuery({ queryKey: chiaviLead.allegati(leadId), queryFn: () => api.listaAllegati(leadId) })

// ----------------------------------------------------------------- mutations
export function useCreaLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.creaLead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lead', 'lista'] }),
  })
}

export function useAggiornaLead(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: api.PatchLead) => api.aggiornaLead(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chiaviLead.dettaglio(id) })
      qc.invalidateQueries({ queryKey: ['lead', 'lista'] })
    },
  })
}

export function useEliminaLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.eliminaLead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lead', 'lista'] }),
  })
}

/** Invalida il dettaglio del lead: usata dalle mutation dei badge brand. */
function useBrandMutation(
  leadId: string,
  fn: (brand: Enum<'brand'>) => Promise<void>,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: chiaviLead.dettaglio(leadId) }),
  })
}

export const useAggiungiBrand = (leadId: string) =>
  useBrandMutation(leadId, (brand) => api.aggiungiBrand(leadId, brand))
export const useRimuoviBrand = (leadId: string) =>
  useBrandMutation(leadId, (brand) => api.rimuoviBrand(leadId, brand))

/** Helper: mutation che invalida una sola chiave del lead corrente. */
function useMutazioneLead<V>(chiave: readonly unknown[], fn: (v: V) => Promise<void>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: chiave }),
  })
}

// contatti
export const useCreaContatto = (leadId: string) =>
  useMutazioneLead(chiaviLead.contatti(leadId), api.creaContatto)
export const useAggiornaContatto = (leadId: string) =>
  useMutazioneLead(chiaviLead.contatti(leadId), (v: { id: string; patch: api.PatchContatto }) =>
    api.aggiornaContatto(v.id, v.patch),
  )
export const useEliminaContatto = (leadId: string) =>
  useMutazioneLead(chiaviLead.contatti(leadId), api.eliminaContatto)
export const useImpostaPrincipale = (leadId: string) =>
  useMutazioneLead(chiaviLead.contatti(leadId), (contattoId: string) =>
    api.impostaPrincipale(leadId, contattoId),
  )

// sedi + pos (condividono la chiave 'sedi': i pos sono annidati nelle sedi)
export const useCreaSede = (leadId: string) =>
  useMutazioneLead(chiaviLead.sedi(leadId), api.creaSede)
export const useEliminaSede = (leadId: string) =>
  useMutazioneLead(chiaviLead.sedi(leadId), api.eliminaSede)
export const useCreaPos = (leadId: string) =>
  useMutazioneLead(chiaviLead.sedi(leadId), api.creaPos)
export const useAggiornaPos = (leadId: string) =>
  useMutazioneLead(chiaviLead.sedi(leadId), (v: { id: string; patch: api.PatchPos }) =>
    api.aggiornaPos(v.id, v.patch),
  )
export const useEliminaPos = (leadId: string) =>
  useMutazioneLead(chiaviLead.sedi(leadId), api.eliminaPos)

// concorrenti
export const useAggiungiConcorrente = (leadId: string) =>
  useMutazioneLead(chiaviLead.concorrenti(leadId), (concorrenteId: string) =>
    api.aggiungiConcorrente(leadId, concorrenteId),
  )
export const useRimuoviConcorrente = (leadId: string) =>
  useMutazioneLead(chiaviLead.concorrenti(leadId), (concorrenteId: string) =>
    api.rimuoviConcorrente(leadId, concorrenteId),
  )

// allegati
export const useCreaAllegato = (leadId: string) =>
  useMutazioneLead(chiaviLead.allegati(leadId), api.creaAllegato)
export const useEliminaAllegato = (leadId: string) =>
  useMutazioneLead(chiaviLead.allegati(leadId), api.eliminaAllegato)
