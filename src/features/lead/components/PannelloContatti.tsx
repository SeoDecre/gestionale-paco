import { useState, type FormEvent } from 'react'
import { Scheda } from '@/components/ui/Scheda'
import { Bottone, BottoneIcona } from '@/components/ui/Bottone'
import { Campo, Input, Select } from '@/components/ui/Campo'
import { Pillola } from '@/components/ui/Pillola'
import { Icona } from '@/components/ui/Icona'
import { Avviso } from '@/components/ui/Avviso'
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
      icona="persona"
      azione={
        <Bottone
          variante="fantasma"
          misura="sm"
          icona={aggiungi ? 'chiudi' : 'aggiungi'}
          onClick={() => setAggiungi((v) => !v)}
        >
          {aggiungi ? 'Chiudi' : 'Aggiungi'}
        </Bottone>
      }
      className="mb-4"
    >
      {aggiungi && (
        <FormContatto leadId={leadId} onFatto={() => setAggiungi(false)} />
      )}

      {contatti.isLoading && <Caricamento />}
      {contatti.isError && <Errore errore={contatti.error} />}
      {contatti.data && contatti.data.length === 0 && !aggiungi && (
        <Vuoto
          icona="persona"
          testo="Nessun contatto."
          azione={
            <Bottone
              misura="sm"
              icona="aggiungi"
              onClick={() => setAggiungi(true)}
            >
              Aggiungi contatto
            </Bottone>
          }
        />
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
    <li className="transizione-colore rounded-card border border-bordo px-3 py-2 hover:border-bordo-forte">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-campo font-medium">
            {contatto.nome}
            {contatto.ruoli_contatto && (
              <span className="text-testo-debole">
                {' '}
                · {contatto.ruoli_contatto.nome}
              </span>
            )}
          </p>
          {contatti && (
            <p className="truncate text-etichetta text-testo-debole">
              {contatti}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {contatto.principale ? (
            <Pillola tinta="successo" icona="stella">
              Principale
            </Pillola>
          ) : (
            <Bottone
              variante="fantasma"
              misura="sm"
              onClick={() => principale.mutate(contatto.id)}
              caricamento={principale.isPending}
            >
              Rendi principale
            </Bottone>
          )}
          <Pillola tinta="neutro">
            {ETICHETTA_PROVENIENZA[contatto.provenienza]}
          </Pillola>
          {contatto.telefono && (
            <a
              href={`tel:${contatto.telefono.replace(/\s/g, '')}`}
              onClick={onChiama}
              aria-label={
                brand
                  ? `Chiama ${contatto.nome} e registra la lavorazione`
                  : `Chiama ${contatto.nome}`
              }
              title={
                brand
                  ? `Chiama ${contatto.nome} e registra la lavorazione`
                  : `Chiama ${contatto.nome}`
              }
              className="premibile inline-flex h-11 w-11 items-center justify-center rounded-pillola border border-success-soft-border bg-success-soft text-success-soft-text"
            >
              <Icona nome="telefono" />
            </a>
          )}
          <BottoneIcona
            nome="elimina"
            etichetta={`Elimina ${contatto.nome}`}
            className="text-danger-soft-text"
            onClick={() => elimina.mutate(contatto.id)}
            disabled={elimina.isPending}
          />
        </div>
      </div>
      {chiamata.isError && (
        <Avviso tinta="pericolo" className="mt-1">
          Chiamata partita, ma la lavorazione non è stata salvata.
        </Avviso>
      )}
      {chiamata.isSuccess && (
        <Avviso tinta="successo" className="mt-1">
          {testoChiamataAutomatica(
            contatto.nome,
            new Date(chiamata.submittedAt),
          )}{' '}
          — registrato.
        </Avviso>
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
    /* Etichette visibili e non solo `placeholder`: il placeholder sparisce
       appena si scrive, e chi rilegge il modulo a meta' non sa piu' quale
       campo sia quale. */
    <form
      onSubmit={onSubmit}
      className="animate-salita mb-3 flex flex-col gap-2 rounded-card border border-bordo bg-sfondo p-3"
    >
      <Campo etichetta="Nome" obbligatorio>
        <Input
          autoFocus
          autoComplete="name"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </Campo>
      <Campo etichetta="Ruolo">
        <Select value={ruoloId} onChange={(e) => setRuoloId(e.target.value)}>
          <option value="">— ruolo —</option>
          {(ruoli.data ?? []).map((r) => (
            <option key={r.id} value={r.id}>
              {r.nome}
            </option>
          ))}
        </Select>
      </Campo>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {/* `type` semantico: su iPhone apre il tastierino telefonico e la
            tastiera con la @ invece di quella generica. */}
        <Campo etichetta="Telefono">
          <Input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </Campo>
        <Campo etichetta="Email">
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Campo>
      </div>
      {crea.isError && <Errore errore={crea.error} />}
      <Bottone
        type="submit"
        icona="aggiungi"
        disabled={!nome.trim()}
        caricamento={crea.isPending}
      >
        {crea.isPending ? 'Salvataggio…' : 'Aggiungi contatto'}
      </Bottone>
    </form>
  )
}
