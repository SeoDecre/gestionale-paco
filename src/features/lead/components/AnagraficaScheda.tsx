import { Scheda } from '@/components/ui/Scheda'
import { Campo, Input, Select, Textarea } from '@/components/ui/Campo'
import { Pillola } from '@/components/ui/Pillola'
import { BannerModifiche } from '@/components/ui/BannerModifiche'
import { Errore } from '@/components/ui/Stato'
import { useBozza } from '@/lib/useBozza'
import { pivaValida, capValido, provinciaValida, emailValida } from '@/lib/validazione'
import { formattaEuro } from '@/lib/format'
import { urlGoogleAttivita, urlFacebookAttivita, urlGooglePiva } from '@/lib/ricerche'
import type { Enum, Riga } from '@/types/db'
import type { LeadConBrand } from '../api'
import { useAggiornaLead } from '../queries'
import { useParametriTarget, useZone } from '@/features/vocabolari/queries'
import { useOfferte } from '@/features/offerte/queries'
import { BottonePdfOfferta } from '@/features/offerte/BottonePdfOfferta'
import { BADGE_BRAND } from '../brand'
import { dividiPerTarget } from '../offerta'
import { suggerisciTarget } from '../target'

type CampiAnagrafica = Pick<
  Riga<'lead'>,
  | 'ragione_sociale'
  | 'email'
  | 'sito_web'
  | 'piva'
  | 'codice_fiscale'
  | 'indirizzo'
  | 'civico'
  | 'cap'
  | 'comune'
  | 'provincia'
  | 'fatturato_mensile'
  | 'target'
  | 'zona_manuale'
  | 'zona_id'
  | 'offerta_consigliata_id'
  | 'note'
>

const LETTERE: Enum<'target_lettera'>[] = ['E', 'A', 'B', 'C']

