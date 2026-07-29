# AgentPro — sistema di design

Documento breve. La fonte di verità è `src/index.css`; qui c'è solo come
usarla e perché è fatta così.

## La regola

**Nei componenti si usa sempre un token, mai un valore grezzo.**

Niente `bg-slate-100`, niente `#fff`, niente `text-[13px]`, niente
`duration-200`, niente `z-50`. Se serve un valore che non esiste, si aggiunge
a `src/index.css` — non lo si scrive nel componente.

Il motivo pratico: il tema scuro è arrivato dopo, ed è costato **una sezione
di `index.css` e zero righe nei componenti**. Ogni valore grezzo che si
infila nei file è un punto che il prossimo cambio globale non raggiungerà.

## I tre strati di `index.css`

1. **Palette runtime** (`--t-*`) — gli unici colori veri del progetto, una
   volta per tema (chiaro, scuro).
2. **Token semantici** (`@theme inline`) — danno un nome al *ruolo*
   (`--color-superficie`, `--color-danger-soft`), non al colore. È quello che
   i componenti vedono.
3. **Base + utility composte** — regole globali (focus, tocco,
   reduced-motion) e utility che incapsulano una decisione (`premibile`,
   `superficie-card`).

Lo strato 2 non conosce nessun colore. Per questo aggiungere un tema è
un'operazione locale.

## Token disponibili

| Famiglia | Token |
|---|---|
| Superfici | `sfondo` `superficie` `superficie-alt` `bordo` `bordo-forte` |
| Testo | `testo` `testo-debole` `testo-tenue` |
| Azione | `primario` `primario-forte` `primario-testo` |
| Tinte semantiche | `{danger,success,info,warning,neutral}-soft` + `-soft-border` + `-soft-text` |
| Eccezione §2 | `danger-fill` `danger-fill-text` — **solo** Memo vocale / Foto |
| Sistema | `focus` `velo` |
| Testo (dimensioni) | `text-micro` 13 · `text-etichetta` 15 · `text-campo` 17 · `text-titolo` 22 · `text-cifra` 30 |
| Raggi | `radius-piccolo` 8 · `radius-card` 12 · `radius-grande` 16 · `radius-pillola` |
| Ombre | `shadow-basso` `shadow-medio` `shadow-alto` |
| Curve | `ease-uscita` `ease-morbida` `ease-cassetto` |
| Durate | `--durata-pressione` 140 · `--durata-veloce` 160 · `--durata-media` 220 · `--durata-lenta` 300 |
| Z-index | `z-sticky` `z-navigazione` `z-velo` `z-dialogo` `z-avviso` |

`text-micro` esiste **solo** per etichette di navigazione e badge. Mai per
contenuto leggibile: §15 vieta di rimpicciolire il testo per guadagnare
spazio, la densità viene dal vedere più elementi.

## Utility composte

| Utility | Cosa incapsula |
|---|---|
| `superficie-card` | sfondo + bordo + raggio della card |
| `premibile` | feedback al tocco (`scale(0.97)`) + transizioni di colore |
| `premibile-ampio` | come sopra ma per card e righe di lista (`scale(0.995)`) |
| `transizione-colore` | transizione su colore/bordo/sfondo, mai `all` |
| `transizione-opacita` / `transizione-trasformazione` | le altre due transizioni consentite |
| `cifre` | cifre a larghezza fissa (contatori, orari, importi) |
| `scorrevole-x` | riga che scorre in orizzontale senza scrollbar |
| `pb-sicura` / `spazio-barra` | safe area inferiore e spazio per la tab bar |

## Componenti

Tutto in `src/components/ui/`. **Non** si ridisegna a mano ciò che esiste già.

- `Bottone` (`primario` `secondario` `fantasma` `pericolo` `registrazione`),
  `BottoneIcona` — obbliga a passare `etichetta`, così un bersaglio di sola
  icona non resta muto per VoiceOver.
- `Campo` + `Input` / `Select` / `Textarea` — `Campo` collega da solo
  `id`, `aria-invalid`, `aria-describedby` e l'asterisco di obbligatorietà.
- `Scheda`, `TestataPagina` — superficie con intestazione, titolo di pagina.
- `Chip` + `BarraChip`, `classiChip` (per i chip che sono link).
- `Segmentato` — una scelta fra N, con `role="radiogroup"`.
- `Pillola`, `PillolaColorata` (colori presi dal vocabolario in DB).
- `Avviso` — riquadro di nota; tinta = significato, icona sempre presente.
- `Stato`: `Caricamento`, `Scheletro`, `Errore`, `Vuoto`.
- `Icona` — **unico** file che importa `lucide-react`. Nomi semantici
  (`agenda`, `pos`), non descrittivi del disegno.

## Regole non negoziabili

- **Nessuna emoji come icona.** Il tipo `NomeIcona` lo impedisce a
  compilazione: passare `'📅'` a `<Icona>` è un errore di TypeScript.
- **Il colore non è mai l'unica informazione** (WCAG 1.4.1): stati ed esiti
  portano anche un'icona.
- **Bersagli da 44px**, imposto da `button { min-height: var(--tocco-min) }`.
- **Etichette visibili**, non `placeholder` usati come etichetta. Dove
  l'etichetta ruberebbe spazio (filtri) serve almeno `aria-label`.
- **`hover:` è ridefinito** dentro `@media (hover: hover) and (pointer: fine)`
  (§ `@custom-variant` in `index.css`): sul telefono un hover resterebbe
  appiccicato dopo il tap. Il feedback al tocco lo dà `premibile`.
- **Mai `transition: all`** e mai animare `width`/`height`/`top`/`left`: solo
  `transform` e `opacity`, che non passano da layout e paint.
- **Mai `ease-in`** sull'interfaccia: parte lento, e l'istante in cui l'utente
  guarda di più è il primo.
- **`prefers-reduced-motion`** è già gestito globalmente in `index.css`.

## Contrasto

`scripts/verifica-contrasto.py` legge i token da `src/index.css`, converte
oklch → sRGB e verifica ogni coppia testo/sfondo nei **due** temi contro le
soglie WCAG (4.5:1 testo, 3:1 controlli e bordi di campo).

```bash
npm run contrasto      # esce diverso da zero se una coppia scende sotto soglia
```

Va rieseguito **ogni volta che si tocca un colore**. Al momento passano tutte
e 46 le coppie.

> `bordo` e `bordo-forte` non sono sinonimi: `bordo` è un divisore decorativo,
> `bordo-forte` è il bordo dei controlli (input, select, bottoni secondari) e
> deve reggere 3:1, altrimenti sotto il sole il campo sparisce.

## Cosa NON è verificato

Il sistema è verificato per contrasto, tipi, build, test e lint. **Non è mai
stato visto renderizzato in un browser** — vale per questo lavoro come per
tutto il resto del progetto (vedi `HANDOFF.md`). Il tema scuro in particolare
è corretto sulla carta e mai guardato.
