import { Pillola, type Tinta } from './Pillola'

/**
 * Pillola che usa i colori salvati sulla voce di vocabolario (colore_bg /
 * colore_fg / colore_dot del CRM 3.0). Se la voce non ha colori propri
 * ricade sulla tinta semantica §2, che resta il default dell'app.
 *
 * Il pallino colorato a sinistra è quello che nel 3.0 rendeva riconoscibile
 * uno stato di verifica a colpo d'occhio in una lista lunga.
 */
export function PillolaColorata({
  testo,
  coloreBg,
  coloreFg,
  coloreDot,
  tinta = 'neutro',
}: {
  testo: string
  coloreBg?: string | null
  coloreFg?: string | null
  coloreDot?: string | null
  tinta?: Tinta
}) {
  if (!coloreBg && !coloreFg) {
    return <Pillola tinta={tinta}>{testo}</Pillola>
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-pillola border px-3 py-1 text-etichetta font-medium"
      style={{
        backgroundColor: coloreBg ?? undefined,
        color: coloreFg ?? undefined,
        borderColor: coloreFg ? `${coloreFg}33` : undefined,
      }}
    >
      {coloreDot && (
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: coloreDot }}
        />
      )}
      {testo}
    </span>
  )
}