export function AnagraficaScheda({ lead }: { lead: LeadConBrand }) {
  const salva = useAggiornaLead(lead.id)
  const bande = useParametriTarget()
  const zone = useZone()
  const offerte = useOfferte()

  const { bozza, imposta, annulla, modificato } = useBozza<CampiAnagrafica>({
    ragione_sociale: lead.ragione_sociale,
    email: lead.email,
    sito_web: lead.sito_web,
    piva: lead.piva,
    codice_fiscale: lead.codice_fiscale,
    indirizzo: lead.indirizzo,
    civico: lead.civico,
    cap: lead.cap,
    comune: lead.comune,
    provincia: lead.provincia,
    fatturato_mensile: lead.fatturato_mensile,
    target: lead.target,
    zona_manuale: lead.zona_manuale,
    zona_id: lead.zona_id,
    offerta_consigliata_id: lead.offerta_consigliata_id,
    note: lead.note,
  })

  const erroriPiva = pivaValida(bozza.piva) ? null : 'Deve essere di 11 cifre.'
  const erroriCap = capValido(bozza.cap) ? null : '5 cifre.'
  const erroriProv = provinciaValida(bozza.provincia) ? null : '2 lettere (es. NA).'
  const erroriEmail = emailValida(bozza.email) ? null : 'Email non valida.'
  const valido =
    !erroriPiva && !erroriCap && !erroriProv && !erroriEmail && bozza.ragione_sociale.trim() !== ''

  const suggerito = suggerisciTarget(bozza.fatturato_mensile, bande.data ?? [])

  const numero = (v: string): number | null => {
    const n = Number(v.replace(',', '.'))
    return v.trim() === '' || Number.isNaN(n) ? null : n
  }

  // §4 "Verifica dati online". Ricerche costruite sul nome che si sta
  // scrivendo, non su quello salvato: si cerca proprio per correggerlo.
  const gGoogle = urlGoogleAttivita(bozza)
  const gFacebook = urlFacebookAttivita(bozza)
  const gPiva = urlGooglePiva(bozza.piva)

  /**
   * §4: l'offerta consigliata si "pesca dal target". Restano scegliibili solo
   * le offerte attive dei brand del lead — più quella già collegata anche se
   * archiviata, altrimenti archiviare un'offerta cancellerebbe dalla tendina
   * la traccia di cosa era stato proposto (§9).
   */
  const brandLead = new Set(lead.lead_brand.map((b) => b.brand))
  const scegliibili = (offerte.data ?? []).filter(
    (o) =>
      (o.stato === 'attiva' || o.id === bozza.offerta_consigliata_id) &&
      (brandLead.size === 0 || brandLead.has(o.brand)),
  )
  const { consigliate, altre } = dividiPerTarget(scegliibili, bozza.target)
  const offertaScelta = scegliibili.find((o) => o.id === bozza.offerta_consigliata_id)
  const etichettaOfferta = (o: Riga<'offerte'>) =>
    `${BADGE_BRAND[o.brand].etichetta} · ${o.nome}` +
    (o.canone != null ? ` · ${formattaEuro(o.canone)}` : '')

  return (
    <Scheda titolo="Anagrafica" className="mb-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Campo etichetta="Ragione sociale" className="sm:col-span-2">
          {(id) => (
            <Input
              id={id}
              value={bozza.ragione_sociale}
              onChange={(e) => imposta('ragione_sociale', e.target.value)}
            />
          )}
        </Campo>

        <Campo etichetta="Email" errore={erroriEmail}>
          {(id) => (
            <Input
              id={id}
              type="email"
              value={bozza.email ?? ''}
              onChange={(e) => imposta('email', e.target.value || null)}
            />
          )}
        </Campo>
        <Campo etichetta="Sito web">
          {(id) => (
            <Input
              id={id}
              value={bozza.sito_web ?? ''}
              onChange={(e) => imposta('sito_web', e.target.value || null)}
            />
          )}
        </Campo>

        <Campo etichetta="P.IVA" errore={erroriPiva}>
          {(id) => (
            <div className="flex items-center gap-2">
              <Input
                id={id}
                inputMode="numeric"
                value={bozza.piva ?? ''}
                onChange={(e) => imposta('piva', e.target.value || null)}
              />
              {/* §4: tasto ricerca Google sulla P.IVA. */}
              {gPiva && <LinkRicerca href={gPiva} etichetta="Cerca" />}
            </div>
          )}
        </Campo>
        <Campo etichetta="Codice fiscale">
          {(id) => (
            <Input
              id={id}
              value={bozza.codice_fiscale ?? ''}
              onChange={(e) => imposta('codice_fiscale', e.target.value || null)}
            />
          )}
        </Campo>

        <Campo etichetta="Indirizzo">
          {(id) => (
            <Input
              id={id}
              value={bozza.indirizzo ?? ''}
              onChange={(e) => imposta('indirizzo', e.target.value || null)}
            />
          )}
        </Campo>
        <Campo etichetta="Civico">
          {(id) => (
            <Input
              id={id}
              value={bozza.civico ?? ''}
              onChange={(e) => imposta('civico', e.target.value || null)}
            />
          )}
        </Campo>
        <Campo etichetta="CAP" errore={erroriCap}>
          {(id) => (
            <Input
              id={id}
              inputMode="numeric"
              value={bozza.cap ?? ''}
              onChange={(e) => imposta('cap', e.target.value || null)}
            />
          )}
        </Campo>
        <Campo etichetta="Comune">
          {(id) => (
            <Input
              id={id}
              value={bozza.comune ?? ''}
              onChange={(e) => imposta('comune', e.target.value || null)}
            />
          )}
        </Campo>
        <Campo etichetta="Provincia" errore={erroriProv}>
          {(id) => (
            <Input
              id={id}
              maxLength={2}
              value={bozza.provincia ?? ''}
              onChange={(e) => imposta('provincia', e.target.value.toUpperCase() || null)}
            />
          )}
        </Campo>

        {/* Zona: derivata dal CAP, con override manuale opzionale (§7). */}
        <Campo etichetta="Zona" className="sm:col-span-2">
          {() => (
            <div className="flex flex-col gap-2">
              {!bozza.zona_manuale ? (
                <p className="text-campo">
                  {lead.zone?.nome ?? <span className="text-testo-debole">Derivata dal CAP</span>}
                </p>
              ) : (
                <Select
                  value={bozza.zona_id ?? ''}
                  onChange={(e) => imposta('zona_id', e.target.value || null)}
                >
                  <option value="">— nessuna —</option>
                  {(zone.data ?? []).map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.nome}
                    </option>
                  ))}
                </Select>
              )}
              <label className="flex items-center gap-2 text-etichetta text-testo-debole">
                <input
                  type="checkbox"
                  checked={bozza.zona_manuale}
                  onChange={(e) => imposta('zona_manuale', e.target.checked)}
                />
                Imposta zona manualmente
              </label>
            </div>
          )}
        </Campo>

        {/* Fatturato mensile + suggerimento target (§4: mai auto-applicato). */}
        <Campo etichetta="Fatturato mensile (€)">
          {(id) => (
            <Input
              id={id}
              inputMode="decimal"
              value={bozza.fatturato_mensile ?? ''}
              onChange={(e) => imposta('fatturato_mensile', numero(e.target.value))}
            />
          )}
        </Campo>
        <Campo etichetta="Target">
          {(id) => (
            <div className="flex items-center gap-2">
              <Select
                id={id}
                value={bozza.target ?? ''}
                onChange={(e) =>
                  imposta('target', (e.target.value || null) as Enum<'target_lettera'> | null)
                }
              >
                <option value="">—</option>
                {LETTERE.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </Select>
              {suggerito && suggerito !== bozza.target && (
                <button
                  type="button"
                  onClick={() => imposta('target', suggerito)}
                  className="flex items-center gap-1 whitespace-nowrap text-etichetta text-info-soft-text"
                >
                  Suggerito <Pillola tinta="avviso">{suggerito}</Pillola> Applica
                </button>
              )}
            </div>
          )}
        </Campo>

        {/* §4: offerta consigliata, pescata dal target ma scelta a mano. */}
        <Campo etichetta="Offerta consigliata" className="sm:col-span-2">
          {(id) => (
            <div className="flex flex-col gap-1.5">
              <Select
                id={id}
                value={bozza.offerta_consigliata_id ?? ''}
                onChange={(e) => imposta('offerta_consigliata_id', e.target.value || null)}
              >
                <option value="">— nessuna —</option>
                {consigliate.length > 0 && (
                  <optgroup
                    label={
                      bozza.target ? `Adatte al target ${bozza.target}` : 'Senza vincolo di target'
                    }
                  >
                    {consigliate.map((o) => (
                      <option key={o.id} value={o.id}>
                        {etichettaOfferta(o)}
                      </option>
                    ))}
                  </optgroup>
                )}
                {altre.length > 0 && (
                  <optgroup label="Fuori target">
                    {altre.map((o) => (
                      <option key={o.id} value={o.id}>
                        {etichettaOfferta(o)}
                      </option>
                    ))}
                  </optgroup>
                )}
              </Select>
              {offertaScelta && (
                <div className="flex flex-wrap items-center gap-2 text-etichetta text-testo-debole">
                  {offertaScelta.stato === 'archiviata' && (
                    <Pillola tinta="neutro">Archiviata</Pillola>
                  )}
                  {offertaScelta.descrizione && <span>{offertaScelta.descrizione}</span>}
                  <BottonePdfOfferta path={offertaScelta.pdf_path} etichetta="Apri PDF offerta" />
                </div>
              )}
              {scegliibili.length === 0 && (
                <span className="text-etichetta text-testo-debole">
                  Nessuna offerta attiva per i brand di questo lead — si creano in Configurazione.
                </span>
              )}
            </div>
          )}
        </Campo>

        {/* §4: verifica dati online, basata sul nome attività. */}
        <Campo etichetta="Verifica dati online" className="sm:col-span-2">
          {() => (
            <div className="flex flex-wrap items-center gap-2">
              {gGoogle && <LinkRicerca href={gGoogle} etichetta="Google" />}
              {gFacebook && <LinkRicerca href={gFacebook} etichetta="Facebook" />}
              {!gGoogle && (
                <span className="text-etichetta text-testo-debole">
                  Serve la ragione sociale.
                </span>
              )}
            </div>
          )}
        </Campo>

        <Campo etichetta="Note" className="sm:col-span-2">
          {(id) => (
            <Textarea
              id={id}
              value={bozza.note ?? ''}
              onChange={(e) => imposta('note', e.target.value || null)}
            />
          )}
        </Campo>
      </div>

      {salva.isError && (
        <div className="mt-3">
          <Errore errore={salva.error} />
        </div>
      )}

      {modificato && (
        <BannerModifiche
          inCorso={salva.isPending}
          onAnnulla={annulla}
          onSalva={() => {
            if (valido) salva.mutate(bozza)
          }}
        />
      )}
    </Scheda>
  )
}

/**
 * Link di ricerca esterna §4. Scheda nuova (`_blank`) con `noreferrer`: il lead
 * si sta modificando, non deve sparire sotto i piedi. Altezza 44px come i
 * bottoni — qui è un <a>, la regola CSS globale non lo raggiunge.
 */
function LinkRicerca({ href, etichetta }: { href: string; etichetta: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-11 items-center rounded-card border border-info-soft-border bg-info-soft px-3 text-etichetta font-medium text-info-soft-text"
    >
      🔍 {etichetta}
    </a>
  )
}
