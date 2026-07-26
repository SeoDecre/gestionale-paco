import { useQuery } from '@tanstack/react-query'
import * as api from './api'

export const chiaviDashboard = {
  contatori: ['dashboard', 'contatori'] as const,
  chiusiMese: ['dashboard', 'chiusi-mese'] as const,
}

export const useContatoriStato = () =>
  useQuery({ queryKey: chiaviDashboard.contatori, queryFn: api.contatoriStato })

export const useChiusiMese = () =>
  useQuery({ queryKey: chiaviDashboard.chiusiMese, queryFn: api.chiusiMese })
