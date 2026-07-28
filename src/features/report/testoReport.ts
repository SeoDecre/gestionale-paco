import { indirizzoCompleto } from '@/lib/maps'
import { righeNavigazione, firma, nomeAgente, type DatiAgente, type DatiMandato } from '@/lib/condivisione'

/**
 * Report in forma di TESTO, per mail / WhatsApp / Telegram — come faceva il
 * CRM 3.0, che generava tre varianti a mano in tre punti diversi.
 *
 * Puro e testato. WhatsApp usa gli asterischi per il grassetto; mail e
 * Telegram restano testo semplice, perché nel corpo di una mail gli asterischi
 * si vedrebbero come tali.
 */

export type LeadTesto = {
  ragione_sociale: string
  comune?: string | null
  indirizzo?: string | null
  civico?: string | null
  cap?: string | null
  provincia?: string | null
  telefono?: string | null
  cellulare?: string | null
  target?: string | null
  brand?: string[]
  stato?: string | null
}

export type Formato = 'mail' | 'whatsapp' | 'telegram'

const grassetto = (s: string, f: Formato) => (f === 'whatsapp' ? `*${s}*` : s)

function bloccoLead(l: LeadTesto, f: Formato, conNavigazione: boolean): string {
  const testa = [l.brand?.join('/'), l.target ? `T:${l.target}` : null, l.stato]
    .filter(Boolean)
    .join(' · ')
  const telefono = l.telefono || l.cellulare
  const righe = [
    grassetto(l.ragione_sociale, f),
    testa || null,
    indirizzoCompleto(l) || null,
    telefono ? `Tel: ${telefono}` : null,
    ...(conNavigazione ? righeNavigazione(l) : []),
  ]
  return righe.filter(Boolean).join('\n')
}

export type IntestazioneReport = {
  titolo?: string
  data?: Date
  totale: number
  vinti?: number
  tasso?: number
}

/**
 * Report completo. `conNavigazione` aggiunge i due link mappa per lead: utili
 * in un messaggio operativo, ingombranti in un riepilogo lungo, quindi
 * l'ultima parola resta a chi condivide.
 */
export function testoReport(
  lead: LeadTesto[],
  intestazione: IntestazioneReport,
  formato: Formato,
  agente?: DatiAgente | null,
  mandato?: DatiMandato | null,
  conNavigazione = true,
): string {
  const data = (intestazione.data ?? new Date()).toLocaleDateString('it-IT')
  const testa = [
    grassetto(intestazione.titolo ?? 'Report AgentPro CRM', formato),
    `Data: ${data}`,
    `Agente: ${nomeAgente(agente)}`,
    [
      `Lead: ${intestazione.totale}`,
      intestazione.vinti != null ? `Vinti: ${intestazione.vinti}` : null,
      intestazione.tasso != null ? `Tasso: ${intestazione.tasso}%` : null,
    ]
      .filter(Boolean)
      .join(' · '),
  ].join('\n')

  const corpo = lead.map((l) => bloccoLead(l, formato, conNavigazione)).join('\n\n')

  return [testa, corpo, firma(agente, mandato)].filter(Boolean).join('\n\n')
}
