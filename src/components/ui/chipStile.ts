/**
 * Le classi di un chip, senza l'elemento.
 *
 * Vive in un file suo e non dentro `Chip.tsx` perche' oxlint (regola
 * `only-export-components`) vieta di esportare non-componenti da un modulo di
 * componenti: romperebbe il Fast Refresh.
 *
 * Serve quando il chip deve essere un link e non un bottone (navigazione): un
 * `<button>` dentro un `<a>` non e' HTML valido e rompe il tasto indietro.
 */
export function classiChip({
  attivo = false,
  tratteggiato = false,
}: { attivo?: boolean; tratteggiato?: boolean } = {}) {
  return [
    'premibile inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap',
    'rounded-pillola border px-3 py-1.5 text-etichetta font-medium',
    tratteggiato ? 'border-dashed' : '',
    attivo
      ? 'border-info-soft-border bg-info-soft text-info-soft-text'
      : 'border-bordo bg-superficie text-testo-debole hover:border-bordo-forte hover:text-testo',
  ].join(' ')
}
