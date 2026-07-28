import { useState } from 'react'
import { messaggioErrore } from '@/lib/errors'
import { urlFirmato } from '@/lib/media'

/**
 * Apre il PDF originale di un'offerta (§9). Il bucket è privato: il link non
 * può essere un href statico, va firmato al momento del tap. Usato sia in
 * Configurazione (elenco offerte) sia sulla scheda lead (offerta consigliata).
 */
export function BottonePdfOfferta({
  path,
  etichetta = 'PDF',
}: {
  path: string | null | undefined
  etichetta?: string
}) {
  const [inCorso, setInCorso] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  if (!path) return null

  async function apri() {
    setErrore(null)
    setInCorso(true)
    try {
      window.open(await urlFirmato(path!), '_blank', 'noopener')
    } catch (e) {
      setErrore(messaggioErrore(e))
    } finally {
      setInCorso(false)
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={apri}
        disabled={inCorso}
        className="text-etichetta text-info-soft-text underline"
      >
        📄 {inCorso ? 'Apertura…' : etichetta}
      </button>
      {errore && <span className="text-etichetta text-danger-soft-text">{errore}</span>}
    </span>
  )
}
