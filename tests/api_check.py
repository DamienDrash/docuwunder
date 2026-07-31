#!/usr/bin/env python3
"""Vertragspruefung gegen die laufende Paperless-ngx-API.

Die App verlaesst sich auf eine Reihe konkreter Zusagen der API: bestimmte
Filterparameter, die Sortierfelder, die Struktur der Volltexttreffer und den
Ablauf beim Hochladen. Faellt eine davon weg - etwa nach einem Serverupdate -
zeigt die Oberflaeche stumm falsche oder gar keine Daten. Dieses Skript prueft
jede dieser Zusagen einzeln.

Der Token kommt aus der Umgebung:

    PAPERLESS_TOKEN=… python3 tests/api_check.py

Ersatzweise aus tests/.token (nicht versioniert). Die Adresse laesst sich mit
PAPERLESS_URL uebersteuern.
"""
import json
import os
import pathlib
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASIS = os.environ.get("PAPERLESS_URL", "http://127.0.0.1:8099/paperless/api").rstrip("/")

ergebnisse = []


def token() -> str:
    t = os.environ.get("PAPERLESS_TOKEN", "").strip()
    if t:
        return t
    datei = ROOT / "tests" / ".token"
    if datei.exists():
        return datei.read_text(encoding="utf-8").strip()
    print("Kein API-Token. Setze PAPERLESS_TOKEN oder lege tests/.token an.")
    print("Token erzeugen: Paperless-Oberflaeche -> Einstellungen -> API-Token.")
    sys.exit(2)


TOKEN = token()


def hole(pfad, params=None, method="GET", daten=None, roh=False, typ="application/json"):
    url = BASIS + pfad
    if params:
        url += "?" + urllib.parse.urlencode(params)
    rumpf = None
    if daten is not None:
        rumpf = daten if isinstance(daten, bytes) else json.dumps(daten).encode()
    req = urllib.request.Request(url, data=rumpf, method=method)
    req.add_header("Authorization", "Token " + TOKEN)
    req.add_header("Accept", "*/*" if roh else "application/json")
    if daten is not None and not isinstance(daten, bytes):
        req.add_header("Content-Type", "application/json")
    elif typ and isinstance(daten, bytes):
        req.add_header("Content-Type", typ)
    with urllib.request.urlopen(req, timeout=30) as r:
        inhalt = r.read()
        if roh:
            return r.status, inhalt, r.headers
        return r.status, (json.loads(inhalt) if inhalt else None), r.headers


def pruefe(name, fn):
    try:
        hinweis = fn()
        ergebnisse.append((True, name, hinweis or ""))
        print(f"  ok      {name}" + (f" – {hinweis}" if hinweis else ""))
    except AssertionError as e:
        ergebnisse.append((False, name, str(e)))
        print(f"  FEHLER  {name}: {e}")
    except Exception as e:  # noqa: BLE001 - jede Ursache soll als Fehler zaehlen
        ergebnisse.append((False, name, repr(e)))
        print(f"  FEHLER  {name}: {e!r}")


def anzahl(params):
    _, d, _ = hole("/documents/", dict(params, page_size=1, fields="id"))
    return d["count"]


def ids(params, n=50):
    _, d, _ = hole("/documents/", dict(params, page_size=n, fields="id"))
    return [r["id"] for r in d["results"]]


# --- Grundlagen ------------------------------------------------------------

def t_erreichbar():
    st, d, _ = hole("/documents/", {"page_size": 1})
    assert st == 200, f"HTTP {st}"
    assert "results" in d and "count" in d, "Liste ohne results/count"
    return f"{d['count']} Dokumente"


def t_ui_settings():
    _, d, _ = hole("/ui_settings/")
    assert "user" in d, "ui_settings ohne user – das Onboarding braucht es"
    assert "username" in d["user"], "user ohne username"


