#!/usr/bin/env python3
"""Converte il database del CRM 3.0 (SQLite) in un backup JSON di AgentPro.

Uso:
    python3 scripts/migra-crm3.py "AgentPro_CRM_3.0 copia/data/crm.db" > migrazione.json

    # Se nel progetto ci sono GIA' dei lead (importati dallo stesso Excel),
    # passare la mappa P.IVA -> id esistente, altrimenti si creano doppioni:
    python3 scripts/migra-crm3.py crm.db --mappa-esistenti esistenti.json > migrazione.json

    dove esistenti.json e' [{"piva": "...", "id": "uuid"}, ...] preso dal
    progetto. Per ogni P.IVA gia' presente si RIUSA il suo id, cosi' l'upsert
    aggiorna la riga invece di scontrarsi con l'indice unico su (owner, piva).

Poi: Configurazione -> Backup -> "Scegli file .json" -> Ripristina.
Il ripristino fa upsert e riscrive owner_id con l'utente collegato, quindi si
puo' rilanciare senza creare doppioni.

PERCHE' PASSARE DAL BACKUP invece di scrivere su Supabase da qui: il file di
backup e' gia' il formato di scambio dell'app, il ripristino passa dalla RLS
con il JWT dell'utente vero, e non serve mettere una chiave di servizio in uno
script. In piu' il risultato e' ispezionabile prima di toccare il database.

LIMITI NOTI, dichiarati invece che nascosti:
  - lavorazioni.esito_id resta NULL: gli esiti sono un vocabolario con id
    generati per utente, e indovinare l'accoppiamento inventerebbe dati. Il
    testo dell'esito del 3.0 finisce nelle note, quindi non si perde nulla;
    lo stato derivato del lead diventa "in lavorazione", che e' corretto.
  - i ruoli dei contatti finiscono nelle note, per lo stesso motivo.
  - gli allegati non si migrano: i file stanno su disco, non nel database.
  - i campi che il 3.0 non conosce NON vengono inviati (niente chiavi a null):
    l'upsert aggiorna solo cio' che sa, invece di azzerare quello che c'e'.
"""

import json
import sqlite3
import sys
import uuid

# Namespace fisso: lo stesso id del 3.0 produce sempre lo stesso uuid, cosi'
# rilanciare la migrazione aggiorna le righe invece di duplicarle.
NS = uuid.UUID("6f9619ff-8b86-d011-b42d-00c04fc964ff")


def uid(prefisso, valore):
    return str(uuid.uuid5(NS, f"crm3:{prefisso}:{valore}"))


def senza_nulli(d):
    """Toglie le chiavi a None: l'upsert aggiorna solo i campi che conosciamo.

    Mandare esplicitamente null azzererebbe dati gia' presenti nel progetto,
    che e' l'opposto di quello che deve fare una migrazione."""
    return {k: v for k, v in d.items() if v is not None}


def s(v):
    """Stringa non vuota, o None."""
    if v is None:
        return None
    t = str(v).strip()
    return t or None


def num(v):
    try:
        t = str(v).replace(".", "").replace(",", ".").strip()
        return float(t) if t else None
    except Exception:
        return None


def intero(v):
    try:
        n = int(float(str(v).strip()))
        return n if n >= 0 else None
    except Exception:
        return None


# Il 3.0 aveva un target per lead; le lettere coincidono con le nostre.
TARGET_VALIDI = {"E", "A", "B", "C"}

# fonte: il 3.0 marcava self_gen a parte, il resto veniva dall'Excel NEXI.
def fonte(riga):
    if s(riga.get("self_gen")) in ("si", "1", "SI", "Si"):
        return "self_gen"
    return "import_excel"


def brand(riga):
    b = (s(riga.get("brand")) or "NEXI").upper()
    return "HERA_COMM" if "HERA" in b else "NEXI"


