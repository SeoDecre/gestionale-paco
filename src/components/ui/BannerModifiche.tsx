import { Bottone } from './Bottone'
import { Icona } from './Icona'

/**
 * Banner "Modifiche non salvate" §2 — ambra (warning-soft). Appare fisso in
 * basso quando l'anagrafica ha modifiche pendenti; Paco è in piedi davanti al
 * cliente, il tasto Salva deve essere sempre raggiungibile col pollice.
 *
 * `animate-salita` lo fa entrare dal basso invece di apparire dal nulla: una
 * barra che compare di colpo sotto il pollice si tocca per sbaglio.
 */
export function BannerModifiche({
  inCorso,
  onSalva,
  onAnnulla,
}: {
  inCorso: boolean
  onSalva: () => void
  onAnnulla: () => void
}) {
  return (
    <div
      role="status"
      className="animate-salita z-sticky sticky bottom-0 mt-4 flex items-center gap-2 rounded-card border border-warning-soft-border bg-warning-soft px-3 py-2.5 shadow-medio"
    >
      <Icona nome="avviso" misura="sm" className="text-warning-soft-text" />
      <span className="flex-1 text-etichetta font-medium text-warning-soft-text">
        Modifiche non salvate
      </span>
      <Bottone
        variante="secondario"
        misura="sm"
        onClick={onAnnulla}
        disabled={inCorso}
      >
        Annulla
      </Bottone>
      <Bottone misura="sm" icona="salva" onClick={onSalva} caricamento={inCorso}>
        {inCorso ? 'Salvataggio…' : 'Salva'}
      </Bottone>
    </div>
  )
}
