import { Scheda } from '@/components/ui/Scheda'
import { Caricamento, Errore } from '@/components/ui/Stato'
import { useEsigenzePos } from '@/features/vocabolari/queries'
import { useEsigenzeLead, useAggiungiEsigenza, useRimuoviEsigenza } from '../queries'

/**
 * Esigenze POS del cliente — le "pillole" del CRM 3.0 ("POS senza fili", "POS
 * per asporto", "POS+cassa integrato").
 *
 * Come i concorrenti, stanno a livello AZIENDA e non per sede (§4): il tipo di
 * bisogno è dell'attività, non del singolo terminale. Le voci si gestiscono in
 * Configurazione → Vocabolari → Esigenze POS.
 */
export function PannelloEsigenze({ leadId }: { leadId: string }) {
  const disponibili = useEsigenzePos()
  const scelte = useEsigenzeLead(leadId)
  const aggiungi = useAggiungiEsigenza(leadId)
  const rimuovi = useRimuoviEsigenza(leadId)

  const scelteIds = new Set((scelte.data ?? []).map((e) => e.esigenza_id))

  return (
    <Scheda titolo="Esigenze POS" className="mb-4">
      {(disponibili.isLoading || scelte.isLoading) && <Caricamento />}
      {disponibili.isError && <Errore errore={disponibili.error} />}
      {scelte.isError && <Errore errore={scelte.error} />}

      {disponibili.data && disponibili.data.length === 0 && (
        <p className="text-etichetta text-testo-debole">
          Nessuna esigenza in elenco — si aggiungono in Configurazione → Vocabolari.
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {(disponibili.data ?? []).map((e) => {
          const on = scelteIds.has(e.id)
          return (
            <button
              key={e.id}
              type="button"
              aria-pressed={on}
              disabled={aggiungi.isPending || rimuovi.isPending}
              onClick={() => (on ? rimuovi.mutate(e.id) : aggiungi.mutate(e.id))}
              className={`min-h-11 rounded-pillola border px-3 text-etichetta font-medium ${
                on
                  ? 'border-info-soft-border bg-info-soft text-info-soft-text'
                  : 'border-bordo bg-superficie text-testo-debole'
              }`}
            >
              {e.nome}
            </button>
          )
        })}
      </div>

      {aggiungi.isError && (
        <div className="mt-2">
          <Errore errore={aggiungi.error} />
        </div>
      )}
    </Scheda>
  )
}