def t_dokumentfelder():
    _, d, _ = hole("/documents/", {"page_size": 1})
    if not d["results"]:
        return "uebersprungen – keine Dokumente"
    doc = d["results"][0]
    # Genau die Felder, die mapDoc() liest.
    for f in ("id", "title", "correspondent", "document_type", "storage_path",
              "created", "added", "tags", "archive_serial_number", "content"):
        assert f in doc, f"Feld {f} fehlt – mapDoc liest es"
    assert "is_shared_by_requester" in doc, "is_shared_by_requester fehlt – Kennzeichen „geteilt“"
    assert "page_count" in doc, "page_count fehlt – Seitenzahl in der Detailansicht"


def t_stammdaten_zaehler():
    # orgData() zeigt document_count statt selbst zu zaehlen.
    for pfad in ("/tags/", "/correspondents/", "/document_types/"):
        _, d, _ = hole(pfad, {"page_size": 1})
        if not d["results"]:
            continue
        assert "document_count" in d["results"][0], f"{pfad} ohne document_count"
    return "document_count vorhanden"


def t_inbox_kennzeichen():
    _, d, _ = hole("/tags/", {"page_size": 250})
    for t in d["results"]:
        assert "is_inbox_tag" in t, "Schlagwort ohne is_inbox_tag"
    n = sum(1 for t in d["results"] if t["is_inbox_tag"])
    return f"{n} Posteingang-Schlagwort(e)"


# --- Filter ----------------------------------------------------------------

def t_filter_dokumentart():
    _, d, _ = hole("/document_types/", {"page_size": 1})
    if not d["results"]:
        return "uebersprungen – keine Dokumentarten"
    art = d["results"][0]
    n = anzahl({"document_type__id__in": art["id"]})
    assert n == art["document_count"], \
        f"document_type__id__in liefert {n}, document_count sagt {art['document_count']}"
    return f"{art['name']}: {n}"


def t_filter_absender():
    _, d, _ = hole("/correspondents/", {"page_size": 1})
    if not d["results"]:
        return "uebersprungen – keine Absender"
    k = d["results"][0]
    n = anzahl({"correspondent__id__in": k["id"]})
    assert n == k["document_count"], f"correspondent__id__in liefert {n}, erwartet {k['document_count']}"


def t_filter_schlagwort_oder_und():
    _, d, _ = hole("/tags/", {"page_size": 250})
    tags = [t for t in d["results"] if t["document_count"] > 0]
    if len(tags) < 2:
        return "uebersprungen – zu wenige belegte Schlagwoerter"
    a, b = tags[0], tags[1]
    menge_oder = set(ids({"tags__id__in": f"{a['id']},{b['id']}"}))
    menge_a = set(ids({"tags__id__all": a["id"]}))
    menge_b = set(ids({"tags__id__all": b["id"]}))
    assert menge_oder == menge_a | menge_b, "tags__id__in verknuepft nicht mit ODER"
    # Beide Parameter zusammen muessen sich verketten (UND), sonst waere der
    # Favoritenfilter neben gewaehlten Schlagwoertern wirkungslos.
    kombi = set(ids({"tags__id__in": f"{a['id']},{b['id']}", "tags__id__all": a["id"]}))
    assert kombi == menge_oder & menge_a, "tags__id__in und tags__id__all werden nicht verknuepft"
    return f"ODER {len(menge_oder)}, UND {len(kombi)}"


def t_filter_ausschluss():
    _, d, _ = hole("/tags/", {"page_size": 250})
    tags = [t for t in d["results"] if t["document_count"] > 0]
    if not tags:
        return "uebersprungen – keine belegten Schlagwoerter"
    t = tags[0]
    gesamt = anzahl({})
    ohne = anzahl({"tags__id__none": t["id"]})
    mit = anzahl({"tags__id__all": t["id"]})
    assert ohne + mit == gesamt, \
        f"tags__id__none schliesst nicht sauber aus ({ohne} + {mit} != {gesamt})"
    return "Posteingang laesst sich ausschliessen"


def t_filter_jahr():
    jetzt = time.gmtime().tm_year
    summe = sum(anzahl({"created__year": j}) for j in range(jetzt - 10, jetzt + 1))
    gesamt = anzahl({})
    assert summe <= gesamt, "created__year liefert mehr als der Gesamtbestand"
    assert anzahl({"created__year": jetzt}) >= 0
    return f"{summe} von {gesamt} in den letzten 11 Jahren"


