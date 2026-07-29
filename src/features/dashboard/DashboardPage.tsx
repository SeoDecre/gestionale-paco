import { Link } from 'react-router-dom'
import { Scheda, TestataPagina } from '@/components/ui/Scheda'
import { Pillola } from '@/components/ui/Pillola'
import { Icona } from '@/components/ui/Icona'
import { Caricamento, Errore, Vuoto } from '@/components/ui/Stato'
import { formattaOra, formattaData } from '@/lib/format'
import { urlPercorso, indirizzoCompleto } from '@/lib/maps'
import {
  useContatoriStato,
  useChiusiMese,
  usePanoramica,
  useUltimeLavorazioni,
} from './queries'
import { useAppuntamentiGiorno } from '@/features/planning/queries'
import { giornoISO } from '@/features/planning/giorni'
import type { AppuntamentoConLead } from '@/features/planning/api'
import type { UltimaLavorazione } from './api'

/**
 * "Oggi" — §3 più le metriche del CRM 3.0.
 *
 * Le piastrelle sono LINK verso la lista già filtrata (querystring): nel 3.0
 * cliccare un numero portava alla lista corrispondente, ed è il gesto che
 * trasforma un cruscotto in uno strumento di lavoro.
 */
export function DashboardPage() {
  const contatori = useContatoriStato()
  const chiusi = useChiusiMese()
  const pano = usePanoramica()
  const ultime = useUltimeLavorazioni()
  const oggi = giornoISO()
  const appuntamenti = useAppuntamentiGiorno(oggi)

  const attivi = (appuntamenti.data ?? []).filter((a) => a.stato !== 'annullato')
  const percorso = urlPercorso(attivi.map((a) => a.lead ?? {}))

  return (
    <div className="mx-auto max-w-5xl">
      <TestataPagina
        titolo="Oggi"
        descrizione={formattaData(new Date().toISOString())}
      />

      {/* ------------------------------------------------------------- KPI */}
      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Kpi
          valore={pano.data ? `${pano.data.tassoChiusura}%` : '—'}
          etichetta="Tasso di chiusura"
          nota={
            pano.data
              ? `${pano.data.vintiTotali} vinti su ${pano.data.contattati} contattati`
              : undefined
          }
          tinta={pano.data && pano.data.tassoChiusura >= 20 ? 'successo' : 'avviso'}
        />
        <Kpi
          valore={pano.data ? String(pano.data.lavSettimana) : '—'}
          etichetta="Lavorazioni (7 giorni)"
          nota={pano.data ? `${pano.data.lavMese} nel mese` : undefined}
          tinta="info"
        />
        <Kpi
          valore={pano.data ? String(pano.data.mediaLavorazioni) : '—'}
          etichetta="Media lavorazioni per lead"
          nota={pano.data ? `su ${pano.data.totaleLead} lead` : undefined}
          tinta="neutro"
        />
      </div>
      {pano.isError && <Errore errore={pano.error} />}

      {/* ------------------------------------------------------ piastrelle */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <Tile etichetta="Lead totali" valore={pano.data?.totaleLead} tinta="neutro" a="/lead" />
        <Tile
          etichetta="Da contattare"
          valore={contatori.data?.da_contattare}
          tinta="neutro"
          a="/lead?stato=da_contattare"
        />
        <Tile
          etichetta="In lavorazione"
          valore={contatori.data?.in_lavorazione}
          tinta="info"
          a="/lead?stato=in_lavorazione"
        />
        <Tile
          etichetta="Vinti (mese)"
          valore={chiusi.data?.vinti}
          tinta="successo"
          a="/lead?stato=chiuso_vinto"
        />
        <Tile
          etichetta="Persi (mese)"
          valore={chiusi.data?.persi}
          tinta="pericolo"
          a="/lead?stato=chiuso_perso"
        />
        <Tile
          etichetta="Target A"
          valore={pano.data?.perTarget.A}
          tinta="successo"
          a="/lead?target=A"
        />
        <Tile
          etichetta="Target E"
          valore={pano.data?.perTarget.E}
          tinta="avviso"
          a="/lead?target=E"
        />
        <Tile
          etichetta="Self gen"
          valore={pano.data?.perFonte.self_gen}
          tinta="info"
          a="/lead?selfgen=1"
        />
      </div>
      {contatori.isError && <Errore errore={contatori.error} />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Scheda
          titolo="Appuntamenti di oggi"
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
        >
          {appuntamenti.isLoading && <Caricamento />}
          {appuntamenti.isError && <Errore errore={appuntamenti.error} />}
          {!appuntamenti.isLoading && attivi.length === 0 && (
            <Vuoto icona="agenda" testo="Nessun appuntamento oggi." />
          )}
          <ul className="flex flex-col gap-2">
            {attivi.map((a) => (
              <RigaAppuntamento key={a.id} app={a} />
            ))}
          </ul>
        </Scheda>

        <Scheda titolo="Ultime lavorazioni" icona="orologio">
          {ultime.isLoading && <Caricamento />}
          {ultime.isError && <Errore errore={ultime.error} />}
          {ultime.data && ultime.data.length === 0 && (
            <Vuoto icona="orologio" testo="Nessuna lavorazione registrata." />
          )}
          <ul className="flex flex-col gap-2">
            {ultime.data?.map((l) => (
              <RigaLavorazione key={l.id} lav={l} />
            ))}
          </ul>
        </Scheda>
      </div>
    </div>
  )
}

const COLORE = {
  neutro: 'text-testo',
  info: 'text-info-soft-text',
  successo: 'text-success-soft-text',
  pericolo: 'text-danger-soft-text',
  avviso: 'text-warning-soft-text',
} as const

type Tinta = keyof typeof COLORE

function Kpi({
  valore,
  etichetta,
  nota,
  tinta,
}: {
  valore: string
  etichetta: string
  nota?: string
  tinta: Tinta
}) {
  return (
    <div className="superficie-card p-3 text-center">
      {/* `cifre` = cifre a larghezza fissa: senza, il numero balla ogni volta
          che cambia di una unita' e l'occhio lo segue invece di leggerlo. */}
      <p className={`cifre text-cifra font-semibold ${COLORE[tinta]}`}>
        {valore}
      </p>
      <p className="text-etichetta text-testo-debole">{etichetta}</p>
      {nota && (
        <p className="mt-0.5 text-etichetta text-testo-tenue">{nota}</p>
      )}
    </div>
  )
}

/** Piastrella cliccabile: porta alla lista lead già filtrata. */
function Tile({
  etichetta,
  valore,
  tinta,
  a,
}: {
  etichetta: string
  valore: number | undefined
  tinta: Tinta
  a: string
}) {
  return (
    <Link
      to={a}
      className="superficie-card premibile-ampio group block p-3 text-center hover:border-bordo-forte hover:bg-superficie-alt"
    >
      <p className={`cifre text-cifra font-semibold ${COLORE[tinta]}`}>
        {valore ?? '—'}
      </p>
      <p className="flex items-center justify-center gap-0.5 text-etichetta text-testo-debole">
        {etichetta}
        {/* La freccia dice che la piastrella e' un varco verso la lista, non
            solo un numero. Compare al passaggio del mouse per non fare
            rumore su otto piastrelle in fila. */}
        <Icona
          nome="successivo"
          misura="sm"
          className="transizione-opacita opacity-0 group-hover:opacity-100"
        />
      </p>
    </Link>
  )
}

function RigaAppuntamento({ app }: { app: AppuntamentoConLead }) {
  const indirizzo = app.lead ? indirizzoCompleto(app.lead) : ''
  return (
    <li className="transizione-colore flex items-center justify-between gap-3 rounded-card border border-bordo px-3 py-2 hover:border-bordo-forte hover:bg-superficie-alt">
      <div className="min-w-0">
        <p className="text-campo font-medium">
          <span className="cifre text-info-soft-text">
            {formattaOra(app.inizio)}
          </span>{' '}
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
          <p className="truncate text-etichetta text-testo-debole">{indirizzo}</p>
        )}
      </div>
      {app.stato === 'fatto' && (
        <Pillola tinta="successo" icona="successo">
          Fatto
        </Pillola>
      )}
    </li>
  )
}

function RigaLavorazione({ lav }: { lav: UltimaLavorazione }) {
  const e = lav.esiti_lavorazione
  const tinta = e?.is_chiusura ? (e.esito_positivo ? 'successo' : 'pericolo') : 'info'
  return (
    <li className="transizione-colore flex items-center justify-between gap-2 rounded-card border border-bordo px-3 py-2 hover:border-bordo-forte hover:bg-superficie-alt">
      <div className="min-w-0">
        <Link
          to={`/lead/${lav.lead_id}`}
          className="transizione-colore block truncate text-campo font-medium hover:text-info-soft-text hover:underline"
        >
          {lav.lead?.ragione_sociale ?? 'Lead'}
        </Link>
        <p className="text-etichetta text-testo-debole">
          {formattaData(lav.data_ora)}
        </p>
      </div>
      {e && (
        <Pillola
          tinta={tinta}
          icona={
            e.is_chiusura ? (e.esito_positivo ? 'successo' : 'errore') : undefined
          }
        >
          {e.nome}
        </Pillola>
      )}
    </li>
  )
}
