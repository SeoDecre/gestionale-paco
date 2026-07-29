import { useState } from 'react'
import { Segmentato } from '@/components/ui/Segmentato'
import { Scheda } from '@/components/ui/Scheda'
import { Campo, Input, Textarea } from '@/components/ui/Campo'
import { BannerModifiche } from '@/components/ui/BannerModifiche'
import { Caricamento, Errore } from '@/components/ui/Stato'
import { useBozza } from '@/lib/useBozza'
import { firma, nomeAgente } from '@/lib/condivisione'
import { emailValida } from '@/lib/validazione'
import { TUTTI_I_BRAND, BADGE_BRAND } from '@/features/lead/brand'
import type { Enum } from '@/types/db'
import { useAgente, useMandati, useSalvaAgente, useSalvaMandato } from './queries'
import type { PatchAgente, PatchMandato } from './api'

/**
 * "Agente & Mandati" del CRM 3.0. Due blocchi: chi è l'agente (una riga per
 * utente) e il mandato per brand (codice agente, admin, firma), perché NEXI e
 * Hera Comm hanno riferimenti e firme diverse.
 */
export function SchedaAgente() {
  const agente = useAgente()
  const salva = useSalvaAgente()

  if (agente.isLoading) {
    return (
      <Scheda titolo="Dati agente" className="mb-4">
        <Caricamento />
      </Scheda>
    )
  }

  return <FormAgente iniziale={estraiAgente(agente.data)} salva={salva} />
}

type CampiAgente = Required<Pick<PatchAgente, 'nome' | 'cognome' | 'area' | 'tel' | 'cell' | 'email' | 'indirizzo' | 'note'>>

function estraiAgente(d: ReturnType<typeof useAgente>['data']): CampiAgente {
  return {
    nome: d?.nome ?? null,
    cognome: d?.cognome ?? null,
    area: d?.area ?? null,
    tel: d?.tel ?? null,
    cell: d?.cell ?? null,
    email: d?.email ?? null,
    indirizzo: d?.indirizzo ?? null,
    note: d?.note ?? null,
  }
}

function FormAgente({
  iniziale,
  salva,
}: {
  iniziale: CampiAgente
  salva: ReturnType<typeof useSalvaAgente>
}) {
  const { bozza, imposta, annulla, modificato } = useBozza<CampiAgente>(iniziale)
  const erroreEmail = emailValida(bozza.email) ? null : 'Email non valida.'

  const testo = (k: keyof CampiAgente, etichetta: string, errore?: string | null) => (
    <Campo key={k} etichetta={etichetta} errore={errore}>
      {(id) => (
        <Input
          id={id}
          value={bozza[k] ?? ''}
          onChange={(e) => imposta(k, e.target.value || null)}
        />
      )}
    </Campo>
  )

  return (
    <Scheda titolo="Dati agente" className="mb-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {testo('nome', 'Nome')}
        {testo('cognome', 'Cognome')}
        {testo('area', 'Area territoriale')}
        {testo('cell', 'Cellulare')}
        {testo('tel', 'Telefono')}
        {testo('email', 'Email', erroreEmail)}
        <Campo etichetta="Indirizzo" className="sm:col-span-2">
          {(id) => (
            <Input
              id={id}
              value={bozza.indirizzo ?? ''}
              onChange={(e) => imposta('indirizzo', e.target.value || null)}
            />
          )}
        </Campo>
        <Campo etichetta="Note" className="sm:col-span-2">
          {(id) => (
            <Textarea
              id={id}
              value={bozza.note ?? ''}
              onChange={(e) => imposta('note', e.target.value || null)}
            />
          )}
        </Campo>
      </div>

      {salva.isError && (
        <div className="mt-3">
          <Errore errore={salva.error} />
        </div>
      )}

      {modificato && (
        <BannerModifiche
          inCorso={salva.isPending}
          onAnnulla={annulla}
          onSalva={() => {
            if (!erroreEmail) salva.mutate(bozza)
          }}
        />
      )}
    </Scheda>
  )
}

// ------------------------------------------------------------------ mandati
type CampiMandato = Required<
  Pick<
    PatchMandato,
    | 'ragione_sociale'
    | 'codice_agente'
    | 'admin'
    | 'area'
    | 'tel'
    | 'cell'
    | 'email'
    | 'referente'
    | 'indirizzo'
    | 'firma'
    | 'note'
  >
>

