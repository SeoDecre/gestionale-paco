import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Scheda } from '@/components/ui/Scheda'
import { Bottone } from '@/components/ui/Bottone'
import { Select } from '@/components/ui/Campo'
import { Pillola } from '@/components/ui/Pillola'
import { Errore } from '@/components/ui/Stato'
import { messaggioErrore } from '@/lib/errors'
import type { Enum } from '@/types/db'
import { leggiXlsx, type DatiLeadImport } from './excel'
import { esistentiPerPiva, simili, creaLeadImport, applicaMerge } from './api'

type Duplicato = {
  dati: DatiLeadImport
  esistenteId: string
  esistenteNome: string
  modo: Enum<'merge_mode'>
}
type Piano = { nuovi: DatiLeadImport[]; duplicati: Duplicato[] }

export function ImportExcel() {
  const qc = useQueryClient()
  const [piano, setPiano] = useState<Piano | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, setInCorso] = useState(false)
  const [risultato, setRisultato] = useState<string | null>(null)

  async function onFile(file: File) {
    setErrore(null)
    setRisultato(null)
    setInCorso(true)
    try {
      const righe = await leggiXlsx(file)
      const conPiva = righe.filter((r) => r.piva)
      const esistenti = await esistentiPerPiva(conPiva.map((r) => r.piva!))
      const perPiva = new Map(esistenti.map((e) => [e.piva, e]))

      const nuovi: DatiLeadImport[] = []
      const duplicati: Duplicato[] = []
      for (const r of righe) {
        const match = r.piva ? perPiva.get(r.piva) : undefined
        if (match) {
          duplicati.push({
            dati: r,
            esistenteId: match.id,
            esistenteNome: match.ragione_sociale,
            modo: 'integra',
          })
        } else if (!r.piva) {
          // Nessuna P.IVA: fallback fuzzy nome+CAP (§8).
          const sim = await simili(r.ragione_sociale, r.cap)
          if (sim[0] && sim[0].similarita >= 0.6) {
            duplicati.push({
              dati: r,
              esistenteId: sim[0].id,
              esistenteNome: sim[0].ragione_sociale,
              modo: 'integra',
            })
          } else nuovi.push(r)
        } else nuovi.push(r)
      }
      setPiano({ nuovi, duplicati })
    } catch (e) {
      setErrore(messaggioErrore(e))
    } finally {
      setInCorso(false)
    }
  }

  async function importa() {
    if (!piano) return
    setInCorso(true)
    setErrore(null)
    try {
      for (const n of piano.nuovi) await creaLeadImport(n, 'import_excel')
      for (const d of piano.duplicati) await applicaMerge(d.esistenteId, d.dati, d.modo)
      qc.invalidateQueries({ queryKey: ['lead'] })
      setRisultato(`Importati ${piano.nuovi.length} nuovi lead, ${piano.duplicati.length} duplicati gestiti.`)
      setPiano(null)
    } catch (e) {
      setErrore(messaggioErrore(e))
    } finally {
      setInCorso(false)
    }
  }

  return (
    <Scheda titolo="Import Excel mensile">
      {!piano && (
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-card border border-bordo px-4 py-2.5 text-campo">
          {inCorso ? 'Lettura…' : 'Scegli file .xlsx'}
          <input
            type="file"
            accept=".xlsx,.xls"
            hidden
            disabled={inCorso}
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) void onFile(f)
            }}
          />
        </label>
      )}

      {errore && <div className="mt-3"><Errore errore={errore} /></div>}
      {risultato && <p className="mt-3 text-success-soft-text">{risultato}</p>}

      {piano && (
        <div className="mt-2">
          <div className="mb-3 flex gap-2">
            <Pillola tinta="successo">{piano.nuovi.length} nuovi</Pillola>
            <Pillola tinta="avviso">{piano.duplicati.length} duplicati</Pillola>
          </div>

          {piano.duplicati.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 text-etichetta text-testo-debole">
                Duplicati (per P.IVA o nome simile) — scegli cosa fare:
              </p>
              <ul className="flex flex-col gap-2">
                {piano.duplicati.map((d, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-bordo px-3 py-2"
                  >
                    <span className="min-w-0 truncate text-etichetta">
                      {d.dati.ragione_sociale}
                      <span className="text-testo-debole"> → {d.esistenteNome}</span>
                    </span>
                    <Select
                      className="w-56"
                      value={d.modo}
                      onChange={(e) =>
                        setPiano((p) =>
                          p
                            ? {
                                ...p,
                                duplicati: p.duplicati.map((x, j) =>
                                  j === i ? { ...x, modo: e.target.value as Enum<'merge_mode'> } : x,
                                ),
                              }
                            : p,
                        )
                      }
                    >
                      <option value="integra">Integra i campi presenti</option>
                      <option value="sovrascrivi">Sovrascrivi tutto</option>
                      <option value="lascia">Lascia esistente</option>
                    </Select>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <Bottone onClick={importa} disabled={inCorso}>
              {inCorso ? 'Import in corso…' : 'Importa'}
            </Bottone>
            <Bottone variante="secondario" onClick={() => setPiano(null)} disabled={inCorso}>
              Annulla
            </Bottone>
          </div>
        </div>
      )}

      <p className="mt-3 text-etichetta text-testo-debole">
        Lavorazioni, appuntamenti e contatti dei lead esistenti non vengono mai toccati (§8).
      </p>
    </Scheda>
  )
}
