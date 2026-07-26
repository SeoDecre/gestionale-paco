import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Scheda } from '@/components/ui/Scheda'
import { Bottone } from '@/components/ui/Bottone'
import { Pillola } from '@/components/ui/Pillola'
import { Caricamento, Errore, Vuoto } from '@/components/ui/Stato'
import { formattaData, formattaOra } from '@/lib/format'
import { urlPercorso, indirizzoCompleto } from '@/lib/maps'
import { useAppuntamentiGiorno, useAnnullaAppuntamento, useSegnaFatto } from './queries'
import { giornoISO, spostaGiorno } from './giorni'
import { slotLiberi, occupatiDaAppuntamenti, minutiInOra } from './slot'
import type { AppuntamentoConLead } from './api'

const DURATA_SUGGERIMENTI = 60

export function AgendaPage() {
  const [giorno, setGiorno] = useState(giornoISO())
  const appuntamenti = useAppuntamentiGiorno(giorno)

  const attivi = (appuntamenti.data ?? []).filter((a) => a.stato !== 'annullato')
  const occupati = occupatiDaAppuntamenti(attivi)
  const liberi = slotLiberi(DURATA_SUGGERIMENTI, occupati)
  const percorso = urlPercorso(attivi.map((a) => a.lead ?? {}))
  const dataLabel = formattaData(new Date(`${giorno}T00:00:00`))

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <Bottone variante="secondario" onClick={() => setGiorno(spostaGiorno(giorno, -1))}>
          ←
        </Bottone>
        <div className="text-center">
          <h1 className="text-titolo font-semibold">{dataLabel}</h1>
          <button
            className="text-etichetta text-info-soft-text"
            onClick={() => setGiorno(giornoISO())}
          >
            Oggi
          </button>
        </div>
        <Bottone variante="secondario" onClick={() => setGiorno(spostaGiorno(giorno, 1))}>
          →
        </Bottone>
      </div>

      <Scheda
        titolo="Appuntamenti"
        azione={
          percorso && attivi.length > 1 ? (
            <a href={percorso} className="text-etichetta text-info-soft-text">
              Apri percorso
            </a>
          ) : undefined
        }
        className="mb-4"
      >
        {appuntamenti.isLoading && <Caricamento />}
        {appuntamenti.isError && <Errore errore={appuntamenti.error} />}
        {attivi.length === 0 && <Vuoto testo="Giornata libera." />}
        <ul className="flex flex-col gap-2">
          {attivi.map((a) => (
            <RigaAgenda key={a.id} app={a} />
          ))}
        </ul>
      </Scheda>

      <Scheda titolo={`Slot liberi (${DURATA_SUGGERIMENTI} min, fasce preferite)`}>
        {liberi.length === 0 ? (
          <p className="text-testo-debole">Nessuno slot libero nelle fasce preferite.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {liberi.map((m) => (
              <Pillola key={m} tinta="info">
                {minutiInOra(m)}
              </Pillola>
            ))}
          </div>
        )}
      </Scheda>
    </div>
  )
}

function RigaAgenda({ app }: { app: AppuntamentoConLead }) {
  const annulla = useAnnullaAppuntamento()
  const fatto = useSegnaFatto()
  const indirizzo = app.lead ? indirizzoCompleto(app.lead) : ''

  return (
    <li className="rounded-card border border-bordo px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-campo font-medium">
            <span className="text-info-soft-text">{formattaOra(app.inizio)}</span>
            {'–'}
            {formattaOra(app.fine)}{' '}
            {app.lead ? (
              <Link to={`/lead/${app.lead_id}`} className="underline">
                {app.lead.ragione_sociale}
              </Link>
            ) : (
              'Appuntamento'
            )}
          </p>
          {indirizzo && <p className="truncate text-etichetta text-testo-debole">{indirizzo}</p>}
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          {app.stato === 'fatto' ? (
            <Pillola tinta="successo">Fatto</Pillola>
          ) : (
            <button
              className="text-etichetta text-success-soft-text"
              onClick={() => fatto.mutate(app.id)}
              disabled={fatto.isPending}
            >
              Fatto
            </button>
          )}
          <button
            className="text-etichetta text-danger-soft-text"
            onClick={() => annulla.mutate(app.id)}
            disabled={annulla.isPending}
          >
            Annulla
          </button>
        </div>
      </div>
    </li>
  )
}