export function SchedaMandati() {
  const mandati = useMandati()
  const agente = useAgente()
  const salva = useSalvaMandato()
  const [brand, setBrand] = useState<Enum<'brand'>>('NEXI')

  const corrente = mandati.data?.find((m) => m.brand === brand)

  return (
    <Scheda titolo="Mandati commerciali" className="mb-4">
      <Segmentato
        piena
        className="mb-3"
        etichetta="Brand del mandato"
        valore={brand}
        onChange={setBrand}
        opzioni={TUTTI_I_BRAND.map((b) => ({
          valore: b,
          etichetta: BADGE_BRAND[b].etichetta,
        }))}
      />

      {mandati.isLoading && <Caricamento />}
      {mandati.isError && <Errore errore={mandati.error} />}

      {mandati.data && (
        <FormMandato
          // Rimonta il form al cambio brand: sono due record distinti, non lo
          // stesso record modificato.
          key={brand}
          brand={brand}
          iniziale={{
            ragione_sociale: corrente?.ragione_sociale ?? null,
            codice_agente: corrente?.codice_agente ?? null,
            admin: corrente?.admin ?? null,
            area: corrente?.area ?? null,
            tel: corrente?.tel ?? null,
            cell: corrente?.cell ?? null,
            email: corrente?.email ?? null,
            referente: corrente?.referente ?? null,
            indirizzo: corrente?.indirizzo ?? null,
            firma: corrente?.firma ?? 'Cordiali saluti,',
            note: corrente?.note ?? null,
          }}
          salva={salva}
          anteprima={firma(agente.data, corrente)}
          nome={nomeAgente(agente.data)}
        />
      )}
    </Scheda>
  )
}

function FormMandato({
  brand,
  iniziale,
  salva,
  anteprima,
  nome,
}: {
  brand: Enum<'brand'>
  iniziale: CampiMandato
  salva: ReturnType<typeof useSalvaMandato>
  anteprima: string
  nome: string
}) {
  const { bozza, imposta, annulla, modificato } = useBozza<CampiMandato>(iniziale)

  const testo = (k: keyof CampiMandato, etichetta: string) => (
    <Campo key={k} etichetta={etichetta}>
      {(id) => (
        <Input
          id={id}
          value={bozza[k] ?? ''}
          onChange={(e) => imposta(k, e.target.value || null)}
        />
      )}
    </Campo>
  )

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {testo('ragione_sociale', 'Ragione sociale')}
        {testo('codice_agente', 'Codice agente')}
        {testo('admin', 'Admin / riferimento')}
        {testo('referente', 'Referente interno')}
        {testo('area', 'Area')}
        {testo('tel', 'Telefono ufficio')}
        {testo('cell', 'Cellulare')}
        {testo('email', 'Email')}
        <Campo etichetta="Indirizzo" className="sm:col-span-2">
          {(id) => (
            <Input
              id={id}
              value={bozza.indirizzo ?? ''}
              onChange={(e) => imposta('indirizzo', e.target.value || null)}
            />
          )}
        </Campo>
        <Campo etichetta="Riga di firma" className="sm:col-span-2">
          {(id) => (
            <Input
              id={id}
              value={bozza.firma ?? ''}
              onChange={(e) => imposta('firma', e.target.value || null)}
            />
          )}
        </Campo>
        <Campo etichetta="Note" className="sm:col-span-2">
          {(id) => (
            <Textarea
              id={id}
              value={bozza.note ?? ''}
              onChange={(e) => imposta('note', e.target.value || null)}
            />
          )}
        </Campo>
      </div>

      {/* Come esce la firma in fondo a mail e report. */}
      <div className="mt-3 rounded-card bg-sfondo p-3">
        <p className="mb-1 text-etichetta text-testo-debole">Anteprima firma</p>
        <pre className="whitespace-pre-wrap font-sans text-etichetta text-testo">
          {modificato
            ? [
                bozza.firma || 'Cordiali saluti,',
                nome,
                bozza.codice_agente
                  ? `Cod. ${bozza.codice_agente}${bozza.ragione_sociale ? ` — ${bozza.ragione_sociale}` : ''}`
                  : null,
              ]
                .filter(Boolean)
                .join('\n')
            : anteprima}
        </pre>
      </div>

      {salva.isError && (
        <div className="mt-3">
          <Errore errore={salva.error} />
        </div>
      )}

      {modificato && (
        <BannerModifiche
          inCorso={salva.isPending}
          onAnnulla={annulla}
          onSalva={() => salva.mutate({ brand, patch: bozza })}
        />
      )}
    </>
  )
}
