import { useState, type FormEvent } from 'react'
import { Scheda } from '@/components/ui/Scheda'
import { Bottone, BottoneIcona } from '@/components/ui/Bottone'
import { Input, Select } from '@/components/ui/Campo'
import { Pillola } from '@/components/ui/Pillola'
import { Caricamento, Errore, Vuoto } from '@/components/ui/Stato'
import { RiconosciIndirizzo } from '@/components/ui/RiconosciIndirizzo'
import { ibanValido } from '@/lib/validazione'
import { indirizzoCompleto } from '@/lib/maps'
import type { IndirizzoAnalizzato } from '@/lib/indirizzo'
import type { SedeConPos, PosConTipo } from '../api'
import {
  useSedi,
  useCreaSede,
  useAggiornaSede,
  useEliminaSede,
  useCreaPos,
  useEliminaPos,
} from '../queries'
import { useEtichetteSede, useTipiPos, useEsigenzePos } from '@/features/vocabolari/queries'
import { ContatorePos } from './ContatorePos'

const MAX_SEDI = 4

export function PannelloSedi({ leadId }: { leadId: string }) {
  const sedi = useSedi(leadId)
  const [aggiungi, setAggiungi] = useState(false)
  const numero = sedi.data?.length ?? 0
  const pieno = numero >= MAX_SEDI

  return (
    <Scheda
      titolo={`Sedi (${numero}/${MAX_SEDI})`}
      azione={
        !pieno && (
          <Bottone
            variante="fantasma"
            misura="sm"
            icona={aggiungi ? 'chiudi' : 'aggiungi'}
            onClick={() => setAggiungi((v) => !v)}
          >
            {aggiungi ? 'Chiudi' : 'Aggiungi'}
          </Bottone>
        )
      }
      className="mb-4"
    >
      {/* §4: confronto fra POS dichiarati a voce e POS davvero censiti. */}
      <div className="mb-3">
        <ContatorePos leadId={leadId} />
      </div>

      {aggiungi && !pieno && <FormSede leadId={leadId} onFatto={() => setAggiungi(false)} />}

      {sedi.isLoading && <Caricamento />}
      {sedi.isError && <Errore errore={sedi.error} />}
      {numero === 0 && !aggiungi && <Vuoto testo="Nessuna sede censita." />}

      <div className="flex flex-col gap-3">
        {sedi.data?.map((s) => (
          <SchedaSede key={s.id} leadId={leadId} sede={s} />
        ))}
      </div>
    </Scheda>
  )
}