def t_filter_id_in():
    alle = ids({}, 3)
    if len(alle) < 2:
        return "uebersprungen – zu wenige Dokumente"
    teil = alle[:2]
    got = set(ids({"id__in": ",".join(map(str, teil))}))
    assert got == set(teil), f"id__in liefert {got}, erwartet {set(teil)}"


def t_workflow_zuordnung():
    """Die App uebersetzt Ausloeser und Aktionen von Zahlen in Worte.

    Diese Zahlen kommen aus der API. Waren sie einmal falsch zugeordnet, zeigt
    die Oberflaeche stumm den falschen Ausloeser an - genau das war der Fall.
    """
    st, d, _ = hole("/workflows/", method="OPTIONS")
    assert st == 200, f"OPTIONS /workflows/ -> HTTP {st}"
    felder = (d.get("actions") or {}).get("POST") or {}

    def auswahl(pfad):
        k = felder
        for teil in pfad:
            k = (k.get(teil) or {})
        return {c["value"]: c["display_name"] for c in k.get("choices", [])}

    ausloeser = auswahl(["triggers", "child", "children", "type"])
    aktionen = auswahl(["actions", "child", "children", "type"])
    assert ausloeser, "keine Ausloesertypen im Schema"

    # Genau die Zuordnung aus app.js. Kommt ein Typ dazu oder verschiebt sich
    # einer, faellt es hier auf und nicht erst dem Nutzer.
    ERWARTET_AUSLOESER = {1: "Consumption Started", 2: "Document Added",
                          3: "Document Updated", 4: "Scheduled"}
    ERWARTET_AKTIONEN = {1: "Assignment", 2: "Removal", 3: "Email",
                         4: "Webhook", 5: "Password removal", 6: "Move to trash"}
    for nr, name in ERWARTET_AUSLOESER.items():
        assert ausloeser.get(nr) == name, \
            f"Ausloeser {nr} heisst jetzt {ausloeser.get(nr)!r}, erwartet {name!r}"
    for nr, name in ERWARTET_AKTIONEN.items():
        assert aktionen.get(nr) == name, \
            f"Aktion {nr} heisst jetzt {aktionen.get(nr)!r}, erwartet {name!r}"
    return f"{len(ausloeser)} Ausloeser, {len(aktionen)} Aktionen"


def t_sortierung():
    # Genau die Werte aus SORT_API in app.js.
    for ordering in ("-created", "created", "title", "correspondent__name"):
        st, d, _ = hole("/documents/", {"page_size": 5, "ordering": ordering, "fields": "id"})
        assert st == 200, f"ordering={ordering} -> HTTP {st}"
        assert "results" in d, f"ordering={ordering} ohne results"
    # Aufsteigend und absteigend muessen sich unterscheiden, sonst wird gar
    # nicht sortiert.
    #
    # Verglichen wird die Folge der Datumswerte, nicht die der ids: Paperless
    # speichert `created` als Datum ohne Uhrzeit, mehrere Dokumente koennen
    # sich also denselben Wert teilen. Innerhalb einer solchen Gruppe gibt es
    # keinen definierten Zweitschluessel, die Reihenfolge dort ist beliebig -
    # eine Umkehrung auf id-Ebene waere zufaellig und der Test flatterhaft.
    if anzahl({}) > 1:
        def daten(ordering):
            _, d, _ = hole("/documents/", {"page_size": 50, "ordering": ordering, "fields": "id,created"})
            return [x["created"] for x in d["results"]]

        auf, ab = daten("created"), daten("-created")
        assert auf == sorted(auf), "created liefert nicht aufsteigend"
        assert ab == sorted(ab, reverse=True), "-created liefert nicht absteigend"
        assert auf == list(reversed(ab)), "created und -created umfassen nicht dieselben Dokumente"
    return "vier Sortierfelder"


