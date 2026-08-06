# Release-Dokumentation (Meilenstein D)

Stand: 06.08.2026 · aktuelle Fassung: **0.9.3** (`VERSION`)

Diese Datei beschreibt, wie aus dem Arbeitsstand eine veröffentlichte Fassung wird — Schritt
für Schritt, ohne Vorwissen über eine bestimmte Arbeitssitzung. Wer diese Liste von oben nach
unten abarbeitet, macht ein Release richtig.

**Zuerst das Wichtigste, weil es alles andere prägt:**

> Es gibt **keinen Build-Schritt und keinen Kopiervorgang**. Caddy liefert die Dateien direkt
> aus `/opt/paperless-app/` unter <https://services.frigew.ski/paperless-app/> aus. Eine
> gespeicherte Datei ist damit **sofort öffentlich** — auch uncommittet, auch halbfertig.
> „Deployen" heißt hier: nichts tun. Die eigentliche Arbeit eines Release ist deshalb
> **Prüfen vor dem Speichern**, nicht Ausliefern danach.
> (Dokumentiert in `/opt/paperless/README.md`, Abschnitt „Begleit-App".)

---

## 1 · Versionsschema

Semantische Versionierung, Ursprung ist die Datei **`VERSION`** im Wurzelverzeichnis (eine
Zeile, z. B. `0.9.3`). Sie wird von Hand gepflegt und ist die einzige Stelle, an der die
Produktversion steht.

| Stelle | Wann sie steigt | Beispiele aus der Historie |
|---|---|---|
| **MAJOR** | Bruch für Nutzer oder für die Server-Anbindung | bisher nie — die App ist vor 1.0 |
| **MINOR** | neue, **sichtbare** Fähigkeit; kein Bruch | `0.8.11 → 0.9.0` (Auto-Auslöser wurde inhaltsbezogen statt Zeitschaltung); `0.7.0 → 0.8.0` (neue Leistungs-Prüfstufe) |
| **PATCH** | Fehlerbehebung, Barrierefreiheit, Tests, Doku — kein neues Nutzerverhalten | `0.9.0 → 0.9.1` (Fokus-Trap), `0.9.2 → 0.9.3` (optionales TOTP-Feld beim Anmelden) |

Zwei Regeln, die sich in diesem Projekt bewährt haben:

- **Wer sich fragt, ob MINOR oder PATCH, nimmt PATCH** — außer der Nutzer merkt die Änderung
  ohne Hinweis. „Ein Test mehr" ist PATCH, „der Knopf tut jetzt etwas anderes" ist MINOR.
- **Die Begründung wandert mit.** Jeder Roadmap-Eintrag endet mit einer Zeile
  `Version: 0.9.2 -> 0.9.3 (PATCH: …)`. Ohne Begründung ist die Zahl nur eine Zahl.

**Vor 1.0.0** ist die App ausdrücklich noch nicht als produktionsreif erklärt
(Selbstauskunft 56 %, siehe `docs/ROADMAP.md`). `1.0.0` ist kein Termin, sondern ein Zustand:
Geräteverifikation bestanden (`docs/GERAETE-CHECKLISTE.md`), Barrierefreiheits-Restschuld
geschlossen, Release-Weg einmal vollständig durchlaufen.

**Bekannte Lücke:** Die App zeigt ihre Version **nirgends in der Oberfläche** an. Auf dem
Telefon lässt sich damit nicht feststellen, welche Fassung läuft — für Fehlerberichte ist das
lästig. Wer das schließt: die Zahl aus `VERSION` müsste in `index.html`/`vorlage/tabs.js`
sichtbar werden. Bis dahin hilft nur der Hüllen-Hash (siehe 2.2) als Fingerabdruck.

---

## 2 · Was ein Release umfasst

### 2.1 Die Dateien

Alles, was ausgeliefert wird, ist statisch und liegt im Repository:

- `index.html` (lädt in **fester Reihenfolge**: React → htm → `ui.js` → `logik.js` → `api.js`
  → `vorlage/*` → `vorlage.js` → `app.js`)
- die Module neben `app.js`: `logik.js`, `api.js`, `scan.js`, `erfassen.js`, `sperre.js`,
  `suche.js`, `vorschau.js`, `betrieb.js`, `ordnung.js`, `mitglieder.js`, `stile.js`,
  `start.js`, `ui.js`, `vorlage.js`
- die Bildschirme unter `vorlage/`
- `basis.css`, `manifest.webmanifest`, `sw.js`, `icons/`, `favicon*`, `assets/`
- `vendor/` — React, htm und die Schriften liegen **lokal**; die App lädt von keinem fremden
  Server. Das ist Voraussetzung für den Offline-Betrieb und darf bei einem Release nicht
  aufgeweicht werden.

**Nicht Teil eines Release** (und per `.gitignore` draußen): `tests/.token`, `.venv-test/`,
`__pycache__/`, `tests/shots-*/`, `native/node_modules/`, `native/web/`. Die Prüfskripte unter
`tests/` und `tools/` sind versioniert, gehören aber nicht zur ausgelieferten Oberfläche.

### 2.2 Service Worker, Hüllenversion und Cache-Busting

Das ist der empfindlichste Teil eines Release. In `sw.js` stehen drei zusammenhängende Dinge:

```js
const VERSION = '91fb2ebabddb';              // Prüfsumme über den Inhalt der Hülle
const CACHE   = 'docuwunder-huelle-' + VERSION;
const HUELLE  = [ './', './index.html', './app.js', … ];   // was vorgehalten wird
```

- **`HUELLE`** ist die Liste der vorgehaltenen Dateien. Eine **neue** Quelldatei muss hier
  eingetragen werden — sonst fehlt sie offline. (Ebenso in `index.html` **vor** `app.js` und
  in `tests/syntax_check.py`.)
- **`VERSION`** in `sw.js` ist **nicht** die Produktversion, sondern ein SHA-256-Ausschnitt
  über genau die Dateien aus `HUELLE` (plus `sw.js` selbst ohne diese Zeile). Gesetzt wird sie
  von **`python3 tools/huelle.py`**, niemals von Hand.
- **`CACHE`** enthält diese Prüfsumme im Namen. Ändert sich eine Hüllendatei, ändert sich der
  Name, `activate` löscht alle älteren `docuwunder-huelle-*` (und die historischen
  `ablage-huelle-*`) — **das ist das Cache-Busting.** Bleibt die Prüfsumme stehen, behält die
  installierte App ihren alten Stand und behobene Fehler erreichen niemanden. Genau das ist
  hier schon einmal passiert (`docs/AUDIT.md`, H-5); seitdem gibt es die Prüfsumme und die
  Teststufe `tests/huelle_check.py`, die sie erzwingt.
- Zwei Strategien im Worker, gut zu wissen für die Abnahme: `vendor/` und `icons/` kommen
  **zuerst aus dem Cache** (Auffrischung nebenher), alles andere **zuerst aus dem Netz** mit
  3-Sekunden-Frist und Rückfall auf den Cache. Unter `/paperless/` fasst der Worker **nichts**
  an — Dokumente landen nie in einem Cache.
- `sw.js` selbst wird von Caddy mit `no-store` ausgeliefert (dokumentiert in `CLAUDE.md`).
  Ohne das ließe sich eine kaputte Worker-Fassung nicht mehr ersetzen.

### 2.3 Die drei Zahlen, die ein Release verändert

| Was | Datei | Wer setzt sie |
|---|---|---|
| Produktversion | `VERSION` | Mensch, mit Begründung |
| Hüllenversion / Cache-Name | `sw.js` (`const VERSION`) | `tools/huelle.py` |
| Beleg + Begründung | `docs/ROADMAP.md`, `docs/AUDIT.md` | Mensch |

Die beiden Zahlen sind **unabhängig**: ein reiner Doku-Batch erhöht `VERSION`, aber nicht die
Hüllenversion (Doku ist nicht Teil der Hülle). Eine Änderung an `app.js` ändert die
Hüllenversion, auch wenn die Produktversion gleich bliebe — das darf sie aber nicht, siehe
Schritt 3.3.

---

## 3 · Release-Ablauf, Schritt für Schritt

Arbeitsverzeichnis für alles Folgende: `/opt/paperless-app`.

### 3.0 Vorbedingungen prüfen

```bash
cd /opt/paperless-app
git status --short          # muss überschaubar sein: nur die eigenen Änderungen
git log --oneline -3
cat VERSION
```

- Liegt **fremde, uncommittete Arbeit** im Baum (mehrere Sitzungen arbeiten hier), erst klären
  — nicht mit-committen. Diese Dateien sind live ausgeliefert, also ist ein `git checkout` auf
  sie ein Eingriff in den laufenden Betrieb.
- Der Zugangsschlüssel für die serverseitigen Teststufen muss verfügbar sein: entweder
  `PAPERLESS_TOKEN=…` in der Umgebung oder `tests/.token`. Der Schlüssel gehört **nie** in
  einen Commit (`tests/geheim_check.py` prüft das).

### 3.1 Vollständigen Testlauf machen

```bash
python3 tests/run_e2e.py
```

Elf Stufen, von schnell nach langsam. Reihenfolge und Zweck:

| # | Stufe | Was sie sichert |
|---:|---|---|
| 1 | `syntax_check` | Syntax aller JS-Dateien (bricht sie, wird der Rest übersprungen) |
| 2 | `logik_check` | 60 Unit-Tests der reinen Logik, ohne Browser (`node --test`) |
| 3 | `template_check` | jeder von einem Bildschirm gelesene Wert kommt aus `renderVals()` |
| 4 | `a11y_check` | Baseline klickbarer `div`/`span`, `type="button"`-Regel |
| 5 | `aufrufe_check` | jedes `this.name()` trifft eine Methode, die es gibt |
| 6 | `huelle_check` | **Hüllenversion passt zum Inhalt** (das Cache-Gate) |
| 7 | `geheim_check` | keine Token/Zugangsdaten in versionierten Dateien |
| 8 | `pwa_check` | Manifest, Worker und Einstiegspunkt passen zusammen |
| 9 | `perf_check` | Leistung der Dokumentliste bis 50.000 Dokumente (Mock-API) |
| 10 | `api_check` | die Zusagen der Paperless-API, auf die die App baut (braucht Server) |
| 11 | `browser_check` | die App im echten Browser gegen den echten Server (47 Prüfungen) |

Nur ohne Server: `python3 tests/run_e2e.py --statisch` (Stufen 1–9). Das ist für einen Release
**nicht** ausreichend — 10 und 11 sind die einzigen Stufen, die die echte Anbindung prüfen.

Schlägt `huelle_check` fehl, ist das kein Fehler, sondern die Erinnerung an Schritt 3.2.

### 3.2 Hüllenversion neu setzen

```bash
python3 tools/huelle.py        # setzt const VERSION in sw.js aus dem Inhalt
```

Nur nötig, wenn eine Datei aus `HUELLE` geändert wurde — also bei fast jeder Codeänderung.
Danach **Schritt 3.1 wiederholen** (mindestens `--statisch`), denn `sw.js` ist selbst Teil der
Prüfsumme.

Wurde eine **neue** Quelldatei angelegt, vorher:

1. Eintrag in `sw.js` → `HUELLE`
2. `<script>`-Zeile in `index.html` **vor** `app.js`
3. Eintrag in `tests/syntax_check.py`

### 3.3 Version hochziehen

```bash
echo "0.9.4" > VERSION      # Stelle nach den Regeln aus Abschnitt 1 wählen
```

Jedes Release erhöht `VERSION` — auch ein reiner Fehlerbehebungs-Batch. Zwei verschiedene
Auslieferungen mit derselben Nummer machen jede spätere Fehlersuche unmöglich.

### 3.4 Changelog-Eintrag schreiben

Es gibt **keine `CHANGELOG.md`** — die Historie steht in zwei Dateien und wird dort **am Ende
angehängt**, nie umgeschrieben:

- **`docs/ROADMAP.md`** — ein Abschnitt `## <Thema> (<Datum>)` mit dem, was sich für Nutzer
  ändert, was bewusst **nicht** umgesetzt wurde, dem Testnachweis (Stufenzahl, Prüfungszahlen)
  und als letzter Zeile `Version: 0.9.3 -> 0.9.4 (PATCH: …)`.
- **`docs/AUDIT.md`** — die technischen Details, Messwerte und Befunde, auf die der
  Roadmap-Eintrag verweist.
- Bei einer Architekturentscheidung zusätzlich ein Nachtrag in der zuständigen ADR unter
  `docs/adr/`.

Was in einen guten Eintrag gehört (so wird es hier gemacht): **was geändert wurde**, **was
bewusst offen bleibt**, **wie es geprüft wurde**, **was nicht verifiziert ist**. Der letzte
Punkt ist der wichtigste — unbelegte Behauptungen sind in diesem Projekt ausdrücklich als
Fehler behandelt worden (`docs/ROADMAP.md`, „Was gelogen war").

### 3.5 Commit und Tag

```bash
git add -A
git commit -m "<Thema>: <was sich ändert> (0.9.3 -> 0.9.4)"
git tag -a v0.9.4 -m "DocuWunder 0.9.4"
```

- Commit-Titel nennt das Thema **und** den Versionssprung — so ist die Historie ohne
  `git show` lesbar.
- **Vor dem ersten Tag prüfen, ob die Namensform stimmt:** `git tag --list`. Existieren noch
  keine Tags, gilt ab jetzt `v<VERSION>`.

### 3.6 Auf GitHub pushen — **AKTUELL BLOCKIERT**

> **Blockiert.** Der Push braucht Damiens Eintrag des Deploy-Keys mit Schreibrecht im
> GitHub-Repository (offene Frage 3 in `/opt/paperless/PO-STATUS.md`). Der Schlüssel liegt
> seit 05.08.2026 21:31 auf dem Host (`/home/ubuntu/.ssh/paperless-app-deploy`, ed25519 ohne
> Passphrase, nur für dieses Repo), das Remote ist auf SSH umgestellt, `known_hosts` ist
> gefüllt. `ssh -T` antwortet erwartungsgemäß mit „Permission denied", bis der öffentliche
> Teil eingetragen ist. Commit `22f7c68` (v0.9.2) und alles danach warten.

Sobald freigegeben:

```bash
git -C /opt/paperless-app remote -v      # zeigt das konfigurierte SSH-Remote
git push origin main
git push origin v0.9.4
```

Danach laufen die GitHub-Actions (`.github/workflows/pruefung.yml`): erst die statischen
Stufen, dann — nur wenn die grün sind — API- und Browserprüfung gegen eine Wegwerf-Instanz von
paperless-ngx. Achtung: die CI startet **`paperless-ngx:2.18.4`**, die Produktion läuft auf
**3.0.5**. Grüne CI ist deshalb kein vollständiger Ersatz für Schritt 3.1 gegen den echten
Server.

Der Push ist **nicht** die Auslieferung. Er ist die Sicherung und die zweite Meinung.

### 3.7 Deployen

Nichts zu tun — die Dateien liegen bereits am ausgelieferten Ort (siehe Kasten oben).
Was stattdessen **kontrolliert** werden muss, steht in Abschnitt 4.

Die Fassung erreicht die installierten Geräte so:

1. Beim nächsten Start holt der Browser `sw.js` (per `no-store` immer frisch).
2. Der Worker sieht eine neue `VERSION`, installiert die Hülle neu (`cache: 'reload'`, umgeht
   den HTTP-Cache) und ruft `skipWaiting()` — er übernimmt also **ohne** Warten auf
   geschlossene Fenster.
3. `activate` löscht die alten Cache-Einträge.
4. **Ein bereits offenes Fenster behält seinen alten Stand**, bis es neu geladen wird. Für
   einen Test also: App vollständig schließen (aus dem App-Umschalter wischen) und neu
   starten — sonst prüft man die vorige Fassung.

---

## 4 · Abnahmekriterien vor einem Release

Alle Punkte müssen erfüllt sein. Ein „fast" ist ein Nein.

- [ ] `python3 tests/run_e2e.py` **vollständig grün** (11 Stufen, inkl. `api_check` und
      `browser_check` gegen den echten Server) — Ausgabe aufbewahren, sie ist der Nachweis
- [ ] `python3 tools/huelle.py --pruefen` endet mit 0 (Hüllenversion passt zum Inhalt)
- [ ] `VERSION` erhöht, Sprung nach den Regeln aus Abschnitt 1 begründet
- [ ] Eintrag in `docs/ROADMAP.md` (und `docs/AUDIT.md`) vorhanden, mit Testnachweis **und**
      dem, was ausdrücklich nicht verifiziert ist
- [ ] neue Quelldateien in `HUELLE`, `index.html` und `tests/syntax_check.py` eingetragen
- [ ] kein Geheimnis im Commit (`tests/geheim_check.py` grün; `tests/.token` und `.env` sind
      nicht versioniert)
- [ ] `git status` zeigt nach dem Commit einen sauberen Baum — keine fremde Arbeit
      mitgenommen, keine gemeint-aber-vergessene Datei
- [ ] **Handprobe im Browser** gegen die ausgelieferte Adresse
      <https://services.frigew.ski/paperless-app/>: App vollständig geschlossen und neu
      gestartet, Anmeldung funktioniert, eine Dokumentliste lädt, ein Dokument öffnet sich,
      **keine** Fehler in der Browser-Konsole
- [ ] Betrifft das Release den Scanner oder die Erfassung: `docs/GERAETE-CHECKLISTE.md`
      wenigstens in den Abschnitten A, C, D und G auf einem echten Telefon durchgegangen
- [ ] Betrifft das Release die Anmeldung: zusätzlich mit **aktivem** Zwei-Faktor-Code geprüft
      (der Server erzwingt den Code auch für `POST /api/token/`)

Für den Push kommt hinzu (sobald 3.6 frei ist): GitHub-Actions-Lauf grün, Tag gesetzt und
mitgepusht.

---

## 5 · Rollback

Zu unterscheiden sind zwei Fälle.

### 5.1 Die Oberfläche ist kaputt (Normalfall)

Auf den letzten guten Stand zurückgehen. Der Bestand im Archiv ist davon **nicht** betroffen —
die App speichert keine Dokumente, sie zeigt nur, was der Server hat.

```bash
cd /opt/paperless-app
git log --oneline -10                 # letzten guten Stand bestimmen
git revert <commit>                   # bevorzugt: die Änderung rückwärts als neuer Commit
# oder, wenn der kaputte Stand noch nicht gepusht wurde:
git reset --hard <letzter-guter-commit>
```

Danach **zwingend**:

```bash
python3 tools/huelle.py               # Hüllenversion an den zurückgenommenen Inhalt anpassen
python3 tests/run_e2e.py --statisch
echo "<vorherige oder erhöhte Nummer>" > VERSION
```

Warum die Hüllenversion so wichtig ist: ohne neue Prüfsumme behalten alle installierten Apps
die **kaputte** Hülle im Cache. Der Rollback wäre auf dem Server richtig und auf den Geräten
unsichtbar. Ein Rollback ohne `tools/huelle.py` ist kein Rollback.

Zur Nummer in `VERSION`: sauberer als das Zurückstellen ist ein **Hochzählen** (0.9.4 kaputt →
0.9.5 mit dem Inhalt von 0.9.3), weil dann keine zwei verschiedenen Auslieferungen dieselbe
Nummer tragen. Roadmap-Eintrag dazu schreiben, mit dem Grund der Rücknahme.

### 5.2 Der Service Worker selbst ist kaputt

Der unangenehmere Fall: eine Worker-Fassung, die falsche Antworten ausliefert, kann sich
theoretisch selbst am Leben halten. Deshalb liefert Caddy `sw.js` mit `no-store` aus — der
Browser holt ihn bei jedem Start frisch, und eine korrigierte Fassung greift beim nächsten
Start. Reicht das nicht, hilft geräteseitig:

- App vollständig schließen und neu starten (holt `sw.js` neu),
- im Browser: Website-Daten für die Adresse löschen (deregistriert den Worker),
- als letzte Stufe: PWA deinstallieren und neu installieren.

Ein Notausgang für alle Geräte auf einmal existiert nicht — das ist der Grund, warum eine
Änderung an `sw.js` besonders vorsichtig behandelt wird.

### 5.3 Der Server, nicht die App

Sieht es nach einem Problem von paperless-ngx aus (Anmeldung geht nirgends, API antwortet mit
5xx), gehört das **nicht** hierher: Rollback-Weg des Backends steht in
`/opt/paperless/ops/UPDATE-RUNBOOK.md`, Abschnitt 6.

---

## 6 · Bekannte Stolperfallen

**1 · Der Arbeitsbaum ist die Auslieferung.** Wer eine Datei speichert, veröffentlicht sie.
Es gibt keine Vorschau-Stufe zwischen Editor und Publikum. Größere Umbauten deshalb nicht
„mal kurz" in `/opt/paperless-app` machen — dafür gibt es einen Klon außerhalb (z. B. unter
`/tmp`, siehe `PO-STATUS.md` 06.08. 00:40, Worktree `/tmp/dw-clean` für einen A/B-Vergleich).

**2 · Hüllenversion vergessen.** Der klassische Fehler dieses Projekts (`AUDIT.md` H-5): der
Code ist neu, der Cache ist alt, niemand merkt es, weil beim Entwickeln der Cache umgangen
wird. `tests/huelle_check.py` fängt das ab — **wenn** man die Tests laufen lässt.

**3 · Neue Datei nur in `index.html`.** Dann läuft die App online und bricht offline, weil die
Datei nicht in `HUELLE` steht. Immer alle drei Stellen (3.2).

**4 · Der Subpath `/paperless`.** Der Server läuft **nicht** auf eigener Domain, sondern unter
<https://services.frigew.ski/paperless>, die App unter `/paperless-app/`. Daraus folgt:

- Alle Pfade im Frontend bleiben **relativ** (`./app.js`, `./icons/…`) — der Worker rechnet
  seinen Geltungsbereich aus `self.registration.scope` aus. Ein absoluter Pfad `/app.js`
  bricht sofort.
- Der Worker fasst **nur** `.../paperless-app/` an und lässt `/paperless/` in Ruhe. Wer diese
  Grenze aufweicht, cached Dokumente — genau das, was nicht passieren darf.
- Die API-Adresse zeigt auf `/paperless/api` — nicht auf `/api`. Beim Onboarding wird die
  Serveradresse **mit** dem Subpath eingegeben.
- Auf der Serverseite hängen `PAPERLESS_FORCE_SCRIPT_NAME`, `PAPERLESS_STATIC_URL`,
  `PAPERLESS_CSRF_TRUSTED_ORIGINS` und die Proxy-Variablen daran (siehe
  `/opt/paperless/BETRIEBSHANDBUCH.md`). Sie sind **nicht** Sache dieses Repos, erklären aber
  die meisten „geht plötzlich nicht"-Fälle nach einem Backend-Update.

**5 · Ein offenes Fenster zeigt die alte Fassung.** Nach dem Release erst prüfen, wenn die App
wirklich neu gestartet wurde. Sonst hält man die vorige Fassung für die neue.

**6 · CI-Version ≠ Produktionsversion.** GitHub prüft gegen `paperless-ngx:2.18.4`, produktiv
läuft `3.0.5`. Was nur eine der beiden Fassungen betrifft (API-Umbenennungen, MFA-Verhalten),
kann grün in der CI und rot in Produktion sein — deshalb ist der lokale Lauf gegen den echten
Server Teil der Abnahme.

**7 · Der Zugangsschlüssel überlebt vieles.** Ein bereits ausgestellter API-Token bleibt auch
nach Aktivierung von Zwei-Faktor gültig. Ein Anmeldeproblem zeigt sich deshalb oft **nur** bei
frischer Anmeldung, nicht bei einem Gerät, das schon eingerichtet ist. Wer die Anmeldung
prüfen will, muss sich vorher abmelden.

**8 · `docs/` und `native/` sind nicht Teil der Hülle.** Änderungen dort erhöhen `VERSION`
(wenn sie ein Release wert sind), aber nicht den Cache-Namen. Kein Grund zur Sorge — nur
nicht wundern, wenn `tools/huelle.py` „passt bereits" meldet.

---

## 7 · Kurzfassung zum Abarbeiten

```bash
cd /opt/paperless-app
git status --short                       # 3.0  sauberer Ausgangspunkt?
python3 tests/run_e2e.py                 # 3.1  alle 11 Stufen grün
python3 tools/huelle.py                  # 3.2  Hüllenversion setzen
python3 tests/run_e2e.py --statisch      # 3.2  nach der Änderung an sw.js nochmal
echo "0.9.4" > VERSION                   # 3.3  Version hochziehen
# 3.4  Eintrag in docs/ROADMAP.md (+ docs/AUDIT.md) schreiben
git add -A && git commit -m "Thema: … (0.9.3 -> 0.9.4)"
git tag -a v0.9.4 -m "DocuWunder 0.9.4"
# 3.6  git push  — BLOCKIERT bis der Deploy-Key eingetragen ist
# 3.7  Deploy: nichts zu tun. App auf dem Gerät VOLLSTÄNDIG neu starten und prüfen.
```
