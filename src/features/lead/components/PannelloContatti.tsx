import { useState, type FormEvent } from 'react'
import { Scheda } from '@/components/ui/Scheda'
import { Bottone } from '@/components/ui/Bottone'
import { Input, Select } from '@/components/ui/Campo'
import { Pillola } from '@/components/ui/Pillola'
import { Caricamento, Errore, Vuoto } from '@/components/ui/Stato'
import { testoChiamataAutomatica } from '@/lib/format'
import { useRegistraLavorazione } from '@/features/lavorazioni/queries'
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

export function PannelloContatti({
  leadId,
  brand,
}: {
  leadId: string
  /** Brand a cui attribuire la lavorazione automatica del tasto telefono (§4). */
  brand?: Enum<'brand'>
}) {
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
          <RigaContatto key={c.id} leadId={leadId} contatto={c} brand={brand} />
        ))}
      </ul>
    </Scheda>
  )
}

function RigaContatto({
  leadId,
  contatto,
  brand,
}: {
  leadId: string
  contatto: ContattoConRuolo
  brand?: Enum<'brand'>
}) {
  const principale = useImpostaPrincipale(leadId)
  const elimina = useEliminaContatto(leadId)
  const chiamata = useRegistraLavorazione(leadId)
  const contatti = [contatto.telefono, contatto.email].filter(Boolean).join(' · ')

  /**
   * §4: il tasto verde chiama E registra da solo una lavorazione veloce
   * "Chiamato [nome] il [data] alle [ora]". Non si fa preventDefault: la
   * navigazione a tel: deve partire comunque, anche se la scrittura fallisce
   * o è lenta — Paco sta per parlare col cliente, la telefonata viene prima.
   * Senza brand sul lead non c'è una lavorazione da scrivere (brand è NOT
   * NULL): si chiama e basta, e il tasto lo dice nel titolo.
   */
  function onChiama() {
    if (!brand) return
    chiamata.mutate({
      lav: {
        lead_id: leadId,
        brand,
        contatto_id: contatto.id,
        note: testoChiamataAutomatica(contatto.nome),
      },
    })
  }

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
          {contatto.telefono && (
            <a
              href={`tel:${contatto.telefono.replace(/\s/g, '')}`}
              onClick={onChiama}
              aria-label={`Chiama ${contatto.nome}`}
              title={
                brand
                  ? `Chiama ${contatto.nome} e registra la lavorazione`
                  : `Chiama ${contatto.nome}`
              }
              className="inline-flex h-11 w-11 items-center justify-center rounded-pillola border border-success-soft-border bg-success-soft text-success-soft-text"
            >
              📞
            </a>
          )}
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
      {chiamata.isError && (
        <p className="mt-1 text-etichetta text-danger-soft-text">
          Chiamata partita, ma la lavorazione non è stata salvata.
        </p>
      )}
      {chiamata.isSuccess && (
        <p className="mt-1 text-etichetta text-success-soft-text">
          {testoChiamataAutomatica(contatto.nome, new Date(chiamata.submittedAt))} — registrato.
        </p>
      )}
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
