import { Scheda } from '@/components/ui/Scheda'
import { Chip } from '@/components/ui/Chip'
import { Caricamento, Errore, Vuoto } from '@/components/ui/Stato'
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
    <Scheda
      titolo="Esigenze POS"
      icona="pos"
      descrizione="Del cliente, non della singola sede (§4)."
      className="mb-4"
    >
      {(disponibili.isLoading || scelte.isLoading) && <Caricamento />}
      {disponibili.isError && <Errore errore={disponibili.error} />}
      {scelte.isError && <Errore errore={scelte.error} />}

      {disponibili.data && disponibili.data.length === 0 && (
        <Vuoto
          icona="pos"
          testo="Nessuna esigenza in elenco — si aggiungono in Configurazione → Vocabolari."
        />
      )}

      <div className="flex flex-wrap gap-1.5">
        {(disponibili.data ?? []).map((e) => {
          const on = scelteIds.has(e.id)
          return (
            <Chip
              key={e.id}
              attivo={on}
              disabled={aggiungi.isPending || rimuovi.isPending}
              onClick={() => (on ? rimuovi.mutate(e.id) : aggiungi.mutate(e.id))}
            >
              {e.nome}
            </Chip>
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
