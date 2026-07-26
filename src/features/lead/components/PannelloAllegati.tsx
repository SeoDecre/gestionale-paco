import { useRef, useState, type ChangeEvent } from 'react'
import { Scheda } from '@/components/ui/Scheda'
import { Bottone } from '@/components/ui/Bottone'
import { Pillola } from '@/components/ui/Pillola'
import { Caricamento, Errore, Vuoto } from '@/components/ui/Stato'
import { formattaDurata, formattaDataOra } from '@/lib/format'
import { messaggioErrore } from '@/lib/errors'
import { caricaAllegato, urlFirmato } from '@/lib/media'
import type { Enum, Riga } from '@/types/db'
import { useAllegati, useCreaAllegato, useEliminaAllegato } from '../queries'
import { useRegistratore } from '../useRegistratore'

const ICONA: Record<Enum<'tipo_allegato'>, string> = {
  audio: '🎙️',
  foto: '📷',
  documento: '📄',
}

export function PannelloAllegati({ leadId }: { leadId: string }) {
  const allegati = useAllegati(leadId)
  const crea = useCreaAllegato(leadId)
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, setInCorso] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const reg = useRegistratore()

  async function fermaEcarica() {
    setErrore(null)
    setInCorso(true)
    try {
      const r = await reg.ferma()
      const f = await caricaAllegato(leadId, r.blob, r.estensione, 'Memo vocale')
      await crea.mutateAsync({
        lead_id: leadId,
        tipo: 'audio',
        storage_path: f.storage_path,
        nome_file: f.nome_file,
        durata_sec: r.durataSec,
        stato: 'da_integrare',
      })
    } catch (e) {
      setErrore(messaggioErrore(e))
    } finally {
      setInCorso(false)
    }
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // consente di riselezionare lo stesso file
    if (!file) return
    setErrore(null)
    setInCorso(true)
    try {
      const estensione = file.name.split('.').pop() || 'bin'
      const tipo: Enum<'tipo_allegato'> = file.type.startsWith('image/') ? 'foto' : 'documento'
      const f = await caricaAllegato(leadId, file, estensione, file.name)
      await crea.mutateAsync({
        lead_id: leadId,
        tipo,
        storage_path: f.storage_path,
        nome_file: f.nome_file,
      })
    } catch (err) {
      setErrore(messaggioErrore(err))
    } finally {
      setInCorso(false)
    }
  }

  return (
    <Scheda titolo="Allegati" className="mb-4">
      <div className="mb-3 flex gap-2">
        {reg.stato === 'in_corso' ? (
          <Bottone variante="registrazione" piena onClick={fermaEcarica} disabled={inCorso}>
            ⏺ Ferma ({formattaDurata(reg.secondi)})
          </Bottone>
        ) : (
          <Bottone variante="registrazione" onClick={reg.avvia} disabled={inCorso}>
            🎙️ Memo vocale
          </Bottone>
        )}
        <Bottone variante="registrazione" onClick={() => fileRef.current?.click()} disabled={inCorso}>
          📷 Foto / doc.
        </Bottone>
        <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={onFile} />
      </div>

      {reg.errore && <p className="mb-2 text-etichetta text-danger-soft-text">{reg.errore}</p>}
      {errore && <p className="mb-2 text-etichetta text-danger-soft-text">{errore}</p>}
      {inCorso && <p className="mb-2 text-etichetta text-testo-debole">Caricamento…</p>}

      {allegati.isLoading && <Caricamento />}
      {allegati.isError && <Errore errore={allegati.error} />}
      {allegati.data && allegati.data.length === 0 && <Vuoto testo="Nessun allegato." />}

      <ul className="flex flex-col gap-2">
        {allegati.data?.map((a) => (
          <RigaAllegato key={a.id} leadId={leadId} allegato={a} />
        ))}
      </ul>
    </Scheda>
  )
}

function RigaAllegato({ leadId, allegato }: { leadId: string; allegato: Riga<'allegati'> }) {
  const elimina = useEliminaAllegato(leadId)
  const [apertura, setApertura] = useState(false)

  async function apri() {
    setApertura(true)
    try {
      const url = await urlFirmato(allegato.storage_path)
      window.open(url, '_blank', 'noopener')
    } finally {
      setApertura(false)
    }
  }

  return (
    <li className="flex items-center justify-between gap-2 rounded-card border border-bordo px-3 py-2">
      <button className="flex min-w-0 items-center gap-2 text-left" onClick={apri} disabled={apertura}>
        <span>{ICONA[allegato.tipo]}</span>
        <span className="min-w-0">
          <span className="block truncate text-campo text-info-soft-text underline">
            {allegato.nome_file ?? allegato.tipo}
          </span>
          <span className="block text-etichetta text-testo-debole">
            {allegato.durata_sec != null && `${formattaDurata(allegato.durata_sec)} · `}
            {formattaDataOra(allegato.created_at)}
          </span>
        </span>
      </button>
      <div className="flex flex-shrink-0 items-center gap-1.5">
        {allegato.stato && (
          <Pillola tinta={allegato.stato === 'integrato' ? 'successo' : 'avviso'}>
            {allegato.stato === 'integrato' ? 'Integrato' : 'Da integrare'}
          </Pillola>
        )}
        <button
          aria-label="Elimina allegato"
          className="px-1 text-danger-soft-text"
          onClick={() => elimina.mutate(allegato.id)}
          disabled={elimina.isPending}
        >
          ✕
        </button>
      </div>
    </li>
  )
}