function SchedaSede({ leadId, sede }: { leadId: string; sede: SedeConPos }) {
  const elimina = useEliminaSede(leadId)
  const aggiorna = useAggiornaSede(leadId)
  const [aggiungiPos, setAggiungiPos] = useState(false)
  const indirizzo = indirizzoCompleto(sede)

  return (
    <div
      className={`rounded-card border p-3 ${
        sede.principale ? 'border-info-soft-border bg-info-soft/30' : 'border-bordo'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-campo font-medium">
            {sede.nome ?? `Sede ${sede.slot}`}
            {sede.etichette_sede && (
              <span className="text-testo-debole"> · {sede.etichette_sede.nome}</span>
            )}
          </p>
          {indirizzo && <p className="text-etichetta text-testo-debole">{indirizzo}</p>}
        </div>
        <BottoneIcona
          nome="elimina"
          etichetta="Elimina sede"
          className="text-danger-soft-text"
          onClick={() => elimina.mutate(sede.id)}
          disabled={elimina.isPending}
        />
      </div>

      {/* Principale = quella per mappa e corrispondenza; consegna POS = dove
          arriva materialmente il terminale. Non coincidono sempre, ed è
          l'informazione che fa sbagliare le consegne quando manca (§ 3.0). */}
      <div className="mt-2 flex flex-wrap gap-3">
        <label className="flex items-center gap-1.5 text-etichetta text-testo-debole">
          <input
            type="radio"
            name={`principale-${sede.lead_id}`}
            checked={sede.principale}
            onChange={() => aggiorna.mutate({ id: sede.id, patch: { principale: true } })}
          />
          Principale
        </label>
        <label className="flex items-center gap-1.5 text-etichetta text-testo-debole">
          <input
            type="checkbox"
            checked={sede.consegna_pos}
            onChange={(e) =>
              aggiorna.mutate({ id: sede.id, patch: { consegna_pos: e.target.checked } })
            }
          />
          Consegna POS
        </label>
        {sede.consegna_pos && (
          <Pillola tinta="avviso" icona="allegato">
            Consegna qui
          </Pillola>
        )}
      </div>

      {/* Censimento POS della sede (§5) */}
      <div className="mt-2 border-t border-bordo pt-2">
        <div className="flex items-center justify-between">
          <span className="text-etichetta text-testo-debole">POS censiti</span>
          <Bottone
            variante="fantasma"
            misura="sm"
            icona={aggiungiPos ? 'chiudi' : 'aggiungi'}
            onClick={() => setAggiungiPos((v) => !v)}
          >
            {aggiungiPos ? 'Chiudi' : 'POS'}
          </Bottone>
        </div>
        <ul className="mt-1 flex flex-col gap-1">
          {sede.sedi_pos.map((p) => (
            <RigaPos key={p.id} leadId={leadId} pos={p} />
          ))}
        </ul>
        {aggiungiPos && (
          <FormPos leadId={leadId} sedeId={sede.id} onFatto={() => setAggiungiPos(false)} />
        )}
      </div>
    </div>
  )
}

function RigaPos({ leadId, pos }: { leadId: string; pos: PosConTipo }) {
  const elimina = useEliminaPos(leadId)
  const esigenze = useEsigenzePos()
  const esigenza = esigenze.data?.find((e) => e.id === pos.esigenza_id)

  const dettagli = [
    pos.iban,
    pos.seriale,
    esigenza?.nome,
    pos.differenzia_pagamenti ? 'pagamenti differenziati' : null,
    pos.amex ? 'Amex' : null,
    pos.note,
  ].filter(Boolean)

  return (
    <li className="flex items-start justify-between gap-2 text-etichetta">
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-1.5">
          <Pillola tinta="pericolo">{pos.tipi_pos?.nome ?? 'POS'}</Pillola>
          {pos.quantita > 1 && <span className="font-medium">×{pos.quantita}</span>}
        </span>
        {dettagli.length > 0 && (
          <span className="mt-0.5 block text-testo-debole">{dettagli.join(' · ')}</span>
        )}
      </span>
      <BottoneIcona
          nome="elimina"
          etichetta="Elimina POS"
          className="text-danger-soft-text"
          onClick={() => elimina.mutate(pos.id)}
          disabled={elimina.isPending}
        />
    </li>
  )
}

function FormSede({ leadId, onFatto }: { leadId: string; onFatto: () => void }) {
  const crea = useCreaSede(leadId)
  const etichette = useEtichetteSede()
  const [nome, setNome] = useState('')
  const [etichettaId, setEtichettaId] = useState('')
  const [indirizzo, setIndirizzo] = useState('')
  const [civico, setCivico] = useState('')
  const [cap, setCap] = useState('')
  const [comune, setComune] = useState('')
  const [provincia, setProvincia] = useState('')
  const [consegnaPos, setConsegnaPos] = useState(false)

  /** Riempie i campi da "incolla e riconosci" / autocompletamento. */
  function applica(a: IndirizzoAnalizzato) {
    if (a.indirizzo) setIndirizzo(a.indirizzo)
    if (a.civico) setCivico(a.civico)
    if (a.cap) setCap(a.cap)
    if (a.comune) setComune(a.comune)
    if (a.provincia) setProvincia(a.provincia)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    await crea.mutateAsync({
      lead_id: leadId,
      nome: nome.trim() || null,
      etichetta_id: etichettaId || null,
      indirizzo: indirizzo.trim() || null,
      civico: civico.trim() || null,
      cap: cap.trim() || null,
      comune: comune.trim() || null,
      provincia: provincia.trim() || null,
      consegna_pos: consegnaPos,
    })
    onFatto()
  }

  return (
    <form onSubmit={onSubmit} className="mb-3 flex flex-col gap-2 rounded-card bg-sfondo p-3">
      <Input
        placeholder="Nome sede (come su scontrino POS)"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />
      <Select value={etichettaId} onChange={(e) => setEtichettaId(e.target.value)}>
        <option value="">— etichetta —</option>
        {(etichette.data ?? []).map((et) => (
          <option key={et.id} value={et.id}>
            {et.nome}
          </option>
        ))}
      </Select>

      <RiconosciIndirizzo onApplica={applica} />

      <div className="flex gap-2">
        <Input placeholder="Indirizzo" value={indirizzo} onChange={(e) => setIndirizzo(e.target.value)} />
        <Input placeholder="Civico" className="w-24" value={civico} onChange={(e) => setCivico(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Input placeholder="CAP" className="w-28" value={cap} onChange={(e) => setCap(e.target.value)} />
        <Input placeholder="Comune" value={comune} onChange={(e) => setComune(e.target.value)} />
        <Input
          placeholder="Prov"
          className="w-20"
          maxLength={2}
          value={provincia}
          onChange={(e) => setProvincia(e.target.value.toUpperCase())}
        />
      </div>
      <label className="flex items-center gap-2 text-etichetta text-testo-debole">
        <input
          type="checkbox"
          checked={consegnaPos}
          onChange={(e) => setConsegnaPos(e.target.checked)}
        />
        Qui va consegnato il POS
      </label>
      {crea.isError && <Errore errore={crea.error} />}
      <Bottone type="submit" disabled={crea.isPending}>
        {crea.isPending ? 'Salvataggio…' : 'Aggiungi sede'}
      </Bottone>
    </form>
  )
}

function FormPos({
  leadId,
  sedeId,
  onFatto,
}: {
  leadId: string
  sedeId: string
  onFatto: () => void
}) {
  const crea = useCreaPos(leadId)
  const tipi = useTipiPos()
  const esigenze = useEsigenzePos()
  const [tipoId, setTipoId] = useState('')
  const [iban, setIban] = useState('')
  const [seriale, setSeriale] = useState('')
  const [quantita, setQuantita] = useState('1')
  const [esigenzaId, setEsigenzaId] = useState('')
  const [differenzia, setDifferenzia] = useState(false)
  const [amex, setAmex] = useState(false)
  const [note, setNote] = useState('')

  const tipo = tipi.data?.find((t) => t.id === tipoId)
  const chiedeIban = tipo?.richiede_iban ?? false
  const ibanOk = ibanValido(iban)
  const q = Number(quantita)
  const quantitaOk = Number.isInteger(q) && q >= 1 && q <= 99

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (chiedeIban && !ibanOk) return
    if (!quantitaOk) return
    await crea.mutateAsync({
      sede_id: sedeId,
      tipo_pos_id: tipoId || null,
      iban: chiedeIban ? iban.trim().toUpperCase() || null : null,
      seriale: seriale.trim() || null,
      quantita: q,
      esigenza_id: esigenzaId || null,
      differenzia_pagamenti: differenzia,
      amex,
      note: note.trim() || null,
    })
    onFatto()
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 flex flex-col gap-2 rounded-card bg-sfondo p-3">
      <div className="flex gap-2">
        <Select value={tipoId} onChange={(e) => setTipoId(e.target.value)}>
          <option value="">— tipo POS —</option>
          {(tipi.data ?? []).map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </Select>
        <Input
          className="w-20"
          inputMode="numeric"
          aria-label="Quantità"
          placeholder="Qtà"
          value={quantita}
          onChange={(e) => setQuantita(e.target.value)}
        />
      </div>
      {!quantitaOk && (
        <p className="text-etichetta text-danger-soft-text">La quantità va da 1 a 99.</p>
      )}

      <Select value={esigenzaId} onChange={(e) => setEsigenzaId(e.target.value)}>
        <option value="">— esigenza —</option>
        {(esigenze.data ?? []).map((es) => (
          <option key={es.id} value={es.id}>
            {es.nome}
          </option>
        ))}
      </Select>

      {chiedeIban && (
        <Input
          placeholder="IBAN"
          value={iban}
          onChange={(e) => setIban(e.target.value.toUpperCase())}
        />
      )}
      {chiedeIban && iban && !ibanOk && (
        <p className="text-etichetta text-danger-soft-text">IBAN non valido.</p>
      )}
      <Input placeholder="Seriale (opz.)" value={seriale} onChange={(e) => setSeriale(e.target.value)} />

      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-1.5 text-etichetta text-testo-debole">
          <input
            type="checkbox"
            checked={differenzia}
            onChange={(e) => setDifferenzia(e.target.checked)}
          />
          Pagamenti differenziati
        </label>
        <label className="flex items-center gap-1.5 text-etichetta text-testo-debole">
          <input type="checkbox" checked={amex} onChange={(e) => setAmex(e.target.checked)} />
          Amex
        </label>
      </div>

      <Input placeholder="Note (opz.)" value={note} onChange={(e) => setNote(e.target.value)} />

      {crea.isError && <Errore errore={crea.error} />}
      <Bottone
        type="submit"
        disabled={crea.isPending || !quantitaOk || (chiedeIban && !!iban && !ibanOk)}
      >
        {crea.isPending ? 'Salvataggio…' : 'Aggiungi POS'}
      </Bottone>
    </form>
  )
}
