import { Pillola } from '@/components/ui/Pillola'
import { urlMappa, indirizzoCompleto } from '@/lib/maps'
import type { Enum } from '@/types/db'
import type { LeadConBrand } from '../api'
import { BADGE_BRAND, BADGE_STATO, TUTTI_I_BRAND } from '../brand'
import { SelettoreVerifica } from './SelettoreVerifica'
import { useAggiungiBrand, useRimuoviBrand } from '../queries'

const ETICHETTA_FONTE: Record<Enum<'fonte_lead'>, string> = {
  import_excel: 'Excel aziendale',
  self_gen: 'Self gen',
  call_center_nexi: 'Call center NEXI',
}

export function TestataLead({ lead }: { lead: LeadConBrand }) {
  const aggiungi = useAggiungiBrand(lead.id)
  const rimuovi = useRimuoviBrand(lead.id)
  const mappa = urlMappa(lead)
  const attivi = new Map(lead.lead_brand.map((b) => [b.brand, b.stato]))

  return (
    <div className="mb-4">
      <h1 className="text-titolo font-semibold">{lead.ragione_sociale}</h1>

      {mappa && (
        <a href={mappa} className="mt-1 inline-block text-etichetta text-info-soft-text underline">
          {indirizzoCompleto(lead)}
        </a>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Pillola tinta="neutro">{ETICHETTA_FONTE[lead.fonte]}</Pillola>
        <SelettoreVerifica lead={lead} />

        {TUTTI_I_BRAND.map((brand) => {
          const stato = attivi.get(brand)
          const b = BADGE_BRAND[brand]
          if (stato == null) {
            return (
              <button
                key={brand}
                onClick={() => aggiungi.mutate(brand)}
                disabled={aggiungi.isPending}
                className="rounded-pillola border border-dashed border-bordo px-3 py-1 text-etichetta text-testo-debole"
              >
                ＋ {b.etichetta}
              </button>
            )
          }
          return (
            <span key={brand} className="inline-flex items-center gap-1">
              <Pillola tinta={b.tinta}>{b.etichetta}</Pillola>
              <Pillola tinta={BADGE_STATO[stato].tinta}>{BADGE_STATO[stato].etichetta}</Pillola>
              <button
                onClick={() => rimuovi.mutate(brand)}
                disabled={rimuovi.isPending}
                aria-label={`Rimuovi ${b.etichetta}`}
                className="px-1 text-testo-debole"
              >
                ✕
              </button>
            </span>
          )
        })}
      </div>
    </div>
  )
}
