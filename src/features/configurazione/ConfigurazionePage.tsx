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
  { id: 'agente', etichetta: 'Agente & Mandati', icona: '🪪' },
  { id: 'offerte', etichetta: 'Offerte', icona: '📄' },
  { id: 'target', etichetta: 'Target', icona: '🎯' },
  { id: 'zone', etichetta: 'Zone', icona: '🗺️' },
  { id: 'vocabolari', etichetta: 'Vocabolari', icona: '🏷️' },
  { id: 'campi', etichetta: 'Campi per brand', icona: '🧩' },
  { id: 'notifiche', etichetta: 'Notifiche', icona: '🔔' },
  { id: 'backup', etichetta: 'Backup', icona: '🛡️' },
]

export function ConfigurazionePage() {
  const [sezione, setSezione] = useState<Sezione>('agente')

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-titolo font-semibold">Configurazione azienda</h1>

      <BarraSchede voci={SEZIONI} attiva={sezione} onCambia={setSezione} />

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
  )
}
