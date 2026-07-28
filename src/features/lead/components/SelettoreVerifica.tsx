import { useState } from 'react'
import { PillolaColorata } from '@/components/ui/PillolaColorata'
import { useStatiVerifica } from '@/features/vocabolari/queries'
import { useAggiornaLead } from '../queries'
import type { LeadConBrand } from '../api'

/**
 * Stato di VERIFICA dell'anagrafica (dal CRM 3.0). È un asse separato dallo
 * stato commerciale: "i dati di questa azienda sono confermati?" non ha
 * niente a che vedere con "a che punto è la trattativa". Un lead può essere
 * chiuso vinto e ancora non verificato.
 *
 * Le voci si gestiscono in Configurazione → Vocabolari → Stati di verifica.
 */
export function SelettoreVerifica({ lead }: { lead: LeadConBrand }) {
  const stati = useStatiVerifica()
  const salva = useAggiornaLead(lead.id)
  const [aperto, setAperto] = useState(false)

  const corrente = lead.stati_verifica

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAperto((v) => !v)}
        aria-expanded={aperto}
        aria-haspopup="listbox"
        className="inline-flex min-h-11 items-center gap-1.5 rounded-card border border-bordo bg-superficie px-3 text-etichetta"
        disabled={salva.isPending}
      >
        {corrente ? (
          <PillolaColorata
            testo={corrente.nome}
            coloreBg={corrente.colore_bg}
            coloreFg={corrente.colore_fg}
            coloreDot={corrente.colore_dot}
          />
        ) : (
          <span className="text-testo-debole">Verifica: —</span>
        )}
        <span aria-hidden className="text-testo-debole">
          ▾
        </span>
      </button>

      {aperto && (
        <>
          {/* Sfondo che intercetta il tocco fuori: su iOS il blur non basta
              per chiudere un menu. */}
          <button
            aria-label="Chiudi"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setAperto(false)}
          />
          <ul
            role="listbox"
            className="absolute right-0 z-50 mt-1 min-w-52 overflow-hidden rounded-card border border-bordo bg-superficie shadow-lg"
          >
            {(stati.data ?? []).map((s) => (
              <li key={s.id}>
                <button
                  role="option"
                  aria-selected={lead.verifica_id === s.id}
                  className="flex min-h-11 w-full items-center px-3 text-left hover:bg-sfondo"
                  onClick={() => {
                    salva.mutate({ verifica_id: s.id })
                    setAperto(false)
                  }}
                >
                  <PillolaColorata
                    testo={s.nome}
                    coloreBg={s.colore_bg}
                    coloreFg={s.colore_fg}
                    coloreDot={s.colore_dot}
                  />
                </button>
              </li>
            ))}
            {lead.verifica_id && (
              <li className="border-t border-bordo">
                <button
                  className="min-h-11 w-full px-3 text-left text-etichetta text-testo-debole hover:bg-sfondo"
                  onClick={() => {
                    salva.mutate({ verifica_id: null })
                    setAperto(false)
                  }}
                >
                  Togli lo stato di verifica
                </button>
              </li>
            )}
          </ul>
        </>
      )}
    </div>
  )
}
