import type { Enum, Riga } from '@/types/db'

/**
 * Suggerimento del target — speculare a public.suggerisci_target() nel DB
 * (migrazione 03). Il lead memorizza il fatturato MENSILE; le soglie sono
 * ANNUE, quindi si confronta mensile × 12. min null = nessun minimo (C),
 * max null = nessun massimo (E). Condizione: annuo >= min e annuo < max.
 *
 * §4: il target si SUGGERISCE soltanto. L'applicazione avviene con un bottone
 * esplicito, mai in automatico — qui si calcola, non si scrive.
 */
export type BandaTarget = Pick<
  Riga<'parametri_target'>,
  'target' | 'soglia_min_annua' | 'soglia_max_annua'
>

export function suggerisciTarget(
  fatturatoMensile: number | null | undefined,
  bande: BandaTarget[],
): Enum<'target_lettera'> | null {
  if (fatturatoMensile == null || fatturatoMensile < 0) return null
  const annuo = fatturatoMensile * 12
  const banda = bande.find(
    (b) =>
      (b.soglia_min_annua == null || annuo >= b.soglia_min_annua) &&
      (b.soglia_max_annua == null || annuo < b.soglia_max_annua),
  )
  return banda?.target ?? null
}
