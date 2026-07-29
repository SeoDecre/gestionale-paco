import { useState, type FormEvent } from 'react'
import { Scheda } from '@/components/ui/Scheda'
import { Bottone, BottoneIcona } from '@/components/ui/Bottone'
import { Input } from '@/components/ui/Campo'
import { Pillola } from '@/components/ui/Pillola'
import { Caricamento, Errore, Vuoto } from '@/components/ui/Stato'
import { capValido } from '@/lib/validazione'
import {
  useTutteLeVoci,
  useCreaVoce,
  useAggiornaVoce,
  useEliminaVoce,
  useCapDiZona,
  useComuniDiZona,
  useCreaComuneZona,
  useEliminaComuneZona,
  useCreaCap,
  useEliminaCap,
} from '@/features/vocabolari/queries'

type Zona = { id: string; nome: string; attivo: boolean; ordine: number; colore: string | null }

/** Editor zone + mappatura CAP (§7): la zona del lead si deriva da questi CAP. */
export function EditorZone() {
  const zone = useTutteLeVoci<Zona>('zone')
  const crea = useCreaVoce('zone')
  const [nuovo, setNuovo] = useState('')

  async function aggiungi(e: FormEvent) {
    e.preventDefault()
    if (!nuovo.trim()) return
    const ordine = (zone.data?.reduce((m, v) => Math.max(m, v.ordine), 0) ?? 0) + 10
    await crea.mutateAsync({ nome: nuovo.trim(), ordine })
    setNuovo('')
  }

  return (
    <Scheda titolo="Zone e CAP" className="mb-4">
      {zone.isLoading && <Caricamento />}
      {zone.isError && <Errore errore={zone.error} />}
      {zone.data && zone.data.length === 0 && <Vuoto testo="Nessuna zona." />}

      <div className="mb-3 flex flex-col gap-2">
        {zone.data?.map((z) => (
          <RigaZona key={z.id} zona={z} />
        ))}
      </div>

      <form onSubmit={aggiungi} className="flex gap-2">
        <Input placeholder="Nuova zona…" value={nuovo} onChange={(e) => setNuovo(e.target.value)} />
        <Bottone type="submit" disabled={crea.isPending || !nuovo.trim()}>
          Aggiungi
        </Bottone>
      </form>
    </Scheda>
  )
}

function RigaZona({ zona }: { zona: Zona }) {
  const aggiorna = useAggiornaVoce('zone')
  const elimina = useEliminaVoce('zone')
  const [aperto, setAperto] = useState(false)

  return (
    <div className="rounded-card border border-bordo p-2">
      <div className="flex items-center gap-2">
        <button className="flex-1 text-left text-campo font-medium" onClick={() => setAperto((v) => !v)}>
          {aperto ? '▾' : '▸'} {zona.nome}
        </button>
        <label className="flex items-center gap-1 text-etichetta text-testo-debole">
          <input
            type="checkbox"
            checked={zona.attivo}
            onChange={(e) => aggiorna.mutate({ id: zona.id, patch: { attivo: e.target.checked } })}
          />
          Attivo
        </label>
        <BottoneIcona
          nome="elimina"
          etichetta="Elimina zona"
          className="text-danger-soft-text"
          onClick={() => elimina.mutate(zona.id)}
          disabled={elimina.isPending}
        />
      </div>
      {aperto && (
        <>
          <ElencoCap zonaId={zona.id} />
          <ElencoComuni zonaId={zona.id} />
        </>
      )}
    </div>
  )
}

function ElencoCap({ zonaId }: { zonaId: string }) {
  const cap = useCapDiZona(zonaId)
  const crea = useCreaCap(zonaId)
  const elimina = useEliminaCap(zonaId)
  const [nuovoCap, setNuovoCap] = useState('')
  const [comune, setComune] = useState('')

  const capOk = capValido(nuovoCap) && nuovoCap.trim() !== ''

  async function aggiungi(e: FormEvent) {
    e.preventDefault()
    if (!capOk) return
    await crea.mutateAsync({ cap: nuovoCap.trim(), comune: comune.trim() || null })
    setNuovoCap('')
    setComune('')
  }

  return (
    <div className="mt-2 border-t border-bordo pt-2">
      <div className="mb-2 flex flex-wrap gap-1.5">
        {cap.data?.map((c) => (
          <span key={c.id} className="inline-flex items-center gap-1">
            <Pillola tinta="neutro">
              {c.cap}
              {c.comune ? ` · ${c.comune}` : ''}
            </Pillola>
            <BottoneIcona
              nome="chiudi"
              etichetta="Rimuovi CAP"
              className="text-danger-soft-text"
              onClick={() => elimina.mutate(c.id)}
            />
          </span>
        ))}
        {cap.data && cap.data.length === 0 && (
          <span className="text-etichetta text-testo-debole">Nessun CAP.</span>
        )}
      </div>
      <form onSubmit={aggiungi} className="flex gap-2">
        <Input
          placeholder="CAP"
          inputMode="numeric"
          className="w-28"
          value={nuovoCap}
          onChange={(e) => setNuovoCap(e.target.value)}
        />
        <Input placeholder="Comune (opz.)" value={comune} onChange={(e) => setComune(e.target.value)} />
        <Bottone type="submit" icona="aggiungi" disabled={crea.isPending || !capOk}>
          Aggiungi
        </Bottone>
      </form>
      {crea.isError && <div className="mt-1"><Errore errore={crea.error} /></div>}
    </div>
  )
}

/**
 * Comuni della zona (dal CRM 3.0, che mappava le aree per nome di comune).
 * Convive con i CAP: il CAP e' piu' specifico e vince, il comune fa da
 * ripiego per chi non vuole censire venti CAP uno per uno (migrazione 19).
 */
function ElencoComuni({ zonaId }: { zonaId: string }) {
  const comuni = useComuniDiZona(zonaId)
  const crea = useCreaComuneZona(zonaId)
  const elimina = useEliminaComuneZona(zonaId)
  const [nuovo, setNuovo] = useState('')

  async function aggiungi(e: FormEvent) {
    e.preventDefault()
    if (!nuovo.trim()) return
    await crea.mutateAsync(nuovo.trim())
    setNuovo('')
  }

  return (
    <div className="mt-2 border-t border-bordo pt-2">
      <p className="mb-1 text-etichetta text-testo-debole">
        Comuni interi (ripiego quando il CAP non e' mappato)
      </p>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {comuni.data?.map((c) => (
          <span key={c.id} className="inline-flex items-center gap-1">
            <Pillola tinta="info">{c.comune}</Pillola>
            <BottoneIcona
              nome="chiudi"
              etichetta="Rimuovi comune"
              className="text-danger-soft-text"
              onClick={() => elimina.mutate(c.id)}
            />
          </span>
        ))}
        {comuni.data && comuni.data.length === 0 && (
          <span className="text-etichetta text-testo-debole">Nessun comune.</span>
        )}
      </div>
      <form onSubmit={aggiungi} className="flex gap-2">
        <Input
          placeholder="Comune (es. LIVORNO)"
          value={nuovo}
          onChange={(e) => setNuovo(e.target.value)}
        />
        <Bottone type="submit" icona="aggiungi" disabled={crea.isPending || !nuovo.trim()}>
          Aggiungi
        </Bottone>
      </form>
      {crea.isError && (
        <div className="mt-1">
          <Errore errore={crea.error} />
        </div>
      )}
    </div>
  )
}
