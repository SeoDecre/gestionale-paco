import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Aggiornamento } from '@/types/db'
import * as api from './api'

/**
 * Chiavi di cache dei vocabolari. Cambiano di rado: staleTime lungo per non
 * rifare la fetch a ogni apertura di lead.
 */
export const chiaviVocabolari = {
  tutto: ['vocabolari'] as const,
  tabella: (t: string) => ['vocabolari', t] as const,
  tutte: (t: string) => ['vocabolari', t, 'tutte'] as const,
  cap: (zonaId: string) => ['zone_cap', zonaId] as const,
}

const OPZIONI = { staleTime: 5 * 60_000 }

export const useRuoliContatto = () =>
  useQuery({
    queryKey: chiaviVocabolari.tabella('ruoli_contatto'),
    queryFn: api.listaRuoliContatto,
    ...OPZIONI,
  })

export const useEtichetteSede = () =>
  useQuery({
    queryKey: chiaviVocabolari.tabella('etichette_sede'),
    queryFn: api.listaEtichetteSede,
    ...OPZIONI,
  })

export const useConcorrenti = () =>
  useQuery({
    queryKey: chiaviVocabolari.tabella('concorrenti_pos'),
    queryFn: api.listaConcorrenti,
    ...OPZIONI,
  })

export const useTipiPos = () =>
  useQuery({
    queryKey: chiaviVocabolari.tabella('tipi_pos'),
    queryFn: api.listaTipiPos,
    ...OPZIONI,
  })

export const useEsiti = () =>
  useQuery({
    queryKey: chiaviVocabolari.tabella('esiti_lavorazione'),
    queryFn: api.listaEsiti,
    ...OPZIONI,
  })

export const useAzioniSuccessive = () =>
  useQuery({
    queryKey: chiaviVocabolari.tabella('azioni_successive'),
    queryFn: api.listaAzioniSuccessive,
    ...OPZIONI,
  })

export const useZone = () =>
  useQuery({
    queryKey: chiaviVocabolari.tabella('zone'),
    queryFn: api.listaZone,
    ...OPZIONI,
  })

export const useParametriTarget = () =>
  useQuery({
    queryKey: chiaviVocabolari.tabella('parametri_target'),
    queryFn: api.listaParametriTarget,
    ...OPZIONI,
  })

// -------------------------------------------------------- editor (§9) scrittura
export const useTutteLeVoci = <T = unknown>(tabella: api.TabellaVocab) =>
  useQuery({
    queryKey: chiaviVocabolari.tutte(tabella),
    queryFn: () => api.tutteLeVoci<T>(tabella),
  })

function useMutazioneVocab(tabella: api.TabellaVocab, fn: (v: never) => Promise<void>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn as (v: unknown) => Promise<void>,
    onSuccess: () => qc.invalidateQueries({ queryKey: chiaviVocabolari.tabella(tabella) }),
  })
}

export const useCreaVoce = (tabella: api.TabellaVocab) =>
  useMutazioneVocab(tabella, (valori: Record<string, unknown>) =>
    api.creaVoce(tabella, valori),
  )
export const useAggiornaVoce = (tabella: api.TabellaVocab) =>
  useMutazioneVocab(tabella, (v: { id: string; patch: Record<string, unknown> }) =>
    api.aggiornaVoce(tabella, v.id, v.patch),
  )
export const useEliminaVoce = (tabella: api.TabellaVocab) =>
  useMutazioneVocab(tabella, (id: string) => api.eliminaVoce(tabella, id))

export function useAggiornaParametroTarget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { id: string; patch: Aggiornamento<'parametri_target'> }) =>
      api.aggiornaParametroTarget(v.id, v.patch),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: chiaviVocabolari.tabella('parametri_target') }),
  })
}

// -------------------------------------------------------------------- zone_cap
export const useCapDiZona = (zonaId: string) =>
  useQuery({
    queryKey: chiaviVocabolari.cap(zonaId),
    queryFn: () => api.capDiZona(zonaId),
  })

function useMutazioneCap(zonaId: string, fn: (v: never) => Promise<void>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn as (v: unknown) => Promise<void>,
    onSuccess: () => qc.invalidateQueries({ queryKey: chiaviVocabolari.cap(zonaId) }),
  })
}

export const useCreaCap = (zonaId: string) =>
  useMutazioneCap(zonaId, (v: { cap: string; comune: string | null }) =>
    api.creaCap(zonaId, v.cap, v.comune),
  )
export const useEliminaCap = (zonaId: string) =>
  useMutazioneCap(zonaId, (id: string) => api.eliminaCap(id))
