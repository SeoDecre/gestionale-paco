import { Scheda } from '@/components/ui/Scheda'
import { Caricamento, Errore } from '@/components/ui/Stato'
import { Icona } from '@/components/ui/Icona'
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
    <Scheda
      titolo="Concorrenti"
      icona="pos"
      descrizione="A livello di azienda, non per sede (§4)."
      className="mb-4"
    >
      {(vocab.isLoading || attivi.isLoading) && <Caricamento />}
      {attivi.isError && <Errore errore={attivi.error} />}
      <div className="flex flex-wrap gap-2">
        {(vocab.data ?? []).map((c) => {
          const on = inUso.has(c.id)
          /* Il concorrente attivo e' rosso (danger §2), non blu come gli
             altri chip: qui "acceso" vuol dire "c'e' un concorrente da
             scalzare", che e' un avviso e non una selezione qualsiasi. */
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              disabled={occupato}
              onClick={() =>
                on ? rimuovi.mutate(c.id) : aggiungi.mutate(c.id)
              }
              className={`premibile inline-flex items-center gap-1.5 rounded-pillola border px-3 py-1.5 text-etichetta font-medium disabled:opacity-45 ${
                on
                  ? 'border-danger-soft-border bg-danger-soft text-danger-soft-text'
                  : 'border-dashed border-bordo bg-superficie text-testo-debole hover:border-bordo-forte hover:text-testo'
              }`}
            >
              <Icona nome={on ? 'conferma' : 'aggiungi'} misura="sm" />
              {c.nome}
            </button>
          )
        })}
      </div>
    </Scheda>
  )
}
