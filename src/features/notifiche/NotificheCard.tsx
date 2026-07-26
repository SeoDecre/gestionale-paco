import { Scheda } from '@/components/ui/Scheda'
import { Bottone } from '@/components/ui/Bottone'
import { Pillola } from '@/components/ui/Pillola'
import { useNotifiche } from './useNotifiche'

/**
 * Card impostazioni notifiche (§7). Su iOS il push richiede l'app installata
 * alla Home Screen: se non è standalone, lo si spiega invece di far fallire.
 */
export function NotificheCard() {
  const n = useNotifiche()

  return (
    <Scheda titolo="Notifiche push" className="mb-4">
      {!n.supportato && (
        <p className="text-testo-debole">
          Questo dispositivo/browser non supporta le notifiche push.
        </p>
      )}

      {n.supportato && !n.standalone && (
        <p className="text-warning-soft-text">
          Per ricevere le notifiche su iPhone/iPad installa prima l’app: tasto Condividi →
          “Aggiungi a Home”, poi apri AgentPro dall’icona e torna qui.
        </p>
      )}

      {n.supportato && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Pillola tinta={n.iscritto ? 'successo' : 'neutro'}>
            {n.iscritto ? 'Attive' : 'Non attive'}
          </Pillola>
          {!n.iscritto ? (
            <Bottone onClick={n.attiva} disabled={n.caricamento}>
              {n.caricamento ? 'Attivazione…' : 'Attiva notifiche'}
            </Bottone>
          ) : (
            <>
              <Bottone variante="secondario" onClick={n.prova}>
                Invia prova
              </Bottone>
              <Bottone variante="pericolo" onClick={n.disattiva} disabled={n.caricamento}>
                Disattiva
              </Bottone>
            </>
          )}
        </div>
      )}

      {n.esito && <p className="mt-2 text-etichetta text-success-soft-text">{n.esito}</p>}
      {n.errore && <p className="mt-2 text-etichetta text-danger-soft-text">{n.errore}</p>}

      <p className="mt-3 text-etichetta text-testo-debole">
        Promemoria 1 ora prima di ogni appuntamento, più i riepiloghi delle 07:00 e 20:00 (§7).
      </p>
    </Scheda>
  )
}
