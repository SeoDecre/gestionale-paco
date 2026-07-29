import { useState } from 'react'
import { ImportExcel } from './ImportExcel'
import { ImportMail } from './ImportMail'
import { TestataPagina } from '@/components/ui/Scheda'
import { BarraSchede } from '@/components/ui/Schede'

export function ImportPage() {
  const [tab, setTab] = useState<'excel' | 'mail'>('excel')

  return (
    <div className="mx-auto max-w-3xl">
      <TestataPagina
        titolo="Importa"
        descrizione="Lavorazioni, appuntamenti e contatti non vengono mai toccati da un import (§8)."
      />

      <BarraSchede
        voci={[
          { id: 'excel', etichetta: 'Excel aziendale', icona: 'foglio' },
          { id: 'mail', etichetta: 'Mail call center', icona: 'mail' },
        ]}
        attiva={tab}
        onCambia={setTab}
        etichetta="Sorgente da importare"
      />

      <div key={tab} className="animate-comparsa">
        {tab === 'excel' ? <ImportExcel /> : <ImportMail />}
      </div>
    </div>
  )
}
