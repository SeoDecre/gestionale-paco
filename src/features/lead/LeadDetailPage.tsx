import { useParams, useNavigate, Link } from 'react-router-dom'
import { Caricamento, Errore } from '@/components/ui/Stato'
import { useLead, useEliminaLead } from './queries'
import { TestataLead } from './components/TestataLead'
import { AnagraficaScheda } from './components/AnagraficaScheda'
import { PannelloContatti } from './components/PannelloContatti'
import { PannelloSedi } from './components/PannelloSedi'
import { PannelloConcorrenti } from './components/PannelloConcorrenti'
import { PannelloAllegati } from './components/PannelloAllegati'
import { PannelloLavorazioni } from '@/features/lavorazioni/PannelloLavorazioni'

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
      <Link to="/lead" className="mb-3 inline-block text-etichetta text-info-soft-text">
        ← Tutti i lead
      </Link>

      {lead.isLoading && <Caricamento />}
      {lead.isError && <Errore errore={lead.error} />}

      {lead.data && (
        <>
          <TestataLead lead={lead.data} />
          <AnagraficaScheda lead={lead.data} />
          <PannelloLavorazioni leadId={id} brandIniziale={lead.data.lead_brand[0]?.brand} />
          <PannelloContatti leadId={id} />
          <PannelloSedi leadId={id} />
          <PannelloConcorrenti leadId={id} />
          <PannelloAllegati leadId={id} />

          <button
            onClick={onElimina}
            disabled={elimina.isPending}
            className="mt-2 text-etichetta text-danger-soft-text underline"
          >
            Elimina lead
          </button>
        </>
      )}
    </div>
  )
}
