import { useState } from 'react'
import { Icona } from '@/components/ui/Icona'
import { Link } from 'react-router-dom'
import { Scheda } from '@/components/ui/Scheda'
import { Bottone, BottoneIcona } from '@/components/ui/Bottone'
import { Pillola } from '@/components/ui/Pillola'
import { Caricamento, Errore, Vuoto } from '@/components/ui/Stato'
import { formattaData, formattaOra } from '@/lib/format'
import { urlPercorso, indirizzoCompleto } from '@/lib/maps'
import { useAppuntamentiGiorno, useAnnullaAppuntamento, useSegnaFatto } from './queries'
import { giornoISO, spostaGiorno } from './giorni'
import type { AppuntamentoConLead } from './api'
import { AzioniAppuntamento } from './AzioniAppuntamento'

export function AgendaPage() {
  const [giorno, setGiorno] = useState(giornoISO())
  const appuntamenti = useAppuntamentiGiorno(giorno)

  const attivi = (appuntamenti.data ?? []).filter((a) => a.stato !== 'annullato')
  const percorso = urlPercorso(attivi.map((a) => a.lead ?? {}))
  const dataLabel = formattaData(new Date(`${giorno}T00:00:00`))

  return (
    <div className="mx-auto max-w-3xl">
      {/* Giorno / settimana: la griglia settimanale è quella del CRM 3.0. */}
      {/* Giorno e' la vista corrente: e' uno `span`, non un link a se stessa.
          `aria-current` lo dice anche a chi non vede l'evidenziazione. */}
      <div className="mb-3 flex gap-2">
        <span
          aria-current="page"
          className="flex-1 rounded-card border border-info-soft-border bg-info-soft px-3 py-2 text-center text-campo font-medium text-info-soft-text"
        >
          Giorno
        </span>
        <Link
          to="/agenda/settimana"
          className="superficie-card premibile flex-1 px-3 py-2 text-center text-campo text-testo-debole hover:border-bordo-forte hover:text-testo"
        >
          Settimana
        </Link>
      </div>

      <div className="mb-4 flex items-center justify-between gap-2">
        <BottoneIcona
          nome="precedente"
          etichetta="Giorno precedente"
          variante="secondario"
          onClick={() => setGiorno(spostaGiorno(giorno, -1))}
        />
        <div className="min-w-0 text-center">
          <h1 className="truncate text-titolo font-semibold">{dataLabel}</h1>
          <Bottone
            variante="fantasma"
            misura="sm"
            className="text-info-soft-text"
            onClick={() => setGiorno(giornoISO())}
          >
            Oggi
          </Bottone>
        </div>
        <BottoneIcona
          nome="successivo"
          etichetta="Giorno successivo"
          variante="secondario"
          onClick={() => setGiorno(spostaGiorno(giorno, 1))}
        />
      </div>

      <Scheda
        titolo="Appuntamenti"
        icona="agenda"
        azione={
          percorso && attivi.length > 1 ? (
            <a
              href={percorso}
              target="_blank"
              rel="noopener noreferrer"
              className="transizione-colore inline-flex items-center gap-1 text-etichetta font-medium text-info-soft-text hover:underline"
            >
              <Icona nome="naviga" misura="sm" />
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
    </div>
  )
}

function RigaAgenda({ app }: { app: AppuntamentoConLead }) {
  const annulla = useAnnullaAppuntamento()
  const fatto = useSegnaFatto()
  const indirizzo = app.lead ? indirizzoCompleto(app.lead) : ''

  return (
    <li className="transizione-colore rounded-card border border-bordo px-3 py-2 hover:border-bordo-forte">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-campo font-medium">
            <span className="cifre text-info-soft-text">
              {formattaOra(app.inizio)}
            </span>
            {'–'}
            <span className="cifre">{formattaOra(app.fine)}</span>{' '}
            {app.lead ? (
              <Link
                to={`/lead/${app.lead_id}`}
                className="transizione-colore hover:text-info-soft-text hover:underline"
              >
                {app.lead.ragione_sociale}
              </Link>
            ) : (
              'Appuntamento'
            )}
          </p>
          {indirizzo && (
            <p className="truncate text-etichetta text-testo-debole">
              {indirizzo}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {app.stato === 'fatto' ? (
            <Pillola tinta="successo" icona="successo">
              Fatto
            </Pillola>
          ) : (
            <Bottone
              variante="fantasma"
              misura="sm"
              icona="conferma"
              className="text-success-soft-text"
              onClick={() => fatto.mutate(app.id)}
              caricamento={fatto.isPending}
            >
              Fatto
            </Bottone>
          )}
          <Bottone
            variante="fantasma"
            misura="sm"
            className="text-danger-soft-text"
            onClick={() => annulla.mutate(app.id)}
            caricamento={annulla.isPending}
          >
            Annulla
          </Bottone>
        </div>
      </div>
      {/* Calendario, navigazione, promemoria: le scorciatoie del CRM 3.0. */}
      <div className="mt-2">
        <AzioniAppuntamento app={app} />
      </div>
    </li>
  )
}
