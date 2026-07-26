import type { ReactNode } from 'react'
import { Scheda } from '@/components/ui/Scheda'
import { Campo, Input } from '@/components/ui/Campo'
import { TriStato } from '@/components/ui/TriStato'
import { BannerModifiche } from '@/components/ui/BannerModifiche'
import { Caricamento, Errore } from '@/components/ui/Stato'
import { useBozza } from '@/lib/useBozza'
import { useLeadNexi, useSalvaLeadNexi } from './queries'
import { NEXI_VUOTO, type CampiNexi } from './api'

/**
 * Sezioni tecniche NEXI (§10). Da mostrare SOLO se i brand del lead includono
 * NEXI. Booleani tri-stato; alcuni campi appaiono in base alla risposta padre.
 */
export function PannelloNexi({ leadId }: { leadId: string }) {
  const nexi = useLeadNexi(leadId)
  const salva = useSalvaLeadNexi(leadId)

  if (nexi.isLoading) {
    return (
      <Scheda titolo="NEXI — sezioni tecniche" className="mb-4">
        <Caricamento />
      </Scheda>
    )
  }

  return <FormNexi iniziale={estrai(nexi.data)} salva={salva} />
}

function estrai(d: ReturnType<typeof useLeadNexi>['data']): CampiNexi {
  if (!d) return NEXI_VUOTO
  return {
    rateale_interessato: d.rateale_interessato,
    extra_ue_valuta_estera: d.extra_ue_valuta_estera,
    dcc_attivo: d.dcc_attivo,
    amex_attivo: d.amex_attivo,
    amex_continuare: d.amex_continuare,
    amex_attivare: d.amex_attivare,
    canone_attuale: d.canone_attuale,
    commissioni_attuali: d.commissioni_attuali,
    transazioni_sotto_30: d.transazioni_sotto_30,
    transazioni_fuori_sede: d.transazioni_fuori_sede,
    vende_online: d.vende_online,
    ordini_telefonici: d.ordini_telefonici,
  }
}

function FormNexi({
  iniziale,
  salva,
}: {
  iniziale: CampiNexi
  salva: ReturnType<typeof useSalvaLeadNexi>
}) {
  const { bozza, imposta, annulla, modificato } = useBozza<CampiNexi>(iniziale)

  return (
    <Scheda titolo="NEXI — sezioni tecniche" className="mb-4">
      <Gruppo titolo="Multi-POS & pagamenti">
        <TriStato
          etichetta="Interessato al pagamento rateale?"
          valore={bozza.rateale_interessato}
          onChange={(v) => imposta('rateale_interessato', v)}
        />
        <TriStato
          etichetta="Clienti extra-UE con carte in valuta estera?"
          valore={bozza.extra_ue_valuta_estera}
          onChange={(v) => imposta('extra_ue_valuta_estera', v)}
        />
        {bozza.extra_ue_valuta_estera === true && (
          <TriStato
            etichetta="DCC attivo / da segnalare?"
            valore={bozza.dcc_attivo}
            onChange={(v) => imposta('dcc_attivo', v)}
          />
        )}
      </Gruppo>

      <Gruppo titolo="American Express">
        <TriStato
          etichetta="Ha già il servizio Amex?"
          valore={bozza.amex_attivo}
          onChange={(v) => imposta('amex_attivo', v)}
        />
        {bozza.amex_attivo === true && (
          <TriStato
            etichetta="Vuole continuare con Amex?"
            valore={bozza.amex_continuare}
            onChange={(v) => imposta('amex_continuare', v)}
          />
        )}
        {bozza.amex_attivo === false && (
          <TriStato
            etichetta="Vuole attivare Amex?"
            valore={bozza.amex_attivare}
            onChange={(v) => imposta('amex_attivare', v)}
          />
        )}
      </Gruppo>

      <Gruppo titolo="Costi POS attuali">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Campo etichetta="Canone attuale (€)">
            {(id) => (
              <Input
                id={id}
                inputMode="decimal"
                value={bozza.canone_attuale ?? ''}
                onChange={(e) =>
                  imposta(
                    'canone_attuale',
                    e.target.value.trim() === '' ? null : Number(e.target.value.replace(',', '.')),
                  )
                }
              />
            )}
          </Campo>
          <Campo etichetta="Commissioni attuali">
            {(id) => (
              <Input
                id={id}
                value={bozza.commissioni_attuali ?? ''}
                onChange={(e) => imposta('commissioni_attuali', e.target.value || null)}
              />
            )}
          </Campo>
        </div>
      </Gruppo>

      <Gruppo titolo="Operatività & tecnologia">
        <TriStato
          etichetta="Transazioni sotto 30€ frequenti?"
          valore={bozza.transazioni_sotto_30}
          onChange={(v) => imposta('transazioni_sotto_30', v)}
        />
        <TriStato
          etichetta="Vuole vedere le transazioni da fuori sede?"
          valore={bozza.transazioni_fuori_sede}
          onChange={(v) => imposta('transazioni_fuori_sede', v)}
        />
      </Gruppo>

      <Gruppo titolo="Banca & Business">
        <TriStato
          etichetta="Vende online?"
          valore={bozza.vende_online}
          onChange={(v) => imposta('vende_online', v)}
        />
        <TriStato
          etichetta="Riceve ordini telefonici?"
          valore={bozza.ordini_telefonici}
          onChange={(v) => imposta('ordini_telefonici', v)}
        />
      </Gruppo>

      {salva.isError && (
        <div className="mt-3">
          <Errore errore={salva.error} />
        </div>
      )}

      {modificato && (
        <BannerModifiche
          inCorso={salva.isPending}
          onAnnulla={annulla}
          onSalva={() => salva.mutate(bozza)}
        />
      )}
    </Scheda>
  )
}

function Gruppo({ titolo, children }: { titolo: string; children: ReactNode }) {
  return (
    <div className="mb-3 border-b border-bordo pb-3 last:mb-0 last:border-0 last:pb-0">
      <p className="mb-1 text-etichetta font-medium text-testo-debole">{titolo}</p>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}
