import { useState, type ChangeEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Scheda } from '@/components/ui/Scheda'
import { Bottone } from '@/components/ui/Bottone'
import { Errore } from '@/components/ui/Stato'
import { messaggioErrore } from '@/lib/errors'
import { scaricaTesto } from '@/lib/scarica'
import { esportaTutto, ripristina, type Backup, type EsitoRipristino } from './api'

/**
 * Backup / ripristino (dal CRM 3.0). Un file JSON con tutte le tabelle
 * dell'utente. Non contiene i FILE dello Storage — solo i loro metadati.
 */
export function BackupCard() {
  const qc = useQueryClient()
  const [inCorso, setInCorso] = useState<'export' | 'import' | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const [daRipristinare, setDaRipristinare] = useState<Backup | null>(null)
  const [riepilogo, setRiepilogo] = useState<string | null>(null)
  const [esiti, setEsiti] = useState<EsitoRipristino[] | null>(null)

  async function scarica() {
    setErrore(null)
    setInCorso('export')
    try {
      const b = await esportaTutto()
      const totale = Object.values(b.tabelle).reduce((n, r) => n + r.length, 0)
      scaricaTesto(
        `agentpro_backup_${new Date().toISOString().slice(0, 10)}.json`,
        JSON.stringify(b, null, 2),
        'application/json',
      )
      setRiepilogo(`Backup scaricato — ${totale} righe.`)
    } catch (e) {
      setErrore(messaggioErrore(e))
    } finally {
      setInCorso(null)
    }
  }

  function scegliFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setErrore(null)
    setEsiti(null)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const dati = JSON.parse(String(reader.result)) as Backup
        if (!dati.tabelle || typeof dati.tabelle !== 'object') {
          setErrore('File non riconosciuto: manca la sezione "tabelle".')
          return
        }
        const totale = Object.values(dati.tabelle).reduce(
          (n, r) => n + (Array.isArray(r) ? r.length : 0),
          0,
        )
        setDaRipristinare(dati)
        setRiepilogo(
          `${totale} righe del ${new Date(dati.creato).toLocaleDateString('it-IT')} pronte da ripristinare.`,
        )
      } catch {
        setErrore('File non leggibile: non è un JSON valido.')
      }
    }
    reader.readAsText(file)
  }

  async function conferma() {
    if (!daRipristinare) return
    if (
      !confirm(
        'Ripristinare questo backup?\n\nLe righe con lo stesso id vengono SOVRASCRITTE. Quelle non presenti nel file restano dove sono.',
      )
    ) {
      return
    }
    setErrore(null)
    setInCorso('import')
    try {
      const r = await ripristina(daRipristinare)
      setEsiti(r)
      setDaRipristinare(null)
      await qc.invalidateQueries()
    } catch (e) {
      setErrore(messaggioErrore(e))
    } finally {
      setInCorso(null)
    }
  }

  const falliti = esiti?.filter((e) => e.errore) ?? []

  return (
    <Scheda titolo="Backup e ripristino" className="mb-4">
      <p className="mb-3 rounded-card border border-info-soft-border bg-info-soft px-3 py-2 text-etichetta text-info-soft-text">
        Il backup contiene tutte le tabelle (lead, lavorazioni, appuntamenti, vocabolari,
        configurazione). <strong>Non</strong> contiene i file di foto, memo vocali e PDF: quelli
        restano nello Storage, e nel JSON ne trovi solo i riferimenti.
      </p>

      <Bottone onClick={scarica} disabled={inCorso !== null}>
        {inCorso === 'export' ? 'Preparazione…' : '⬇ Scarica backup (.json)'}
      </Bottone>

      <div className="mt-4 border-t border-bordo pt-4">
        <p className="mb-2 text-campo font-medium">Ripristina da file</p>
        <p className="mb-2 rounded-card border border-warning-soft-border bg-warning-soft px-3 py-2 text-etichetta text-warning-soft-text">
          Il ripristino sovrascrive le righe che hanno lo stesso identificativo. Non cancella
          quello che nel file non c'è.
        </p>
        <label className="inline-flex min-h-11 cursor-pointer items-center rounded-card border border-bordo bg-superficie px-4 text-campo font-medium">
          Scegli file .json
          <input type="file" accept="application/json,.json" hidden onChange={scegliFile} />
        </label>

        {riepilogo && <p className="mt-2 text-etichetta text-testo-debole">{riepilogo}</p>}

        {daRipristinare && (
          <div className="mt-2">
            <Bottone variante="pericolo" onClick={conferma} disabled={inCorso !== null}>
              {inCorso === 'import' ? 'Ripristino…' : 'Ripristina questo backup'}
            </Bottone>
          </div>
        )}

        {esiti && (
          <div className="mt-3">
            <p className="text-etichetta text-success-soft-text">
              Ripristinate {esiti.reduce((n, e) => n + (e.errore ? 0 : e.righe), 0)} righe su{' '}
              {esiti.length} tabelle.
            </p>
            {falliti.length > 0 && (
              <ul className="mt-1 flex flex-col gap-0.5">
                {falliti.map((f) => (
                  <li key={f.tabella} className="text-etichetta text-danger-soft-text">
                    {f.tabella}: {f.errore}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {errore && (
        <div className="mt-3">
          <Errore errore={errore} />
        </div>
      )}
    </Scheda>
  )
}
