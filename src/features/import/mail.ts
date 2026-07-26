/**
 * Parser della mail call-center NEXI (§8). Costruito "alla cieca" senza un
 * campione reale: si basa su etichette "Campo: valore" con vari sinonimi, più
 * qualche fallback (P.IVA come 11 cifre ovunque). Da tarare quando arriva una
 * mail vera — la mappa SINONIMI è l'unico punto da toccare.
 */

export type DatiMail = {
  ragione_sociale: string | null
  piva: string | null
  indirizzo: string | null
  cap: string | null
  comune: string | null
  provincia: string | null
  pos_attuale: string | null
  referente: string | null
  telefono: string | null
  appuntamento: string | null
  note: string | null
}

const SINONIMI: Record<keyof DatiMail, string[]> = {
  ragione_sociale: ['ragione sociale', 'nome attività', 'nome attivita', 'attività', 'azienda', 'cliente'],
  piva: ['p.iva', 'p. iva', 'partita iva', 'piva', 'vat'],
  indirizzo: ['indirizzo', 'via'],
  cap: ['cap'],
  comune: ['comune', 'città', 'citta', 'localita', 'località'],
  provincia: ['provincia', 'prov'],
  pos_attuale: ['pos attuale', 'pos', 'concorrente', 'gestore attuale'],
  referente: ['referente', 'contatto', 'titolare', 'nominativo'],
  telefono: ['telefono', 'tel', 'cellulare', 'cell', 'recapito'],
  appuntamento: ['appuntamento', 'appunt', 'data appuntamento', 'quando'],
  note: ['note', 'annotazioni', 'osservazioni'],
}

/** Cerca "etichetta: valore" per uno dei sinonimi, sulla stessa riga. */
function campo(testo: string, etichette: string[]): string | null {
  for (const et of etichette) {
    const re = new RegExp(`^\\s*${escape(et)}\\s*[:\\-]\\s*(.+)$`, 'im')
    const m = testo.match(re)
    if (m && m[1].trim()) return m[1].trim()
  }
  return null
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const soloCifre = (v: string | null): string | null => {
  if (!v) return null
  const c = v.replace(/\D/g, '')
  return c || null
}

export function estraiDaMail(testo: string): DatiMail {
  const dati: DatiMail = {
    ragione_sociale: campo(testo, SINONIMI.ragione_sociale),
    piva: null,
    indirizzo: campo(testo, SINONIMI.indirizzo),
    cap: null,
    comune: campo(testo, SINONIMI.comune),
    provincia: null,
    pos_attuale: campo(testo, SINONIMI.pos_attuale),
    referente: campo(testo, SINONIMI.referente),
    telefono: soloCifre(campo(testo, SINONIMI.telefono)),
    appuntamento: campo(testo, SINONIMI.appuntamento),
    note: campo(testo, SINONIMI.note),
  }

  // P.IVA: dall'etichetta oppure, in mancanza, 11 cifre consecutive nel testo.
  const pivaEtichetta = soloCifre(campo(testo, SINONIMI.piva))
  dati.piva =
    pivaEtichetta && pivaEtichetta.length === 11
      ? pivaEtichetta
      : (testo.match(/\b(\d{11})\b/)?.[1] ?? null)

  // CAP: dall'etichetta oppure 5 cifre isolate.
  const capEtichetta = campo(testo, SINONIMI.cap)
  dati.cap =
    (capEtichetta && capEtichetta.match(/\b\d{5}\b/)?.[0]) ||
    (testo.match(/\b(\d{5})\b/)?.[1] ?? null)

  const prov = campo(testo, SINONIMI.provincia)
  dati.provincia = prov && /^[A-Za-z]{2}$/.test(prov.trim()) ? prov.trim().toUpperCase() : null

  return dati
}
