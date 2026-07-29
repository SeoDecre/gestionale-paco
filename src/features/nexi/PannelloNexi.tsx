import { useState } from 'react'
import { Scheda } from '@/components/ui/Scheda'
import { Campo, Input, Select } from '@/components/ui/Campo'
import { TriStato } from '@/components/ui/TriStato'
import { BarraSchede, Gruppo, type VoceScheda } from '@/components/ui/Schede'
import { PilloleMultiple } from '@/components/ui/Pillole'
import { BannerModifiche } from '@/components/ui/BannerModifiche'
import { Caricamento, Errore } from '@/components/ui/Stato'
import { Avviso } from '@/components/ui/Avviso'
import { useBozza } from '@/lib/useBozza'
import { useLeadNexi, useSalvaLeadNexi } from './queries'
import {
  NEXI_VUOTO,
  TIPI_CARTA,
  MODALITA_POS,
  CONNETTIVITA,
  leggiCommissioni,
  leggiModalita,
  type CampiNexi,
  type CommissioniDettaglio,
} from './api'

/**
 * Intervista commerciale NEXI — §10 più le domande del CRM 3.0, divise nelle
 * stesse sei schede che usava lui. Da mostrare SOLO se i brand del lead
 * includono NEXI.
 *
 * I booleani sono TRI-STATO: "—" vuol dire domanda non posta, che è diverso da
 * "ha risposto no". È la distinzione che fa capire cosa resta da chiedere.
 */

type IdScheda = 'pos' | 'multipos' | 'amex' | 'costi' | 'operativita' | 'banca'

const SCHEDE: VoceScheda<IdScheda>[] = [
  { id: 'pos', etichetta: 'Anagrafica POS', icona: 'pos' },
  { id: 'multipos', etichetta: 'Multi-POS', icona: 'multipos' },
  { id: 'amex', etichetta: 'Amex', icona: 'amex' },
  { id: 'costi', etichetta: 'Costi POS', icona: 'costi' },
  { id: 'operativita', etichetta: 'Operatività', icona: 'operativita' },
  { id: 'banca', etichetta: 'Banca & Business', icona: 'banca' },
]

export function PannelloNexi({ leadId }: { leadId: string }) {
  const nexi = useLeadNexi(leadId)
  const salva = useSalvaLeadNexi(leadId)

  if (nexi.isLoading) {
    return (
      <Scheda titolo="NEXI — intervista commerciale" className="mb-4">
        <Caricamento />
      </Scheda>
    )
  }

  return <FormNexi iniziale={estrai(nexi.data)} salva={salva} />
}

