import { Pillola } from '@/components/ui/Pillola'
import type { Tinta } from '@/components/ui/Pillola'
import { useLavorazioni } from '@/features/lavorazioni/queries'
import { useSedi } from '../queries'
import { posDichiarati, posCensiti, statoCensimento, type StatoCensimento } from '../pos'

/**
 * Contatore "POS dichiarati (a voce) / censiti (nelle sedi)" — §4/§5.
 * Confronta quanto il cliente ha detto al telefono con quanto è stato davvero
 * rilevato sul posto: è il segnale che dice a Paco se manca ancora un giro di
 * censimento. La logica sta in ../pos.ts, qui c'è solo la resa.
 */

const TINTA: Record<StatoCensimento, Tinta> = {
  ignoto: 'neutro',
  incompleto: 'avviso',
  completo: 'successo',
  oltre: 'info',
}

export function ContatorePos({
  leadId,
  dichiarati: dichiaratiProp,
}: {
  leadId: string
  /**
   * Sovrascrive il valore letto dalle lavorazioni. Serve in Registra
   * lavorazione, dove il confronto deve seguire la cifra che si sta digitando
   * e non quella dell'ultima chiamata salvata.
   */
  dichiarati?: number | null
}) {
  const sedi = useSedi(leadId)
  const lavorazioni = useLavorazioni(leadId)

  const censiti = posCensiti(sedi.data ?? [])
  const dichiarati =
    dichiaratiProp !== undefined ? dichiaratiProp : posDichiarati(lavorazioni.data ?? [])
  const stato = statoCensimento(dichiarati, censiti)

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-etichetta text-testo-debole">
      {stato === 'ignoto' ? (
        <>
          <Pillola tinta="neutro">{censiti} censiti</Pillola>
          <span>nessun POS dichiarato a voce</span>
        </>
      ) : (
        <>
          <Pillola tinta={TINTA[stato]}>
            {dichiarati} dichiarati / {censiti} censiti
          </Pillola>
          {stato === 'incompleto' && <span>mancano {dichiarati! - censiti} da censire</span>}
          {stato === 'oltre' && <span>censiti più del dichiarato</span>}
        </>
      )}
    </span>
  )
}
