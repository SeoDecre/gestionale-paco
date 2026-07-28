/**
 * Estrazione dei parametri commerciali dal testo di un'offerta — portato dal
 * CRM 3.0, che lo faceva lato server su `pdf-parse`.
 *
 * Qui lavora sul TESTO: chi carica il PDF può incollarne il contenuto (o una
 * riga sola) e farsi precompilare canone, commissione e fascia di transato.
 * È un aiuto, non una fonte di verità: i valori restano modificabili, come
 * avvisava anche il 3.0 ("controlla i dati estratti").
 */

export type ParametriOfferta = {
  canone: number | null
  commissione: number | null
  transato_min: number | null
  transato_max: number | null
}

const VUOTO: ParametriOfferta = {
  canone: null,
  commissione: null,
  transato_min: null,
  transato_max: null,
}

/**
 * Converte un numero scritto all'italiana: "1.234,56" -> 1234.56.
 * Il punto è separatore di migliaia, la virgola di decimali — l'opposto
 * dell'inglese, e sbagliarlo trasforma 1.200 € in 1,2 €.
 */
export function numeroItaliano(s: string): number | null {
  const pulito = s.trim().replace(/\./g, '').replace(',', '.')
  if (pulito === '' || !/^\d+(\.\d+)?$/.test(pulito)) return null
  const n = Number(pulito)
  return Number.isFinite(n) ? n : null
}

export function estraiParametriOfferta(testo: string): ParametriOfferta {
  const t = (testo ?? '').replace(/\s+/g, ' ')
  if (!t.trim()) return { ...VUOTO }
  const out: ParametriOfferta = { ...VUOTO }

  // Canone: la parola vicino a un importo, in un verso o nell'altro.
  const canone =
    t.match(/canone[^0-9€]{0,25}€?\s*([\d.]+(?:,\d+)?)/i) ??
    t.match(/€\s*([\d.]+(?:,\d+)?)[^0-9]{0,25}canone/i)
  if (canone) out.canone = numeroItaliano(canone[1])

  // Commissione: una percentuale con decimali ("0,90%"). Si richiede la
  // virgola per non catturare "IVA 22%" o "sconto 50%".
  const comm = t.match(/(\d{1,2},\d{1,3})\s*%/)
  if (comm) out.commissione = numeroItaliano(comm[1])

  // Fascia di transato: "da 10.000 a 50.000" oppure "fino a 50.000".
  const intervallo = t.match(/da\s*€?\s*([\d.]+(?:,\d+)?)\s*(?:a|-|–)\s*€?\s*([\d.]+(?:,\d+)?)/i)
  if (intervallo) {
    out.transato_min = numeroItaliano(intervallo[1])
    out.transato_max = numeroItaliano(intervallo[2])
  } else {
    const finoA = t.match(/fino\s*a\s*€?\s*([\d.]+(?:,\d+)?)/i)
    if (finoA) out.transato_max = numeroItaliano(finoA[1])
    const oltre = t.match(/(?:oltre|da)\s*€?\s*([\d.]+(?:,\d+)?)\s*(?:in su|in poi)?/i)
    if (oltre && !finoA) out.transato_min = numeroItaliano(oltre[1])
  }

  return out
}

// ------------------------------------------------------------------ matching
export type OffertaCandidata = {
  id: string
  nome: string
  transato_min: number | null
  transato_max: number | null
}

export type OffertaValutata<T> = { offerta: T; punteggio: number; motivo: string }

/**
 * Ordina le offerte per adeguatezza al transato ANNUO del lead — il motore di
 * matching del 3.0, reso esplicito.
 *
 * Regole, dalla più forte alla più debole:
 *  - dentro la fascia dichiarata: massimo punteggio;
 *  - fuori fascia: penalità proporzionale alla distanza, così la più vicina
 *    resta comunque in cima invece di sparire;
 *  - offerta senza fascia: punteggio neutro, vale per tutti;
 *  - transato del lead sconosciuto: nessuna offerta è "sbagliata", quindi
 *    tutte neutre e l'ordine resta quello di partenza.
 */
export function ordinaPerTransato<T extends OffertaCandidata>(
  offerte: T[],
  transatoAnnuo: number | null | undefined,
): OffertaValutata<T>[] {
  return offerte
    .map((o, i) => {
      const senzaFascia = o.transato_min == null && o.transato_max == null
      if (transatoAnnuo == null || transatoAnnuo <= 0) {
        return { offerta: o, punteggio: 0, motivo: 'Transato del lead non indicato', ordine: i }
      }
      if (senzaFascia) {
        return { offerta: o, punteggio: 0, motivo: 'Nessuna fascia dichiarata', ordine: i }
      }
      const min = o.transato_min ?? 0
      const max = o.transato_max ?? Infinity
      if (transatoAnnuo >= min && transatoAnnuo <= max) {
        return { offerta: o, punteggio: 100, motivo: 'Nella fascia di transato', ordine: i }
      }
      const distanza = transatoAnnuo < min ? min - transatoAnnuo : transatoAnnuo - max
      // Penalità che cresce con la distanza ma non va sotto zero, così
      // l'ordinamento resta significativo anche per scarti enormi.
      const punteggio = Math.max(0, 50 - distanza / 1000)
      return {
        offerta: o,
        punteggio,
        motivo: transatoAnnuo < min ? 'Transato sotto la fascia' : 'Transato sopra la fascia',
        ordine: i,
      }
    })
    .sort((a, b) => b.punteggio - a.punteggio || a.ordine - b.ordine)
    .map(({ offerta, punteggio, motivo }) => ({ offerta, punteggio, motivo }))
}
