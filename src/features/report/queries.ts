import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FiltriLead } from './api'
import * as api from './api'

export const chiaviReport = {
  dataset: ['report', 'dataset'] as const,
  liste: ['liste-salvate'] as const,
}

export const useDatasetReport = () =>
  useQuery({ queryKey: chiaviReport.dataset, queryFn: api.datasetReport })

export const useListeSalvate = () =>
  useQuery({ queryKey: chiaviReport.liste, queryFn: api.listaListe })

export function useSalvaLista() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { nome: string; filtri: FiltriLead; colonne: string[] }) =>
      api.salvaLista(v.nome, v.filtri, v.colonne),
    onSuccess: () => qc.invalidateQueries({ queryKey: chiaviReport.liste }),
  })
}

export function useEliminaLista() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.eliminaLista,
    onSuccess: () => qc.invalidateQueries({ queryKey: chiaviReport.liste }),
  })
}
