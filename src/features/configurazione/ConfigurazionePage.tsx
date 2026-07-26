import { useState } from 'react'
import { EditorOfferte } from './EditorOfferte'
import { EditorParametriTarget } from './EditorParametriTarget'
import { EditorZone } from './EditorZone'
import { EditorEsiti } from './EditorEsiti'
import { EditorVocabolario } from './EditorVocabolario'

type Sezione = 'offerte' | 'target' | 'zone' | 'vocabolari'

const SEZIONI: { chiave: Sezione; etichetta: string }[] = [
  { chiave: 'offerte', etichetta: 'Offerte' },
  { chiave: 'target', etichetta: 'Target' },
  { chiave: 'zone', etichetta: 'Zone' },
  { chiave: 'vocabolari', etichetta: 'Vocabolari' },
]

export function ConfigurazionePage() {
  const [sezione, setSezione] = useState<Sezione>('offerte')

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-titolo font-semibold">Configurazione azienda</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {SEZIONI.map((s) => (
          <button
            key={s.chiave}
            onClick={() => setSezione(s.chiave)}
            className={
              sezione === s.chiave
                ? 'rounded-pillola bg-info-soft-text px-3 py-1.5 text-etichetta text-white'
                : 'rounded-pillola border border-bordo bg-superficie px-3 py-1.5 text-etichetta text-testo-debole'
            }
          >
            {s.etichetta}
          </button>
        ))}
      </div>

      {sezione === 'offerte' && <EditorOfferte />}
      {sezione === 'target' && <EditorParametriTarget />}
      {sezione === 'zone' && <EditorZone />}
      {sezione === 'vocabolari' && (
        <>
          <EditorVocabolario tabella="ruoli_contatto" titolo="Ruoli contatto" />
          <EditorVocabolario tabella="etichette_sede" titolo="Etichette sede" />
          <EditorVocabolario tabella="azioni_successive" titolo="Azioni successive" />
          <EditorVocabolario tabella="concorrenti_pos" titolo="Concorrenti POS" />
          <EditorVocabolario
            tabella="tipi_pos"
            titolo="Tipi POS"
            extra={[{ chiave: 'richiede_iban', etichetta: 'IBAN' }]}
          />
          <EditorEsiti />
        </>
      )}
    </div>
  )
}
