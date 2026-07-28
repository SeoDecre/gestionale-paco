/**
 * Download lato client di un file generato in memoria (backup JSON, .ics,
 * export). Un solo punto per creare/revocare l'object URL: dimenticare la
 * revoke tiene il blob in memoria per tutta la vita della pagina.
 */
export function scaricaBlob(nomeFile: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeFile
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function scaricaTesto(nomeFile: string, testo: string, mime = 'text/plain'): void {
  scaricaBlob(nomeFile, new Blob([testo], { type: `${mime};charset=utf-8` }))
}

/**
 * Apre un link esterno in una scheda nuova. `noopener` è obbligatorio: senza,
 * la pagina aperta può manipolare quella di partenza tramite window.opener.
 */
export function apriEsterno(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer')
}
