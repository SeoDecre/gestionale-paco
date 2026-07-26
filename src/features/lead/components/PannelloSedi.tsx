import { useState, type FormEvent } from 'react'
import { Scheda } from '@/components/ui/Scheda'
import { Bottone } from '@/components/ui/Bottone'
import { Input, Select } from '@/components/ui/Campo'
import { Pillola } from '@/components/ui/Pillola'
import { Caricamento, Errore, Vuoto } from '@/components/ui/Stato'
import { ibanValido } from '@/lib/validazione'
import { indirizzoCompleto } from '@/lib/maps'
import type { SedeConPos, PosConTipo } from '../api'
import {
  useSedi,
  useCreaSede,
  useEliminaSede,
  useCreaPos,
  useEliminaPos,
} from '../queries'
import { useEtichetteSede, useTipiPos } from '@/features/vocabolari/queries'

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
          <button className="text-etichetta text-info-soft-text" onClick={() => setAggiungi((v) => !v)}>
            {aggiungi ? 'Chiudi' : '＋ Aggiungi'}
          </button>
        )
      }
      className="mb-4"
    >
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
  const [aggiungiPos, setAggiungiPos] = useState(false)
  const indirizzo = indirizzoCompleto(sede)

  return (
    <div className="rounded-card border border-bordo p-3">
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
        <button
          aria-label="Elimina sede"
          className="px-1 text-danger-soft-text"
          onClick={() => elimina.mutate(sede.id)}
          disabled={elimina.isPending}
        >
          ✕
        </button>
      </div>

      {/* Censimento POS della sede (§5) */}
      <div className="mt-2 border-t border-bordo pt-2">
        <div className="flex items-center justify-between">
          <span className="text-etichetta text-testo-debole">POS censiti</span>
          <button className="text-etichetta text-info-soft-text" onClick={() => setAggiungiPos((v) => !v)}>
            {aggiungiPos ? 'Chiudi' : '＋ POS'}
          </button>
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
  return (
    <li className="flex items-center justify-between gap-2 text-etichetta">
      <span>
        <Pillola tinta="pericolo">{pos.tipi_pos?.nome ?? 'POS'}</Pillola>
        {pos.iban && <span className="ml-2 text-testo-debole">{pos.iban}</span>}
      </span>
      <button
        aria-label="Elimina POS"
        className="px-1 text-danger-soft-text"
        onClick={() => elimina.mutate(pos.id)}
        disabled={elimina.isPending}
      >
        ✕
      </button>
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
  const [tipoId, setTipoId] = useState('')
  const [iban, setIban] = useState('')
  const [seriale, setSeriale] = useState('')

  const tipo = tipi.data?.find((t) => t.id === tipoId)
  const chiedeIban = tipo?.richiede_iban ?? false
  const ibanOk = ibanValido(iban)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (chiedeIban && !ibanOk) return
    await crea.mutateAsync({
      sede_id: sedeId,
      tipo_pos_id: tipoId || null,
      iban: chiedeIban ? iban.trim().toUpperCase() || null : null,
      seriale: seriale.trim() || null,
    })
    onFatto()
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 flex flex-col gap-2 rounded-card bg-sfondo p-3">
      <Select value={tipoId} onChange={(e) => setTipoId(e.target.value)}>
        <option value="">— tipo POS —</option>
        {(tipi.data ?? []).map((t) => (
          <option key={t.id} value={t.id}>
            {t.nome}
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
      {crea.isError && <Errore errore={crea.error} />}
      <Bottone type="submit" disabled={crea.isPending || (chiedeIban && !!iban && !ibanOk)}>
        {crea.isPending ? 'Salvataggio…' : 'Aggiungi POS'}
      </Bottone>
    </form>
  )
}
