/**
 * Interruttore tri-stato per i booleani NULL-abili (§10 NEXI): Sì / No / — (non
 * chiesto). Verde per Sì, rosso tenue per No, grigio per il non impostato.
 */
export function TriStato({
  etichetta,
  valore,
  onChange,
}: {
  etichetta: string
  valore: boolean | null
  onChange: (v: boolean | null) => void
}) {
  const opzioni: { label: string; v: boolean | null; on: string }[] = [
    { label: 'Sì', v: true, on: 'bg-success-soft-text text-white' },
    { label: 'No', v: false, on: 'bg-danger-soft-text text-white' },
    { label: '—', v: null, on: 'bg-neutral-soft-text text-white' },
  ]
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-campo">{etichetta}</span>
      <div className="flex flex-shrink-0 overflow-hidden rounded-card border border-bordo">
        {opzioni.map((o) => {
          const attivo = valore === o.v
          return (
            <button
              key={o.label}
              type="button"
              onClick={() => onChange(o.v)}
              className={`px-3 py-1.5 text-etichetta ${attivo ? o.on : 'bg-superficie text-testo-debole'}`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
