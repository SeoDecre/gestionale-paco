/**
 * Riconoscimento di un indirizzo incollato + autocompletamento via Photon
 * (l'API di ricerca su OpenStreetMap). Entrambi arrivano dal CRM 3.0, dove
 * incollare "VIA X 31 - 57016 - COMUNE (LI)" era il modo normale di inserire
 * una sede presa da una visura.
 *
 * `analizzaIndirizzo` è pura e testata; la ricerca Photon è l'unica parte che
 * tocca la rete ed è isolata in fondo.
 */

export type IndirizzoAnalizzato = {
  indirizzo: string | null
  civico: string | null
  cap: string | null
  comune: string | null
  provincia: string | null
}

const VUOTO: IndirizzoAnalizzato = {
  indirizzo: null,
  civico: null,
  cap: null,
  comune: null,
  provincia: null,
}

const pulisci = (s: string) => s.trim().replace(/\s+/g, ' ')
const oNull = (s: string | undefined | null) => {
  const v = (s ?? '').trim()
  return v === '' ? null : v
}

/**
 * Stacca il numero civico dalla via. Il civico sta in fondo e può avere una
 * lettera o una barra ("31", "31/A", "31 bis"): si prende solo se comincia
 * per cifra, altrimenti "Via Trento 4 Novembre" perderebbe metà nome.
 */
function separaCivico(via: string): { indirizzo: string | null; civico: string | null } {
  const m = via.match(/^(.*?)[,\s]+(\d+\s*(?:[/-]?\s*[A-Za-z]{1,3}|bis|ter)?)\s*$/i)
  if (!m) return { indirizzo: oNull(via), civico: null }
  return { indirizzo: oNull(m[1]), civico: oNull(m[2].replace(/\s+/g, '')) }
}

/**
 * Analizza un indirizzo incollato. Riconosce le forme più comuni:
 *   "VIA ROMA 31 - 57016 - ROSIGNANO (LI)"
 *   "Via Roma 31, 57016 Rosignano (LI)"
 *   "Via Roma 31, 57016 Rosignano LI"
 *   "Via Roma 31"
 *
 * Non inventa: quello che non riconosce resta null, così l'utente vede subito
 * cosa deve completare a mano.
 */
export function analizzaIndirizzo(testo: string): IndirizzoAnalizzato {
  const t = pulisci(testo ?? '')
  if (!t) return { ...VUOTO }

  const out: IndirizzoAnalizzato = { ...VUOTO }
  let resto = t

  // Provincia fra parentesi: "(LI)". Si toglie subito, è la meno ambigua.
  const mProv = resto.match(/\(\s*([A-Za-z]{2})\s*\)/)
  if (mProv) {
    out.provincia = mProv[1].toUpperCase()
    resto = pulisci(resto.replace(mProv[0], ' '))
  }

  // CAP: cinque cifre isolate.
  const mCap = resto.match(/(?:^|[\s,;-])(\d{5})(?:[\s,;-]|$)/)
  if (mCap) {
    out.cap = mCap[1]
    resto = pulisci(resto.replace(mCap[1], ' '))
  }

  // Quel che resta si divide su trattini o virgole: [via] [comune].
  const pezzi = resto
    .split(/\s*[-–,;]\s*/)
    .map(pulisci)
    .filter(Boolean)

  if (pezzi.length >= 2) {
    const via = separaCivico(pezzi[0])
    out.indirizzo = via.indirizzo
    out.civico = via.civico
    let comune = pezzi.slice(1).join(' ')
    // Sigla provincia in coda senza parentesi: "Rosignano LI".
    if (!out.provincia) {
      const mCoda = comune.match(/^(.*?)[\s,]+([A-Za-z]{2})$/)
      if (mCoda) {
        comune = mCoda[1]
        out.provincia = mCoda[2].toUpperCase()
      }
    }
    out.comune = oNull(comune)
  } else if (pezzi.length === 1) {
    // Una sola parte: se avevamo un CAP è "via ... comune", altrimenti è
    // solo la via.
    const via = separaCivico(pezzi[0])
    out.indirizzo = via.indirizzo
    out.civico = via.civico
  }

  return out
}

/** Vero se l'analisi ha estratto qualcosa di utilizzabile. */
export function haQualcosa(a: IndirizzoAnalizzato): boolean {
  return Object.values(a).some((v) => v !== null)
}

// ------------------------------------------------------------------ Photon
export type SuggerimentoIndirizzo = IndirizzoAnalizzato & { etichetta: string }

type PhotonFeature = {
  properties?: {
    name?: string
    street?: string
    housenumber?: string
    postcode?: string
    city?: string
    town?: string
    village?: string
    county?: string
    state?: string
  }
}

/** Sigla provincia da "Provincia di Livorno" / "Livorno". */
function siglaProvincia(county: string | undefined): string | null {
  if (!county) return null
  const nome = county.replace(/^provincia di\s+/i, '').trim()
  return nome ? nome.slice(0, 2).toUpperCase() : null
}

/**
 * Ricerca indirizzi su Photon (OSM). Limitata all'Italia e a poche risposte:
 * si digita da telefono, una lista lunga è inutilizzabile.
 *
 * Photon è pubblico e senza chiave; se non risponde si restituisce lista
 * vuota e l'utente scrive a mano — l'autocompletamento è un aiuto, non un
 * passaggio obbligato.
 */
export async function cercaIndirizzi(
  query: string,
  segnale?: AbortSignal,
): Promise<SuggerimentoIndirizzo[]> {
  const q = query.trim()
  if (q.length < 3) return []
  const url =
    `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}` + `&lang=it&limit=5&lat=43.5&lon=10.5`
  try {
    const r = await fetch(url, { signal: segnale })
    if (!r.ok) return []
    const dati = (await r.json()) as { features?: PhotonFeature[] }
    return (dati.features ?? []).map((f) => {
      const p = f.properties ?? {}
      const comune = p.city ?? p.town ?? p.village ?? null
      const via = p.street ?? p.name ?? null
      const a: SuggerimentoIndirizzo = {
        indirizzo: via,
        civico: p.housenumber ?? null,
        cap: p.postcode ?? null,
        comune,
        provincia: siglaProvincia(p.county),
        etichetta: [
          [via, p.housenumber].filter(Boolean).join(' '),
          [p.postcode, comune].filter(Boolean).join(' '),
        ]
          .filter(Boolean)
          .join(', '),
      }
      return a
    })
  } catch {
    // Rete assente o richiesta annullata: nessun suggerimento, nessun errore
    // in faccia all'utente.
    return []
  }
}
