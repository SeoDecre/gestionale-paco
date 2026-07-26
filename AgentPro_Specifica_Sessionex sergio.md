# AgentPro CRM web — Specifica sessione di progettazione

Documento riepilogativo di tutte le decisioni prese durante la sessione di progettazione con Paco, da usare come contesto completo per continuare lo sviluppo in Claude Code sul Mac Mini.

---

## 0. Stato del progetto

Repository: `pacosoftdecre/agentpro-web` (GitHub). Stack: Next.js (App Router) + TypeScript, Prisma su Postgres (Vercel Postgres), Vercel Blob per allegati, autenticazione password unica + cookie di sessione firmato.

- **Fase 0** (fatta e testata in locale): login, middleware di protezione, schema Prisma iniziale, dashboard placeholder.
- **Fase 1** (fatta, mai testata con DB reale): API CRUD lead/sedi/POS terminali, pagine lista lead, nuovo lead, dettaglio lead con anagrafica modificabile.
- **Cartella di lavoro**: deve stare FUORI da iCloud Drive (es. `~/Documents/agentpro-web`), mai dentro `Mobile Documents/com~apple~iCloud`, per evitare conflitti tra iCloud e Git sui file nascosti `.git`.
- **Prossimo passo tecnico immediato**: completare `git push` su GitHub (se non già fatto), collegare Vercel con Vercel Postgres, impostare le variabili d'ambiente `APP_PASSWORD` e `AUTH_SECRET`, fare `npm run db:push` per applicare lo schema aggiornato.

---

## 1. Modello dati — aggiornamenti rispetto allo schema Fase 1

- **`Lead.brand`**: da valore singolo diventa **lista** (`Brand[]`). Un lead può avere sia NEXI che Hera Comm assegnati insieme (stesso cliente lavorato per entrambi i brand). Anagrafica unica; le sezioni tecniche si mostrano in base ai brand assegnati.
- **`Lead.referente` e `Lead.telefono` a livello lead**: **rimossi**. Il referente è semplicemente il `Contatto` con etichetta "Principale" (badge, un solo Principale per volta). Import mail call center ed Excel creano Contatti, non compilano più questi campi.
- **`Allegato.tipo`**: esteso a `"foto" | "documento" | "audio"` (prima solo foto/audio).
- **`Allegato` per audio**: aggiungere `stato: "da_integrare" | "integrato"` e `integratoAt: DateTime?` (usato dal job di cancellazione automatica a 48 ore dopo essere marcato integrato).
- **Nuova tabella `ParametriTarget`**: soglie E/A/B/C configurabili a DB, non hardcoded. Campi: `target` (enum), `sogliaMinAnnua`, `sogliaMaxAnnua`. Editabile da sezione Parametri (vedi punto 9).
- **`Offerta`**: già esiste nello schema, va esposta come vera sezione CRUD (vedi punto 9), non solo tabella.
- **Import Excel — modalità doppioni**: aggiungere terza opzione oltre a "sovrascrivi tutto" / "lascia esistente": **"Integra solo i campi presenti nel file"** — aggiorna solo i campi valorizzati nella riga Excel, lascia intatti gli altri. In tutti e tre i casi, Lavorazioni/Appuntamenti/Contatti/Storico non vengono mai toccati.

---

## 2. Principi grafici generali (validi su tutta l'app)

**Layout per device**
- **iPhone**: colonna singola, mai campi affiancati, piena larghezza. Font: etichette 15px, testo campi 17px. Nome attività grande (22px) e centrato in testata, editabile. Indirizzo cliccabile → apre Maps.
- **iPad**: master-detail (lista lead a sinistra, dettaglio a destra), campi anche a 2 colonne dove utile, testo SEMPRE grande e leggibile (non ridotto per guadagnare spazio — la densità viene dal vedere più cose insieme, non da caratteri più piccoli).
- **Desktop**: layout più denso, multi-colonna.

**Etichette dei campi**: stile "pillola" — rettangolo arrotondato, sfondo grigio neutro, testo centrato, larghezza piena su iPhone.

