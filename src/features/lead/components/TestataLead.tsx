import { Pillola } from '@/components/ui/Pillola'
import { Chip } from '@/components/ui/Chip'
import { BottoneIcona } from '@/components/ui/Bottone'
import { Icona } from '@/components/ui/Icona'
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
        <a
          href={mappa}
          target="_blank"
          rel="noopener noreferrer"
          className="transizione-colore mt-1 inline-flex items-center gap-1 text-etichetta text-info-soft-text hover:underline"
        >
          <Icona nome="mappa" misura="sm" />
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
              <Chip
                key={brand}
                tratteggiato
                icona="aggiungi"
                onClick={() => aggiungi.mutate(brand)}
                disabled={aggiungi.isPending}
              >
                {b.etichetta}
              </Chip>
            )
          }
          return (
            <span key={brand} className="inline-flex items-center gap-1">
              <Pillola tinta={b.tinta}>{b.etichetta}</Pillola>
              <Pillola tinta={BADGE_STATO[stato].tinta}>
                {BADGE_STATO[stato].etichetta}
              </Pillola>
              <BottoneIcona
                nome="chiudi"
                etichetta={`Rimuovi ${b.etichetta}`}
                onClick={() => rimuovi.mutate(brand)}
                disabled={rimuovi.isPending}
              />
            </span>
          )
        })}
      </div>
    </div>
  )
}
