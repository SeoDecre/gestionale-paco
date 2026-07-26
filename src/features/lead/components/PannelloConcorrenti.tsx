import { Scheda } from '@/components/ui/Scheda'
import { Caricamento, Errore } from '@/components/ui/Stato'
import { useConcorrenti } from '@/features/vocabolari/queries'
import {
  useLeadConcorrenti,
  useAggiungiConcorrente,
  useRimuoviConcorrente,
} from '../queries'

/**
 * Concorrenti a livello AZIENDA (§4, "non per sede"). Chip selezionabili dal
 * vocabolario: attivi in rosso (danger, §2), gli altri come contorno da aggiungere.
 */
export function PannelloConcorrenti({ leadId }: { leadId: string }) {
  const vocab = useConcorrenti()
  const attivi = useLeadConcorrenti(leadId)
  const aggiungi = useAggiungiConcorrente(leadId)
  const rimuovi = useRimuoviConcorrente(leadId)

  const inUso = new Set((attivi.data ?? []).map((c) => c.concorrente_id))
  const occupato = aggiungi.isPending || rimuovi.isPending

  return (
    <Scheda titolo="Concorrenti" className="mb-4">
      {(vocab.isLoading || attivi.isLoading) && <Caricamento />}
      {attivi.isError && <Errore errore={attivi.error} />}
      <div className="flex flex-wrap gap-2">
        {(vocab.data ?? []).map((c) => {
          const on = inUso.has(c.id)
          return (
            <button
              key={c.id}
              disabled={occupato}
              onClick={() => (on ? rimuovi.mutate(c.id) : aggiungi.mutate(c.id))}
              className={
                on
                  ? 'rounded-pillola border border-danger-soft-border bg-danger-soft px-3 py-1 text-etichetta font-medium text-danger-soft-text'
                  : 'rounded-pillola border border-dashed border-bordo px-3 py-1 text-etichetta text-testo-debole'
              }
            >
              {on ? '✓ ' : '＋ '}
              {c.nome}
            </button>
          )
        })}
      </div>
    </Scheda>
  )
}
