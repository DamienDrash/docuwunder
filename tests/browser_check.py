#!/usr/bin/env python3
"""Bedienpruefung der App in einem echten Browser.

Die statischen Pruefungen sagen nichts darueber, ob die App im Browser auch
laeuft: ob das Runtime die Komponente aufbaut, ob die Serverabfragen mit den
richtigen Parametern hinausgehen und ob die Liste wirklich Dokumente zeigt.
Genau das prueft dieses Skript.

Dafuer laeuft ein kleiner Server, der die App wie im Betrieb ausliefert:
/paperless-app/ von der Platte, /paperless/ weitergereicht an das Backend.
Nur so ist die App mit der API gleichursprunglich - die Adresse der API leitet
sie aus ihrer eigenen ab.

    PAPERLESS_TOKEN=… python3 tests/browser_check.py

Braucht Playwright mit Chromium (python3 -m playwright install chromium).
"""
import http.server
import os
import pathlib
import socket
import socketserver
import sys
import threading
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
BACKEND = os.environ.get("PAPERLESS_URL", "http://127.0.0.1:8099/paperless/api").rstrip("/")
# Aus …/paperless/api wird die Wurzel, unter der das Backend haengt.
BACKEND_ROOT = BACKEND[: -len("/api")] if BACKEND.endswith("/api") else BACKEND


def token() -> str:
    t = os.environ.get("PAPERLESS_TOKEN", "").strip()
    if t:
        return t
    datei = ROOT / "tests" / ".token"
    if datei.exists():
        return datei.read_text(encoding="utf-8").strip()
    print("Kein API-Token. Setze PAPERLESS_TOKEN oder lege tests/.token an.")
    sys.exit(2)


TOKEN = token()


class Handler(http.server.SimpleHTTPRequestHandler):
    """Serviert /paperless-app/ von der Platte und reicht /paperless/ weiter."""

    def log_message(self, *a):  # noqa: D102 - Ausgabe waere nur Rauschen
        pass

    def _weiterreichen(self):
        pfad = self.path[len("/paperless"):]
        laenge = int(self.headers.get("content-length") or 0)
        rumpf = self.rfile.read(laenge) if laenge else None
        req = urllib.request.Request(BACKEND_ROOT + pfad, data=rumpf, method=self.command)
        for k, v in self.headers.items():
            if k.lower() in ("host", "content-length", "connection", "accept-encoding"):
                continue
            req.add_header(k, v)
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                daten, status, kopf = r.read(), r.status, r.headers
        except urllib.error.HTTPError as e:
            daten, status, kopf = e.read(), e.code, e.headers
        except Exception as e:  # noqa: BLE001
            self.send_error(502, str(e))
            return
        self.send_response(status)
        for k, v in kopf.items():
            if k.lower() in ("transfer-encoding", "content-length", "connection", "content-encoding"):
                continue
            self.send_header(k, v)
        self.send_header("Content-Length", str(len(daten)))
        self.end_headers()
        self.wfile.write(daten)

    def _datei(self):
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
        # Wie in Caddy: der Worker selbst darf nie aus dem Browsercache kommen,
        # sonst laesst sich eine kaputte Fassung nicht mehr ersetzen.
        if ziel.name == "sw.js":
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.end_headers()
        self.wfile.write(daten)

    def _route(self):
        if self.path.startswith("/paperless/"):
            self._weiterreichen()
        elif self.path.startswith("/paperless-app/"):
            self._datei()
        else:
            self.send_error(404)

    do_GET = do_POST = do_PATCH = do_DELETE = do_PUT = lambda self: self._route()


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def freier_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


ergebnisse = []


def pruefe(name, fn):
    try:
        hinweis = fn()
        ergebnisse.append((True, name))
        print(f"  ok      {name}" + (f" – {hinweis}" if hinweis else ""))
    except AssertionError as e:
        ergebnisse.append((False, name))
        print(f"  FEHLER  {name}: {e}")
    except Exception as e:  # noqa: BLE001
        ergebnisse.append((False, name))
        print(f"  FEHLER  {name}: {e!r}")


