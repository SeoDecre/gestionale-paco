import { useState } from 'react'
import { Scheda } from '@/components/ui/Scheda'
import { Pillola } from '@/components/ui/Pillola'
import { Caricamento, Errore, Vuoto } from '@/components/ui/Stato'
import { formattaDataOra } from '@/lib/format'
import type { Enum } from '@/types/db'
import { BADGE_BRAND } from '@/features/lead/brand'
import type { LavorazioneEstesa } from './api'
import { useLavorazioni, useEliminaLavorazione } from './queries'
import { FormRegistraLavorazione } from './FormRegistraLavorazione'

export function PannelloLavorazioni({
  leadId,
  brandIniziale,
  leadZonaId,
}: {
  leadId: string
  brandIniziale?: Enum<'brand'>
  leadZonaId?: string | null
}) {
  const lavorazioni = useLavorazioni(leadId)
  const [registra, setRegistra] = useState(false)

  return (
    <Scheda
      titolo="Lavorazioni"
      azione={
        <button className="text-etichetta text-info-soft-text" onClick={() => setRegistra((v) => !v)}>
          {registra ? 'Chiudi' : '＋ Registra'}
        </button>
      }
      className="mb-4"
    >
      {registra && (
        <div className="mb-3">
          <FormRegistraLavorazione
            leadId={leadId}
            brandIniziale={brandIniziale}
            leadZonaId={leadZonaId}
            onFatto={() => setRegistra(false)}
          />
        </div>
      )}

      {lavorazioni.isLoading && <Caricamento />}
      {lavorazioni.isError && <Errore errore={lavorazioni.error} />}
      {lavorazioni.data && lavorazioni.data.length === 0 && !registra && (
        <Vuoto testo="Nessuna lavorazione registrata." />
      )}

      <ul className="flex flex-col gap-2">
        {lavorazioni.data?.map((l) => (
          <RigaLavorazione key={l.id} leadId={leadId} lavorazione={l} />
        ))}
      </ul>
    </Scheda>
  )
}

function RigaLavorazione({
  leadId,
  lavorazione,
}: {
  leadId: string
  lavorazione: LavorazioneEstesa
}) {
  const elimina = useEliminaLavorazione(leadId)
  const b = BADGE_BRAND[lavorazione.brand]
  const dettagli = [
    lavorazione.azioni_successive?.nome && `→ ${lavorazione.azioni_successive.nome}`,
    lavorazione.contatti?.nome && `con ${lavorazione.contatti.nome}`,
    lavorazione.pos_richiesti != null && `${lavorazione.pos_richiesti} POS dichiarati`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <li className="rounded-card border border-bordo px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Pillola tinta={b.tinta}>{b.etichetta}</Pillola>
            {lavorazione.esiti_lavorazione && (
              <span className="text-campo font-medium">{lavorazione.esiti_lavorazione.nome}</span>
            )}
            <span className="text-etichetta text-testo-debole">
              {formattaDataOra(lavorazione.data_ora)}
            </span>
          </div>
          {dettagli && <p className="mt-0.5 text-etichetta text-testo-debole">{dettagli}</p>}
          {lavorazione.note && <p className="mt-0.5 text-etichetta">{lavorazione.note}</p>}
        </div>
        <button
          aria-label="Elimina lavorazione"
          className="px-1 text-danger-soft-text"
          onClick={() => elimina.mutate(lavorazione.id)}
          disabled={elimina.isPending}
        >
          ✕
        </button>
      </div>
    </li>
  )
}