def converti(percorso_db, mappa_piva=None):
    mappa_piva = mappa_piva or {}
    con = sqlite3.connect(percorso_db)
    con.row_factory = sqlite3.Row

    def righe(tabella):
        try:
            return [dict(r) for r in con.execute(f"SELECT * FROM {tabella}")]
        except sqlite3.Error:
            return []

    tabelle = {}

    # ------------------------------------------------------------- agente
    ag = righe("agente")
    if ag:
        a = ag[0]
        tabelle["profilo_agente"] = [
            {
                "owner_id": "00000000-0000-0000-0000-000000000000",  # riscritto dal ripristino
                "nome": s(a.get("nome")),
                "cognome": s(a.get("cognome")),
                "area": s(a.get("area")),
                "tel": s(a.get("tel")),
                "cell": s(a.get("cell")),
                "email": s(a.get("email")),
                "indirizzo": s(a.get("indirizzo")),
                "note": s(a.get("note")),
            }
        ]

    # ------------------------------------------------------------ mandati
    mandati = []
    for m in righe("mandati"):
        b = "HERA_COMM" if "HERA" in (s(m.get("brand")) or "").upper() else "NEXI"
        mandati.append(
            {
                "id": uid("mandato", b),
                "brand": b,
                "ragione_sociale": s(m.get("ragione_sociale")),
                "codice_agente": s(m.get("codice_agente")),
                "admin": s(m.get("admin")),
                "area": s(m.get("area")),
                "tel": s(m.get("tel")),
                "cell": s(m.get("cell")),
                "email": s(m.get("email")),
                "referente": s(m.get("referente")),
                "indirizzo": s(m.get("indirizzo")),
                "firma": s(m.get("firma")) or "Cordiali saluti,",
                "note": s(m.get("note")),
            }
        )
    if mandati:
        tabelle["mandati"] = mandati

    # ------------------------------------------------- aree -> zone + comuni
    zone, zone_comune = [], []
    for a in righe("aree_custom"):
        zid = uid("zona", a["id"])
        zone.append(
            {
                "id": zid,
                "nome": s(a.get("nome")) or str(a["id"]),
                "ordine": intero(a.get("ordine")) or 0,
                "attivo": True,
            }
        )
        try:
            comuni = json.loads(a.get("comuni") or "[]")
        except Exception:
            comuni = []
        for c in comuni:
            nome = s(c)
            if nome:
                zone_comune.append(
                    {"id": uid("zonacomune", f"{a['id']}:{nome}"), "zona_id": zid, "comune": nome}
                )
    if zone:
        tabelle["zone"] = zone
    if zone_comune:
        tabelle["zone_comune"] = zone_comune

    # --------------------------------------------------------------- lead
    lead, lead_brand, riusati = [], [], []
    for l in righe("leads"):
        piva = s(l.get("piva"))
        # La colonna accetta solo 11 cifre: quello che non lo e' va scartato,
        # altrimenti il CHECK rifiuta l'intera riga.
        if piva and not (piva.isdigit() and len(piva) == 11):
            piva = None
        # Se la P.IVA e' gia' nel progetto si riusa il SUO id: l'upsert
        # aggiorna quella riga. Con un id nuovo l'indice unico su
        # (owner_id, piva) rifiuterebbe l'inserimento e farebbe fallire
        # l'intero blocco.
        lid = mappa_piva.get(piva) if piva else None
        riusato = lid is not None
        if lid is None:
            lid = uid("lead", l["id"])
        cap = s(l.get("cap"))
        if cap and not (cap.isdigit() and len(cap) == 5):
            cap = None
        prov = s(l.get("prov"))
        if prov and not (len(prov) == 2 and prov.isalpha()):
            prov = None
        target = (s(l.get("target")) or "").upper()

        # Il 3.0 teneva il transato ANNUO; qui si memorizza il MENSILE (§4).
        annuo = num(l.get("transato_annuo"))
        mensile = round(annuo / 12, 2) if annuo else None

        note = " | ".join(
            filter(
                None,
                [
                    s(l.get("note")),
                    f"Stato CRM 3.0: {s(l.get('stato'))}" if s(l.get("stato")) else None,
                    f"Verifica CRM 3.0: {s(l.get('verify_state'))}"
                    if s(l.get("verify_state"))
                    else None,
                    f"Referente: {s(l.get('ref_nome'))} ({s(l.get('ref_ruolo')) or '-'})"
                    if s(l.get("ref_nome"))
                    else None,
                ],
            )
        )

        lead.append(
            senza_nulli({
                "id": lid,
                "ragione_sociale": s(l.get("nome")) or "Senza nome",
                "piva": piva,
                "codice_fiscale": s(l.get("cf")),
                "indirizzo": s(l.get("addr")),
                "cap": cap,
                "comune": s(l.get("comune")),
                "provincia": prov,
                "email": s(l.get("email")),
                "pec": s(l.get("pec")),
                "sito_web": s(l.get("web")),
                "telefono": s(l.get("tel")),
                "cellulare": s(l.get("cell")),
                "mcc": s(l.get("mcc")),
                "psp_attuale": s(l.get("psp")),
                "orari": s(l.get("orari")),
                "forma_giuridica": s(l.get("forma")),
                "n_punti_vendita": intero(l.get("n_punti_vendita")),
                "fatturato_mensile": mensile,
                "target": target if target in TARGET_VALIDI else None,
                "fonte": fonte(l),
                "proposta_offerta": s(l.get("proposta_offerta")),
                "import_sessione": s(l.get("import_session")),
                "note": note or None,
                "zona_manuale": False,
            })
        )
        lead_brand.append(
            {
                "id": uid("leadbrand", lid),
                "lead_id": lid,
                "brand": brand(l),
                "stato": "da_contattare",  # lo ricalcola il trigger dalle lavorazioni
            }
        )
        if riusato:
            riusati.append(lid)

    tabelle["lead"] = lead
    tabelle["lead_brand"] = lead_brand

    # ----------------------------------------------------------- contatti
    # id del lead per id legacy, cosi' i figli puntano alla riga giusta
    per_legacy = {}
    for l in righe("leads"):
        pv = s(l.get("piva"))
        pv = pv if (pv and pv.isdigit() and len(pv) == 11) else None
        per_legacy[str(l["id"])] = (mappa_piva.get(pv) if pv else None) or uid("lead", l["id"])

    contatti = []
    for c in righe("contatti"):
        nome = s(c.get("nome"))
        if not nome:
            continue
        note = " | ".join(
            filter(None, [s(c.get("note")), f"Ruolo CRM 3.0: {s(c.get('ruolo'))}" if s(c.get("ruolo")) else None])
        )
        contatti.append(
            {
                "id": uid("contatto", c["id"]),
                "lead_id": per_legacy.get(str(c["lead_id"]), uid("lead", c["lead_id"])),
                "nome": nome,
                "telefono": s(c.get("tel")),
                "note": note or None,
                "provenienza": "manuale",
                "principale": False,
            }
        )
    if contatti:
        tabelle["contatti"] = contatti

    # -------------------------------------------------------- lavorazioni
    lavorazioni = []
    idlead = {l["id"] for l in lead}
    for v in righe("lavorazioni"):
        lid = per_legacy.get(str(v["lead_id"]), uid("lead", v["lead_id"]))
        if lid not in idlead:
            continue
        testo = " | ".join(
            filter(
                None,
                [
                    s(v.get("testo")),
                    f"Esito CRM 3.0: {s(v.get('esito'))}" if s(v.get("esito")) else None,
                    f"Tipo: {s(v.get('tipo'))}" if s(v.get("tipo")) else None,
                    f"Azione: {s(v.get('azione_futura'))}" if s(v.get("azione_futura")) else None,
                ],
            )
        )
        data = s(v.get("visita_ts")) or s(v.get("data"))
        lavorazioni.append(
            {
                "id": uid("lavorazione", v["id"]),
                "lead_id": lid,
                "brand": next((b["brand"] for b in lead_brand if b["lead_id"] == lid), "NEXI"),
                "esito_id": None,  # vedi limiti in testa al file
                "note": testo or None,
                "data_ora": (data or "").replace(" ", "T") or None,
            }
        )
    if lavorazioni:
        tabelle["lavorazioni"] = lavorazioni

    # ------------------------------------------------------- appuntamenti
    appuntamenti = []
    for a in righe("appuntamenti"):
        lid = per_legacy.get(str(a["lead_id"]), uid("lead", a["lead_id"]))
        if lid not in idlead:
            continue
        giorno = s(a.get("data"))
        if not giorno:
            continue
        ora = s(a.get("ora")) or "09:00"
        appuntamenti.append(
            {
                "id": uid("appuntamento", a["id"]),
                "lead_id": lid,
                "brand": next((b["brand"] for b in lead_brand if b["lead_id"] == lid), "NEXI"),
                "inizio": f"{giorno}T{ora}:00",
                "durata_min": intero(a.get("durata")) or 60,
                "luogo": s(a.get("note")),
                "stato": "pianificato",
            }
        )
    if appuntamenti:
        tabelle["appuntamenti"] = appuntamenti

    con.close()
    return {"versione": 1, "creato": "migrazione-crm3", "tabelle": tabelle}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    mappa = {}
    if "--mappa-esistenti" in sys.argv:
        percorso = sys.argv[sys.argv.index("--mappa-esistenti") + 1]
        for r in json.load(open(percorso)):
            if r.get("piva") and r.get("id"):
                mappa[str(r["piva"])] = str(r["id"])
        print(f"-- P.IVA gia' nel progetto: {len(mappa)}", file=sys.stderr)
    backup = converti(sys.argv[1], mappa)
    conteggi = {k: len(v) for k, v in backup["tabelle"].items()}
    print(json.dumps(backup, ensure_ascii=False, indent=2))
    print(f"\n-- righe convertite: {conteggi}", file=sys.stderr)
