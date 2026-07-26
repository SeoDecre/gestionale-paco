import { useState } from 'react'
import { ImportExcel } from './ImportExcel'
import { ImportMail } from './ImportMail'

export function ImportPage() {
  const [tab, setTab] = useState<'excel' | 'mail'>('excel')

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-titolo font-semibold">Importa</h1>

      <div className="mb-4 flex gap-2">
        {(['excel', 'mail'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              tab === t
                ? 'rounded-pillola bg-info-soft-text px-3 py-1.5 text-etichetta text-white'
                : 'rounded-pillola border border-bordo bg-superficie px-3 py-1.5 text-etichetta text-testo-debole'
            }
          >
            {t === 'excel' ? 'Excel aziendale' : 'Mail call center'}
          </button>
        ))}
      </div>

      {tab === 'excel' ? <ImportExcel /> : <ImportMail />}
    </div>
  )
}
