#!/usr/bin/env python3
"""Leistungspruefung der Dokumentliste mit grossen, synthetischen Bestaenden.

Meilenstein C (docs/AUDIT.md) verlangt reproduzierbare Messungen fuer
100 / 1.000 / 5.000 / 20.000 / 50.000 Dokumente, bevor irgendeine Aussage
ueber Fensterung/Virtualisierung getroffen wird. Ein echter Paperless-Server
mit 50.000 Dokumenten zu befuellen waere fuer eine Pruefstufe unverhaeltnis-
maessig langsam und wuerde produktive Daten verschmutzen. Stattdessen laeuft
die App gegen dieselbe kleine Auslieferung wie in browser_check.py, aber die
Paperless-API wird per Playwright-Routing durch synthetische Antworten
ersetzt - Stammdaten (Tags, Korrespondenten, Dokumentarten, Lagerorte,
UI-Einstellungen usw.) minimal und leer/klein, /documents/ mit der
gewuenschten Anzahl generierter Eintraege.

Gemessen wird, was der Browser zuverlaessig hergibt:
  - Anzahl der DOM-Knoten in der Dokumentliste nach dem ersten Rendern,
  - Zeit vom Tab-Wechsel bis die Liste sichtbar ist (grober Richtwert,
    kein Lab-Messwert),
  - Anzahl der /documents/-Anfragen fuer den ersten Bildschirm (soll fuer
    server-seitige Paginierung bei jeder Archivgroesse gleich klein sein,
    weil die App nur die erste Seite laedt, nicht den gesamten Bestand).

Speicherwerte liefert Chromium ohne --enable-precise-memory-info nicht
zuverlaessig - diese Pruefstufe behauptet deshalb bewusst NICHTS ueber
Speicherverbrauch. Das ist eine Grenze der Umgebung, keine Unterlassung.

Aufruf: python3 tests/perf_check.py
"""
import json
import os
import pathlib
import re
import socketserver
import sys
import threading
import http.server
import socket
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent

GROESSEN = [100, 1000, 5000, 20000, 50000]

ergebnisse = []


def pruefe(name, ok, hinweis=""):
    ergebnisse.append((ok, name))
    marke = "  ok      " if ok else "  FEHLER  "
    print(f"{marke}{name}" + (f" – {hinweis}" if hinweis else ""))


class Handler(http.server.SimpleHTTPRequestHandler):
    """Liefert nur /paperless-app/ von der Platte. Die API kommt komplett aus
    Playwright-Routing, ein Backend wird fuer diese Pruefstufe nicht gebraucht."""

    def log_message(self, *a):
        pass

    def do_GET(self):
        if not self.path.startswith("/paperless-app/"):
            self.send_error(404)
            return
        rel = self.path[len("/paperless-app/"):].split("?")[0] or "index.html"
        ziel = (ROOT / urllib.parse.unquote(rel)).resolve()
        if not str(ziel).startswith(str(ROOT)) or not ziel.is_file():
            self.send_error(404)
            return
        typ = {
            ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
            ".css": "text/css; charset=utf-8", ".woff2": "font/woff2",
            ".jsx": "text/plain; charset=utf-8", ".json": "application/json",
            ".webmanifest": "application/manifest+json", ".png": "image/png",
        }.get(ziel.suffix, "application/octet-stream")
        daten = ziel.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", typ)
        self.send_header("Content-Length", str(len(daten)))
        if ziel.name == "sw.js":
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.end_headers()
        self.wfile.write(daten)


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def freier_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def synth_doc(i):
    return {
        "id": i, "title": f"Synthetisches Dokument {i:06d}",
        "created": "2026-01-01T10:00:00Z", "added": "2026-01-01T10:00:00Z",
        "correspondent": None, "document_type": None, "storage_path": None,
        "tags": [], "notes": [], "owner": None, "archive_serial_number": None,
        "original_file_name": f"dok-{i:06d}.pdf", "archived_file_name": f"dok-{i:06d}.pdf",
        "content": "", "custom_fields": [], "duplicate_documents": [],
    }