def main():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Playwright fehlt – Browserpruefung uebersprungen.")
        print("Nachinstallieren: pip install playwright && python3 -m playwright install chromium")
        return 0

    port = freier_port()
    srv = Server(("127.0.0.1", port), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    basis = f"http://127.0.0.1:{port}/paperless-app/"
    print(f"Browserpruefung ({basis})")

    fehlerkonsole = []
    anfragen = []

    with sync_playwright() as p:
        browser = p.chromium.launch()
        seite = browser.new_page(viewport={"width": 430, "height": 900})
        # Der Token liegt im Browser, sonst startet die App im Onboarding.
        seite.add_init_script(
            f"localStorage.setItem('paperless.token', {TOKEN!r});"
            "localStorage.removeItem('paperless.base');"
            "localStorage.removeItem('paperless.suchverlauf');"
        )
        seite.on("console", lambda m: fehlerkonsole.append(m.text) if m.type == "error" else None)
        seite.on("pageerror", lambda e: fehlerkonsole.append(f"Ausnahme: {e}"))
        seite.on("request", lambda r: anfragen.append(r.url) if "/paperless/api/" in r.url else None)

        try:
            seite.goto(basis + "index.html", wait_until="networkidle", timeout=45000)

            import re

            def tab(name):
                """Eintrag der unteren Tableiste - der Name kommt auch sonst vor."""
                seite.get_by_text(name, exact=True).last.click()
                seite.wait_for_timeout(1200)

            def api_seit(n):
                return [u.split("/paperless/api")[1] for u in anfragen[n:]]

            def arten_namen():
                """Dokumentarten des Servers, haeufigste zuerst - wie die Chips."""
                req = urllib.request.Request(BACKEND + "/document_types/?page_size=50")
                req.add_header("Authorization", "Token " + TOKEN)
                req.add_header("Accept", "application/json")
                import json
                with urllib.request.urlopen(req, timeout=15) as r:
                    d = json.loads(r.read())
                roh = sorted(d["results"], key=lambda x: -x.get("document_count", 0))
                return [x["name"] for x in roh[:4]]

            def such_beispiel():
                """Ein vorhandenes Dokument samt suchbarem Wort aus seinem Titel.

                Frueher stand hier ein fester Suchbegriff. Der band den Test an
                einen bestimmten Datenbestand und schlug fehl, sobald dieses
                Dokument fehlte - ohne dass an der App etwas kaputt war.
                """
                import json
                req = urllib.request.Request(BACKEND + "/documents/?page_size=25&ordering=-added")
                req.add_header("Authorization", "Token " + TOKEN)
                req.add_header("Accept", "application/json")
                with urllib.request.urlopen(req, timeout=15) as r:
                    d = json.loads(r.read())
                for doc in d.get("results", []):
                    titel = (doc.get("title") or "").strip()
                    # Ein Wort, das lang genug ist, um im Volltextindex zu greifen.
                    # Unterstriche trennen ebenfalls: "NDA_CycleCoin_Damien" sind drei Woerter.
                    for wort in re.split(r"[\W_]+", titel, flags=re.UNICODE):
                        if len(wort) >= 5:
                            return titel, wort
                return None, None

            def t_aufgebaut():
                # Die Tableiste erscheint nur, wenn die Komponente steht.
                seite.wait_for_selector("text=Übersicht", timeout=20000)
                return "Oberflaeche aufgebaut"

            def t_leiste_folgt_der_wahl():
                # theme-color faerbt im installierten Zustand die Leiste des
                # Systems ueber der App. Im Kopf steht sie je Systemschema -
                # waehlt jemand in den Einstellungen ausdruecklich Hell oder
                # Dunkel, muss sie mitgehen. Geprueft wird deshalb die Wirkung
                # des Schalters, nicht sein Vorhandensein.
                soll = dict(re.findall(
                    r"const LEISTE_(HELL|DUNKEL) = '(#[0-9A-Fa-f]{6})'",
                    (ROOT / "index.html").read_text(encoding="utf-8")))
                assert len(soll) == 2, f"Farben in index.html nicht gefunden: {soll}"

                def farben():
                    return seite.eval_on_selector_all(
                        "meta[name='theme-color']", "ms => ms.map(m => m.content)")

                tab("Mehr")
                # Die Einstellungen haengen an der Kontokarte - dem ersten
                # Eintrag des Bildschirms nach seiner Ueberschrift.
                seite.locator("[data-screen-label='Mehr'] > div").nth(1).click()
                seite.wait_for_selector("[data-screen-label='Einstellungen']", timeout=10000)
                einst = seite.locator("[data-screen-label='Einstellungen']")
                try:
                    for wahl, farbe in (("Dunkel", soll["DUNKEL"]), ("Hell", soll["HELL"])):
                        einst.get_by_text(wahl, exact=True).click()
                        seite.wait_for_timeout(400)
                        ist = farben()
                        assert ist and set(ist) == {farbe}, f"nach Wahl „{wahl}“: {ist}"
                finally:
                    # Zurueck in den Ausgangszustand, damit die folgenden
                    # Pruefungen dieselbe App vorfinden wie ohne diese hier.
                    einst.get_by_text("System", exact=True).click()
                    seite.keyboard.press("Escape")
                    seite.wait_for_timeout(400)
                    tab("Übersicht")
                return "Leiste folgt der Wahl in der App"

            def t_startseite_hat_daten():
                txt = seite.inner_text("body")
                assert "ZULETZT HINZUGEFÜGT" in txt, "Startseite ohne Abschnitt für neue Dokumente"
                # Die Startseite holt ihre Liste getrennt vom Dokumente-Tab.
                assert any("ordering=-added" in u for u in anfragen), \
                    "Startseite fragt nicht nach den zuletzt hinzugefuegten"
                return "Startseite gefuellt"

            def t_dokumente_geladen():
                tab("Dokumente")
                txt = seite.inner_text("body")
                assert "Keine Dokumente gefunden" not in txt, "Liste bleibt leer"
                # Die Zaehlzeile nennt die Gesamtzahl aus der Serverantwort.
                m = re.search(r"(\d+) Dokumente?\b", txt)
                assert m and int(m.group(1)) > 0, f"keine Dokumentanzahl in der Liste: {txt[:200]!r}"
                return f"{m.group(1)} Dokumente"

            def t_serverseitig_geladen():
                # Die Liste wird mit Sortierung und Seitengroesse geholt, nicht
                # komplett und dann lokal geordnet.
                treffer = [u for u in anfragen if "ordering=" in u and "page_size=" in u]
                assert treffer, "keine Listenabfrage mit ordering/page_size"
                return "ordering und page_size werden mitgeschickt"

            def t_sortierwechsel_laedt_neu():
                vorher = len(anfragen)
                seite.get_by_text("Neueste", exact=True).first.click()
                seite.wait_for_timeout(400)
                seite.get_by_text("Titel A–Z", exact=True).first.click()
                seite.wait_for_timeout(1800)
                neu = api_seit(vorher)
                assert any("ordering=title" in u for u in neu), \
                    f"Sortierwechsel loest keine Serverabfrage aus: {neu}"
                return "ordering=title angefordert"

            def t_filter_laedt_neu():
                # Die Schnellfilter nach "Favoriten" sind echte Dokumentarten
                # des Servers - anders als frueher keine feste Liste.
                arten = arten_namen()
                if not arten:
                    return "uebersprungen – keine Dokumentarten auf dem Server"
                vorher = len(anfragen)
                chip = seite.get_by_text(arten[0], exact=True).first
                chip.click()
                seite.wait_for_timeout(1800)
                neu = api_seit(vorher)
                assert any("document_type__id__in=" in u for u in neu), \
                    f"Dokumentart-Filter geht nicht an den Server: {neu}"
                # Wieder abwaehlen, damit die naechsten Pruefungen alles sehen.
                chip.click()
                seite.wait_for_timeout(1500)
                return f"„{arten[0]}“ als document_type__id__in angefordert"

            def t_suche_serverseitig():
                titel, wort = such_beispiel()
                if not wort:
                    return "uebersprungen - kein Dokument mit brauchbarem Titel"
                vorher = len(anfragen)
                # Suchleiste des Dokumente-Tabs.
                seite.get_by_text("Titel, Absender oder Inhalt", exact=True).first.click()
                seite.wait_for_timeout(600)
                feld = seite.locator("input[placeholder='Titel, Absender oder Inhalt']").first
                feld.fill(wort)
                seite.wait_for_timeout(2500)
                neu = api_seit(vorher)
                assert any(("query=" + wort.lower()) in u.lower() for u in neu), \
                    f"Suche geht nicht an den Server: {neu}"
                txt = seite.inner_text("body")
                assert "Treffer" in txt, "keine Trefferzeile"
                assert titel[:20] in txt, \
                    f"Suche nach „{wort}“ zeigt „{titel}“ nicht an"
                return f"query={wort} angefordert, Treffer angezeigt"

            def t_treffer_oeffnet_mit_vorschau():
                vorher = len(anfragen)
                # Erster Treffer der Suchergebnisse.
                titel, _ = such_beispiel()
                if not titel:
                    return "uebersprungen - kein Dokument vorhanden"
                seite.get_by_text(titel[:20], exact=False).last.click()
                seite.wait_for_timeout(3000)
                neu = api_seit(vorher)
                assert any("/thumb/" in u for u in neu), \
                    f"Vorschaubild wird nicht geladen: {neu}"
                bild = seite.locator("img[alt^='Vorschau von']")
                assert bild.count() > 0, "kein Vorschaubild im Dokument"
                return "Vorschau geladen und angezeigt"

            def t_keine_ausnahmen():
                assert not fehlerkonsole, "; ".join(fehlerkonsole[:3])
                return "keine Konsolenfehler"

            # --- PWA ---------------------------------------------------------
            # Diese Pruefungen kommen ans Ende: die letzte kappt die Verbindung,
            # und danach sind Fehler in der Konsole richtig statt falsch.

            def t_worker_uebernimmt():
                # register() laeuft beim 'load' der Seite - der Worker muss
                # danach nicht nur da sein, sondern die Seite auch steuern.
                # Erst dann kommen ihre Anfragen ueberhaupt bei ihm an.
                seite.wait_for_function(
                    "() => navigator.serviceWorker && navigator.serviceWorker.controller",
                    timeout=20000,
                )
                skript = seite.evaluate("navigator.serviceWorker.controller.scriptURL")
                assert skript.endswith("/paperless-app/sw.js"), skript
                return "Worker steuert die Seite"

            def t_huelle_liegt_im_cache():
                fehlt = seite.evaluate(
                    """async () => {
                        const namen = (await caches.keys()).filter(n => n.startsWith('docuwunder-huelle-'));
                        if (namen.length !== 1) return ['unerwartete Caches: ' + namen.join()];
                        const cache = await caches.open(namen[0]);
                        const soll = ['./index.html', './support.js', './mobile.dc.html',
                                      './api.js', './vendor/react.production.min.js'];
                        const da = await Promise.all(soll.map(p => cache.match(p, {ignoreVary: true})));
                        return soll.filter((p, i) => !da[i]);
                    }"""
                )
                assert not fehlt, f"nicht in der Huelle: {fehlt}"
                return "Huelle vollstaendig"

            def t_keine_dokumente_im_cache():
                # Die App speichert bewusst keine API-Antworten: darin stecken
                # Dokumente, und eine alte Liste waere eine Aussage ueber den
                # Bestand, die der Server nicht gedeckt hat.
                drin = seite.evaluate(
                    """async () => {
                        const raus = [];
                        for (const n of await caches.keys()) {
                            const c = await caches.open(n);
                            for (const r of await c.keys()) {
                                if (r.url.includes('/paperless/')) raus.push(r.url);
                            }
                        }
                        return raus;
                    }"""
                )
                assert not drin, f"im Cache gelandet: {drin[:3]}"
                return "keine Serverdaten im Cache"

            def t_vorschau_weicht_dem_telefon():
                # iphone.html zeigt die Oberflaeche in einer nachgebauten
                # iOS-Huelle. Auf einem echten Telefon waere das ein Rahmen im
                # Rahmen - wer dort ankommt, will die App.
                telefon = browser.new_context(
                    viewport={"width": 393, "height": 852}, is_mobile=True,
                    has_touch=True, device_scale_factor=3,
                )
                try:
                    p2 = telefon.new_page()
                    p2.goto(basis + "design/iphone.html", wait_until="domcontentloaded", timeout=30000)
                    p2.wait_for_url("**/index.html", timeout=10000)
                    # Mit ?rahmen bleibt der Entwurf absichtlich erreichbar.
                    p2.goto(basis + "design/iphone.html?rahmen", wait_until="domcontentloaded", timeout=30000)
                    p2.wait_for_timeout(800)
                    assert p2.url.endswith("design/iphone.html?rahmen"), \
                        f"?rahmen haelt den Entwurf nicht offen: {p2.url}"
                finally:
                    telefon.close()
                return "Telefon landet in der App, ?rahmen zeigt den Entwurf"

            def t_startet_ohne_netz():
                seite.context.set_offline(True)
                try:
                    seite.goto(basis + "index.html", wait_until="domcontentloaded", timeout=30000)
                    # Die Oberflaeche muss stehen - ohne Server hat sie keine
                    # Daten, aber die Huelle kommt aus dem Cache.
                    seite.wait_for_selector("text=Übersicht", timeout=20000)
                    txt = seite.inner_text("body")
                    assert "Übersicht" in txt, "Oberflaeche bleibt leer"
                finally:
                    seite.context.set_offline(False)
                return "App baut sich ohne Verbindung auf"

            for name, fn in [
                ("Oberflaeche baut sich auf", t_aufgebaut),
                ("Leiste folgt dem gewaehlten Schema", t_leiste_folgt_der_wahl),
                ("Startseite zeigt Serverdaten", t_startseite_hat_daten),
                ("Dokumente werden geladen", t_dokumente_geladen),
                ("Liste kommt sortiert vom Server", t_serverseitig_geladen),
                ("Sortierwechsel laedt neu", t_sortierwechsel_laedt_neu),
                ("Filter laedt neu", t_filter_laedt_neu),
                ("Suche geht an den Server", t_suche_serverseitig),
                ("Treffer oeffnet mit Vorschau", t_treffer_oeffnet_mit_vorschau),
                ("Keine Fehler in der Konsole", t_keine_ausnahmen),
                ("Service Worker steuert die Seite", t_worker_uebernimmt),
                ("Huelle liegt im Cache", t_huelle_liegt_im_cache),
                ("Keine Serverdaten im Cache", t_keine_dokumente_im_cache),
                ("Entwurfsvorschau weicht dem Telefon", t_vorschau_weicht_dem_telefon),
                ("App startet ohne Netz", t_startet_ohne_netz),
            ]:
                pruefe(name, fn)
        finally:
            browser.close()
            srv.shutdown()

    fehler = [n for ok, n in ergebnisse if not ok]
    print()
    if fehler:
        print(f"{len(fehler)} von {len(ergebnisse)} Pruefungen fehlgeschlagen")
        return 1
    print(f"Alle {len(ergebnisse)} Pruefungen bestanden")
    return 0


if __name__ == "__main__":
    sys.exit(main())
