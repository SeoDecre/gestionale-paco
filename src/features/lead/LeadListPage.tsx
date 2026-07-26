import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Bottone } from '@/components/ui/Bottone'
import { Input } from '@/components/ui/Campo'
import { Pillola } from '@/components/ui/Pillola'
import { Caricamento, Errore, Vuoto } from '@/components/ui/Stato'
import { formattaEuro } from '@/lib/format'
import { messaggioErrore } from '@/lib/errors'
import { useListaLead, useCreaLead } from './queries'
import type { LeadConBrand } from './api'
import { BADGE_BRAND } from './brand'

export function LeadListPage() {
  const [cerca, setCerca] = useState('')
  const lista = useListaLead(cerca)

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-titolo font-semibold">Lead</h1>
      </div>

      <NuovoLead />

      <Input
        type="search"
        placeholder="Cerca per ragione sociale…"
        value={cerca}
        onChange={(e) => setCerca(e.target.value)}
        className="mb-4"
      />

      {lista.isLoading && <Caricamento />}
      {lista.isError && <Errore errore={lista.error} />}
      {lista.data && lista.data.length === 0 && (
        <Vuoto testo={cerca ? 'Nessun lead trovato.' : 'Ancora nessun lead.'} />
      )}
      {lista.data && lista.data.length > 0 && (
        <ul className="flex flex-col gap-2">
          {lista.data.map((l) => (
            <RigaLead key={l.id} lead={l} />
          ))}
        </ul>
      )}
    </div>
  )
}

function RigaLead({ lead }: { lead: LeadConBrand }) {
  const luogo = [lead.comune, lead.zone?.nome].filter(Boolean).join(' · ')
  return (
    <li>
      <Link
        to={`/lead/${lead.id}`}
        className="flex items-center justify-between gap-3 rounded-card border border-bordo bg-superficie px-4 py-3"
      >
        <div className="min-w-0">
          <p className="truncate text-campo font-medium">{lead.ragione_sociale}</p>
          {luogo && <p className="truncate text-etichetta text-testo-debole">{luogo}</p>}
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          {lead.fatturato_mensile != null && (
            <span className="text-etichetta text-testo-debole">
              {formattaEuro(lead.fatturato_mensile)}/mese
            </span>
          )}
          {lead.target && <Pillola tinta="avviso">{lead.target}</Pillola>}
          {lead.lead_brand.map((b) => (
            <Pillola key={b.brand} tinta={BADGE_BRAND[b.brand].tinta}>
              {BADGE_BRAND[b.brand].etichetta}
            </Pillola>
          ))}
        </div>
      </Link>
    </li>
  )
}

/** Creazione rapida: basta la ragione sociale, poi si apre il dettaglio. */
function NuovoLead() {
  const [aperto, setAperto] = useState(false)
  const [nome, setNome] = useState('')
  const crea = useCreaLead()
  const navigate = useNavigate()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    const lead = await crea.mutateAsync({ ragione_sociale: nome.trim() })
    navigate(`/lead/${lead.id}`)
  }

  if (!aperto) {
    return (
      <Bottone piena className="mb-4" onClick={() => setAperto(true)}>
        ＋ Nuovo lead
      </Bottone>
    )
  }

  return (
    <form onSubmit={onSubmit} className="mb-4 flex flex-col gap-2">
      <Input
        autoFocus
        placeholder="Ragione sociale"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />
      {crea.isError && <p className="text-etichetta text-danger-soft-text">{messaggioErrore(crea.error)}</p>}
      <div className="flex gap-2">
        <Bottone type="submit" disabled={crea.isPending || !nome.trim()}>
          {crea.isPending ? 'Creazione…' : 'Crea e apri'}
        </Bottone>
        <Bottone variante="secondario" onClick={() => setAperto(false)}>
          Annulla
        </Bottone>
      </div>
    </form>
  )
}