**Colori semantici** (coerenti ovunque):
- Rosso chiaro: concorrenti/POS attuale, conflitti/errori (slot planning occupato), tasti elimina
- Verde chiaro: stati positivi (Verificato, Coincide, zona comoda planning), brand Hera Comm, badge "Principale" contatto
- Blu chiaro: brand NEXI, link cliccabili, sezione "Oggi" in dashboard
- Ambra chiaro: target, banner modifiche non salvate, avvisi soft
- Grigio neutro: etichette campi, sfondo card, badge fonte lead (self gen/call center)
- **Eccezione**: tasti "Memo vocale" e "Foto/doc." usano rosso pieno (fill-danger) per convenzione universale di registrazione, non seguono la logica semantica sopra

**Stato modifiche non salvate**: banner ambra "Modifiche non salvate" appena si tocca un campo; conferma richiesta se si esce senza salvare.

**Tutti i campi anagrafica sono modificabili in linea**, nessuno di sola lettura (nome attività incluso).

---

## 3. Dashboard/Home

Ordine sezioni, dall'alto in basso:

1. **Ricerca rapida** (stessa logica della lista lead)
2. **"Oggi"**: appuntamenti del giorno in ordine orario (evidenzia il più imminente), lead da richiamare oggi, **mappa** con le tappe della giornata e percorso tracciato (tap su tappa → apre Apple/Google Maps), tasto "Apri percorso completo"
3. **Statistiche rapide** (griglia 2x2, tutte cliccabili → aprono lista lead filtrata): Lead totali, Da contattare, In lavorazione, Chiusi (mese)
4. **Per fonte** (2 riquadri cliccabili → lista filtrata): Self gen, Call center NEXI (Excel aziendale non ha riquadro, è la fonte predefinita)
5. **Accessi rapidi** (griglia 2x2): Nuovo lead, Da mail call center, Importa Excel, Planning

Ogni riga appuntamento in "Oggi" è cliccabile → apre la scheda lead.

---

## 4. Scheda lead — struttura completa

**Testata**: badge (brand — anche multipli, target, fonte se self gen/call center), nome attività (editabile, grande, centrato), indirizzo (cliccabile → Maps).

**Scorciatoie rapide** (subito sotto la testata, sfondo rosso pieno, affiancate):
- "Memo vocale" (icona microfono) — tap avvia registrazione
- "Foto/doc." (icona camera) — tap apre scelta Scatta foto / Carica PDF-PNG

**Campi sempre visibili**: Email, Sito web, P.IVA (+ tasto ricerca Google), Verifica dati online (tasti Google + Facebook basati sul nome attività), POS attuale (chip concorrenti a livello azienda, non per sede), Target + Fatturato mensile (con suggerimento automatico di rivalutazione target — mai applicato in automatico, sempre tasto "Applica"), Offerta consigliata (pescata dal target).

**In fondo, griglia 2x2 di tasti che aprono sezioni a parte** (ognuno col conteggio):
- **Contatti**: elenco nominativi (ruolo da tendina gestibile come le etichette sede), ognuno con badge provenienza + data ("Da mail call center", "Da import Excel", "Aggiunto a mano"), badge "Principale" per il referente, tasto rosso "-" (elimina diretto) e verde telefono (chiama + crea lavorazione veloce automatica "Chiamato [nome] il [data] alle [ora]"). Tasto "Aggiungi contatto" in fondo, apre modal con Ruolo/Nome/Telefono e tasti Elimina/Annulla/Salva.
- **Sedi** (fino a 4): nome sede (come su scontrino POS), indirizzo con autocompletamento (Photon/OSM — comune autofill cap+provincia, via con suggerimenti), etichetta da tendina gestibile, POS multipli (tipo: Smart/Fisso/Mobile/Virtuale + IBAN proprio), note libere per sede. Contatore "POS dichiarati (a voce) / censiti (nelle sedi)" per confronto. Modal nuova sede precompilato con l'indirizzo già in anagrafica.
- **Lavorazioni**: storico cronologico (esito, data, contatto, note, appuntamento generato se presente) + tasto "Nuova lavorazione" che apre Registra lavorazione (vedi punto 5).
- **Foto e documenti**: griglia foto/PDF con anteprima, tasti Scatta foto/Carica PDF-PNG; sotto, memo vocali con play/durata/data e stato Da integrare (ambra) / Integrato (verde) — cancellazione automatica 48h dopo essere marcato Integrato.

