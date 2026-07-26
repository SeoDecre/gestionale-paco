/** Deep link verso le mappe native. §3/§4: l'indirizzo è sempre cliccabile. */

export type Indirizzo = {
  indirizzo?: string | null
  civico?: string | null
  cap?: string | null
  comune?: string | null
  provincia?: string | null
}

/** "Via Roma 12, 80100 Napoli NA" — una riga sola, senza pezzi vuoti. */
export function indirizzoCompleto(a: Indirizzo): string {
  const via = [a.indirizzo, a.civico].filter(Boolean).join(' ')
  const citta = [a.cap, a.comune].filter(Boolean).join(' ')
  return [via, citta, a.provincia].filter(Boolean).join(', ')
}

const isApple = () =>
  typeof navigator !== 'undefined' &&
  /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)

/**
 * Su iPhone/iPad/Mac apre Apple Maps, altrove Google Maps.
 * Paco lavora da iPhone: deve aprirsi l'app nativa, non una scheda browser.
 */
export function urlMappa(a: Indirizzo): string | null {
  const q = indirizzoCompleto(a)
  if (!q) return null
  return isApple()
    ? `maps://?q=${encodeURIComponent(q)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

/** Percorso multi-tappa per il tasto "Apri percorso completo" (§3 "Oggi"). */
export function urlPercorso(tappe: Indirizzo[]): string | null {
  const punti = tappe.map(indirizzoCompleto).filter(Boolean)
  if (punti.length === 0) return null
  if (punti.length === 1) return urlMappa(tappe[0])

  if (isApple()) {
    // Apple Maps accetta una sola coppia partenza/arrivo: si punta
    // dalla prima all'ultima tappa; gli scali intermedi non sono supportati.
    return `maps://?saddr=${encodeURIComponent(punti[0])}&daddr=${encodeURIComponent(
      punti[punti.length - 1],
    )}`
  }
  const origin = encodeURIComponent(punti[0])
  const destination = encodeURIComponent(punti[punti.length - 1])
  const waypoints = punti.slice(1, -1).map(encodeURIComponent).join('|')
  return (
    `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}` +
    (waypoints ? `&waypoints=${waypoints}` : '')
  )
}
