import { useState } from 'react'
import { Icona } from '@/components/ui/Icona'
import { Link } from 'react-router-dom'
import { Bottone, BottoneIcona } from '@/components/ui/Bottone'
import { Pillola } from '@/components/ui/Pillola'
import { Caricamento, Errore } from '@/components/ui/Stato'
import { formattaOra } from '@/lib/format'
import { urlPercorso } from '@/lib/maps'
import { BADGE_BRAND } from '@/features/lead/brand'
import { useAppuntamentiSettimana } from './queries'
import { lunediDellaSettimana, settimana, giornoISO, spostaGiorno } from './giorni'
import { AzioniAppuntamento } from './AzioniAppuntamento'
import type { AppuntamentoConLead } from './api'

const NOMI_GIORNO = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']

/**
 * Planning settimanale — la griglia a sette colonne del CRM 3.0.
 *
 * Su telefono le sette colonne diventano sette sezioni impilate: sette colonne
 * da 50px sarebbero illeggibili, e §15 vieta di rimpicciolire il testo per
 * far entrare più roba.
 */
export function SettimanaPage() {
  const [lunedi, setLunedi] = useState(() => lunediDellaSettimana())
  const appuntamenti = useAppuntamentiSettimana(lunedi)
  const giorni = settimana(lunedi)
  const oggi = giornoISO()

  const perGiorno = (g: string) =>
    (appuntamenti.data ?? [])
      .filter((a) => a.stato !== 'annullato' && giornoISO(new Date(a.inizio)) === g)
      .sort((a, b) => a.inizio.localeCompare(b.inizio))

  const inizio = new Date(`${lunedi}T00:00:00`)
  const fine = new Date(`${spostaGiorno(lunedi, 6)}T00:00:00`)

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-3 flex gap-2">
        <Link
          to="/agenda"
          className="superficie-card premibile flex-1 px-3 py-2 text-center text-campo text-testo-debole hover:border-bordo-forte hover:text-testo"
        >
          Giorno
        </Link>
        <span
          aria-current="page"
          className="flex-1 rounded-card border border-info-soft-border bg-info-soft px-3 py-2 text-center text-campo font-medium text-info-soft-text"
        >
          Settimana
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-titolo font-semibold">Planning settimanale</h1>
        <div className="flex items-center gap-2">
          <BottoneIcona
            nome="precedente"
            etichetta="Settimana precedente"
            variante="secondario"
            onClick={() => setLunedi(spostaGiorno(lunedi, -7))}
          />
          <span className="cifre whitespace-nowrap text-etichetta text-testo-debole">
            {inizio.getDate()} {MESI[inizio.getMonth()]} – {fine.getDate()}{' '}
            {MESI[fine.getMonth()]} {fine.getFullYear()}
          </span>
          <BottoneIcona
            nome="successivo"
            etichetta="Settimana successiva"
            variante="secondario"
            onClick={() => setLunedi(spostaGiorno(lunedi, 7))}
          />
          <Bottone
            variante="secondario"
            onClick={() => setLunedi(lunediDellaSettimana())}
          >
            Oggi
          </Bottone>
        </div>
      </div>

      {appuntamenti.isLoading && <Caricamento />}
      {appuntamenti.isError && <Errore errore={appuntamenti.error} />}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-7 lg:gap-2">
        {giorni.map((g, i) => {
          const lista = perGiorno(g)
          const isOggi = g === oggi
          const percorso = urlPercorso(lista.map((a) => a.lead ?? {}))
          const data = new Date(`${g}T00:00:00`)

          return (
            <section
              key={g}
              className={`rounded-card border bg-superficie ${
                isOggi ? 'border-info-soft-border ring-1 ring-info-soft-border' : 'border-bordo'
              }`}
            >
              <header
                className={`flex items-center justify-between gap-2 border-b border-bordo px-3 py-2 lg:block lg:text-center ${
                  isOggi ? 'bg-info-soft' : ''
                }`}
              >
                <span
                  className={`text-etichetta ${
                    isOggi
                      ? 'font-semibold text-info-soft-text'
                      : 'text-testo-debole'
                  }`}
                >
                  {NOMI_GIORNO[i]} <span className="cifre">{data.getDate()}</span>{' '}
                  {MESI[data.getMonth()]}
                </span>
                <span className="flex items-center gap-2">
                  {lista.length > 0 && (
                    <span className="cifre text-etichetta font-medium text-testo-debole lg:hidden">
                      {lista.length}
                    </span>
                  )}
                  {percorso && lista.length > 1 && (
                    <a
                      href={percorso}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transizione-colore inline-flex items-center gap-1 text-etichetta font-medium text-info-soft-text hover:underline"
                    >
                      <Icona nome="naviga" misura="sm" />
                      Percorso
                    </a>
                  )}
                </span>
              </header>

              <div className="flex flex-col gap-2 p-2">
                {lista.length === 0 ? (
                  <p className="px-1 py-2 text-etichetta text-testo-tenue">
                    Libero
                  </p>
                ) : (
                  lista.map((a) => <CartaAppuntamento key={a.id} app={a} />)
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function CartaAppuntamento({ app }: { app: AppuntamentoConLead }) {
  const b = app.brand ? BADGE_BRAND[app.brand] : null
  return (
    <article className="transizione-colore rounded-card border border-bordo p-2 hover:border-bordo-forte hover:bg-superficie-alt">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="cifre text-campo font-semibold text-info-soft-text">
          {formattaOra(app.inizio)}
        </span>
        {b && <Pillola tinta={b.tinta}>{b.etichetta}</Pillola>}
        {app.stato === 'fatto' && (
          <Pillola tinta="successo" icona="successo">
            Fatto
          </Pillola>
        )}
      </div>
      {app.lead ? (
        <Link
          to={`/lead/${app.lead_id}`}
          className="transizione-colore mt-0.5 block truncate text-campo hover:text-info-soft-text hover:underline"
        >
          {app.lead.ragione_sociale}
        </Link>
      ) : (
        <p className="mt-0.5 text-campo">Appuntamento</p>
      )}
      {app.lead?.comune && (
        <p className="truncate text-etichetta text-testo-debole">{app.lead.comune}</p>
      )}
      <div className="mt-1.5">
        <AzioniAppuntamento app={app} compatto />
      </div>
    </article>
  )
}
