import { Scheda } from '@/components/ui/Scheda'
import { Campo, Input, Select } from '@/components/ui/Campo'
import { TriStato } from '@/components/ui/TriStato'
import { BannerModifiche } from '@/components/ui/BannerModifiche'
import { Caricamento, Errore } from '@/components/ui/Stato'
import { useBozza } from '@/lib/useBozza'
import { BADGE_BRAND } from '@/features/lead/brand'
import type { Enum, Riga } from '@/types/db'
import { useCampiAttivi, useValoriCampi, useSalvaValoriCampi } from './queries'
import { leggiOpzioni } from './api'

/**
 * Risposte ai campi personalizzati del brand, sulla scheda lead (CRM 3.0).
 * Non si mostra nulla se per quel brand non è stato configurato niente: una
 * scheda vuota sarebbe solo rumore.
 */
export function PannelloCampi({ leadId, brand }: { leadId: string; brand: Enum<'brand'> }) {
  const campi = useCampiAttivi(brand)
  const valori = useValoriCampi(leadId)
  const salva = useSalvaValoriCampi(leadId)

  if (campi.isLoading || valori.isLoading) {
    return (
      <Scheda titolo={`${BADGE_BRAND[brand].etichetta} — domande aggiuntive`} className="mb-4">
        <Caricamento />
      </Scheda>
    )
  }
  if (!campi.data || campi.data.length === 0) return null

  const iniziale: Record<string, string> = {}
  for (const c of campi.data) {
    iniziale[c.id] = valori.data?.find((v) => v.campo_id === c.id)?.valore ?? ''
  }

  return (
    <FormCampi
      // Rimonta se cambia l'insieme dei campi configurati.
      key={campi.data.map((c) => c.id).join(',')}
      brand={brand}
      campi={campi.data}
      iniziale={iniziale}
      salva={salva}
    />
  )
}

function FormCampi({
  brand,
  campi,
  iniziale,
  salva,
}: {
  brand: Enum<'brand'>
  campi: Riga<'campi_config'>[]
  iniziale: Record<string, string>
  salva: ReturnType<typeof useSalvaValoriCampi>
}) {
  const { bozza, imposta, annulla, modificato } = useBozza<Record<string, string>>(iniziale)
  const sezioni = Array.from(new Set(campi.map((c) => c.sezione)))

  return (
    <Scheda titolo={`${BADGE_BRAND[brand].etichetta} — domande aggiuntive`} className="mb-4">
      {sezioni.map((sez) => (
        <div key={sez} className="mb-3 border-b border-bordo pb-3 last:mb-0 last:border-0 last:pb-0">
          <p className="mb-1.5 text-etichetta font-medium text-testo-debole">{sez}</p>
          <div className="flex flex-col gap-3">
            {campi
              .filter((c) => c.sezione === sez)
              .map((c) => (
                <CampoDinamico
                  key={c.id}
                  campo={c}
                  valore={bozza[c.id] ?? ''}
                  onChange={(v) => imposta(c.id, v)}
                />
              ))}
          </div>
        </div>
      ))}

      {salva.isError && (
        <div className="mt-3">
          <Errore errore={salva.error} />
        </div>
      )}

      {modificato && (
        <BannerModifiche
          inCorso={salva.isPending}
          onAnnulla={annulla}
          onSalva={() =>
            salva.mutate(
              campi.map((c) => ({ campo_id: c.id, valore: bozza[c.id] || null })),
            )
          }
        />
      )}
    </Scheda>
  )
}

/** Il controllo giusto per il tipo dichiarato in configurazione. */
function CampoDinamico({
  campo,
  valore,
  onChange,
}: {
  campo: Riga<'campi_config'>
  valore: string
  onChange: (v: string) => void
}) {
  if (campo.tipo === 'si_no') {
    // Stessa convenzione tri-stato del resto dell'app: '' = non chiesto.
    return (
      <TriStato
        etichetta={campo.etichetta}
        valore={valore === '' ? null : valore === 'si'}
        onChange={(v) => onChange(v === null ? '' : v ? 'si' : 'no')}
      />
    )
  }

  return (
    <Campo etichetta={campo.etichetta}>
      {(id) =>
        campo.tipo === 'tendina' ? (
          <Select id={id} value={valore} onChange={(e) => onChange(e.target.value)}>
            <option value="">—</option>
            {leggiOpzioni(campo.opzioni).map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
        ) : (
          <Input
            id={id}
            type={campo.tipo === 'data' ? 'date' : 'text'}
            inputMode={campo.tipo === 'numero' ? 'decimal' : undefined}
            value={valore}
            onChange={(e) => onChange(e.target.value)}
          />
        )
      }
    </Campo>
  )
}
