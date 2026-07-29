import { useState } from 'react'
import { EditorOfferte } from './EditorOfferte'
import { EditorParametriTarget } from './EditorParametriTarget'
import { EditorZone } from './EditorZone'
import { EditorEsiti } from './EditorEsiti'
import { EditorVocabolario } from './EditorVocabolario'
import { EditorCampiPersonalizzati } from './EditorCampiPersonalizzati'
import { NotificheCard } from '@/features/notifiche/NotificheCard'
import { SchedaAgente, SchedaMandati } from '@/features/agente/SchedaAgente'
import { BackupCard } from '@/features/backup/BackupCard'
import { BarraSchede, type VoceScheda } from '@/components/ui/Schede'
import { TestataPagina } from '@/components/ui/Scheda'

type Sezione =
  | 'agente'
  | 'offerte'
  | 'target'
  | 'zone'
  | 'vocabolari'
  | 'campi'
  | 'notifiche'
  | 'backup'

const SEZIONI: VoceScheda<Sezione>[] = [
  { id: 'agente', etichetta: 'Agente & Mandati', icona: 'agente' },
  { id: 'offerte', etichetta: 'Offerte', icona: 'offerte' },
  { id: 'target', etichetta: 'Target', icona: 'target' },
  { id: 'zone', etichetta: 'Zone', icona: 'zone' },
  { id: 'vocabolari', etichetta: 'Vocabolari', icona: 'vocabolari' },
  { id: 'campi', etichetta: 'Campi per brand', icona: 'campi' },
  { id: 'notifiche', etichetta: 'Notifiche', icona: 'notifiche' },
  { id: 'backup', etichetta: 'Backup', icona: 'backup' },
]

export function ConfigurazionePage() {
  const [sezione, setSezione] = useState<Sezione>('agente')

  return (
    <div className="mx-auto max-w-3xl">
      <TestataPagina
        titolo="Configurazione azienda"
        descrizione="Vocabolari, offerte, zone e parametri che alimentano il resto dell'app."
      />

      <BarraSchede
        voci={SEZIONI}
        attiva={sezione}
        onCambia={setSezione}
        etichetta="Sezioni della configurazione"
      />

      {/* `key` sulla sezione: rimontando, il contenuto entra con la sua
          animazione invece di sostituirsi di scatto sotto le schede. */}
      <div key={sezione} className="animate-comparsa flex flex-col gap-4">
      {sezione === 'agente' && (
        <>
          <SchedaAgente />
          <SchedaMandati />
        </>
      )}
      {sezione === 'offerte' && <EditorOfferte />}
      {sezione === 'target' && <EditorParametriTarget />}
      {sezione === 'zone' && <EditorZone />}
      {sezione === 'vocabolari' && (
        <>
          <EditorVocabolario tabella="ruoli_contatto" titolo="Ruoli contatto" />
          <EditorVocabolario tabella="etichette_sede" titolo="Etichette sede" />
          <EditorVocabolario tabella="azioni_successive" titolo="Azioni successive" />
          <EditorVocabolario tabella="concorrenti_pos" titolo="Concorrenti POS" />
          <EditorVocabolario tabella="esigenze_pos" titolo="Esigenze POS" />
          <EditorVocabolario tabella="stati_verifica" titolo="Stati di verifica" />
          <EditorVocabolario
            tabella="tipi_pos"
            titolo="Tipi POS"
            extra={[{ chiave: 'richiede_iban', etichetta: 'IBAN' }]}
          />
          <EditorEsiti />
        </>
      )}
      {sezione === 'campi' && <EditorCampiPersonalizzati />}
      {sezione === 'notifiche' && <NotificheCard />}
      {sezione === 'backup' && <BackupCard />}
      </div>
    </div>
  )
}
