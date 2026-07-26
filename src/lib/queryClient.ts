import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // App online-only (§7: nessuna cache offline). Dati freschi entro 30s
      // bastano per un utente singolo; evita refetch continui in mobilità.
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      // I conflitti (slot occupato) non vanno mai ritentati in automatico.
      retry: false,
    },
  },
})
