import { useCallback, useState } from 'react'

/**
 * Editing "a bozza" di un record: tiene una copia locale modificabile, sa dire
 * se è diversa dall'originale (`modificato`) e si riallinea da sola quando
 * l'originale dal server cambia (es. dopo un salvataggio o un refetch).
 *
 * È il motore del banner "Modifiche non salvate" §2 e vale per qualunque form
 * inline (anagrafica, contatto, sede…). I campi trattati sono primitivi
 * (stringhe/numeri/null/bool), quindi il confronto e il reset via JSON bastano.
 */
export function useBozza<T extends object>(iniziale: T) {
  const serializzato = JSON.stringify(iniziale)
  const [ancora, setAncora] = useState(serializzato)
  const [bozza, setBozza] = useState<T>(iniziale)

  // Adeguamento dello stato al cambio di prop, pattern consigliato da React
  // (nessun useEffect): se l'originale è cambiato, riparti da quello.
  if (serializzato !== ancora) {
    setAncora(serializzato)
    setBozza(iniziale)
  }

  const imposta = useCallback(<K extends keyof T>(campo: K, valore: T[K]) => {
    setBozza((b) => ({ ...b, [campo]: valore }))
  }, [])

  const annulla = useCallback(() => setBozza(JSON.parse(serializzato) as T), [serializzato])

  const modificato = JSON.stringify(bozza) !== ancora

  return { bozza, imposta, annulla, modificato }
}
