import type { Enum } from '@/types/db'

/**
 * Aggregazioni del report §12, tutte pure e testabili. Operano su una forma
 * normalizzata del lead (LeadReport), indipendente dallo shape di PostgREST.
 */
export type LeadReport = {
  fonte: Enum<'fonte_lead'>
  zona: string | null
  brand: { brand: Enum<'brand'>; stato: Enum<'stato_lead'> }[]
  concorrenti: string[]
}

const haVinto = (l: LeadReport) => l.brand.some((b) => b.stato === 'chiuso_vinto')

export type RigaEfficacia = { chiave: string; totale: number; vinti: number; tasso: number }

function efficacia<K extends string | null>(
  leads: LeadReport[],
  chiaveDi: (l: LeadReport) => K,
  etichettaVuota = '—',
): RigaEfficacia[] {
  const acc = new Map<string, { totale: number; vinti: number }>()
  for (const l of leads) {
    const k = chiaveDi(l) ?? etichettaVuota
    const r = acc.get(k) ?? { totale: 0, vinti: 0 }
    r.totale += 1
    if (haVinto(l)) r.vinti += 1
    acc.set(k, r)
  }
  return [...acc.entries()]
    .map(([chiave, r]) => ({
      chiave,
      totale: r.totale,
      vinti: r.vinti,
      tasso: r.totale ? r.vinti / r.totale : 0,
    }))
    .sort((a, b) => b.totale - a.totale)
}

/** §12: efficacia per fonte lead (Excel / self gen / call center). */
export const efficaciaPerFonte = (leads: LeadReport[]) => efficacia(leads, (l) => l.fonte)

/** §12: conversione per zona. */
export const conversionePerZona = (leads: LeadReport[]) =>
  efficacia(leads, (l) => l.zona, 'Senza zona')

/** §12: funnel stati per (brand). */
export type FunnelBrand = Record<Enum<'stato_lead'>, number>

export function statiPerBrand(leads: LeadReport[]): Map<Enum<'brand'>, FunnelBrand> {
  const vuoto = (): FunnelBrand => ({
    da_contattare: 0,
    in_lavorazione: 0,
    chiuso_vinto: 0,
    chiuso_perso: 0,
  })
  const acc = new Map<Enum<'brand'>, FunnelBrand>()
  for (const l of leads) {
    for (const b of l.brand) {
      const f = acc.get(b.brand) ?? vuoto()
      f[b.stato] += 1
      acc.set(b.brand, f)
    }
  }
  return acc
}

/** §12: concorrenti dominanti per zona (conteggio per zona → concorrente). */
export function concorrentiPerZona(leads: LeadReport[]): Map<string, Map<string, number>> {
  const acc = new Map<string, Map<string, number>>()
  for (const l of leads) {
    const z = l.zona ?? 'Senza zona'
    const perZona = acc.get(z) ?? new Map<string, number>()
    for (const c of l.concorrenti) perZona.set(c, (perZona.get(c) ?? 0) + 1)
    if (l.concorrenti.length) acc.set(z, perZona)
  }
  return acc
}