def t_paginierung():
    gesamt = anzahl({})
    if gesamt < 2:
        return "uebersprungen – zu wenige Dokumente"
    _, s1, _ = hole("/documents/", {"page_size": 1, "page": 1, "ordering": "id", "fields": "id"})
    _, s2, _ = hole("/documents/", {"page_size": 1, "page": 2, "ordering": "id", "fields": "id"})
    assert s1["next"], "erste Seite ohne next – die App erkennt daran, ob es weitergeht"
    assert s1["results"][0]["id"] != s2["results"][0]["id"], "Seite 2 wiederholt Seite 1"


# --- Suche -----------------------------------------------------------------

def t_volltextsuche():
    _, d, _ = hole("/documents/", {"page_size": 1})
    if not d["results"]:
        return "uebersprungen – keine Dokumente"
    # Ein Wort aus dem erkannten Text des ersten Dokuments.
    text = (d["results"][0].get("content") or "").split()
    wort = next((w for w in text if len(w) > 5 and w.isalpha()), None)
    if not wort:
        return "uebersprungen – kein brauchbares Suchwort"
    _, r, _ = hole("/documents/", {"query": wort, "page_size": 5})
    assert r["count"] >= 1, f"Volltextsuche nach „{wort}“ findet nichts"
    treffer = r["results"][0]
    assert "__search_hit__" in treffer, "Treffer ohne __search_hit__ – die Hervorhebung braucht es"
    assert "highlights" in treffer["__search_hit__"], "__search_hit__ ohne highlights"
    return f"„{wort}“ -> {r['count']}"


def t_suche_fehleingabe():
    # Eine kaputte Sucheingabe muss als 400 kommen, damit api.js auf die
    # einfache Suche zurueckfallen kann statt einen Fehler zu zeigen.
    try:
        hole("/documents/", {"query": ":::[", "page_size": 1})
    except urllib.error.HTTPError as e:
        assert e.code == 400, f"erwartet HTTP 400, bekam {e.code}"
        return "400 wie erwartet"
    raise AssertionError("kaputte Suchanfrage wurde nicht abgelehnt – der Rueckfallpfad greift nie")


def t_suche_einfach():
    _, d, _ = hole("/documents/", {"page_size": 1})
    if not d["results"]:
        return "uebersprungen – keine Dokumente"
    titel = (d["results"][0].get("title") or "")[:6]
    if not titel.strip():
        return "uebersprungen – kein Titel"
    _, r, _ = hole("/documents/", {"title_content": titel, "page_size": 5})
    assert r["count"] >= 1, f"title_content findet „{titel}“ nicht"


# --- Dateien ---------------------------------------------------------------

def t_vorschau():
    alle = ids({}, 1)
    if not alle:
        return "uebersprungen – keine Dokumente"
    i = alle[0]
    st, inhalt, kopf = hole(f"/documents/{i}/thumb/", roh=True)
    assert st == 200 and len(inhalt) > 0, "Thumbnail leer"
    assert kopf.get("content-type", "").startswith("image/"), \
        f"Thumbnail ist kein Bild ({kopf.get('content-type')})"
    st, inhalt, kopf = hole(f"/documents/{i}/preview/", roh=True)
    assert st == 200 and len(inhalt) > 0, "Vorschau leer"
    return kopf.get("content-type", "")


def t_sammel_download():
    alle = ids({}, 2)
    if not alle:
        return "uebersprungen – keine Dokumente"
    st, inhalt, kopf = hole("/documents/bulk_download/", method="POST", roh=True,
                            daten={"documents": alle, "content": "archive",
                                   "compression": "deflated", "follow_formatting": True})
    assert st == 200, f"HTTP {st}"
    assert inhalt[:2] == b"PK", "Antwort ist kein ZIP"
    return f"{len(inhalt)} Bytes"


# --- Schreiben -------------------------------------------------------------

MINI_PDF = (
    b"%PDF-1.4\n"
    b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
    b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]/Resources<</Font<</F1 4 0 R>>>>"
    b"/Contents 5 0 R>>endobj\n"
    b"4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"
    b"5 0 obj<</Length 62>>stream\n"
    b"BT /F1 12 Tf 20 100 Td (Pruefdokument der App-Testreihe) Tj ET\n"
    b"endstream endobj\n"
    b"trailer<</Root 1 0 R>>\n"
)


