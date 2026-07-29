import { useState, type FormEvent } from 'react'
import { Chip } from '@/components/ui/Chip'
import { Avviso } from '@/components/ui/Avviso'
import { Bottone } from '@/components/ui/Bottone'
import { Campo, Input, Select, Textarea } from '@/components/ui/Campo'
import { Errore } from '@/components/ui/Stato'
import type { Enum } from '@/types/db'
import { useEsiti, useAzioniSuccessive } from '@/features/vocabolari/queries'
import { useContatti } from '@/features/lead/queries'
import { TUTTI_I_BRAND, BADGE_BRAND } from '@/features/lead/brand'
import { ContatorePos } from '@/features/lead/components/ContatorePos'
import { useSlotSuggeriti } from '@/features/planning/queries'
import { formattaData } from '@/lib/format'
import { useRegistraLavorazione } from './queries'

/**
 * Registra lavorazione (§6): salva la lavorazione e, se spuntato, fissa nello
 * stesso gesto l'appuntamento collegato. Un conflitto di slot (23P01) è mostrato
 * come errore leggibile senza perdere i dati inseriti.
 */
export function FormRegistraLavorazione({
  leadId,
  brandIniziale,
  leadZonaId,
  onFatto,
}: {
  leadId: string
  brandIniziale?: Enum<'brand'>
  leadZonaId?: string | null
  onFatto: () => void
}) {
  const registra = useRegistraLavorazione(leadId)
  const esiti = useEsiti()
  const azioni = useAzioniSuccessive()
  const contatti = useContatti(leadId)

  const [brand, setBrand] = useState<Enum<'brand'>>(brandIniziale ?? 'NEXI')
  const [esitoId, setEsitoId] = useState('')
  const [azioneId, setAzioneId] = useState('')
  const [contattoId, setContattoId] = useState('')
  const [posRichiesti, setPosRichiesti] = useState('')
  const [note, setNote] = useState('')

  const [conApp, setConApp] = useState(false)
  const [quando, setQuando] = useState('')
  const [durata, setDurata] = useState('60')
  const [luogo, setLuogo] = useState('')

  const { suggerimenti } = useSlotSuggeriti(leadZonaId, Number(durata) || 60)

  // La colonna è uno smallint >= 0: quanto non è un intero non negativo non è
  // una dichiarazione, è un campo ancora da compilare.
  const posNumero = Number(posRichiesti)
  const posValido =
    posRichiesti.trim() !== '' && Number.isInteger(posNumero) && posNumero >= 0
  /**
   * Mentre si digita il contatore §5 segue il campo; a campo vuoto `undefined`
   * lo fa tornare all'ultima dichiarazione già registrata sul lead.
   */
  const posDichiaratiOra = posValido ? posNumero : undefined

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    await registra.mutateAsync({
      lav: {
        lead_id: leadId,
        brand,
        esito_id: esitoId || null,
        azione_successiva_id: azioneId || null,
        contatto_id: contattoId || null,
        pos_richiesti: posValido ? posNumero : null,
        note: note.trim() || null,
      },
      appuntamento:
        conApp && quando
          ? {
              inizio: new Date(quando).toISOString(),
              durata_min: Number(durata) || 60,
              luogo: luogo.trim() || null,
            }
          : undefined,
    })
    onFatto()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-card bg-sfondo p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Campo etichetta="Brand">
          {(id) => (
            <Select id={id} value={brand} onChange={(e) => setBrand(e.target.value as Enum<'brand'>)}>
              {TUTTI_I_BRAND.map((b) => (
                <option key={b} value={b}>
                  {BADGE_BRAND[b].etichetta}
                </option>
              ))}
            </Select>
          )}
        </Campo>
        <Campo etichetta="Esito">
          {(id) => (
            <Select id={id} value={esitoId} onChange={(e) => setEsitoId(e.target.value)}>
              <option value="">—</option>
              {(esiti.data ?? []).map((es) => (
                <option key={es.id} value={es.id}>
                  {es.nome}
                </option>
              ))}
            </Select>
          )}
        </Campo>
        <Campo etichetta="Azione successiva">
          {(id) => (
            <Select id={id} value={azioneId} onChange={(e) => setAzioneId(e.target.value)}>
              <option value="">—</option>
              {(azioni.data ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </Select>
          )}
        </Campo>
        <Campo etichetta="Contatto sentito">
          {(id) => (
            <Select id={id} value={contattoId} onChange={(e) => setContattoId(e.target.value)}>
              <option value="">—</option>
              {(contatti.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          )}
        </Campo>
        <Campo etichetta="POS dichiarati a voce">
          {(id) => (
            <div className="flex flex-col gap-1.5">
              <Input
                id={id}
                inputMode="numeric"
                value={posRichiesti}
                onChange={(e) => setPosRichiesti(e.target.value)}
              />
              {/* §5: il censimento reale a confronto con quanto si sta dichiarando. */}
              <ContatorePos leadId={leadId} dichiarati={posDichiaratiOra} />
            </div>
          )}
        </Campo>
      </div>

      <Campo etichetta="Note">
        {(id) => <Textarea id={id} value={note} onChange={(e) => setNote(e.target.value)} />}
      </Campo>

      <label className="flex items-center gap-2 text-etichetta">
        <input type="checkbox" checked={conApp} onChange={(e) => setConApp(e.target.checked)} />
        Fissa un appuntamento
      </label>

      {conApp && suggerimenti.length > 0 && (
        <Avviso icona="orologio" titolo="Slot suggeriti (zona comoda, §6)">
          <div className="mt-1 flex flex-col gap-1">
            {suggerimenti.map((g) => (
              <div
                key={g.giorno}
                className="flex flex-wrap items-center gap-1.5"
              >
                <span className="text-etichetta text-testo-debole">
                  {formattaData(new Date(`${g.giorno}T00:00:00`))}
                </span>
                {g.slot.map((s) => (
                  <Chip
                    key={s.value}
                    attivo={quando === s.value}
                    onClick={() => setQuando(s.value)}
                    className="cifre"
                  >
                    {s.ora}
                  </Chip>
                ))}
              </div>
            ))}
          </div>
        </Avviso>
      )}

      {conApp && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Campo etichetta="Quando" className="sm:col-span-1">
            {(id) => (
              <Input
                id={id}
                type="datetime-local"
                value={quando}
                onChange={(e) => setQuando(e.target.value)}
              />
            )}
          </Campo>
          <Campo etichetta="Durata (min)">
            {(id) => (
              <Input
                id={id}
                inputMode="numeric"
                value={durata}
                onChange={(e) => setDurata(e.target.value)}
              />
            )}
          </Campo>
          <Campo etichetta="Luogo">
            {(id) => <Input id={id} value={luogo} onChange={(e) => setLuogo(e.target.value)} />}
          </Campo>
        </div>
      )}

      {registra.isError && <Errore errore={registra.error} />}

      <div className="flex gap-2">
        <Bottone type="submit" disabled={registra.isPending || (conApp && !quando)}>
          {registra.isPending ? 'Salvataggio…' : 'Registra'}
        </Bottone>
        <Bottone variante="secondario" onClick={onFatto}>
          Annulla
        </Bottone>
      </div>
    </form>
  )
}
