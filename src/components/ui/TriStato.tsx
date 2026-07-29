import { Segmentato, type Opzione } from './Segmentato'

/**
 * Interruttore tri-stato per i booleani NULL-abili (§10 NEXI): Sì / No / — (non
 * chiesto). Verde per Sì, rosso tenue per No, grigio per il non impostato.
 *
 * "Non chiesto" e' un valore vero e proprio, distinto da "No": in
 * un'intervista sul campo la differenza fra le due cose e' l'informazione.
 */
const OPZIONI: Opzione<boolean | null>[] = [
  { valore: true, etichetta: 'Sì', tinta: 'successo' },
  { valore: false, etichetta: 'No', tinta: 'pericolo' },
  { valore: null, etichetta: '—', tinta: 'neutro' },
]

export function TriStato({
  etichetta,
  valore,
  onChange,
}: {
  etichetta: string
  valore: boolean | null
  onChange: (v: boolean | null) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-campo">{etichetta}</span>
      <Segmentato
        etichetta={etichetta}
        opzioni={OPZIONI}
        valore={valore}
        onChange={onChange}
      />
    </div>
  )
}
