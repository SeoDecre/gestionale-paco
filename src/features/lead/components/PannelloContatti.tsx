import { useState, type FormEvent } from 'react'
import { Scheda } from '@/components/ui/Scheda'
import { Bottone } from '@/components/ui/Bottone'
import { Input, Select } from '@/components/ui/Campo'
import { Pillola } from '@/components/ui/Pillola'
import { Caricamento, Errore, Vuoto } from '@/components/ui/Stato'
import type { Enum } from '@/types/db'
import type { ContattoConRuolo } from '../api'
import {
  useContatti,
  useCreaContatto,
  useEliminaContatto,
  useImpostaPrincipale,
} from '../queries'
import { useRuoliContatto } from '@/features/vocabolari/queries'

const ETICHETTA_PROVENIENZA: Record<Enum<'provenienza_contatto'>, string> = {
  mail_call_center: 'Call center',
  import_excel: 'Excel',
  manuale: 'Manuale',
}

export function PannelloContatti({ leadId }: { leadId: string }) {
  const contatti = useContatti(leadId)
  const [aggiungi, setAggiungi] = useState(false)

  return (
    <Scheda
      titolo="Contatti"
      azione={
        <button className="text-etichetta text-info-soft-text" onClick={() => setAggiungi((v) => !v)}>
          {aggiungi ? 'Chiudi' : '＋ Aggiungi'}
        </button>
      }
      className="mb-4"
    >
      {aggiungi && <FormContatto leadId={leadId} onFatto={() => setAggiungi(false)} />}

      {contatti.isLoading && <Caricamento />}
      {contatti.isError && <Errore errore={contatti.error} />}
      {contatti.data && contatti.data.length === 0 && !aggiungi && (
        <Vuoto testo="Nessun contatto." />
      )}
      <ul className="flex flex-col gap-2">
        {contatti.data?.map((c) => (
          <RigaContatto key={c.id} leadId={leadId} contatto={c} />
        ))}
      </ul>
    </Scheda>
  )
}

function RigaContatto({ leadId, contatto }: { leadId: string; contatto: ContattoConRuolo }) {
  const principale = useImpostaPrincipale(leadId)
  const elimina = useEliminaContatto(leadId)
  const contatti = [contatto.telefono, contatto.email].filter(Boolean).join(' · ')

  return (
    <li className="rounded-card border border-bordo px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-campo font-medium">
            {contatto.nome}
            {contatto.ruoli_contatto && (
              <span className="text-testo-debole"> · {contatto.ruoli_contatto.nome}</span>
            )}
          </p>
          {contatti && <p className="truncate text-etichetta text-testo-debole">{contatti}</p>}
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          {contatto.principale ? (
            <Pillola tinta="successo">Principale</Pillola>
          ) : (
            <button
              className="text-etichetta text-info-soft-text"
              onClick={() => principale.mutate(contatto.id)}
              disabled={principale.isPending}
            >
              Rendi principale
            </button>
          )}
          <Pillola tinta="neutro">{ETICHETTA_PROVENIENZA[contatto.provenienza]}</Pillola>
          <button
            aria-label="Elimina contatto"
            className="px-1 text-danger-soft-text"
            onClick={() => elimina.mutate(contatto.id)}
            disabled={elimina.isPending}
          >
            ✕
          </button>
        </div>
      </div>
    </li>
  )
}

function FormContatto({ leadId, onFatto }: { leadId: string; onFatto: () => void }) {
  const crea = useCreaContatto(leadId)
  const ruoli = useRuoliContatto()
  const [nome, setNome] = useState('')
  const [ruoloId, setRuoloId] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    await crea.mutateAsync({
      lead_id: leadId,
      nome: nome.trim(),
      ruolo_id: ruoloId || null,
      telefono: telefono.trim() || null,
      email: email.trim() || null,
    })
    onFatto()
  }

  return (
    <form onSubmit={onSubmit} className="mb-3 flex flex-col gap-2 rounded-card bg-sfondo p-3">
      <Input autoFocus placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
      <Select value={ruoloId} onChange={(e) => setRuoloId(e.target.value)}>
        <option value="">— ruolo —</option>
        {(ruoli.data ?? []).map((r) => (
          <option key={r.id} value={r.id}>
            {r.nome}
          </option>
        ))}
      </Select>
      <div className="flex gap-2">
        <Input placeholder="Telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {crea.isError && <Errore errore={crea.error} />}
      <Bottone type="submit" disabled={crea.isPending || !nome.trim()}>
        {crea.isPending ? 'Salvataggio…' : 'Aggiungi contatto'}
      </Bottone>
    </form>
  )
}