---

## 5. Registra lavorazione

Campi: **Contatto di riferimento** (tendina che pesca dai Contatti già salvati sul lead, scorciatoia "+ Nuovo contatto" se vuota — MAI ruolo/nome/telefono duplicati qui), Cosa è successo (pillole a scelta singola, opzioni gestibili), Azione successiva, **Slot planning suggeriti** (vedi punto 6), Note visita, **Richieste POS emerse in chiamata** (n. POS richiesti, differenziare per sede S/N, nota — collegate poi al censimento sedi reale, con indicatore "sedi censite finora X di Y richiesti").

**Salvataggio**: un solo tap su "Salva" scrive contemporaneamente la Lavorazione E l'eventuale Appuntamento in Planning (se è stato scelto uno slot).

---

## 6. Planning

- Ogni appuntamento occupa 1 ora.
- Anti-accavallamento: blocco 409 su slot già occupato (unico calendario, indipendente dal brand).
- Fasce escluse dai **suggerimenti** automatici (non bloccanti se inserite manualmente): prima delle 10:00, 13:00–14:30, dopo le 20:00.
- Suggerimento slot: per ogni giorno con almeno un appuntamento già fissato in zona (tabella Zona/aree_custom) comoda per il lead, propone lo slot subito PRIMA e subito DOPO quell'appuntamento. Giorni senza zona comoda vengono ESCLUSI dai suggerimenti (niente fallback generico).
- Nessun calcolo di tempo di percorrenza reale — solo stima per zona configurata.

---

## 7. Notifiche

- **07:00**: push (iPad/iPhone) con riepilogo giornata — appuntamenti in ordine, lead da richiamare, avvisi planning.
- **20:00**: push con cosa fatto oggi + anteprima domani + conteggio memo vocali "da integrare" su tutti i lead.
- **1 ora prima di ogni appuntamento**: push di promemoria puntuale.
- Su desktop: stesso contenuto in evidenza in dashboard (sezione "Oggi"), niente notifica di sistema.
- Richiede permesso di notifica la prima volta, service worker minimo (solo push, NESSUNA cache offline), job schedulato via Vercel Cron. Suono: standard di sistema.

---

## 8. Import dati

**Import Excel mensile**: nuovi nominativi importati diretti. Doppioni (per P.IVA) → lista di revisione, per ciascuno tre scelte: Sovrascrivi tutto / Lascia esistente / Integra solo i campi presenti nel file. Lavorazioni/appuntamenti/contatti/storico mai toccati.

**Import da mail call center NEXI**: campo "incolla testo mail" → tasto "Estrai dati" → anteprima modificabile (nome attività, P.IVA, indirizzo, POS attuale, appuntamento, note) → controllo doppioni per P.IVA → "Crea lead e appuntamento" in un colpo solo. Il referente/telefono estratto crea un Contatto marcato Principale. Lead taggato "Call center NEXI".

---

## 9. Sezione Configurazione azienda (nuova, importante)

Sostituisce/formalizza il vecchio `OffertePanel` come vera sezione di amministrazione, accessibile solo da Paco:

- **Offerte per azienda** (NEXI / Hera Comm): elenco CRUD completo — crea, modifica, elimina in qualsiasi momento (le condizioni commerciali cambiano spesso). Ogni offerta: nome, descrizione, target min/max, canone, PDF originale, stato attiva/archiviata.
- **Parametri target**: sezione dedicata dove le soglie E/A/B/C (oggi: E>140k, A 60-140k, B 40-60k, C<40k) sono **editabili a DB**, non scritte nel codice — se NEXI cambia le soglie ufficiali, Paco le aggiorna da qui senza bisogno di modificare il codice.
- Sezione parametrica pensata per crescere: eventuali altri parametri configurabili (es. fasce orarie planning, durata appuntamento) potranno finire qui in futuro.

