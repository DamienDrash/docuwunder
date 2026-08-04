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
import json
import os
import pathlib
import re
import socket
import time
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
        try:
            self.wfile.write(daten)
        except (BrokenPipeError, ConnectionResetError):
            # Browser brechen Proxy-Antworten gelegentlich ab (z.B. beim
            # Navigieren oder beim Austausch der Service-Worker-Huelle). Das
            # ist kein Produktfehler und soll die Testausgabe nicht mit
            # Tracebacks verrauschen.
            return

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
        try:
            self.wfile.write(daten)
        except (BrokenPipeError, ConnectionResetError):
            return

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
        # has_touch, weil die Geste zum Aktualisieren an Beruehrungs-
        # ereignissen haengt. Mit der Maus geprueft bestand sie, auf dem
        # Geraet nicht: dort bricht der Browser die Zeigerereignisse ab,
        # sobald er die Bewegung fuer sich nimmt.
        kontext = browser.new_context(viewport={"width": 430, "height": 900},
                                      has_touch=True, is_mobile=True)
        seite = kontext.new_page()
        cdp = kontext.new_cdp_session(seite)
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

            def t_mitglieder_angesetzt():
                """Das Sachgebiet Mitglieder steht in mitglieder.js, nicht in app.js.

                Seine Methoden haengen zur Laufzeit am Prototyp von
                Oberflaeche. Faellt das Anhaengen aus - Ladereihenfolge in
                index.html vertauscht, Datei nicht ausgeliefert -, dann rendert
                die Verwaltung weiterhin klaglos: die Bildschirme bauen nur
                Rueckrufe, und der Fehler kommt erst beim Antippen von
                "Mitglied anlegen". Diese Pruefung sieht ihn beim Start.
                """
                fehlt = seite.evaluate(
                    "() => {"
                    " const p = window.DWApp && window.DWApp.Oberflaeche"
                    "   && window.DWApp.Oberflaeche.prototype;"
                    " if (!p) return ['Oberflaeche fehlt'];"
                    " const soll = Object.keys((window.DWMitglieder || {}).methoden || {});"
                    " if (!soll.length) return ['DWMitglieder fehlt'];"
                    " return soll.filter(n => typeof p[n] !== 'function');"
                    "}")
                assert not fehlt, f"nicht am Prototyp: {fehlt}"
                # Und der Zustand des Sachgebiets muss im Konstruktor gelandet
                # sein, sonst laeuft der Anlegen-Dialog gegen undefined.
                schluessel = seite.evaluate(
                    "() => Object.keys(window.DWMitglieder.start())")
                assert "neuMitglied" in schluessel and "zugang" in schluessel, schluessel
                return f"{len(schluessel)} Zustandswerte, Methoden am Prototyp"

            def t_leiste_folgt_der_wahl():
                # theme-color faerbt im installierten Zustand die Leiste des
                # Systems ueber der App. Im Kopf steht sie je Systemschema -
                # waehlt jemand in den Einstellungen ausdruecklich Hell oder
                # Dunkel, muss sie mitgehen. Geprueft wird deshalb die Wirkung
                # des Schalters, nicht sein Vorhandensein.
                soll = dict(re.findall(
                    r"const LEISTE_(HELL|DUNKEL) = '(#[0-9A-Fa-f]{6})'",
                    ((ROOT / "index.html").read_text(encoding="utf-8") + (ROOT / "start.js").read_text(encoding="utf-8"))))
                assert len(soll) == 2, f"Farben im Einstiegspunkt nicht gefunden: {soll}"

                def farben():
                    return seite.eval_on_selector_all(
                        "meta[name='theme-color']", "ms => ms.map(m => m.content)")

                tab("Mehr")
                # Die Einstellungen haengen an der Kontokarte.
                seite.locator("[data-konto]").last.click()
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

            # --- Barrierefreiheit: Wirkung, nicht Anwesenheit ----------------
            # tests/a11y_check.py zaehlt Buttons in den Vorlagen. Das ist eine
            # Leitplanke gegen Rueckschritte und misst NICHT, ob man die App
            # bedienen kann - gemessen am 2. August: 25 Buttons in den
            # Vorlagen, aber auf den vier Hauptreitern 0 fokussierbare
            # Elemente und Tab erreichte genau eines.
            #
            # Diese Pruefung misst die Wirkung: wie viele Bedienelemente ein
            # Mensch mit der Tastatur tatsaechlich erreicht. Die Schwellen
            # steigen mit der Migration - sie sind Sollwerte, keine Messwerte.

            # Mindestzahl der per Tab erreichbaren Bedienelemente je Reiter.
            # Wird mit jedem migrierten Bildschirm angehoben.
            # Nach der Migration der Tableiste: vier Reiter plus was der
            # Bildschirm selbst schon hergibt.
            TASTATUR_SOLL = {"Übersicht": 5, "Dokumente": 4, "Posteingang": 4, "Mehr": 4}

            def erreichbar(reiter):
                """Wie weit kommt man mit der Tabulatortaste?"""
                seite.locator(f'text="{reiter}"').last.click()
                seite.wait_for_timeout(1700)
                # Von vorn zaehlen. Nach einem Mausklick steht der Fokus
                # mitten in der Reihenfolge - ohne Zuruecksetzen misst man,
                # was nach dem Geklickten kommt, nicht was erreichbar ist.
                seite.evaluate(
                    """() => { if (document.activeElement) document.activeElement.blur();
                      document.body.setAttribute('tabindex', '-1');
                      document.body.focus(); }""")
                gesehen = []
                for _ in range(80):
                    seite.keyboard.press("Tab")
                    wer = seite.evaluate(
                        """() => { const a = document.activeElement;
                          if (!a || a === document.body) return null;
                          const name = a.getAttribute('aria-label')
                            || (a.textContent || '').trim().slice(0, 24)
                            || a.getAttribute('title') || '';
                          return a.tagName + ':' + name; }""")
                    if not wer or wer in gesehen:
                        break
                    gesehen.append(wer)
                return gesehen

            def t_tastatur_erreicht_die_bedienung():
                seite.reload(wait_until="networkidle")
                seite.wait_for_timeout(3200)
                stand, zu_wenig, namenlos = {}, [], []
                for reiter, soll in TASTATUR_SOLL.items():
                    kette = erreichbar(reiter)
                    stand[reiter] = len(kette)
                    if len(kette) < soll:
                        zu_wenig.append(f"{reiter}: {len(kette)} statt {soll}")
                    # Ein Bedienelement ohne erreichbaren Namen ist fuer einen
                    # Screenreader eine leere Schaltflaeche.
                    namenlos += [f"{reiter}/{w}" for w in kette if w.endswith(":")]
                assert not zu_wenig, "Tastaturbedienung verschlechtert – " + "; ".join(zu_wenig)
                assert not namenlos, "Bedienelemente ohne Namen: " + ", ".join(namenlos[:5])
                return ", ".join(f"{k} {v}" for k, v in stand.items())

            # --- Sicherheit --------------------------------------------------

            def t_api_adresse_wird_geprueft():
                """Die API-Adresse darf nicht beliebig sein.

                Sie entscheidet, wohin der Zugangsschluessel im
                Authorization-Kopf geht. Frueher nahm setBase() jede
                Zeichenkette; damit wurde jede Luecke, die localStorage
                schreiben kann, zum Schluesseldiebstahl.

                Grenze dieser Pruefung, damit niemand mehr hineinliest: der
                Zustimmungs-Merker ist eine Huerde, kein Schutz. Wer
                localStorage schreiben kann, schreibt ihn mit. Der wirksame
                Schutz ist connect-src in der CSP.
                """
                abgewiesen = seite.evaluate(
                    """() => {
                      const eigen = PaperlessAPI.getBase();
                      const raus = {};
                      for (const b of ['https://boese.example/api', 'javascript:alert(1)',
                                       'data:text/html,x', 'http://boese.example/api',
                                       '//boese.example/api', '']) {
                        raus[b] = PaperlessAPI.setBase(b).ok;
                      }
                      raus['__eigen__'] = PaperlessAPI.setBase(eigen).ok;
                      raus['__jetzt__'] = PaperlessAPI.getBase();
                      return raus;
                    }""")
                for adresse, angenommen in abgewiesen.items():
                    if adresse.startswith("__"):
                        continue
                    assert angenommen is False, f"{adresse} wurde angenommen"
                assert abgewiesen["__eigen__"] is True, "die eigene Adresse wird abgelehnt"
                assert "boese.example" not in abgewiesen["__jetzt__"]

                # Untergeschobene Adresse ohne Zustimmung wird beim Start verworfen.
                seite.evaluate(
                    "() => localStorage.setItem('paperless.base',"
                    " JSON.stringify({url:'https://boese.example/api'}))")
                seite.reload(wait_until="networkidle")
                seite.wait_for_timeout(2200)
                jetzt = seite.evaluate("() => PaperlessAPI.getBase()")
                assert "boese.example" not in jetzt, \
                    f"untergeschobene Adresse ueberlebt den Start: {jetzt}"
                return "sechs Adressen abgewiesen, untergeschobene beim Start verworfen"

            def t_suchausschnitt_fuehrt_nichts_aus():
                """Der Ausschnitt eines Suchtreffers darf keinen Code ausfuehren.

                Paperless bildet ihn aus dem Dokumentinhalt, also aus der
                Texterkennung. Wer ein Dokument ins Archiv bekommt - per
                E-Mail-Import, ueber den consume-Ordner, als Mitglied -
                bestimmt damit diesen String.

                Die frueherere Fassung strippte die Auszeichnungen ueber
                `el.innerHTML` an einem losgeloesten <div>. Ein losgeloestes
                Element ist aber NICHT inert: nachgemessen fuehrt
                `<img src=x onerror=...>` den Handler aus, auch wenn das
                Element nie im Dokument haengt.
                """
                # Roh-Zeichenkette: die Nutzlasten enthalten Rueckschraege
                # (`<\/script>`), die JavaScript braucht und Python sonst als
                # ungueltige Escape-Folge anmahnt.
                ergebnis = seite.evaluate(
                    r"""() => { globalThis.__xss = 0;
                      const proben = [
                        'Rechnung <img src=x onerror="globalThis.__xss=1"> Musterbau',
                        '<video src=x onerror="globalThis.__xss=1">Vertrag',
                        '<svg onload="globalThis.__xss=1">Beleg',
                        '<script>globalThis.__xss=1<\/script>Mahnung',
                      ];
                      const o = Object.create(DWSuche.methoden);
                      const texte = proben.map(x => DWSuche.methoden.nurText.call(o, x));
                      return new Promise(f => setTimeout(
                        () => f({ texte, gelaufen: !!globalThis.__xss }), 900)); }""")
                assert not ergebnis["gelaufen"], \
                    "der Suchausschnitt fuehrt Code aus dem Dokumentinhalt aus"
                # Und der Text muss weiterhin lesbar herauskommen.
                assert ergebnis["texte"][0] == "Rechnung Musterbau", \
                    f"Text falsch zerlegt: {ergebnis['texte'][0]!r}"
                return "vier Nutzlasten, keine ausgefuehrt"

            # --- Blaettern im Posteingang ------------------------------------
            # Waagerecht wischen wechselt das Dokument. Der heikle Teil ist
            # nicht das Blaettern, sondern die Koexistenz: senkrecht muss
            # weiterhin gescrollt werden. Die Achse wird beim ersten Zug
            # entschieden.

            def t_posteingang_blaettern():
                seite.reload(wait_until="networkidle")
                seite.wait_for_timeout(3800)
                seite.locator('text="Posteingang"').last.click()
                seite.wait_for_timeout(2600)
                zeilen = seite.locator("[data-screen-label='Posteingang'] [data-seite], "
                                       "[data-screen-label='Posteingang'] img")
                seite.locator("[data-screen-label='Posteingang'] img").first.click()
                seite.wait_for_timeout(2400)

                stand = lambda: seite.evaluate(
                    "() => { const e = [...document.querySelectorAll('span')]"
                    ".find(s => /^\\d+ von \\d+$/.test((s.textContent || '').trim()));"
                    " return e ? e.textContent.trim() : null; }")
                anfang = stand()
                assert anfang, "keine Zaehlung in der Pruefansicht"
                gesamt = int(anfang.split(" von ")[1])
                if gesamt < 2:
                    return "nur ein Dokument im Posteingang – nichts zu blaettern"

                def wisch(punkte):
                    cdp.send("Input.dispatchTouchEvent",
                             {"type": "touchStart", "touchPoints": [punkte[0]]})
                    for q in punkte[1:]:
                        cdp.send("Input.dispatchTouchEvent",
                                 {"type": "touchMove", "touchPoints": [q]})
                        seite.wait_for_timeout(40)
                    cdp.send("Input.dispatchTouchEvent",
                             {"type": "touchEnd", "touchPoints": []})
                    seite.wait_for_timeout(900)

                wisch([{"x": x, "y": 430} for x in (330, 290, 240, 180, 110, 60)])
                assert stand() == f"2 von {gesamt}", f"nach links: {stand()}"
                wisch([{"x": x, "y": 430} for x in (60, 110, 180, 240, 290, 330)])
                assert stand() == f"1 von {gesamt}", f"zurueck: {stand()}"
                # Am Anfang gibt es keinen Nachbarn - dort federt es nur.
                wisch([{"x": x, "y": 430} for x in (60, 110, 180, 240, 290, 330)])
                assert stand() == f"1 von {gesamt}", "blaettert ueber den Anfang hinaus"
                # Zu kurz gewischt heisst: nicht gemeint.
                wisch([{"x": x, "y": 430} for x in (200, 190, 178)])
                assert stand() == f"1 von {gesamt}", "kurzes Wischen blaettert"

                # Und senkrecht muss weiterhin gescrollt werden.
                scroll = lambda: seite.evaluate(
                    "() => { const e = [...document.querySelectorAll('[data-rev] *')]"
                    ".find(x => /auto|scroll/.test(getComputedStyle(x).overflowY)"
                    " && x.scrollHeight > x.clientHeight + 4);"
                    " return e ? e.scrollTop : null; }")
                if scroll() is not None:
                    wisch([{"x": 200, "y": y} for y in (380, 340, 290, 240, 190)])
                    assert (scroll() or 0) > 20, \
                        f"senkrecht wird nicht mehr gescrollt (scrollTop {scroll()})"
                    assert stand() == f"1 von {gesamt}", "senkrechtes Wischen blaettert"
                return f"blaettert durch {gesamt}, scrollt weiterhin senkrecht"

            # --- Bedienbarkeit der Kopfzeile ---------------------------------
            # Der Umschalter der Ansicht lag in der Filterzeile, und die
            # scrollt waagerecht. Bei vier Filtern stand er bei x=700 in einem
            # 390 Pixel breiten Fenster - vorhanden, im Baum auffindbar, aber
            # fuer niemanden sichtbar. Deshalb wird hier nicht geprueft, ob es
            # ihn gibt, sondern ob er im Bild liegt.

            def t_umschalter_ist_sichtbar():
                seite.reload(wait_until="networkidle")
                seite.wait_for_timeout(3000)
                seite.locator('text="Dokumente"').last.click()
                seite.wait_for_timeout(2200)
                lage = seite.evaluate(
                    "() => { const k = document.querySelector(\"button[aria-label='Ansicht wechseln']\");"
                    " if (!k) return null; const r = k.getBoundingClientRect();"
                    " return { links: r.left, rechts: r.right, fenster: innerWidth }; }")
                assert lage, "Umschalter nicht gefunden"
                assert lage["links"] >= 0 and lage["rechts"] <= lage["fenster"], \
                    f"Umschalter liegt ausserhalb des Fensters: {lage}"
                return f"sichtbar bei {round(lage['rechts'])} von {lage['fenster']} px"

            # --- Ziehen zum Aktualisieren ------------------------------------

            def ziehen(reiter, weit=True):
                """Mit dem Finger, nicht mit der Maus.

                Der Unterschied ist der ganze Punkt: bei einer Beruehrung
                nimmt der Browser die Bewegung fuer sich und beendet die
                Zeigerereignisse mit pointercancel - gemessen ein einziges
                pointermove, waehrend touchmove weiterlief. Eine Pruefung mit
                der Maus haette das nie gesehen.
                """
                cdp.send("Input.dispatchTouchEvent",
                         {"type": "touchStart", "touchPoints": [{"x": 200, "y": 300}]})
                for y in ((340, 400, 460) if weit else (315, 330)):
                    cdp.send("Input.dispatchTouchEvent",
                             {"type": "touchMove", "touchPoints": [{"x": 200, "y": y}]})
                    seite.wait_for_timeout(70)
                gezogen = seite.evaluate(
                    f"() => (document.querySelector(`[data-screen-label='{reiter}']`)"
                    " || {style:{}}).style.transform")
                cdp.send("Input.dispatchTouchEvent",
                         {"type": "touchEnd", "touchPoints": []})
                return gezogen

            def t_scrollen_bleibt_scrollen():
                """Die Geste darf das Scrollen nicht auffressen.

                Sie greift nur ganz oben - mitten in der Liste nach unten zu
                ziehen ist Scrollen und darf nichts nachladen.
                """
                seite.locator('text="Mehr"').last.click()
                seite.wait_for_timeout(2000)

                def wisch(y0, y1):
                    cdp.send("Input.dispatchTouchEvent",
                             {"type": "touchStart", "touchPoints": [{"x": 200, "y": y0}]})
                    for i in range(1, 9):
                        cdp.send("Input.dispatchTouchEvent", {"type": "touchMove",
                                 "touchPoints": [{"x": 200, "y": y0 + (y1 - y0) * i / 8}]})
                        seite.wait_for_timeout(40)
                    cdp.send("Input.dispatchTouchEvent",
                             {"type": "touchEnd", "touchPoints": []})

                hoch = lambda: seite.evaluate(
                    "() => (document.querySelector('[data-zieh]') || {}).scrollTop")
                assert hoch() == 0, "Liste steht nicht oben"
                wisch(600, 200)
                seite.wait_for_timeout(800)
                assert hoch() > 30, f"Scrollen geht nicht mehr (scrollTop {hoch()})"

                anfragen = []
                seite.on("request", lambda r: anfragen.append(r.url)
                         if "/api/" in r.url else None)
                wisch(300, 460)
                seite.wait_for_timeout(1500)
                assert not anfragen, \
                    f"Ziehen mitten in der Liste hat geladen: {len(anfragen)}"
                return "oben ziehen laedt, mittendrin scrollt es"

            def t_ziehen_laedt_neu():
                for reiter in ("Übersicht", "Dokumente", "Posteingang", "Mehr"):
                    seite.locator(f'text="{reiter}"').last.click()
                    seite.wait_for_timeout(1800)
                    anfragen = []
                    seite.on("request", lambda r: anfragen.append(r.url)
                             if "/api/" in r.url else None)
                    gezogen = ziehen(reiter)
                    assert gezogen and gezogen != "translateY(0px)", \
                        f"{reiter} laesst sich nicht ziehen ({gezogen})"
                    # Federt zurueck, sobald das Nachladen fertig ist.
                    seite.wait_for_function(
                        f"() => {{ const c = document.querySelector("
                        f"`[data-screen-label='{reiter}']`);"
                        " return c && c.style.transform === 'translateY(0px)'; }",
                        timeout=20000)
                    assert anfragen, f"{reiter} hat nichts nachgeladen"
                return "vier Reiter, jeder laedt und federt zurueck"

            def t_kurzes_ziehen_laedt_nicht():
                # Sonst waere jedes Scrollen am oberen Rand ein Neuladen.
                seite.locator('text="Dokumente"').last.click()
                seite.wait_for_timeout(1800)
                anfragen = []
                seite.on("request", lambda r: anfragen.append(r.url)
                         if "/api/documents/?" in r.url else None)
                ziehen("Dokumente", weit=False)
                seite.wait_for_timeout(2500)
                assert not anfragen, f"kurzes Ziehen hat geladen: {len(anfragen)}"
                return "unterhalb der Schwelle passiert nichts"

            # --- Ordneransicht im Reiter Dokumente ---------------------------
            # Der Umschalter kennt drei Ansichten. Geprueft wird die Wirkung:
            # dass jeder Ordner den Server fragt (die Anzeige also den Bestand
            # meint und nicht die geladene Seite), dass die Pfadleiste
            # mitwandert und dass ein Sprung darin wirklich zurueckfuehrt.

            def umschalten():
                seite.evaluate(
                    "() => { const b = document.querySelector(\"button[aria-label='Ansicht wechseln']\");"
                    " if (b) b.click(); }")

            def t_ordneransicht_im_reiter():
                seite.reload(wait_until="networkidle")
                seite.wait_for_timeout(3000)
                seite.locator('text="Dokumente"').last.click()
                seite.wait_for_timeout(2500)

                # Liste -> Raster -> Ordner
                umschalten()
                seite.wait_for_timeout(1300)
                umschalten()
                seite.wait_for_timeout(2400)
                assert seite.locator('text="Alle"').count() > 0, "keine Pfadleiste"
                # Filter und Sortierung wirken auf Ordner nicht und duerfen
                # deshalb nicht dastehen.
                assert seite.locator('text="Filter"').count() == 0, \
                    "Filter steht im Ordnermodus, wirkt dort aber nicht"

                abfragen = []
                seite.on("request", lambda r: abfragen.append(r.url)
                         if "storage_path__id__in" in r.url else None)
                for name in ("Arbeit", "Freelancer", "CycleCoin", "Vertrag"):
                    seite.locator(f"button[aria-label='Ordner „{name}“ öffnen']").click()
                    seite.wait_for_timeout(2300)
                assert len(abfragen) >= 4, \
                    f"nicht jeder Ordner fragt den Server: {len(abfragen)}"

                weg = seite.evaluate(
                    "() => [...document.querySelectorAll('span,button')]"
                    ".filter(s => s.childElementCount === 0)"
                    ".map(s => s.textContent.trim())"
                    ".filter(t => ['Alle','Arbeit','Freelancer','CycleCoin','Vertrag'].includes(t))")
                assert weg == ["Alle", "Arbeit", "Freelancer", "CycleCoin", "Vertrag"], \
                    f"Pfadleiste stimmt nicht: {weg}"

                # Sprung in der Pfadleiste zurueck auf die zweite Ebene.
                seite.locator('text="Arbeit"').first.click()
                seite.wait_for_timeout(2400)
                assert seite.locator('text="Freelancer"').count() > 0, \
                    "der Sprung in der Pfadleiste fuehrt nicht zurueck"

                # Und zurueck zur Liste - der Umschalter muss rundlaufen.
                umschalten()
                seite.wait_for_timeout(1800)
                assert seite.locator('text="Filter"').count() > 0, \
                    "aus dem Ordnermodus geht es nicht zurueck in die Liste"
                return "drei Ansichten, vier Ebenen tief, Pfadleiste traegt zurueck"

            # --- Vorschaubilder ----------------------------------------------
            # Die Listen zeigten fuer jedes Dokument dasselbe gezeichnete
            # Blatt mit grauen Strichen. Geprueft wird, dass dort jetzt das
            # Vorschaubild des Servers steht - an der Bildgroesse, die ein
            # gezeichnetes Blatt nicht hat.

            def t_listen_zeigen_echte_vorschau():
                seite.reload(wait_until="networkidle")
                seite.wait_for_timeout(4000)
                gezeigt = seite.evaluate(
                    "() => [...document.querySelectorAll('img')]"
                    ".filter(i => i.src.startsWith('blob:') && i.naturalWidth > 0)"
                    ".map(i => i.naturalWidth)")
                assert len(gezeigt) >= 3, \
                    f"Startseite zeigt {len(gezeigt)} Vorschaubilder, erwartet mindestens 3"

                seite.locator('text="Dokumente"').last.click()
                seite.wait_for_timeout(3500)
                inListe = seite.evaluate(
                    "() => [...document.querySelectorAll('img')]"
                    ".filter(i => i.src.startsWith('blob:') && i.naturalWidth > 0).length")
                assert inListe >= 5, f"Liste zeigt nur {inListe} Vorschaubilder"

                # Und sie muessen sich unterscheiden - sonst waere es wieder
                # ein Platzhalter, nur diesmal als Bild.
                verschieden = seite.evaluate(
                    "() => new Set([...document.querySelectorAll('img')]"
                    ".filter(i => i.src.startsWith('blob:')).map(i => i.src)).size")
                assert verschieden >= 5, f"nur {verschieden} verschiedene Bilder"
                return f"{inListe} echte Vorschaubilder in der Liste"

            # --- Bedienungen, die nur geredet haben --------------------------
            # Vier Knoepfe hatten als ganze Wirkung einen Hinweistext:
            # "Hilfe oeffnet sich im Browser" (es oeffnete sich nichts),
            # "Datenschutzerklaerung oeffnet sich" (dito), "Folgt der
            # Textgroesse deines Geraets" (an einer Zeile, die aussah wie ein
            # Schalter) und "Der Abruf laeuft nach dem Zeitplan des Servers"
            # (an einem Knopf namens "Jetzt abrufen").

            def t_textgroesse_ist_anzeige():
                seite.reload(wait_until="networkidle")
                seite.wait_for_timeout(2600)
                seite.locator('text="Mehr"').last.click()
                seite.wait_for_timeout(900)
                seite.locator("[data-konto]").last.click()
                seite.wait_for_timeout(1300)
                assert seite.locator("[data-screen-label='Einstellungen']").count() > 0, \
                    "Einstellungen nicht geoeffnet"
                zeiger = seite.locator('text="Textgröße"').last.evaluate(
                    "e => getComputedStyle(e.parentElement).cursor")
                assert zeiger != "pointer", \
                    "Die Zeile sieht antippbar aus, ist aber nur eine Anzeige"
                return "Anzeige statt Schalter"

            def t_datenschutz_hat_inhalt():
                seite.locator('text="Datenschutz"').last.click()
                seite.wait_for_timeout(1300)
                for satz in ("Was auf dem Gerät bleibt", "Was den Server erreicht"):
                    assert seite.locator(f'text="{satz}"').count() > 0, f"„{satz}“ fehlt"
                assert seite.locator('text="Quelltext ansehen"').count() > 0, "kein Verweis"
                seite.keyboard.press("Escape")
                seite.wait_for_timeout(800)
                return "echter Text statt Ankuendigung"

            def t_hilfe_oeffnet_wirklich():
                with seite.context.expect_page(timeout=8000) as neu:
                    seite.locator('text="Hilfe & Support"').last.click()
                ziel = neu.value.url
                neu.value.close()
                assert "DamienDrash/docuwunder" in ziel, f"falsches Ziel: {ziel}"
                return ziel

            def t_mailabruf_stoesst_wirklich_an():
                # Ohne Konto sagt der Knopf das auch.
                seite.reload(wait_until="networkidle")
                seite.wait_for_timeout(2600)
                seite.locator('text="Mehr"').last.click()
                seite.wait_for_timeout(900)
                seite.locator('text="E-Mail-Import"').last.click()
                seite.wait_for_timeout(1300)
                assert seite.locator('text="Kein Konto eingerichtet"').count() > 0, \
                    "Knopf verspricht einen Abruf ohne Konto"

                # Mit Konto muss ein echter Abruf beim Server ankommen. Das
                # Konto zeigt bewusst ins Leere - geprueft wird das Anstossen,
                # nicht das Postfach.
                anlegen = urllib.request.Request(
                    BACKEND + "/mail_accounts/", method="POST",
                    data=json.dumps({
                        "name": "zz-Pruefkonto", "imap_server": "127.0.0.1",
                        "imap_port": 993, "imap_security": 2,
                        "username": "test", "password": "test",
                        "character_set": "UTF-8"}).encode())
                anlegen.add_header("Authorization", "Token " + TOKEN)
                anlegen.add_header("Content-Type", "application/json")
                konto = json.loads(urllib.request.urlopen(anlegen).read())
                try:
                    antworten = []
                    seite.on("response", lambda r: antworten.append((r.status, r.url))
                             if r.request.method == "POST" else None)
                    seite.reload(wait_until="networkidle")
                    seite.wait_for_timeout(2600)
                    seite.locator('text="Mehr"').last.click()
                    seite.wait_for_timeout(900)
                    seite.locator('text="E-Mail-Import"').last.click()
                    seite.wait_for_timeout(1300)
                    seite.locator('text="Jetzt abrufen"').last.click()
                    seite.wait_for_timeout(3000)
                    assert any(s == 200 and "/process/" in u for s, u in antworten), \
                        f"kein Abruf angestossen: {antworten}"
                finally:
                    weg = urllib.request.Request(
                        BACKEND + "/mail_accounts/" + str(konto["id"]) + "/", method="DELETE")
                    weg.add_header("Authorization", "Token " + TOKEN)
                    urllib.request.urlopen(weg)
                return "ohne Konto ehrlich, mit Konto ein echter Abruf"

            # --- Die drei Wege, etwas hereinzubekommen -----------------------
            # "Foto" und "Datei" riefen eine Methode auf, die es nicht gab.
            # Jeder Klick warf still in die Konsole und tat nichts. Geprueft
            # wird deshalb, dass ein Dialog aufgeht UND die gewaehlte Datei
            # beim Server ankommt - nicht, dass der Knopf existiert.

            def t_alle_drei_wege_oeffnen():
                seite.reload(wait_until="networkidle")
                seite.wait_for_timeout(2600)
                # Beide Einstiege: die Kacheln auf der Startseite und das
                # Hinzufuegen-Sheet. Sie tragen verschiedene Beschriftungen und
                # sind schon einmal auseinandergelaufen.
                stumm = []
                for knopf in ("Scannen", "Datei"):
                    try:
                        with seite.expect_file_chooser(timeout=5000) as wahl:
                            seite.locator(f'text="{knopf}"').last.click()
                        wahl.value.set_files([])
                    except Exception:
                        stumm.append("Startseite/" + knopf)
                    seite.keyboard.press("Escape")
                    seite.wait_for_timeout(700)

                PLUS = 'path[d="M12 5v14M5 12h14"]'
                for knopf in ("Dokument scannen", "Datei hochladen"):
                    seite.locator('text="Dokumente"').last.click()
                    seite.wait_for_timeout(800)
                    seite.locator("svg").filter(has=seite.locator(PLUS)).last.click()
                    seite.wait_for_timeout(1100)
                    try:
                        with seite.expect_file_chooser(timeout=5000) as wahl:
                            seite.locator(f'text="{knopf}"').last.click()
                        wahl.value.set_files([])
                    except Exception:
                        stumm.append("Sheet/" + knopf)
                    seite.keyboard.press("Escape")
                    seite.wait_for_timeout(700)

                assert not stumm, f"kein Dialog bei: {stumm}"
                assert not fehlerkonsole, "; ".join(fehlerkonsole[:3])
                return "beide Einstiege, je zwei Wege"

            def t_die_wege_sind_verschieden():
                """Zwei Eintraege muessen zu zwei verschiedenen Dialogen fuehren.

                Vorher waren es drei, und zwei davon oeffneten dasselbe: eine
                Seite kann dem System nur sagen, WELCHE Typen sie annimmt -
                welche Quellen es anbietet, entscheidet es selbst. Hinter
                "Foto" standen deshalb auch Dateien und Google Drive. Ein
                Foto-Picker laesst sich aus dem Web nicht anfordern, also gibt
                es den Eintrag nicht mehr.

                Was bleibt, muss sich unterscheiden: Scannen fragt die Kamera
                an, Datei nicht.
                """
                PLUS = 'path[d="M12 5v14M5 12h14"]'
                wege = {}
                for knopf in ("Dokument scannen", "Datei hochladen"):
                    seite.reload(wait_until="networkidle")
                    seite.wait_for_timeout(2600)
                    seite.locator('text="Dokumente"').last.click()
                    seite.wait_for_timeout(800)
                    seite.locator("svg").filter(has=seite.locator(PLUS)).last.click()
                    seite.wait_for_timeout(1100)
                    with seite.expect_file_chooser() as wahl:
                        seite.locator(f'text="{knopf}"').last.click()
                    feld = wahl.value.element
                    wege[knopf] = {
                        "accept": feld.get_attribute("accept") or "",
                        "mehrere": wahl.value.is_multiple(),
                        "kamera": feld.get_attribute("capture"),
                    }
                    wahl.value.set_files([])
                    seite.keyboard.press("Escape")
                    seite.wait_for_timeout(500)

                assert wege["Dokument scannen"]["kamera"] == "environment", \
                    "Scannen fragt nicht die Kamera an"
                assert wege["Datei hochladen"]["kamera"] is None, \
                    "Datei springt in die Kamera"
                for was in ("image/*", ".pdf"):
                    assert was in wege["Datei hochladen"]["accept"], \
                        f"Datei nimmt {was} nicht an"
                assert seite.locator('text="Foto auswählen"').count() == 0, \
                    "der Foto-Eintrag ist wieder da"
                unterschiede = {(w["accept"], w["mehrere"], w["kamera"]) for w in wege.values()}
                assert len(unterschiede) == 2, f"beide Wege sind gleich: {wege}"
                return "Kamera und Dateiauswahl – zwei verschiedene Dialoge"

            def t_datei_kommt_beim_server_an():
                seite.reload(wait_until="networkidle")
                seite.wait_for_timeout(2600)
                antworten = []
                seite.on("response", lambda r: antworten.append((r.status, r.url))
                         if r.request.method == "POST" else None)
                with seite.expect_file_chooser() as wahl:
                    seite.locator('text="Datei"').last.click()
                wahl.value.set_files([str(pathlib.Path(__file__).parent / "bilder" / "hoch.jpg")])
                seite.wait_for_timeout(4000)
                assert any(s == 200 and "post_document" in u for s, u in antworten), \
                    f"nichts hochgeladen: {antworten}"

                for _ in range(40):
                    time.sleep(3)
                    r = urllib.request.Request(BACKEND + "/documents/?title__icontains=hoch")
                    r.add_header("Authorization", "Token " + TOKEN)
                    d = json.loads(urllib.request.urlopen(r).read())
                    if d["count"]:
                        weg = urllib.request.Request(
                            BACKEND + "/documents/" + str(d["results"][0]["id"]) + "/",
                            method="DELETE")
                        weg.add_header("Authorization", "Token " + TOKEN)
                        urllib.request.urlopen(weg)
                        return "ueber „Datei“ gewaehlte Datei liegt im Server"
                raise AssertionError("Server hat die Datei nicht verarbeitet")

            # --- Scannen -----------------------------------------------------
            # Geprueft wird die Wirkung auf das Bild, nicht das Vorhandensein
            # der Knoepfe: naturalWidth/-Height der Kachel zeigen, ob wirklich
            # gedreht, beschnitten und umsortiert wurde. Der frueher hier
            # gezeichnete Kamerabildschirm haette jede Pruefung bestanden, die
            # nur nach Knoepfen sucht - er hat nie ein Foto gemacht.

            BILDER = pathlib.Path(__file__).parent / "bilder"

            def masse(nr):
                return seite.evaluate(
                    "(nr) => { const i = document.querySelector(`[data-seite=\"${nr}\"] img`);"
                    " return i ? [i.naturalWidth, i.naturalHeight] : null; }", str(nr))

            def t_scannen_mehrseitig():
                seite.reload(wait_until="networkidle")
                seite.wait_for_timeout(2600)
                with seite.expect_file_chooser() as wahl:
                    seite.locator('text="Scannen"').last.click()
                assert wahl.value.is_multiple(), "Dialog nimmt nur eine Datei"
                wahl.value.set_files([str(BILDER / "hoch.jpg"), str(BILDER / "quer.jpg")])
                seite.wait_for_timeout(4000)
                assert seite.locator("[data-seite]").count() == 2, "nicht beide Seiten uebernommen"
                assert masse(1) == [600, 800] and masse(2) == [800, 600], \
                    f"Seiten vertauscht oder verzerrt: {masse(1)}, {masse(2)}"

                seite.locator('[data-seite="1"] [title="Drehen"]').click()
                seite.wait_for_timeout(2500)
                assert masse(1) == [800, 600], f"Drehen tauscht die Kanten nicht: {masse(1)}"

                zweite = masse(2)
                seite.locator('[data-seite="2"] [title="Nach vorn"]').click()
                seite.wait_for_timeout(900)
                assert masse(1) == zweite, "Reihenfolge nicht getauscht"

                seite.locator('[data-seite="2"] [title="Entfernen"]').click()
                seite.wait_for_timeout(900)
                assert seite.locator("[data-seite]").count() == 1, "Seite nicht entfernt"
                assert masse(1) == zweite, "die falsche Seite entfernt"
                return "aufnehmen, drehen, ordnen, entfernen"

            def t_scan_modus_wirkt():
                # Bildmodus (Original/Graustufe) gilt fuer den ganzen Scan
                # (ADR 0005, Phase 3). Die Seite muss dabei ihre Bildquelle
                # tatsaechlich wechseln (echte Pixelrechnung, kein CSS-Filter)
                # und darf nicht verschwinden.
                vorher_src = seite.locator('[data-seite="1"] img').get_attribute("src")
                seite.locator('text="Graustufe"').click()
                seite.wait_for_timeout(2500)
                assert seite.locator('text="Graustufe"').get_attribute("aria-pressed") == "true", \
                    "Graustufe nicht als gewaehlt markiert"
                nachher_src = seite.locator('[data-seite="1"] img').get_attribute("src")
                assert nachher_src and nachher_src != vorher_src, "Bild hat sich nicht neu gerendert"
                assert seite.locator("[data-seite]").count() == 1, "Seite ging beim Moduswechsel verloren"
                # Zurueck auf Original, damit die folgenden Pruefungen (Zuschnitt,
                # Massvergleich) vom bekannten Ausgangszustand ausgehen koennen.
                seite.locator('text="Original"').click()
                seite.wait_for_timeout(2500)
                assert seite.locator('text="Original"').get_attribute("aria-pressed") == "true"
                return "Graustufe faerbt um, Original stellt zurueck, keine Seite verloren"

            def t_scan_regler_wirken():
                # Kontrast/Helligkeit-Regler (Goldstandard-Scanner, 0.6.1).
                # Beide muessen echt neu rechnen (neue Bildquelle) und duerfen
                # die Seite nicht verlieren; der Wert daneben muss folgen.
                vorher_src = seite.locator('[data-seite="1"] img').get_attribute("src")
                kontrast = seite.locator('input[aria-label="Kontrast"]')
                kontrast.fill("1.6")
                kontrast.dispatch_event("change")
                seite.wait_for_timeout(2500)
                assert seite.locator('text="160%"').count() > 0, "Kontrastwert folgt nicht"
                nach_kontrast = seite.locator('[data-seite="1"] img').get_attribute("src")
                assert nach_kontrast and nach_kontrast != vorher_src, \
                    "Kontrastregler veraendert das Bild nicht"
                assert seite.locator("[data-seite]").count() == 1, "Seite bei Kontrast verloren"

                helligkeit = seite.locator('input[aria-label="Helligkeit"]')
                helligkeit.fill("40")
                helligkeit.dispatch_event("change")
                seite.wait_for_timeout(2500)
                assert seite.locator('text="+40"').count() > 0, "Helligkeitswert folgt nicht"
                nach_helligkeit = seite.locator('[data-seite="1"] img').get_attribute("src")
                assert nach_helligkeit and nach_helligkeit != nach_kontrast, \
                    "Helligkeitsregler veraendert das Bild nicht"
                assert seite.locator("[data-seite]").count() == 1, "Seite bei Helligkeit verloren"

                # Zuruecksetzen, damit nachfolgende Pruefungen (Zuschnitt,
                # Massvergleich) vom bekannten Ausgangszustand ausgehen.
                kontrast.fill("1")
                kontrast.dispatch_event("change")
                helligkeit.fill("0")
                helligkeit.dispatch_event("change")
                seite.wait_for_timeout(2500)
                return "Kontrast und Helligkeit wirken auf das Bild, Werte folgen den Reglern"

            def t_rand_erkennung_schlaegt_vor():
                # Automatische Randerkennung (ADR 0005, Phase 4). Getestet wird
                # DWScan.randSchaetzen direkt im Browser mit einem synthetischen
                # Bild (weisser Hintergrund, dunkles Rechteck in der Mitte) -
                # deterministisch und ohne von echten Fotos abzuhaengen. Geprueft
                # wird zweierlei: dass ein plausibles Rechteck gefunden wird UND
                # dass ein Aufruf des Zuschnitt-Dialogs im laufenden Scan den
                # vollen Rahmen durch einen engeren Vorschlag ersetzt, ohne dass
                # "Ganz" (voller Rahmen) unerreichbar wird.
                ergebnis = seite.evaluate("""
                    async () => {
                        const c = document.createElement('canvas');
                        c.width = 300; c.height = 300;
                        const g = c.getContext('2d');
                        g.fillStyle = '#fff';
                        g.fillRect(0, 0, 300, 300);
                        g.fillStyle = '#222';
                        g.fillRect(60, 90, 180, 120);
                        const blob = await new Promise(r => c.toBlob(r, 'image/png'));
                        const r = await window.DWScan.randSchaetzen(blob);
                        return r;
                    }
                """)
                assert ergebnis, "kein Randvorschlag fuer ein eindeutiges Rechteck gefunden"
                assert 0 < ergebnis["x0"] < ergebnis["x1"] < 1, f"kein sinnvoller Rand: {ergebnis}"
                assert 0 < ergebnis["y0"] < ergebnis["y1"] < 1, f"kein sinnvoller Rand: {ergebnis}"
                # Grober Sanity-Check: die Mitte muss im Vorschlag liegen, die
                # Ecken sollen aussen bleiben (das Rechteck liegt bei 20-80%).
                assert ergebnis["x0"] < 0.35 and ergebnis["x1"] > 0.65, f"Rand zu eng/verschoben: {ergebnis}"

                leer = seite.evaluate("""
                    async () => {
                        const c = document.createElement('canvas');
                        c.width = 200; c.height = 200;
                        const g = c.getContext('2d');
                        g.fillStyle = '#fff';
                        g.fillRect(0, 0, 200, 200);
                        const blob = await new Promise(r => c.toBlob(r, 'image/png'));
                        return await window.DWScan.randSchaetzen(blob);
                    }
                """)
                assert leer is None, "ein leeres Bild darf keinen Randvorschlag erzeugen"
                return "eindeutiges Rechteck liefert einen Vorschlag, ein leeres Bild keinen"

            def t_zuschnitt_wirkt():
                vorher = masse(1)
                seite.locator('[data-seite="1"] [title="Zuschneiden"]').click()
                seite.wait_for_timeout(1200)
                assert seite.locator("[data-griff]").count() == 4, "keine Griffe"
                griff = seite.locator('[data-griff="lo"]').bounding_box()
                bild = seite.locator("img[alt='Seite zuschneiden']").bounding_box()
                seite.mouse.move(griff["x"] + 15, griff["y"] + 15)
                seite.mouse.down()
                seite.mouse.move(bild["x"] + bild["width"] * 0.35,
                                 bild["y"] + bild["height"] * 0.30, steps=12)
                seite.mouse.up()
                seite.wait_for_timeout(600)
                seite.locator('text="Übernehmen"').click()
                seite.wait_for_timeout(3000)
                nachher = masse(1)
                assert nachher[0] < vorher[0] and nachher[1] < vorher[1], \
                    f"Zuschnitt ohne Wirkung: {vorher} -> {nachher}"
                return f"{vorher[0]}x{vorher[1]} auf {nachher[0]}x{nachher[1]}"

            def t_zuschnitt_griffe_tastatur():
                seite.locator('[data-seite="1"] [title="Zuschneiden"]').click()
                seite.wait_for_timeout(1200)
                griff = seite.locator('[data-griff="lo"]')
                assert griff.count() == 1, "Zuschnittgriff fehlt"
                griff.focus()
                vorher = griff.evaluate("el => ({ left: el.style.left, top: el.style.top })")
                seite.keyboard.press('ArrowRight')
                seite.keyboard.press('ArrowDown')
                seite.wait_for_timeout(300)
                nachher = griff.evaluate("el => ({ left: el.style.left, top: el.style.top })")
                assert vorher != nachher, f"Pfeiltasten veraendern den Zuschnitt nicht: {vorher} -> {nachher}"
                seite.locator('text="Ganz"').click()
                seite.locator('text="Abbrechen"').click()
                return f"{vorher} -> {nachher}"

            def t_scan_wird_ein_pdf():
                # Der eigentliche Zweck: aus mehreren Aufnahmen wird EIN
                # Dokument. Frueher waeren es mehrere Bilder im Posteingang
                # gewesen, die niemand mehr zusammenbringt.
                with seite.expect_file_chooser() as wahl:
                    seite.locator("[data-neue-seite]").click()
                wahl.value.set_files([str(BILDER / "quer.jpg")])
                seite.wait_for_timeout(3000)
                assert seite.locator("[data-seite]").count() == 2

                seite.locator('text="Weiter"').click()
                seite.wait_for_timeout(900)
                assert seite.locator('text="2 Seiten"').count() > 0, "Seitenzahl fehlt"
                titel = "zz-Pruefung-Scan"
                seite.locator("input").last.fill(titel)
                antworten = []
                seite.on("response", lambda r: antworten.append((r.status, r.url))
                         if r.request.method == "POST" else None)
                seite.locator('text="Hochladen"').click()
                seite.wait_for_timeout(4000)
                assert any(s == 200 and "post_document" in u for s, u in antworten), \
                    f"kein Upload: {antworten}"
                assert seite.locator("[data-screen-label='Scannen']").count() == 0, \
                    "Scan-Bildschirm bleibt offen"

                # Aufraeumen: das erzeugte Dokument wieder entfernen, sobald
                # der Server es verarbeitet hat.
                for _ in range(40):
                    time.sleep(3)
                    r = urllib.request.Request(
                        BACKEND + "/documents/?title__icontains=" + titel)
                    r.add_header("Authorization", "Token " + TOKEN)
                    d = json.loads(urllib.request.urlopen(r).read())
                    if d["count"]:
                        doc = d["results"][0]
                        assert doc.get("page_count") == 2, \
                            f"PDF hat {doc.get('page_count')} statt 2 Seiten"
                        weg = urllib.request.Request(
                            BACKEND + "/documents/" + str(doc["id"]) + "/", method="DELETE")
                        weg.add_header("Authorization", "Token " + TOKEN)
                        urllib.request.urlopen(weg)
                        return "zwei Aufnahmen wurden ein PDF mit zwei Seiten"
                raise AssertionError("Server hat den Scan nicht verarbeitet")

            # --- Kamera-Fallback-Kette (Goldstandard-Scanner Phase 1) -------
            # getUserMedia wird per Init-Skript ersetzt, bevor die Seite laedt -
            # so laesst sich jeder der drei Faelle deterministisch erzwingen,
            # ohne von einer echten Kamera im Testcontainer abzuhaengen.

            def t_kamera_erfolg_zeigt_vorschau():
                # Ein echter MediaStream (aus einem Canvas), damit die
                # srcObject-Zuweisung im Code denselben Pfad nimmt wie mit
                # einer echten Kamera - kein blosses Mock-Objekt.
                seite.context.add_init_script("""
                    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
                    navigator.mediaDevices = navigator.mediaDevices || {};
                    navigator.mediaDevices.getUserMedia = () => {
                        const c = document.createElement('canvas');
                        c.width = 320; c.height = 240;
                        const g = c.getContext('2d'); g.fillStyle = '#0a0'; g.fillRect(0, 0, 320, 240);
                        return Promise.resolve(c.captureStream(5));
                    };
                """)
                seite.reload(wait_until="networkidle")
                seite.wait_for_timeout(2600)
                seite.locator('text="Scannen"').last.click()
                seite.wait_for_timeout(700)
                assert seite.locator('[data-kamera-vorschau]').count() == 1, \
                    "keine Live-Vorschau bei erlaubter Kamera"
                assert seite.locator('[data-kamera-vorschau] video').count() == 1
                seite.locator('[aria-label="Abbrechen"]').click()
                seite.wait_for_timeout(400)
                return "Vorschau erscheint, wenn getUserMedia erfolgreich ist"

            def t_kamera_verweigert_faellt_zurueck():
                seite.context.add_init_script("""
                    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
                    navigator.mediaDevices = navigator.mediaDevices || {};
                    navigator.mediaDevices.getUserMedia = () => {
                        const e = new Error('verweigert'); e.name = 'NotAllowedError';
                        return Promise.reject(e);
                    };
                """)
                seite.reload(wait_until="networkidle")
                seite.wait_for_timeout(2600)
                with seite.expect_file_chooser() as wahl:
                    seite.locator('text="Scannen"').last.click()
                    seite.wait_for_timeout(700)
                assert seite.locator('[data-kamera-vorschau]').count() == 0, \
                    "Vorschau haette bei Verweigerung nicht erscheinen duerfen"
                assert wahl.value.is_multiple(), "Dateidialog nicht erreicht"
                return "Verweigerung faellt sofort auf den Dateidialog zurueck"

            def t_kamera_fehlt_direkt_dateidialog():
                seite.context.add_init_script("""
                    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
                    if (navigator.mediaDevices) delete navigator.mediaDevices.getUserMedia;
                """)
                seite.reload(wait_until="networkidle")
                seite.wait_for_timeout(2600)
                with seite.expect_file_chooser() as wahl:
                    seite.locator('text="Scannen"').last.click()
                assert seite.locator('[data-kamera-vorschau]').count() == 0
                assert wahl.value.is_multiple(), "Dateidialog nicht erreicht ohne getUserMedia"
                return "ohne getUserMedia geht es direkt zum Dateidialog"

            # --- Automatisierungen ------------------------------------------
            # Der Bildschirm legt an, benennt um, wechselt den Ausloeser,
            # schaltet und loescht. Geprueft wird die Wirkung am Server, nicht
            # das Vorhandensein der Knoepfe: ein Knopf, der nichts tut, hat
            # diese App schon einmal beschaeftigt.

            def workflows():
                r = urllib.request.Request(BACKEND + "/workflows/")
                r.add_header("Authorization", "Token " + TOKEN)
                d = json.loads(urllib.request.urlopen(r).read())
                return [(w["id"], w["name"], [t["type"] for t in w["triggers"]],
                         w["enabled"]) for w in d["results"]]

            def t_automatisierung_bearbeiten():
                # Die vorige Pruefung laesst ein Dokument offen; die Tableiste
                # liegt dann darunter. Neu laden bringt die App an den Anfang -
                # der Zugangsschluessel liegt im Browser und ueberlebt das.
                seite.reload(wait_until="networkidle")
                seite.wait_for_timeout(2600)
                seite.locator('text="Mehr"').last.click()
                seite.wait_for_timeout(900)
                seite.locator('text="Automatisierungen"').last.click()
                seite.wait_for_timeout(1500)
                vorher = len(workflows())
                seite.locator("svg").filter(has=seite.locator("path")).nth(1).click()
                seite.wait_for_timeout(2800)
                assert len(workflows()) == vorher + 1, "nicht angelegt"

                seite.locator('text="Neue Automatisierung"').last.click()
                seite.wait_for_timeout(1400)
                feld = seite.locator("input").first
                feld.fill("zz-Pruefung")
                feld.blur()
                seite.wait_for_timeout(2500)
                assert any(w[1] == "zz-Pruefung" for w in workflows()), "nicht umbenannt"

                seite.locator('text="Ändern"').last.click()
                seite.wait_for_timeout(1200)
                seite.locator('text="Dokument aktualisiert"').last.click()
                seite.wait_for_timeout(3000)
                mein = [w for w in workflows() if w[1] == "zz-Pruefung"][0]
                assert mein[2] == [3], f"Ausloeser nicht gewechselt: {mein[2]}"

                schalter = seite.locator('text="Aktiv"').last.locator("xpath=../..").locator("div").last
                schalter.click()
                seite.wait_for_timeout(2500)
                mein = [w for w in workflows() if w[1] == "zz-Pruefung"][0]
                assert mein[3] is True, "nicht aktiviert"
                assert seite.locator('text="Läuft automatisch"').count() > 0, \
                    "Untertitel folgt dem Zustand nicht"

                seite.locator('text="Automatisierung löschen"').last.click()
                seite.wait_for_timeout(3000)
                assert not any(w[1] == "zz-Pruefung" for w in workflows()), "nicht geloescht"
                assert seite.locator("[data-screen-label]").last.get_attribute(
                    "data-screen-label") == "Automatisierungen", \
                    "nach dem Loeschen nicht in der Liste"
                return "anlegen, umbenennen, Ausloeser, schalten, loeschen"

            def t_keine_ausnahmen():
                assert not fehlerkonsole, "; ".join(fehlerkonsole[:3])
                return "keine Konsolenfehler"

            # --- PWA ---------------------------------------------------------
            # Diese Pruefungen kommen ans Ende: die letzte kappt die Verbindung,
            # und danach sind Fehler in der Konsole richtig statt falsch.

            def t_neue_fassung_kommt_an():
                """Erreicht ein Update eine laufende App?

                Der Fall, um den es geht: eine installierte App wird nie neu
                geladen. iOS haelt die Seite tagelang am Leben, ein neuer
                Service Worker belegt nur den Cache fuer den naechsten
                Kaltstart. Behobene Fehler kamen deshalb nicht an - die App
                wusste nicht, dass es sie gibt.

                Geprueft wird mit einer echten Auslieferung: Datei aendern,
                Huellenversion hochzaehlen, in den Vordergrund kommen. Danach
                muss der neue Stand laufen, ohne dass jemand neu laedt.
                """
                app = ROOT / "app.js"
                sw = ROOT / "sw.js"
                app_alt, sw_alt = app.read_text(), sw.read_text()
                # Die Version ist seit tools/huelle.py eine Pruefsumme, kein
                # Zaehler - das Muster darf sie nicht vorwegnehmen.
                fassung = re.search(r"const VERSION = '([^']*)';", sw_alt).group(1)
                # Die Marke haengt an einer Konstante im Kopf von app.js. Steht
                # sie dort nicht mehr, weil ein Sachgebiet ausgezogen ist, waere
                # die geaenderte Datei mit der alten identisch - und die
                # Pruefung liefe stumm in ihren Zeitablauf, statt zu sagen, was
                # ihr fehlt.
                ANKER = "const SORT_API ="
                assert ANKER in app_alt, f"{ANKER} steht nicht mehr in app.js"
                try:
                    app.write_text(app_alt.replace(
                        ANKER, "globalThis.DW_STAND = 'NEU';\n" + ANKER))
                    sw.write_text(sw_alt.replace(
                        f"const VERSION = '{fassung}';",
                        f"const VERSION = '{fassung}-pruefung';"))
                    assert seite.evaluate("() => globalThis.DW_STAND || null") is None, \
                        "die laufende Seite kennt den neuen Stand schon"
                    seite.evaluate("() => window.dispatchEvent(new Event('focus'))")
                    seite.wait_for_function("() => globalThis.DW_STAND === 'NEU'", timeout=25000)
                finally:
                    app.write_text(app_alt)
                    sw.write_text(sw_alt)
                # Zurueck auf den echten Stand, sonst sitzen die folgenden
                # Pruefungen auf der Pruef-Huelle. Gewartet wird auf die
                # Tatsache, nicht auf eine Anzahl Sekunden: der Wechsel
                # zurueck geht ueber dieselbe Installation wie hin.
                seite.evaluate("() => window.dispatchEvent(new Event('focus'))")
                seite.wait_for_function(
                    "async () => (await caches.keys()).every(n => !n.includes('-pruefung'))",
                    timeout=25000)
                seite.reload(wait_until="networkidle")
                seite.wait_for_timeout(2600)
                return "Update erreicht die laufende App ohne Zutun"

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
                        const soll = ['./index.html', './app.js', './vorlage.js', './ui.js',
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
                ("Mitglieder haengen an der Oberflaeche", t_mitglieder_angesetzt),
                ("Leiste folgt dem gewaehlten Schema", t_leiste_folgt_der_wahl),
                ("Startseite zeigt Serverdaten", t_startseite_hat_daten),
                ("Dokumente werden geladen", t_dokumente_geladen),
                ("Liste kommt sortiert vom Server", t_serverseitig_geladen),
                ("Sortierwechsel laedt neu", t_sortierwechsel_laedt_neu),
                ("Filter laedt neu", t_filter_laedt_neu),
                ("Suche geht an den Server", t_suche_serverseitig),
                ("Treffer oeffnet mit Vorschau", t_treffer_oeffnet_mit_vorschau),
                ("Tastatur erreicht die Bedienung", t_tastatur_erreicht_die_bedienung),
                ("API-Adresse wird geprueft", t_api_adresse_wird_geprueft),
                ("Suchausschnitt fuehrt nichts aus", t_suchausschnitt_fuehrt_nichts_aus),
                ("Posteingang blaettern", t_posteingang_blaettern),
                ("Umschalter ist sichtbar", t_umschalter_ist_sichtbar),
                ("Ziehen laedt neu", t_ziehen_laedt_neu),
                ("Kurzes Ziehen laedt nicht", t_kurzes_ziehen_laedt_nicht),
                ("Scrollen bleibt Scrollen", t_scrollen_bleibt_scrollen),
                ("Ordneransicht im Reiter", t_ordneransicht_im_reiter),
                ("Listen zeigen echte Vorschau", t_listen_zeigen_echte_vorschau),
                ("Textgroesse ist eine Anzeige", t_textgroesse_ist_anzeige),
                ("Datenschutz hat Inhalt", t_datenschutz_hat_inhalt),
                ("Hilfe oeffnet den Quelltext", t_hilfe_oeffnet_wirklich),
                ("Mailabruf stoesst wirklich an", t_mailabruf_stoesst_wirklich_an),
                ("Alle Wege zum Hochladen oeffnen", t_alle_drei_wege_oeffnen),
                ("Die Wege sind verschieden", t_die_wege_sind_verschieden),
                ("Gewaehlte Datei kommt an", t_datei_kommt_beim_server_an),
                ("Mehrseitig scannen", t_scannen_mehrseitig),
                ("Bildmodus wirkt auf den Scan", t_scan_modus_wirkt),
                ("Kontrast/Helligkeit wirken", t_scan_regler_wirken),
                ("Randerkennung schlaegt Zuschnitt vor", t_rand_erkennung_schlaegt_vor),
                ("Zuschnitt wirkt auf das Bild", t_zuschnitt_wirkt),
                ("Zuschnittgriffe sind per Tastatur bewegbar", t_zuschnitt_griffe_tastatur),
                ("Scan wird ein mehrseitiges PDF", t_scan_wird_ein_pdf),
                ("Kamera erlaubt zeigt Live-Vorschau", t_kamera_erfolg_zeigt_vorschau),
                ("Kamera verweigert faellt zurueck", t_kamera_verweigert_faellt_zurueck),
                ("Kamera fehlt geht direkt zum Dateidialog", t_kamera_fehlt_direkt_dateidialog),
                ("Automatisierung bearbeiten", t_automatisierung_bearbeiten),
                ("Keine Fehler in der Konsole", t_keine_ausnahmen),
                ("Neue Fassung kommt von selbst an", t_neue_fassung_kommt_an),
                ("Service Worker steuert die Seite", t_worker_uebernimmt),
                ("Huelle liegt im Cache", t_huelle_liegt_im_cache),
                ("Keine Serverdaten im Cache", t_keine_dokumente_im_cache),
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