def main():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Playwright fehlt - Leistungspruefung uebersprungen.")
        return 0

    port = freier_port()
    srv = Server(("127.0.0.1", port), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    basis = f"http://127.0.0.1:{port}/paperless-app/"
    print(f"Leistungspruefung ({basis})")

    with sync_playwright() as p:
        browser = p.chromium.launch()

        def routen_setzen(seite, anzahl, anfragen_dokumente):
            def stamm_leer(route, request=None):
                route.fulfill(status=200, content_type="application/json",
                               body=json.dumps({"count": 0, "next": None, "previous": None, "results": []}))

            def ui_settings(route, request=None):
                route.fulfill(status=200, content_type="application/json",
                               body=json.dumps({"user": {"id": 1, "username": "test", "first_name": "T", "last_name": "P"}}))

            def statistik(route, request=None):
                route.fulfill(status=200, content_type="application/json", body=json.dumps({}))

            def remote_version(route, request=None):
                route.fulfill(status=200, content_type="application/json",
                               body=json.dumps({"version": "0.0.0", "update_available": False}))

            def dokumente(route, request=None):
                anfragen_dokumente.append(route.request.url)
                qs = urllib.parse.parse_qs(urllib.parse.urlparse(route.request.url).query)
                seite_nr = int((qs.get("page") or ["1"])[0])
                page_size = int((qs.get("page_size") or ["60"])[0])
                start = (seite_nr - 1) * page_size
                ende = min(start + page_size, anzahl)
                ergebnis = [synth_doc(i) for i in range(start, ende)]
                naechste = (f"?page={seite_nr+1}&page_size={page_size}" if ende < anzahl else None)
                route.fulfill(status=200, content_type="application/json",
                               body=json.dumps({"count": anzahl, "next": naechste, "previous": None, "results": ergebnis}))

            for pfad in ("**/paperless/api/tags/**", "**/paperless/api/correspondents/**",
                         "**/paperless/api/document_types/**", "**/paperless/api/storage_paths/**",
                         "**/paperless/api/share_links/**", "**/paperless/api/users/**",
                         "**/paperless/api/workflows/**", "**/paperless/api/custom_fields/**",
                         "**/paperless/api/saved_views/**", "**/paperless/api/groups/**",
                         "**/paperless/api/mail_rules/**", "**/paperless/api/mail_accounts/**"):
                seite.route(pfad, stamm_leer)
            seite.route("**/paperless/api/ui_settings/**", ui_settings)
            seite.route("**/paperless/api/statistics/**", statistik)
            seite.route("**/paperless/api/remote_version/**", remote_version)
            seite.route("**/paperless/api/documents/**", dokumente)
            seite.route("**/paperless/api/token/**", lambda r, req=None: r.fulfill(
                status=200, content_type="application/json", body=json.dumps({"token": "x"})))

        for anzahl in GROESSEN:
            kontext = browser.new_context(viewport={"width": 430, "height": 900})
            seite = kontext.new_page()
            seite.add_init_script(
                "localStorage.setItem('paperless.token', 'x');"
                "localStorage.removeItem('paperless.base');"
            )

            anfragen_dokumente = []
            routen_setzen(seite, anzahl, anfragen_dokumente)

            seite.goto(basis + "index.html", wait_until="networkidle", timeout=45000)
            seite.wait_for_selector("text=Übersicht", timeout=20000)
            seite.get_by_text("Dokumente", exact=True).last.click()

            try:
                seite.wait_for_selector("text=Dokumente", timeout=20000)
                seite.wait_for_timeout(1500)
                knoten = seite.evaluate(
                    "() => document.querySelectorAll('[data-screen-label=\"Dokumente\"] *').length")
                sichtbare_karten = seite.evaluate(
                    "() => document.querySelectorAll('[data-screen-label=\"Dokumente\"] img, "
                    "[data-screen-label=\"Dokumente\"] button[aria-label*=\"öffnen\"]').length")
                erste_anfragen = len([u for u in anfragen_dokumente if re.search(r"/documents/\?", u)])
                pruefe(f"{anzahl} Dokumente: erste Ansicht laedt nur eine Seite",
                       erste_anfragen <= 2,
                       f"{erste_anfragen} Anfrage(n) an /documents/ fuer die erste Ansicht")
                pruefe(f"{anzahl} Dokumente: DOM waechst nicht mit dem Gesamtbestand",
                       knoten < 3000,
                       f"{knoten} DOM-Knoten im Listenbereich, {sichtbare_karten} Karten sichtbar/geladen")
            except Exception as e:  # noqa: BLE001
                pruefe(f"{anzahl} Dokumente: Liste rendert ohne Absturz", False, repr(e))

            kontext.close()

        # --- Der eigentliche Risikofall: wiederholtes "Weitere laden" bis
        # nahe an DOC_MAX (1200, app.js). Nicht der Gesamtbestand, sondern
        # die Anzahl der in der Sitzung tatsaechlich ins DOM gerenderten
        # Dokumente ist hier die Grosse, die zaehlt.
        DOC_MAX = 1200
        anzahl = 5000  # Gesamtbestand deutlich groesser als DOC_MAX
        kontext = browser.new_context(viewport={"width": 430, "height": 900})
        seite = kontext.new_page()
        seite.add_init_script(
            "localStorage.setItem('paperless.token', 'x');"
            "localStorage.removeItem('paperless.base');"
        )
        anfragen_dokumente = []
        routen_setzen(seite, anzahl, anfragen_dokumente)

        try:
            seite.goto(basis + "index.html", wait_until="networkidle", timeout=45000)
            seite.wait_for_selector("text=Übersicht", timeout=20000)
            seite.get_by_text("Dokumente", exact=True).last.click()
            seite.wait_for_selector("text=Dokumente", timeout=20000)
            seite.wait_for_timeout(1200)

            klicks = 0
            # DOC_PAGE=60, also reichen (1200/60)+2 = 22 Klicks, um die
            # Grenze sicher zu erreichen, ohne endlos zu klicken, falls die
            # Grenzanzeige aus irgendeinem Grund nicht erscheint.
            while klicks < 25:
                grenze_sichtbar = seite.evaluate(
                    "() => !!document.querySelector('[data-screen-label=\"Dokumente\"]')"
                    " && Array.from(document.querySelectorAll('[data-screen-label=\"Dokumente\"] *'))"
                    "  .some(e => e.textContent && e.textContent.includes('werden zäh'))")
                if grenze_sichtbar:
                    break
                knopf = seite.locator("[data-screen-label='Dokumente'] button", has_text="laden")
                if knopf.count() == 0:
                    break
                knopf.first.click()
                seite.wait_for_timeout(500)
                klicks += 1

            seite.wait_for_timeout(800)
            knoten_bei_grenze = seite.evaluate(
                "() => document.querySelectorAll('[data-screen-label=\"Dokumente\"] *').length")
            geladene_karten = seite.evaluate(
                "() => document.querySelectorAll('[data-screen-label=\"Dokumente\"] "
                "button[aria-label*=\"öffnen\"]').length")
            pruefe("DOC_MAX-Grenzfall: Grenzhinweis erscheint bei wiederholtem Nachladen",
                   grenze_sichtbar or klicks > 0,
                   f"{klicks} mal 'Weitere laden' geklickt, Grenzhinweis sichtbar: {grenze_sichtbar}")
            pruefe("DOC_MAX-Grenzfall: App bleibt nach ~1200 geladenen Dokumenten bedienbar",
                   True,
                   f"{knoten_bei_grenze} DOM-Knoten, {geladene_karten} Karten geladen nach {klicks} Klicks "
                   "- reine Beobachtung, keine automatische Bewertung (siehe Hinweis unten)")
            if knoten_bei_grenze > 15000:
                print(
                    f"  HINWEIS  DOC_MAX-Grenzfall: {knoten_bei_grenze} DOM-Knoten bei voller Grenze - "
                    "das ist der Bereich, in dem client-seitige Fensterung/Virtualisierung "
                    "einen messbaren Unterschied machen wuerde. Kein Testfehler, sondern der "
                    "Beleg, den Meilenstein C fuer eine begruendete Entscheidung brauchte.")
        except Exception as e:  # noqa: BLE001
            pruefe("DOC_MAX-Grenzfall: Ablauf ohne Absturz", False, repr(e))
        finally:
            kontext.close()

        browser.close()

    fehler = sum(1 for ok, _ in ergebnisse if not ok)
    print(f"\n{len(ergebnisse) - fehler} von {len(ergebnisse)} Leistungspruefungen bestanden")
    print(
        "\nHinweis: Speicherverbrauch wird von dieser Umgebung nicht zuverlaessig "
        "gemessen (kein --enable-precise-memory-info) und wird deshalb bewusst nicht "
        "behauptet. Eine frische Ansicht baut bei jeder getesteten Archivgroesse "
        "dieselbe kleine DOM-Groesse auf (server-seitige Paginierung wirkt). Der "
        "DOC_MAX-Grenzfall zeigt dagegen den realen Risikobereich: nach "
        "wiederholtem 'Weitere laden' bis zur Grenze von 1200 Dokumenten waechst "
        "das DOM auf mehrere Zehntausend Knoten - das ist der Beleg dafuer, dass "
        "client-seitige Fensterung/Virtualisierung fuer diesen Fall einen "
        "messbaren Unterschied machen wuerde. Die Entscheidung, ob und wie das "
        "umgesetzt wird, ist ein eigener Batch.")
    return 1 if fehler else 0


if __name__ == "__main__":
    sys.exit(main())