---

## 10. Sezioni tecniche NEXI (nella scheda lead, solo se brand include NEXI)

- **Multi-POS & pagamenti**: pagamento rateale interessato S/N; clienti extra-UE con carte in valuta estera S/N → se sì, attiva/segnala DCC.
- **American Express**: ha già il servizio S/N → se sì "vuole continuare?" S/N; se no "vuole attivare?" S/N.
- **Costi POS attuali**: canone/commissioni attuali + verifica automatica del target (avviso se il transato indicato non corrisponde al target assegnato, sempre da confermare manualmente, mai automatico).
- **Operatività & tecnologia** (ridotta): solo 2 domande — Transazioni sotto 30€ frequenti? S/N; Vuole vedere transazioni da fuori sede? S/N. (Eliminato: difficoltà raggiungere agenzia, storni transazioni, interruzioni internet/elettrica, connettività — DCC extra-UE resta solo in Multi-POS & pagamenti, non duplicato qui).
- **Banca & Business** (ridotta): vende online S/N; riceve ordini telefonici S/N. (Eliminato: soddisfazione banca, cambio banca passato).

## 11. Hera Comm (solo se brand include Hera Comm)

Per ora: solo Anagrafica + Registra lavorazione + Planning (condivise con NEXI). Nessuna sezione tecnica specifica finché Paco non fornisce i campi energia/fotovoltaico. **Niente configuratore multi-azienda generico** — è stato scartato: ogni brand ha le proprie sezioni concrete, non un sistema dinamico di campi configurabili.

---

## 12. Report statistico (prima versione)

Macro aree: conversione per zona/comune; funnel contattati→chiusi per target e per brand; concorrenti dominanti per zona; efficacia per fonte lead (Excel/self gen/call center). Rimandate a dopo: verifica affidabilità target, offerte che convertono di più, stagionalità.

## 13. Export Excel e liste salvate

Filtri combinabili: zona, target, brand, stato lavorazione, fonte lead, data ultimo contatto, concorrente attuale, campagna. Colonne export selezionabili liberamente. Liste salvabili con nome, riusabili sia per export sia come vista di lavoro dentro il CRM per richiamare/lavorare i lead filtrati.

---

## 14. Audit versione precedente (3.0) — NON riportare nella nuova versione

- Backup/Restore manuale JSON → eliminato (backup automatici Postgres)
- Field Report standalone HTML + condivisione WhatsApp/Telegram/link locale + sync iCloud → eliminato del tutto (unica interfaccia web sempre sincronizzata)
- Configuratore multi-azienda generico → eliminato (sostituito da sezioni concrete per brand, vedi punti 10-11)

---

## 15. iPad — layout specifico

Master-detail: lista lead a sinistra (sempre visibile), dettaglio completo a destra. Campi anche a 2 colonne dove ha senso (es. Email/P.IVA affiancati, Fatturato/POS attuale affiancati). I 4 tasti sezione (Contatti/Sedi/Lavorazioni/Foto) in riga orizzontale invece che griglia 2x2. Testo sempre a dimensione ben leggibile, mai ridotto per guadagnare spazio orizzontale — la densità in più viene dal vedere più elementi affiancati, non da caratteri più piccoli.

---

## 16. Priorità di lavoro suggerita da qui

1. Aggiornare schema Prisma con le modifiche del punto 1 (brand array, rimozione referente/telefono lead, Allegato esteso, ParametriTarget)
2. Completare collegamento GitHub → Vercel → Vercel Postgres, deploy funzionante
3. Aggiornare la UI lead esistente (Fase 1) con: quick buttons memo/foto, griglia 4 tasti sezione, Contatti con provenienza/badge Principale, rimozione campo referente
4. Costruire Registra lavorazione con contatto di riferimento + slot planning
5. Costruire Planning con anti-accavallamento e suggerimento zona
6. Costruire sezione Configurazione azienda (Offerte + Parametri target)
7. Import Excel e import mail call center
8. Notifiche push
9. Report ed Export
