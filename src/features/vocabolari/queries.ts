import { useQuery } from '@tanstack/react-query'
import * as api from './api'

/**
 * Chiavi di cache dei vocabolari. Cambiano di rado: staleTime lungo per non
 * rifare la fetch a ogni apertura di lead.
 */
export const chiaviVocabolari = {
  tutto: ['vocabolari'] as const,
  tabella: (t: string) => ['vocabolari', t] as const,
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
