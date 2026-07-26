import { Link } from 'react-router-dom'
import { Scheda } from '@/components/ui/Scheda'
import { Pillola } from '@/components/ui/Pillola'
import { Caricamento, Errore, Vuoto } from '@/components/ui/Stato'
import { formattaOra } from '@/lib/format'
import { urlPercorso, indirizzoCompleto } from '@/lib/maps'
import { useContatoriStato, useChiusiMese } from './queries'
import { useAppuntamentiGiorno } from '@/features/planning/queries'
import { giornoISO } from '@/features/planning/giorni'
import type { AppuntamentoConLead } from '@/features/planning/api'

export function DashboardPage() {
  const contatori = useContatoriStato()
  const chiusi = useChiusiMese()
  const oggi = giornoISO()
  const appuntamenti = useAppuntamentiGiorno(oggi)

  const attivi = (appuntamenti.data ?? []).filter((a) => a.stato !== 'annullato')
  const percorso = urlPercorso(attivi.map((a) => a.lead ?? {}))

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-titolo font-semibold">Oggi</h1>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile etichetta="Da contattare" valore={contatori.data?.da_contattare} tinta="neutro" />
        <Tile etichetta="In lavorazione" valore={contatori.data?.in_lavorazione} tinta="info" />
        <Tile etichetta="Vinti (mese)" valore={chiusi.data?.vinti} tinta="successo" />
        <Tile etichetta="Persi (mese)" valore={chiusi.data?.persi} tinta="pericolo" />
      </div>
      {contatori.isError && <Errore errore={contatori.error} />}

      <Scheda
        titolo="Appuntamenti di oggi"
        azione={
          percorso && attivi.length > 1 ? (
            <a href={percorso} className="text-etichetta text-info-soft-text">
              Apri percorso
            </a>
          ) : undefined
        }
      >
        {appuntamenti.isLoading && <Caricamento />}
        {appuntamenti.isError && <Errore errore={appuntamenti.error} />}
        {attivi.length === 0 && <Vuoto testo="Nessun appuntamento oggi." />}
        <ul className="flex flex-col gap-2">
          {attivi.map((a) => (
            <RigaAppuntamento key={a.id} app={a} />
          ))}
        </ul>
      </Scheda>
    </div>
  )
}

function Tile({
  etichetta,
  valore,
  tinta,
}: {
  etichetta: string
  valore: number | undefined
  tinta: 'neutro' | 'info' | 'successo' | 'pericolo'
}) {
  const colore = {
    neutro: 'text-testo',
    info: 'text-info-soft-text',
    successo: 'text-success-soft-text',
    pericolo: 'text-danger-soft-text',
  }[tinta]
  return (
    <div className="rounded-card border border-bordo bg-superficie p-3 text-center">
      <p className={`text-titolo font-semibold ${colore}`}>{valore ?? '—'}</p>
      <p className="text-etichetta text-testo-debole">{etichetta}</p>
    </div>
  )
}

function RigaAppuntamento({ app }: { app: AppuntamentoConLead }) {
  const indirizzo = app.lead ? indirizzoCompleto(app.lead) : ''
  return (
    <li className="flex items-center justify-between gap-3 rounded-card border border-bordo px-3 py-2">
      <div className="min-w-0">
        <p className="text-campo font-medium">
          <span className="text-info-soft-text">{formattaOra(app.inizio)}</span>{' '}
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
      {app.stato === 'fatto' && <Pillola tinta="successo">Fatto</Pillola>}
    </li>
  )
}
