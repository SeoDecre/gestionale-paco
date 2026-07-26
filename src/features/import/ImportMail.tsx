import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scheda } from '@/components/ui/Scheda'
import { Bottone } from '@/components/ui/Bottone'
import { Campo, Input, Textarea } from '@/components/ui/Campo'
import { Errore } from '@/components/ui/Stato'
import { messaggioErrore } from '@/lib/errors'
import { estraiDaMail, type DatiMail } from './mail'
import { creaLeadDaMail } from './api'

/** "05/08/2026 10:30" -> "2026-08-05T10:30" per <input datetime-local>. */
function aDatetimeLocal(raw: string | null): string {
  if (!raw) return ''
  const m = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\D+(\d{1,2}):(\d{2}))?/)
  if (!m) return ''
  const [, g, mese, anno, h = '09', min = '00'] = m
  return `${anno}-${mese.padStart(2, '0')}-${g.padStart(2, '0')}T${h.padStart(2, '0')}:${min}`
}

export function ImportMail() {
  const navigate = useNavigate()
  const [testo, setTesto] = useState('')
  const [dati, setDati] = useState<DatiMail | null>(null)
  const [quando, setQuando] = useState('')
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, setInCorso] = useState(false)

  function estrai() {
    const d = estraiDaMail(testo)
    setDati(d)
    setQuando(aDatetimeLocal(d.appuntamento))
  }

  const set = <K extends keyof DatiMail>(k: K, v: DatiMail[K]) =>
    setDati((d) => (d ? { ...d, [k]: v } : d))

  async function crea() {
    if (!dati) return
    setInCorso(true)
    setErrore(null)
    try {
      const id = await creaLeadDaMail(dati, quando ? new Date(quando).toISOString() : undefined)
      navigate(`/lead/${id}`)
    } catch (e) {
      setErrore(messaggioErrore(e))
      setInCorso(false)
    }
  }

  return (
    <Scheda titolo="Import da mail call center">
      {!dati && (
        <div className="flex flex-col gap-2">
          <Textarea
            rows={8}
            placeholder="Incolla qui il testo della mail…"
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
          />
          <Bottone onClick={estrai} disabled={!testo.trim()}>
            Estrai dati
          </Bottone>
        </div>
      )}

      {dati && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Campo etichetta="Ragione sociale" className="sm:col-span-2">
              {(id) => (
                <Input id={id} value={dati.ragione_sociale ?? ''} onChange={(e) => set('ragione_sociale', e.target.value || null)} />
              )}
            </Campo>
            <Campo etichetta="P.IVA">
              {(id) => <Input id={id} value={dati.piva ?? ''} onChange={(e) => set('piva', e.target.value || null)} />}
            </Campo>
            <Campo etichetta="Referente">
              {(id) => <Input id={id} value={dati.referente ?? ''} onChange={(e) => set('referente', e.target.value || null)} />}
            </Campo>
            <Campo etichetta="Telefono">
              {(id) => <Input id={id} value={dati.telefono ?? ''} onChange={(e) => set('telefono', e.target.value || null)} />}
            </Campo>
            <Campo etichetta="POS attuale">
              {(id) => <Input id={id} value={dati.pos_attuale ?? ''} onChange={(e) => set('pos_attuale', e.target.value || null)} />}
            </Campo>
            <Campo etichetta="Indirizzo">
              {(id) => <Input id={id} value={dati.indirizzo ?? ''} onChange={(e) => set('indirizzo', e.target.value || null)} />}
            </Campo>
            <Campo etichetta="CAP">
              {(id) => <Input id={id} value={dati.cap ?? ''} onChange={(e) => set('cap', e.target.value || null)} />}
            </Campo>
            <Campo etichetta="Comune">
              {(id) => <Input id={id} value={dati.comune ?? ''} onChange={(e) => set('comune', e.target.value || null)} />}
            </Campo>
            <Campo etichetta="Provincia">
              {(id) => <Input id={id} value={dati.provincia ?? ''} onChange={(e) => set('provincia', e.target.value || null)} />}
            </Campo>
            <Campo etichetta="Appuntamento" className="sm:col-span-2">
              {(id) => <Input id={id} type="datetime-local" value={quando} onChange={(e) => setQuando(e.target.value)} />}
            </Campo>
            <Campo etichetta="Note" className="sm:col-span-2">
              {(id) => <Textarea id={id} value={dati.note ?? ''} onChange={(e) => set('note', e.target.value || null)} />}
            </Campo>
          </div>

          {dati.pos_attuale && (
            <p className="text-etichetta text-testo-debole">
              Nota: “POS attuale” va poi collegato ai chip concorrenti sul lead.
            </p>
          )}
          {errore && <Errore errore={errore} />}

          <div className="flex gap-2">
            <Bottone onClick={crea} disabled={inCorso || !dati.ragione_sociale}>
              {inCorso ? 'Creazione…' : 'Crea lead e appuntamento'}
            </Bottone>
            <Bottone variante="secondario" onClick={() => setDati(null)} disabled={inCorso}>
              Indietro
            </Bottone>
          </div>
        </div>
      )}
    </Scheda>
  )
}
