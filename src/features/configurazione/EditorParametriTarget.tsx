import { useState } from 'react'
import { Scheda } from '@/components/ui/Scheda'
import { Caricamento, Errore } from '@/components/ui/Stato'
import { useParametriTarget, useAggiornaParametroTarget } from '@/features/vocabolari/queries'
import type { Riga } from '@/types/db'

/**
 * Editor delle soglie target E/A/B/C (§9), in valore ANNUO. Vuoto = illimitato
 * (min vuoto su C, max vuoto su E). Salvataggio al blur del campo.
 */
export function EditorParametriTarget() {
  const bande = useParametriTarget()

  return (
    <Scheda titolo="Parametri target (soglie annue)" className="mb-4">
      {bande.isLoading && <Caricamento />}
      {bande.isError && <Errore errore={bande.error} />}
      <div className="flex flex-col gap-2">
        {bande.data?.map((b) => (
          <RigaBanda key={b.id} banda={b} />
        ))}
      </div>
      <p className="mt-2 text-etichetta text-testo-debole">
        Lascia vuoto per “nessun limite”. Le soglie sono annue; il lead memorizza il
        fatturato mensile (× 12).
      </p>
    </Scheda>
  )
}

function RigaBanda({ banda }: { banda: Riga<'parametri_target'> }) {
  const salva = useAggiornaParametroTarget()
  const [min, setMin] = useState(banda.soglia_min_annua?.toString() ?? '')
  const [max, setMax] = useState(banda.soglia_max_annua?.toString() ?? '')

  const num = (v: string): number | null => {
    const n = Number(v.replace(',', '.'))
    return v.trim() === '' || Number.isNaN(n) ? null : n
  }

  const salvaCampo = (campo: 'soglia_min_annua' | 'soglia_max_annua', v: string) =>
    salva.mutate({ id: banda.id, patch: { [campo]: num(v) } })

  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-titolo font-semibold text-warning-soft-text">{banda.target}</span>
      <input
        inputMode="numeric"
        placeholder="min €"
        value={min}
        onChange={(e) => setMin(e.target.value)}
        onBlur={() => salvaCampo('soglia_min_annua', min)}
        className="w-32 rounded-card border border-bordo px-2 py-1.5 text-campo"
      />
      <span className="text-testo-debole">–</span>
      <input
        inputMode="numeric"
        placeholder="max €"
        value={max}
        onChange={(e) => setMax(e.target.value)}
        onBlur={() => salvaCampo('soglia_max_annua', max)}
        className="w-32 rounded-card border border-bordo px-2 py-1.5 text-campo"
      />
      {salva.isError && <Errore errore={salva.error} />}
    </div>
  )
}
