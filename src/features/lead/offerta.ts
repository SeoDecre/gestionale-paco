import type { Enum } from '@/types/db'

/**
 * §4: l'offerta consigliata è "pescata dal target". Qui si decide QUALI offerte
 * ricadono nel target del lead; la scelta resta comunque manuale, come per la
 * lettera di target — l'app suggerisce, non applica (§4).
 *
 * Le lettere non sono alfabetiche: sono bande di fatturato. Dalla migrazione 03,
 * C è la più bassa (< 40k annui) ed E la più alta (> 140k). Ordinarle come
 * stringhe darebbe A < B < C < E, cioè l'intervallo sbagliato.
 */
export const ORDINE_TARGET: Enum<'target_lettera'>[] = ['C', 'B', 'A', 'E']

const rango = (l: Enum<'target_lettera'>) => ORDINE_TARGET.indexOf(l)

/** Solo i campi usati: il modulo resta puro e indipendente dai tipi generati. */
export type OffertaTarget = {
  target_min: Enum<'target_lettera'> | null
  target_max: Enum<'target_lettera'> | null
}

/**
 * Vero se la lettera del lead cade nell'intervallo dell'offerta, estremi
 * inclusi. Estremo null = nessun limite da quel lato: un'offerta senza né min
 * né max vale per tutti, che è il default sensato per chi non compila il range.
 */
export function offertaAdattaAlTarget(
  offerta: OffertaTarget,
  target: Enum<'target_lettera'> | null | undefined,
): boolean {
  if (offerta.target_min == null && offerta.target_max == null) return true
  if (target == null) return false
  const t = rango(target)
  if (offerta.target_min != null && t < rango(offerta.target_min)) return false
  if (offerta.target_max != null && t > rango(offerta.target_max)) return false
  return true
}

/**
 * Divide le offerte in "consigliate per il target" e "altre", mantenendo
 * l'ordine di partenza. Le altre NON si nascondono: Paco deve poter proporre
 * fuori banda, il suggerimento non è un vincolo.
 */
export function dividiPerTarget<T extends OffertaTarget>(
  offerte: T[],
  target: Enum<'target_lettera'> | null | undefined,
): { consigliate: T[]; altre: T[] } {
  const consigliate: T[] = []
  const altre: T[] = []
  for (const o of offerte) {
    if (offertaAdattaAlTarget(o, target)) consigliate.push(o)
    else altre.push(o)
  }
  return { consigliate, altre }
}