function estrai(d: ReturnType<typeof useLeadNexi>['data']): CampiNexi {
  if (!d) return NEXI_VUOTO
  return {
    sicuro_no_nexi: d.sicuro_no_nexi,
    mai_stato_nexi: d.mai_stato_nexi,
    piva_stessa_punti: d.piva_stessa_punti,
    rateale_interessato: d.rateale_interessato,
    due_iban: d.due_iban,
    differenzia_pagamenti: d.differenzia_pagamenti,
    tasso_interesse: d.tasso_interesse,
    extra_ue_valuta_estera: d.extra_ue_valuta_estera,
    dcc_attivo: d.dcc_attivo,
    amex_attivo: d.amex_attivo,
    amex_continuare: d.amex_continuare,
    amex_attivare: d.amex_attivare,
    canone_attuale: d.canone_attuale,
    commissioni_attuali: d.commissioni_attuali,
    commissioni_dettaglio: leggiCommissioni(d.commissioni_dettaglio),
    difficolta_agenzia: d.difficolta_agenzia,
    storni: d.storni,
    interruzioni_servizio: d.interruzioni_servizio,
    transazioni_sotto_30: d.transazioni_sotto_30,
    transazioni_fuori_sede: d.transazioni_fuori_sede,
    modalita_attuali: leggiModalita(d.modalita_attuali),
    connettivita: d.connettivita,
    soddisfatto_banca: d.soddisfatto_banca,
    cambio_banca: d.cambio_banca,
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
  const [scheda, setScheda] = useState<IdScheda>('pos')

  const commissioni = leggiCommissioni(bozza.commissioni_dettaglio)
  const modalita = leggiModalita(bozza.modalita_attuali)

  const impostaCommissione = (carta: string, v: string) => {
    const next: CommissioniDettaglio = { ...commissioni }
    if (v.trim() === '') delete next[carta]
    else next[carta] = v
    imposta('commissioni_dettaglio', next)
  }

  /** Quante risposte date su questa scheda: aiuta a vedere cosa manca. */
  return (
    <Scheda titolo="NEXI — intervista commerciale" className="mb-4">
      <BarraSchede voci={SCHEDE} attiva={scheda} onCambia={setScheda} />

      {scheda === 'pos' && (
        <Gruppo>
          <TriStato
            etichetta="È sicuro di non avere già un POS NEXI?"
            valore={bozza.sicuro_no_nexi}
            onChange={(v) => imposta('sicuro_no_nexi', v)}
          />
          <TriStato
            etichetta="È mai stato cliente NEXI?"
            valore={bozza.mai_stato_nexi}
            onChange={(v) => imposta('mai_stato_nexi', v)}
          />
          <TriStato
            etichetta="Stessa P.IVA per tutti i punti vendita?"
            valore={bozza.piva_stessa_punti}
            onChange={(v) => imposta('piva_stessa_punti', v)}
          />
        </Gruppo>
      )}

      {scheda === 'multipos' && (
        <Gruppo>
          <TriStato
            etichetta="Servono due IBAN diversi?"
            valore={bozza.due_iban}
            onChange={(v) => imposta('due_iban', v)}
          />
          <TriStato
            etichetta="Vuole differenziare i pagamenti per sede?"
            valore={bozza.differenzia_pagamenti}
            onChange={(v) => imposta('differenzia_pagamenti', v)}
          />
          <TriStato
            etichetta="Interessato al pagamento rateale?"
            valore={bozza.rateale_interessato}
            onChange={(v) => imposta('rateale_interessato', v)}
          />
          {bozza.rateale_interessato === true && (
            <Avviso tinta="successo" icona="suggerimento" titolo="Hey Light">
              Proporre il servizio NEXI di pagamento rateale.
            </Avviso>
          )}
          <Campo etichetta="Tasso di interesse attuale">
            {(id) => (
              <Input
                id={id}
                placeholder="es. 5%, circa 6, non lo sa"
                value={bozza.tasso_interesse ?? ''}
                onChange={(e) => imposta('tasso_interesse', e.target.value || null)}
              />
            )}
          </Campo>
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
      )}

      {scheda === 'amex' && (
        <Gruppo>
          <TriStato
            etichetta="È convenzionato con American Express?"
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
            <>
              <TriStato
                etichetta="Vuole attivare Amex?"
                valore={bozza.amex_attivare}
                onChange={(v) => imposta('amex_attivare', v)}
              />
              <Avviso tinta="successo" icona="target" titolo="Offerta Amex">
                Attivazione gratuita · 0% sui primi 3.000 € · 0,90% fino a
                50.000 € · 1,50% oltre.
              </Avviso>
            </>
          )}
          <Avviso icona="euro" titolo="Commissioni NEXI">
            Esente fino a 3.000 € · 0,90% fino a 50.000 € · 1,50% oltre · Pay by
            Link 0,90% + 2,90 €/mese.
          </Avviso>
        </Gruppo>
      )}

      {scheda === 'costi' && (
        <Gruppo>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Campo etichetta="Canone fisso mensile attuale (€)">
              {(id) => (
                <Input
                  id={id}
                  inputMode="decimal"
                  value={bozza.canone_attuale ?? ''}
                  onChange={(e) =>
                    imposta(
                      'canone_attuale',
                      e.target.value.trim() === ''
                        ? null
                        : Number(e.target.value.replace(',', '.')),
                    )
                  }
                />
              )}
            </Campo>
            <Campo etichetta="Commissioni (nota libera)">
              {(id) => (
                <Input
                  id={id}
                  value={bozza.commissioni_attuali ?? ''}
                  onChange={(e) => imposta('commissioni_attuali', e.target.value || null)}
                />
              )}
            </Campo>
          </div>

          <p className="mb-1 mt-3 text-etichetta font-medium text-testo-debole">
            Commissioni per tipo carta (%)
          </p>
          <div className="flex flex-col gap-2">
            {TIPI_CARTA.map((carta) => (
              <label key={carta} className="flex items-center justify-between gap-3">
                <span className="min-w-0 flex-1 text-campo">{carta}</span>
                <input
                  inputMode="decimal"
                  placeholder="0,00%"
                  value={commissioni[carta] ?? ''}
                  onChange={(e) => impostaCommissione(carta, e.target.value)}
                  className="w-28 shrink-0 superficie-card px-3 py-2 text-campo"
                />
              </label>
            ))}
          </div>
        </Gruppo>
      )}

      {scheda === 'operativita' && (
        <Gruppo>
          <TriStato
            etichetta="Difficoltà a raggiungere l'agenzia?"
            valore={bozza.difficolta_agenzia}
            onChange={(v) => imposta('difficolta_agenzia', v)}
          />
          <TriStato
            etichetta="Ha dovuto stornare transazioni errate?"
            valore={bozza.storni}
            onChange={(v) => imposta('storni', v)}
          />
          <TriStato
            etichetta="Interruzioni di rete o di corrente?"
            valore={bozza.interruzioni_servizio}
            onChange={(v) => imposta('interruzioni_servizio', v)}
          />
          <TriStato
            etichetta="Transazioni sotto 30 € frequenti?"
            valore={bozza.transazioni_sotto_30}
            onChange={(v) => imposta('transazioni_sotto_30', v)}
          />
          <TriStato
            etichetta="Vuole vedere le transazioni da fuori sede?"
            valore={bozza.transazioni_fuori_sede}
            onChange={(v) => imposta('transazioni_fuori_sede', v)}
          />

          <p className="mb-1 mt-3 text-etichetta font-medium text-testo-debole">
            Modalità attualmente usate
          </p>
          <PilloleMultiple
            disponibili={[...MODALITA_POS]}
            scelte={modalita}
            onChange={(v) => imposta('modalita_attuali', v)}
          />

          <Campo etichetta="Connettività disponibile" className="mt-3">
            {(id) => (
              <Select
                id={id}
                value={bozza.connettivita ?? ''}
                onChange={(e) => imposta('connettivita', e.target.value || null)}
              >
                <option value="">— non chiesto —</option>
                {CONNETTIVITA.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            )}
          </Campo>
        </Gruppo>
      )}

      {scheda === 'banca' && (
        <Gruppo>
          <TriStato
            etichetta="Soddisfatto delle condizioni della banca sul POS?"
            valore={bozza.soddisfatto_banca}
            onChange={(v) => imposta('soddisfatto_banca', v)}
          />
          <TriStato
            etichetta="Ha già cambiato banca d'appoggio in passato?"
            valore={bozza.cambio_banca}
            onChange={(v) => imposta('cambio_banca', v)}
          />
          <TriStato
            etichetta="Valuta di vendere online?"
            valore={bozza.vende_online}
            onChange={(v) => imposta('vende_online', v)}
          />
          <TriStato
            etichetta="Riceve ordini telefonici con acconto?"
            valore={bozza.ordini_telefonici}
            onChange={(v) => imposta('ordini_telefonici', v)}
          />
        </Gruppo>
      )}

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
