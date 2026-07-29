import { useState } from 'react'
import { PillolaColorata } from '@/components/ui/PillolaColorata'
import { Icona } from '@/components/ui/Icona'
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
        className="superficie-card premibile inline-flex min-h-11 items-center gap-1.5 px-3 text-etichetta hover:border-bordo-forte"
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
        <Icona
          nome="espandi"
          misura="sm"
          className={`transizione-trasformazione text-testo-debole ${
            aperto ? 'rotate-180' : ''
          }`}
        />
      </button>

      {aperto && (
        <>
          {/* Sfondo che intercetta il tocco fuori: su iOS il blur non basta
              per chiudere un menu. */}
          <button
            aria-label="Chiudi"
            className="z-velo fixed inset-0 cursor-default"
            onClick={() => setAperto(false)}
          />
          {/* Il menu scende dal bottone che l'ha aperto (`origin-top-right`),
              non dal proprio centro: e' l'unico punto da cui ha senso che
              esca. */}
          <ul
            role="listbox"
            className="superficie-card animate-salita z-dialogo absolute right-0 mt-1 min-w-52 origin-top-right overflow-hidden shadow-alto"
          >
            {(stati.data ?? []).map((s) => (
              <li key={s.id}>
                <button
                  role="option"
                  aria-selected={lead.verifica_id === s.id}
                  className="transizione-colore flex min-h-11 w-full items-center px-3 text-left hover:bg-superficie-alt"
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
                  className="transizione-colore min-h-11 w-full px-3 text-left text-etichetta text-testo-debole hover:bg-superficie-alt"
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
