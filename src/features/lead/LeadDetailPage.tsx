import { useParams, useNavigate, Link } from 'react-router-dom'
import { Errore, Scheletro } from '@/components/ui/Stato'
import { Bottone } from '@/components/ui/Bottone'
import { Icona } from '@/components/ui/Icona'
import { useLead, useEliminaLead } from './queries'
import { TestataLead } from './components/TestataLead'
import { AnagraficaScheda } from './components/AnagraficaScheda'
import { PannelloContatti } from './components/PannelloContatti'
import { PannelloSedi } from './components/PannelloSedi'
import { PannelloConcorrenti } from './components/PannelloConcorrenti'
import { PannelloEsigenze } from './components/PannelloEsigenze'
import { PannelloAllegati } from './components/PannelloAllegati'
import { PannelloLavorazioni } from '@/features/lavorazioni/PannelloLavorazioni'
import { PannelloNexi } from '@/features/nexi/PannelloNexi'
import { PannelloCampi } from '@/features/campi/PannelloCampi'

export function LeadDetailPage() {
  const { id = '' } = useParams()
  const lead = useLead(id)
  const elimina = useEliminaLead()
  const navigate = useNavigate()

  async function onElimina() {
    if (!confirm('Eliminare definitivamente questo lead e tutti i suoi dati?')) return
    await elimina.mutateAsync(id)
    navigate('/lead')
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/lead"
        className="transizione-colore mb-3 inline-flex min-h-11 items-center gap-1 text-etichetta font-medium text-info-soft-text hover:underline"
      >
        <Icona nome="indietro" misura="sm" />
        Tutti i lead
      </Link>

      {/* Scheletro e non rotellina: la scheda lead ha una forma fissa, quindi
          si puo' riservare lo spazio e la pagina non salta all'arrivo. */}
      {lead.isLoading && <Scheletro righe={8} />}
      {lead.isError && <Errore errore={lead.error} />}

      {lead.data && (
        <>
          <TestataLead lead={lead.data} />
          <AnagraficaScheda lead={lead.data} />
          <PannelloLavorazioni
            leadId={id}
            brandIniziale={lead.data.lead_brand[0]?.brand}
            leadZonaId={lead.data.zona_id}
          />
          {/* Stesso brand usato per la lavorazione automatica del tasto
              telefono (§4): il primo del lead, come per Registra lavorazione. */}
          <PannelloContatti leadId={id} brand={lead.data.lead_brand[0]?.brand} />
          <PannelloSedi leadId={id} />
          <PannelloConcorrenti leadId={id} />
          <PannelloEsigenze leadId={id} />
          {lead.data.lead_brand.some((b) => b.brand === 'NEXI') && <PannelloNexi leadId={id} />}
          {/* Domande extra configurate per brand (CRM 3.0): una scheda per
              ogni brand del lead, e nulla se non è stato configurato niente. */}
          {lead.data.lead_brand.map((b) => (
            <PannelloCampi key={b.brand} leadId={id} brand={b.brand} />
          ))}
          <PannelloAllegati leadId={id} />

          {/* Azione distruttiva staccata dal resto e in fondo: separarla
              spazialmente dalle azioni normali e' cio' che impedisce di
              toccarla per sbaglio scorrendo (HIG/Material). */}
          <div className="mt-6 border-t border-bordo pt-4">
            <Bottone
              variante="pericolo"
              misura="sm"
              icona="elimina"
              onClick={onElimina}
              caricamento={elimina.isPending}
            >
              Elimina lead
            </Bottone>
          </div>
        </>
      )}
    </div>
  )
}
