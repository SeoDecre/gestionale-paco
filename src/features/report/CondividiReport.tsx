import { useState } from 'react'
import { Bottone } from '@/components/ui/Bottone'
import { apriEsterno } from '@/lib/scarica'
import { urlMailto, urlWhatsApp, urlTelegram } from '@/lib/condivisione'
import { useAgente, useMandati } from '@/features/agente/queries'
import { BADGE_BRAND, BADGE_STATO } from '@/features/lead/brand'
import type { Enum } from '@/types/db'
import type { LeadRicco } from './api'
import { testoReport, type LeadTesto } from './testoReport'

/**
 * Condivisione del report (dal CRM 3.0): mail, WhatsApp, Telegram, copia negli
 * appunti e stampa/PDF.
 *
 * Il PDF si ottiene con la stampa del browser ("Salva come PDF") invece di
 * generarlo in JavaScript: il 3.0 lo faceva lato server con pdfmake, che qui
 * significherebbe ~1 MB in più su un bundle già oltre il megabyte, per un
 * risultato peggiore di quello che il sistema operativo produce da solo.
 */
export function CondividiReport({ lead }: { lead: LeadRicco[] }) {
  const agente = useAgente()
  const mandati = useMandati()
  const [copiato, setCopiato] = useState(false)

  // Il mandato per la firma: quello del brand se i lead sono tutti dello
  // stesso, altrimenti nessuno — firmare un report misto col codice NEXI
  // sarebbe sbagliato.
  const brandPresenti = new Set(lead.flatMap((l) => l.lead_brand.map((b) => b.brand)))
  const brandUnico: Enum<'brand'> | undefined =
    brandPresenti.size === 1 ? [...brandPresenti][0] : undefined
  const mandato = brandUnico ? mandati.data?.find((m) => m.brand === brandUnico) : undefined

  const vinti = lead.filter((l) => l.lead_brand.some((b) => b.stato === 'chiuso_vinto')).length
  const intestazione = {
    totale: lead.length,
    vinti,
    tasso: lead.length > 0 ? Math.round((vinti / lead.length) * 100) : 0,
  }

  const perTesto: LeadTesto[] = lead.map((l) => ({
    ragione_sociale: l.ragione_sociale,
    indirizzo: l.indirizzo,
    civico: l.civico,
    cap: l.cap,
    comune: l.comune,
    provincia: l.provincia,
    telefono: l.telefono,
    cellulare: l.cellulare,
    target: l.target,
    brand: l.lead_brand.map((b) => BADGE_BRAND[b.brand].etichetta),
    stato: l.lead_brand.map((b) => BADGE_STATO[b.stato].etichetta).join(', ') || null,
  }))

  const testo = (formato: 'mail' | 'whatsapp' | 'telegram') =>
    testoReport(perTesto, intestazione, formato, agente.data, mandato)

  async function copia() {
    try {
      await navigator.clipboard.writeText(testo('mail'))
      setCopiato(true)
      setTimeout(() => setCopiato(false), 2500)
    } catch {
      setCopiato(false)
    }
  }

  const disabilitato = lead.length === 0

  return (
    <div className="flex flex-wrap gap-2">
      <Bottone
        variante="secondario"
        disabled={disabilitato}
        onClick={() => {
          window.location.href = urlMailto(
            `Report AgentPro — ${new Date().toLocaleDateString('it-IT')}`,
            testo('mail'),
          )
        }}
        icona="mail"
      >
        Mail
      </Bottone>
      <Bottone
        variante="secondario"
        icona="messaggio"
        disabled={disabilitato}
        onClick={() => apriEsterno(urlWhatsApp(testo('whatsapp')))}
      >
        WhatsApp
      </Bottone>
      <Bottone
        variante="secondario"
        icona="invia"
        disabled={disabilitato}
        onClick={() => apriEsterno(urlTelegram(testo('telegram')))}
      >
        Telegram
      </Bottone>
      {/* L'etichetta cambia in "Copiato" per 2,5s: e' l'unica conferma che
          l'operazione e' andata a buon fine, perche' gli appunti non si
          vedono. L'icona cambia con lei, cosi' non e' solo il testo. */}
      <Bottone
        variante="secondario"
        icona={copiato ? 'conferma' : 'copia'}
        disabled={disabilitato}
        onClick={copia}
      >
        {copiato ? 'Copiato' : 'Copia'}
      </Bottone>
      <Bottone
        variante="secondario"
        icona="stampa"
        disabled={disabilitato}
        onClick={() => window.print()}
      >
        Stampa / PDF
      </Bottone>
    </div>
  )
}
