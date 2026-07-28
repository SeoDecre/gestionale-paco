import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Scheda } from '@/components/ui/Scheda'
import { Input } from '@/components/ui/Campo'
import { Pillola } from '@/components/ui/Pillola'
import { Caricamento, Errore, Vuoto } from '@/components/ui/Stato'
import { useListaLead } from '@/features/lead/queries'
import { useZone } from '@/features/vocabolari/queries'
import { BADGE_BRAND } from '@/features/lead/brand'
import type { LeadConBrand } from '@/features/lead/api'

/**
 * "Aree" del CRM 3.0: i lead raggruppati per zona, con quanti sono e quanti
 * di target alto. Serve a decidere dove andare, non a modificare le zone —
 * quelle si gestiscono in Configurazione → Zone.
 *
 * I lead senza zona finiscono in un gruppo "Non assegnati" in fondo: sono
 * quelli da sistemare, e nasconderli li renderebbe invisibili per sempre.
 */
export function AreePage() {
  const lead = useListaLead()
  const zone = useZone()
  const [cerca, setCerca] = useState('')
  const [aperte, setAperte] = useState<Record<string, boolean>>({})

  const q = cerca.trim().toLowerCase()
  const filtra = (l: LeadConBrand) =>
    !q ||
    l.ragione_sociale.toLowerCase().includes(q) ||
    (l.comune ?? '').toLowerCase().includes(q)

  const tutti = (lead.data ?? []).filter(filtra)

  const gruppi = [
    ...(zone.data ?? []).map((z) => ({
      id: z.id,
      nome: z.nome,
      lead: tutti.filter((l) => l.zona_id === z.id),
    })),
    { id: '—', nome: 'Non assegnati', lead: tutti.filter((l) => !l.zona_id) },
  ]

  const inZona = tutti.filter((l) => l.zona_id).length

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-titolo font-semibold">Aree</h1>
        <p className="text-etichetta text-testo-debole">
          {inZona} di {tutti.length} lead in una zona
        </p>
      </div>

      <Input
        type="search"
        placeholder="Cerca per ragione sociale o comune…"
        value={cerca}
        onChange={(e) => setCerca(e.target.value)}
        className="mb-4"
      />

      {(lead.isLoading || zone.isLoading) && <Caricamento />}
      {lead.isError && <Errore errore={lead.error} />}
      {zone.isError && <Errore errore={zone.error} />}

      {lead.data && zone.data && gruppi.every((g) => g.lead.length === 0) && (
        <Vuoto testo={q ? 'Nessun lead trovato.' : 'Ancora nessun lead.'} />
      )}

      {gruppi.map((g) => {
        if (g.lead.length === 0) return null
        // Con una ricerca attiva i gruppi si aprono da soli: chi cerca vuole
        // vedere i risultati, non altri pannelli da toccare.
        const aperto = aperte[g.id] ?? Boolean(q)
        const targetAlti = g.lead.filter((l) => l.target === 'A' || l.target === 'E').length

        return (
          <Scheda
            key={g.id}
            className="mb-3"
            titolo={
              <button
                className="flex w-full items-center gap-2 text-left"
                onClick={() => setAperte((p) => ({ ...p, [g.id]: !aperto }))}
                aria-expanded={aperto}
              >
                <span aria-hidden className="text-testo-debole">
                  {aperto ? '▾' : '▸'}
                </span>
                {g.nome}
              </button>
            }
            azione={
              <span className="flex flex-shrink-0 items-center gap-1.5">
                {targetAlti > 0 && <Pillola tinta="successo">{targetAlti} A/E</Pillola>}
                <span className="text-etichetta font-medium text-testo-debole">
                  {g.lead.length}
                </span>
              </span>
            }
          >
            {aperto ? (
              <ul className="flex flex-col gap-1.5">
                {g.lead
                  .slice()
                  .sort((a, b) => a.ragione_sociale.localeCompare(b.ragione_sociale))
                  .map((l) => (
                    <li key={l.id}>
                      <Link
                        to={`/lead/${l.id}`}
                        className="flex items-center justify-between gap-2 rounded-card border border-bordo px-3 py-2"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-campo font-medium">
                            {l.ragione_sociale}
                          </span>
                          {l.comune && (
                            <span className="block truncate text-etichetta text-testo-debole">
                              {l.comune}
                            </span>
                          )}
                        </span>
                        <span className="flex flex-shrink-0 items-center gap-1">
                          {l.target && <Pillola tinta="avviso">{l.target}</Pillola>}
                          {l.lead_brand.map((b) => (
                            <Pillola key={b.brand} tinta={BADGE_BRAND[b.brand].tinta}>
                              {BADGE_BRAND[b.brand].etichetta}
                            </Pillola>
                          ))}
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-etichetta text-testo-debole">
                {g.lead.length} lead — tocca il titolo per aprire.
              </p>
            )}
          </Scheda>
        )
      })}
    </div>
  )
}
