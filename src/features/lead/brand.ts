import type { Enum } from '@/types/db'
import type { Tinta } from '@/components/ui/Pillola'

/**
 * Presentazione dei brand (§2): NEXI = blu (info), Hera Comm = verde (successo).
 * Un solo posto da cui derivano badge, toggle e colori, in tutta l'app.
 */
export const BADGE_BRAND: Record<Enum<'brand'>, { etichetta: string; tinta: Tinta }> = {
  NEXI: { etichetta: 'NEXI', tinta: 'info' },
  HERA_COMM: { etichetta: 'Hera Comm', tinta: 'successo' },
}

export const TUTTI_I_BRAND: Enum<'brand'>[] = ['NEXI', 'HERA_COMM']

/** Presentazione dello stato derivato del lead (§3). */
export const BADGE_STATO: Record<Enum<'stato_lead'>, { etichetta: string; tinta: Tinta }> = {
  da_contattare: { etichetta: 'Da contattare', tinta: 'neutro' },
  in_lavorazione: { etichetta: 'In lavorazione', tinta: 'info' },
  chiuso_vinto: { etichetta: 'Chiuso vinto', tinta: 'successo' },
  chiuso_perso: { etichetta: 'Chiuso perso', tinta: 'pericolo' },
}