def multipart(felder, datei_name, datei_inhalt):
    grenze = "----paperlessapptest"
    teile = []
    for k, v in felder.items():
        teile.append(f"--{grenze}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode())
    teile.append(
        f"--{grenze}\r\nContent-Disposition: form-data; name=\"document\"; "
        f"filename=\"{datei_name}\"\r\nContent-Type: application/pdf\r\n\r\n".encode()
        + datei_inhalt + b"\r\n"
    )
    teile.append(f"--{grenze}--\r\n".encode())
    return b"".join(teile), f"multipart/form-data; boundary={grenze}"


def t_upload_roundtrip():
    """Hochladen, ueber die Aufgabenkennung verfolgen, wieder entfernen.

    Genau dieser Ablauf steckt in uploadDatei()/wartAufVerarbeitung().
    """
    titel = f"App-Testdokument {int(time.time())}"
    rumpf, ctyp = multipart({"title": titel}, "app-test.pdf", MINI_PDF)
    st, antwort, _ = hole("/documents/post_document/", method="POST", daten=rumpf, typ=ctyp)
    assert st == 200, f"Upload -> HTTP {st}"
    task_id = antwort if isinstance(antwort, str) else (antwort or {}).get("task_id")
    assert task_id, f"Upload liefert keine Aufgabenkennung, sondern {antwort!r}"

    # Ueber die Kennung nachfragen - das macht die App genauso.
    doc_id, status = None, None
    for _ in range(60):
        _, d, _ = hole("/tasks/", {"task_id": task_id})
        eintraege = d if isinstance(d, list) else d.get("results", [])
        assert eintraege, "keine Aufgabe zu dieser Kennung – der Filter task_id greift nicht"
        t = eintraege[0]
        status = str(t.get("status", "")).lower()
        if status == "success":
            doc_id = (t.get("related_document_ids") or [None])[0]
            break
        if status == "failure":
            raise AssertionError(f"Verarbeitung fehlgeschlagen: {t.get('result_data')}")
        time.sleep(1)

    assert status == "success", f"Verarbeitung nicht abgeschlossen (Status {status})"
    assert doc_id, "erfolgreiche Aufgabe ohne related_document_ids – die App braucht die Dokumentkennung"

    _, doc, _ = hole(f"/documents/{doc_id}/")
    assert doc["title"] == titel, f"Titel wurde nicht uebernommen: {doc['title']!r}"

    # Aufraeumen: in den Papierkorb und endgueltig loeschen.
    hole(f"/documents/{doc_id}/", method="DELETE", roh=True)
    _, papier, _ = hole("/trash/", {"page_size": 100})
    im_papierkorb = any(x["id"] == doc_id for x in papier.get("results", []))
    assert im_papierkorb, "geloeschtes Dokument liegt nicht im Papierkorb"
    hole("/trash/", method="POST", daten={"action": "empty", "documents": [doc_id]})
    _, papier2, _ = hole("/trash/", {"page_size": 100})
    assert not any(x["id"] == doc_id for x in papier2.get("results", [])), \
        "Testdokument liess sich nicht endgueltig entfernen"
    return f"Dokument {doc_id} angelegt und wieder entfernt"


def t_gespeicherte_ansicht():
    """Regel 19 ist die Volltextsuche - darauf baut sucheSpeichern()."""
    name = f"__apptest__{int(time.time())}"
    st, v, _ = hole("/saved_views/", method="POST", daten={
        "name": name, "show_on_dashboard": False, "show_in_sidebar": True,
        "sort_field": "created", "sort_reverse": True,
        "filter_rules": [{"rule_type": 19, "value": "pruefwort"}],
    })
    assert st in (200, 201), f"HTTP {st}"
    try:
        regeln = v.get("filter_rules") or []
        assert len(regeln) == 1 and regeln[0]["rule_type"] == 19, \
            f"Volltextregel nicht uebernommen: {regeln}"
    finally:
        hole(f"/saved_views/{v['id']}/", method="DELETE", roh=True)


def t_notizen():
    """Notizen sind eine eigene Liste je Dokument - so sichert notizSichern."""
    alle = ids({}, 1)
    if not alle:
        return "uebersprungen – keine Dokumente"
    i = alle[0]
    _, vorher, _ = hole(f"/documents/{i}/notes/")
    assert isinstance(vorher, list), "Notizen kommen nicht als Liste"
    st, nach, _ = hole(f"/documents/{i}/notes/", method="POST", daten={"note": "__apptest__"})
    assert st in (200, 201), f"Notiz anlegen -> HTTP {st}"
    assert isinstance(nach, list) and nach, "Anlegen liefert nicht die Liste danach"
    neu = next((n for n in nach if n["note"] == "__apptest__"), None)
    assert neu, "angelegte Notiz nicht in der Antwort"
    # Die neueste steht vorn - darauf baut die Anzeige des einen Feldes.
    assert nach[0]["id"] == neu["id"], "neueste Notiz steht nicht an erster Stelle"
    _, rest, _ = hole(f"/documents/{i}/notes/", {"id": neu["id"]}, method="DELETE")
    assert not any(n["id"] == neu["id"] for n in (rest or [])), \
        "Notiz liess sich nicht ueber ?id= entfernen"
    return "anlegen, lesen, entfernen"


def t_papierkorb():
    st, d, _ = hole("/trash/", {"page_size": 1})
    assert st == 200 and "results" in d, "Papierkorb nicht abrufbar"


def t_ohne_token():
    """Ohne gueltigen Token muss 401 kommen - daran haengt onUnauthorized."""
    req = urllib.request.Request(BASIS + "/documents/?page_size=1")
    req.add_header("Authorization", "Token 0000000000000000000000000000000000000000")
    req.add_header("Accept", "application/json")
    try:
        urllib.request.urlopen(req, timeout=15)
    except urllib.error.HTTPError as e:
        assert e.code in (401, 403), f"erwartet 401/403, bekam {e.code}"
        return f"HTTP {e.code}"
    raise AssertionError("ungueltiger Token wurde akzeptiert")


PRUEFUNGEN = [
    ("API erreichbar", t_erreichbar),
    ("Oberflaechen-Einstellungen mit Benutzer", t_ui_settings),
    ("Dokumentfelder, die mapDoc liest", t_dokumentfelder),
    ("Stammdaten liefern document_count", t_stammdaten_zaehler),
    ("Posteingang-Schlagwoerter erkennbar", t_inbox_kennzeichen),
    ("Filter Dokumentart", t_filter_dokumentart),
    ("Filter Absender", t_filter_absender),
    ("Filter Schlagwoerter (ODER und UND)", t_filter_schlagwort_oder_und),
    ("Filter Ausschluss (Posteingang)", t_filter_ausschluss),
    ("Filter Jahr", t_filter_jahr),
    ("Filter feste Kennungen", t_filter_id_in),
    ("Workflow-Zuordnungen", t_workflow_zuordnung),
    ("Sortierung", t_sortierung),
    ("Seitenweises Laden", t_paginierung),
    ("Volltextsuche mit Hervorhebung", t_volltextsuche),
    ("Kaputte Sucheingabe wird abgelehnt", t_suche_fehleingabe),
    ("Einfache Suche als Rueckfall", t_suche_einfach),
    ("Vorschau und Miniaturbild", t_vorschau),
    ("Sammel-Download als ZIP", t_sammel_download),
    ("Notizen anlegen und entfernen", t_notizen),
    ("Papierkorb", t_papierkorb),
    ("Gespeicherte Ansicht mit Volltextregel", t_gespeicherte_ansicht),
    ("Ungueltiger Token wird abgewiesen", t_ohne_token),
    ("Upload, Aufgabenverfolgung, Loeschen", t_upload_roundtrip),
]


def main():
    print(f"API-Vertragspruefung gegen {BASIS}")
    for name, fn in PRUEFUNGEN:
        pruefe(name, fn)
    fehler = [(n, h) for ok, n, h in ergebnisse if not ok]
    print()
    if fehler:
        print(f"{len(fehler)} von {len(ergebnisse)} Pruefungen fehlgeschlagen")
        return 1
    print(f"Alle {len(ergebnisse)} Pruefungen bestanden")
    return 0


if __name__ == "__main__":
    sys.exit(main())
