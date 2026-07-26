import { Bottone } from './Bottone'

/**
 * Banner "Modifiche non salvate" §2 — ambra (warning-soft). Appare fisso in
 * basso quando l'anagrafica ha modifiche pendenti; Paco è in piedi davanti al
 * cliente, il tasto Salva deve essere sempre raggiungibile col pollice.
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
    <div className="sticky bottom-0 z-10 mt-4 flex items-center gap-3 rounded-card border border-warning-soft-border bg-warning-soft px-4 py-3">
      <span className="flex-1 text-etichetta text-warning-soft-text">
        Modifiche non salvate
      </span>
      <Bottone variante="secondario" onClick={onAnnulla} disabled={inCorso}>
        Annulla
      </Bottone>
      <Bottone variante="primario" onClick={onSalva} disabled={inCorso}>
        {inCorso ? 'Salvataggio…' : 'Salva'}
      </Bottone>
    </div>
  )
}
