import { useAgente, useMandati } from '@/features/agente/queries'
import { scaricaTesto, apriEsterno } from '@/lib/scarica'
import { urlMappa } from '@/lib/maps'
import {
  costruisciICS,
  urlGoogleCalendar,
  testoAppuntamento,
  urlMailto,
  urlWhatsApp,
  type DatiCliente,
} from '@/lib/condivisione'
import { formattaData } from '@/lib/format'
import { BADGE_BRAND } from '@/features/lead/brand'
import { Icona, type NomeIcona } from '@/components/ui/Icona'
import type { AppuntamentoConLead } from './api'

/**
 * Le scorciatoie che nel CRM 3.0 stavano su ogni appuntamento: scarica .ics
 * per il calendario di iPhone, aggiungi a Google Calendar, naviga, manda il
 * promemoria per mail o WhatsApp.
 *
 * Il .ics si scarica invece di aprirsi: su iOS il download apre direttamente
 * la scheda "Aggiungi a Calendario", che è il gesto che serve.
 */
export function AzioniAppuntamento({
  app,
  compatto = false,
}: {
  app: AppuntamentoConLead
  compatto?: boolean
}) {
  const agente = useAgente()
  const mandati = useMandati()

  if (!app.lead) return null

  // Il brand sull'appuntamento è opzionale: senza, si firma col profilo
  // agente e basta, invece di scegliere un mandato a caso.
  const mandato = app.brand ? mandati.data?.find((m) => m.brand === app.brand) : undefined
  const cliente: DatiCliente = {
    ragione_sociale: app.lead.ragione_sociale,
    brand: app.brand ? BADGE_BRAND[app.brand].etichetta : null,
    indirizzo: app.lead.indirizzo,
    civico: app.lead.civico,
    cap: app.lead.cap,
    comune: app.lead.comune,
    provincia: app.lead.provincia,
  }
  const dati = { id: app.id, inizio: app.inizio, durata_min: app.durata_min, note: app.luogo }

  const mappa = urlMappa(app.lead)
  const testo = testoAppuntamento(dati, cliente, agente.data, mandato)
  const oggetto = `Appuntamento ${formattaData(app.inizio)} — ${app.lead.ragione_sociale}`

  const azioni = [
    {
      etichetta: 'Calendario',
      icona: 'agenda',
      titolo: 'Scarica .ics',
      onClick: () =>
        scaricaTesto(
          `appuntamento_${app.id}.ics`,
          costruisciICS(dati, cliente),
          'text/calendar',
        ),
    },
    {
      etichetta: 'Google',
      icona: 'settimana',
      titolo: 'Aggiungi a Google Calendar',
      onClick: () => apriEsterno(urlGoogleCalendar(dati, cliente)),
    },
    mappa && {
      etichetta: 'Naviga',
      icona: 'naviga',
      titolo: 'Apri la navigazione',
      onClick: () => apriEsterno(mappa),
    },
    {
      etichetta: 'Mail',
      icona: 'mail',
      titolo: 'Manda il promemoria per mail',
      // mailto: deve navigare nella stessa scheda, altrimenti resta aperta
      // una finestra vuota dopo l'apertura del client di posta.
      onClick: () => {
        window.location.href = urlMailto(oggetto, testo)
      },
    },
    {
      etichetta: 'WhatsApp',
      icona: 'messaggio',
      titolo: 'Manda il promemoria su WhatsApp',
      onClick: () => apriEsterno(urlWhatsApp(testo)),
    },
  ].filter(Boolean) as {
    etichetta: string
    icona: NomeIcona
    titolo: string
    onClick: () => void
  }[]

  return (
    <div className="flex flex-wrap gap-1">
      {azioni.map((a) => (
        <button
          key={a.etichetta}
          type="button"
          title={a.titolo}
          /* L'etichetta accessibile e' quella lunga ("Manda il promemoria su
             WhatsApp") anche quando a schermo si vede solo l'icona: in modo
             compatto e' l'unica descrizione disponibile. */
          aria-label={a.titolo}
          onClick={a.onClick}
          className={`premibile inline-flex min-h-11 items-center gap-1.5 superficie-card text-etichetta text-testo-debole hover:border-bordo-forte hover:text-testo ${
            compatto ? 'px-2.5' : 'px-3'
          }`}
        >
          <Icona nome={a.icona} misura="sm" />
          {!compatto && <span>{a.etichetta}</span>}
        </button>
      ))}
    </div>
  )
}
