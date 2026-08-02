# DocuWunder — Production Readiness Audit v1.0

Stand: 2. August 2026 · Codestand `67e4aec` + Onboarding-A11y-Batch · Paperless-ngx 3.0.4

---

## Zur Methode

Alles hier ist **gemessen**, nicht geschätzt. Wo eine Zahl steht, steht daneben, wie sie
zustande kam. Wo ich etwas nicht prüfen konnte, steht das ausdrücklich (Abschnitt „Nicht
geprüft"). Zwei Befunde habe ich während des Audits sofort behoben, weil sie klein und
kritisch waren — beide mit Gegenprobe, dass die Prüfung den Fehler wirklich fängt.

---

## 1. Gesamtergebnis

### Produktionsreife: **55 %**

| Bereich | Reife | Begründung |
|---|---:|---|
| Funktionsumfang | 90 % | Vollständig verdrahtet, keine Attrappen mehr |
| Testabdeckung | 80 % | 7 Stufen, 53 Unit-, 24 API-, 35 Browserprüfungen; Lücken bei Fehlerpfaden |
| Architektur | 65 % | 13 Module extrahiert, `app.js` noch 2.145 Zeilen und zentral |
| Sicherheit | 55 % | Ein XSS gefunden und behoben; keine CSP, API-Adresse ungeprüft |
| Performance | 45 % | Harte Decke bei ~2.000 Dokumenten in einer Liste (gemessen) |
| PWA | 75 % | Offline und Selbstaktualisierung belegt; Cache-Version von Hand |
| **Barrierefreiheit** | **14 %** | Erste semantische Migration: Onboarding und Sperrdialog nutzen 11 native Buttons; A11y-Leitplanke prueft Rueckschritte, 179 klickbare `<div>/<span>` verbleiben |
| Dokumentation | 30 % | README + Roadmap; 7 von 9 geforderten Dokumenten fehlen |
| CI/Release | 0 % | Kein `.github/`, keine `package.json`, keine Versionierung |
| Store-Reife | 15 % | Siehe K-1 — als PWA **nicht** App-Store-fähig |

Der niedrige Gesamtwert kommt nicht von schlechter Substanz. Das Produkt ist funktional
weit; es fehlen die Dinge, die aus einem funktionierenden Programm ein **auslieferbares
Produkt** machen: Barrierefreiheit, Belastbarkeit im Großen, Automatisierung, Papiere.

---

## 2. Befunde nach Priorität

### KRITISCH

---

#### K-1 · App Store ist mit dieser Architektur nicht erreichbar

**Problem.** DocuWunder ist eine reine PWA. Apple nimmt keine PWAs in den App Store auf;
verlangt wird ein natives Paket. Google Play nimmt PWAs nur als *Trusted Web Activity* —
ein Android-Projekt, das die Seite einbettet.

**Risiko.** Die Mission nennt beide Stores als Ziel. Ohne diese Entscheidung ist jede
weitere Store-Arbeit (Screenshots, Beschreibungen) verfrüht.

**Lösung.** Eine Grundsatzentscheidung, drei gangbare Wege:

| Weg | Aufwand | Folgen |
|---|---|---|
| **Capacitor**-Hülle (iOS + Android) | 3–5 Tage | Ein Repo, native Kamera/Biometrie möglich, zwei Store-Konten nötig (99 $/Jahr Apple, 25 $ einmalig Google) |
| **TWA** nur für Play, iOS bleibt PWA | 1–2 Tage | Billig, aber iOS-Nutzer installieren weiter über Safari |
| Nur PWA, kein Store | 0 | Ehrlich, aber die Mission verfehlt |

**Komplexität.** Hoch (Capacitor), mittel (TWA).
**Dateien.** Neues Verzeichnis `native/`, `manifest.webmanifest`, CI.
**Teststrategie.** Installationsprüfung je Plattform; die bestehende Browsersuite läuft
unverändert gegen den eingebetteten Inhalt.

> **Das ist die erste Entscheidung, die getroffen werden muss.** Alles in Phase 10 hängt daran.

---

#### K-2 · Barrierefreiheit ist praktisch nicht vorhanden

**Problem.** Gemessen im Vorlagenbaum:

```
onClick auf <div>/<span> : 190
echte <button>           :   0
role="…"                 :   0
aria-*                   :   0
tabindex                 :   0
<input> mit Label        :   0 von 14
prefers-reduced-motion   : nirgends
Tastaturbedienung        : nur Escape
```

Die Oberfläche ist damit **weder mit der Tastatur bedienbar noch für Screenreader
verständlich**. Ein Screenreader liest 190 unbeschriftete Gruppierungen.

**Risiko.** Drei Ebenen:
1. Nutzer mit Einschränkungen sind ausgeschlossen.
2. Apple und Google prüfen Barrierefreiheit bei der Abnahme; in der EU greift ab Juni 2025
   der European Accessibility Act für Verbraucherprodukte.
3. Auch ohne Einschränkung: kein Tab, kein Enter, keine Bedienung per Tastatur am Desktop —
   und die App ist ausdrücklich auch für den Desktop gedacht.

**Lösung.** In drei Schritten, ohne Rendering-Umbau:
1. `stile.js` um semantische Bausteine erweitern; klickbare `<div>` werden `<button>` mit
   `type="button"` und zurückgesetztem Rahmen. Das gibt Fokus, Enter/Space und Rolle geschenkt.
2. Alle Eingabefelder mit `aria-label` versehen (sichtbare Labels gibt es meist schon als
   Überschrift daneben).
3. Fokusführung beim Öffnen von Sheets und aufgeschobenen Bildschirmen; `prefers-reduced-motion`
   in `index.html` respektieren.

**Komplexität.** Hoch (Fleißarbeit über 190 Stellen, mechanisch automatisierbar).
**Dateien.** `vorlage/*.js`, `stile.js`, `index.html`, `ui.js`.
**Teststrategie.** Neue Stufe `tests/a11y_check.py`: Tastaturdurchlauf über alle Bildschirme
(Tab bis zum Ende, kein Element ohne erreichbaren Namen), plus statische Prüfung „kein
`onClick` an einem nicht-fokussierbaren Element".

**Fortschritt 2026-08-02.** Onboarding ist als erster abgeschlossener Bereich migriert: alle 9 klickbaren `div`/`span` wurden native `button type="button"`, relevante Eingaben haben `aria-label`, die A11y-Stufe ist im vollständigen Runner aktiv und verhindert steigende nicht-semantische Klickziele. Offen: 179 klickbare `div`/`span` in Dokument-, Erfassungs-, Ordnungs-, Sheet-, Tab- und Verwaltungsbereich; automatisierte Checks ersetzen keine spätere manuelle Screenreader-/Geräteprüfung.

---

#### K-3 · Die Liste bricht bei großen Beständen ein — gemessen

**Problem.** Synthetisch gemessen, Zustand direkt gefüllt, ohne Server:

| Dokumente | Rendern | DOM-Knoten | Scroll-Operation |
|---:|---:|---:|---:|
| 100 | 69 ms | 3.017 | 48 ms |
| 1.000 | 747 ms | 29.117 | 650 ms |
| 5.000 | 2.363 ms | 145.117 | 3.240 ms |
| 20.000 | 9.797 ms | 580.117 | 12.318 ms |
| 50.000 | 20.095 ms | 1.450.117 | 26.856 ms |

Rund **29 DOM-Knoten je Dokument**, streng linear. Ab etwa 2.000 Dokumenten in *einer* Liste
ist die Oberfläche nicht mehr flüssig, ab 20.000 unbenutzbar.

**Einordnung.** In der Praxis wird das über Paginierung gedämpft: `DOC_PAGE = 60`, mehr nur
auf Knopfdruck. Man müsste 333-mal „Weitere laden" drücken, um 20.000 zu erreichen. Die
Decke ist trotzdem real und es gibt **keine Obergrenze** — wer lange genug nachlädt, bringt
die App zum Stehen.

> **Korrektur einer früheren Aussage.** In der Roadmap steht unter 3.3, Virtualisierung sei
> „nicht nötig". Diese Messung reichte nur bis 11.000 Knoten. Bei 1,45 Millionen gilt das
> nicht mehr. Die alte Aussage war für den gemessenen Bereich richtig und darüber hinaus falsch.

**Lösung.** Zwei Stufen:
1. **Sofort, klein:** Obergrenze für nachgeladene Seiten (z. B. 20 Seiten = 1.200 Dokumente),
   danach der ehrliche Hinweis „Grenze die Suche ein". Ein Nachmittag Arbeit.
2. **Richtig:** Fensterung der Liste — nur der sichtbare Bereich plus Puffer im DOM. Ohne
   Fremdbibliothek machbar, weil die Zeilenhöhe fest ist.

**Komplexität.** Niedrig (1), mittel (2).
**Dateien.** `app.js` (`mehrDocs`), `vorlage/tabs.js`.
**Teststrategie.** Die obige Messung als Prüfung mit Schwellwerten: 5.000 Dokumente müssen
unter 400 ms rendern und unter 20.000 Knoten erzeugen.

---

#### K-4 · Keine Content-Security-Policy, Inline-Code blockiert sie

**Problem.** Es gibt keine CSP. Der Einstiegspunkt enthält **80 Zeilen Inline-JavaScript**
und 20 Zeilen Inline-CSS; eine strikte Policy ohne `unsafe-inline` scheitert daran sofort.

**Risiko.** Eine CSP ist die zweite Verteidigungslinie hinter Eingabebehandlung. Wie nötig
die ist, zeigt H-1 unten: dort *gab* es einen Weg, Code auszuführen.

**Lösung.**
1. Inline-Skript aus `index.html` nach `start.js` auslagern (rein mechanisch).
2. Inline-CSS nach `basis.css`.
3. Policy in Caddy setzen:
   `default-src 'self'; img-src 'self' blob: data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`
4. Prüfen, dass `style="…"`-Attribute weiterhin erlaubt sind — die Oberfläche baut darauf
   auf (`stil()`), und Attribut-Stile fallen unter `style-src-attr`, nicht unter `script-src`.

**Komplexität.** Niedrig.
**Dateien.** `index.html`, neu `start.js`/`basis.css`, `sw.js` (Hülle), `/etc/caddy/Caddyfile`.
**Teststrategie.** `pwa_check` um „keine Inline-Skripte" erweitern; Browserprüfung mit
gesetzter CSP, die auf CSP-Verstöße in der Konsole scheitert.

---

### HOCH

---

#### H-1 · ✅ BEHOBEN — XSS über den Suchausschnitt

**Problem.** `nurText()` in `suche.js` entfernte Auszeichnungen so:

```js
const el = document.createElement('div');
el.innerHTML = String(t || '');
return el.textContent;
```

Ein **losgelöstes** Element ist nicht inert. Nachgemessen in Chromium:

| Nutzlast | ausgeführt |
|---|---|
| `<img src=x onerror=…>` | **ja** |
| `<video src=x onerror=…>` | **ja** |
| `<svg onload=…>` | nein |
| `<script>` | nein |

Der Text kommt aus dem **Dokumentinhalt** — also aus der Texterkennung. Wer ein Dokument ins
Archiv bekommt (E-Mail-Import, `consume/`-Ordner, als Mitglied), bestimmt diesen String. Beim
Erscheinen in den Suchtreffern lief der Code im Kontext der App — mit Zugriff auf den
Zugangsschlüssel im `localStorage`.

**Lösung (umgesetzt).** `DOMParser.parseFromString(t, 'text/html')`. Nachgemessen inert,
gleicher Textausgang.

**Test (umgesetzt).** Browserprüfung mit vier Nutzlasten. Gegenprobe gemacht: mit der alten
Fassung schlägt sie fehl.

---

#### H-2 · Die API-Adresse wird nicht geprüft

**Problem.** `setBase()` nimmt jede Zeichenkette, schneidet Schrägstriche ab und legt sie im
`localStorage` ab. Keine Prüfung auf Schema, keine auf Erreichbarkeit, keine Warnung bei
fremder Herkunft.

**Risiko.** Zwei Wege:
1. Ein Tippfehler in der Einrichtung schickt den Zugangsschlüssel an einen fremden Rechner.
2. Schwerwiegender: **jedes XSS wird damit zum Schlüsseldiebstahl.** Wer `localStorage`
   schreiben kann, zeigt die API auf den eigenen Server, und die nächste Anfrage liefert den
   Schlüssel im `Authorization`-Kopf frei Haus. H-1 war genau so ein Weg.

**Lösung.**
- Nur absolute URLs mit `https:` annehmen; `http:` ausschließlich für `localhost`/`127.0.0.1`.
- Bei fremder Herkunft eine ausdrückliche Rückfrage im Onboarding statt stiller Übernahme.
- `connect-src 'self'` in der CSP (K-4) als zweite Sperre.

**Komplexität.** Niedrig.
**Dateien.** `api.js`, `vorlage/onboarding.js`.
**Teststrategie.** API-Vertragsprüfung um abgelehnte Adressen erweitern
(`javascript:`, `http://fremd.example`, relativ, leer).

---

#### H-3 · ✅ BEHOBEN — Acht Zuhörer wurden nie abgemeldet

**Problem.** Die Gestenzuhörer für „Ziehen zum Aktualisieren" und „Blättern im Posteingang"
hängen am `document` und wurden in `componentWillUnmount` nicht entfernt. 15 Anmeldungen
standen 4 Abmeldungen gegenüber.

**Risiko.** Gering im Alltag (die Oberfläche wird nur beim Abmelden abgebaut), aber es ist
genau die Sorte Leck, die in Tests und in eingebetteten Hüllen (K-1) auffällt.

**Lösung (umgesetzt).** Alle acht werden abgemeldet.

---

#### H-4 · Keine CI, keine Versionierung, kein Release-Weg

**Problem.** Kein `.github/`, keine `package.json`, keine Tags, keine Release Notes. Die
Testsuite läuft nur, wenn jemand sie von Hand startet.

**Risiko.** Bei 36 Commits noch überschaubar. Sobald jemand anderes beiträgt, ist ein
grüner Hauptzweig nicht mehr belegbar — und die Suite ist der wichtigste Aktivposten des
Projekts.

**Lösung.**
- `package.json` mit Version, Lizenz, `scripts` (die Prüfstufen als npm-Skripte).
- `.github/workflows/pruefung.yml`: statische Stufen bei jedem Push; Browser- und
  API-Stufen gegen eine im Workflow gestartete Paperless-Instanz (`docker compose`).
- `.github/workflows/release.yml`: Tag → Release Notes aus den Commits → Artefakt.

**Komplexität.** Mittel (die servergebundenen Stufen brauchen eine Wegwerf-Instanz).
**Dateien.** Neu.
**Teststrategie.** Der Workflow ist der Test; einmal absichtlich rot laufen lassen.

---

#### H-5 · Cache-Version des Service Workers von Hand

**Problem.** `const VERSION = 'v8'` wird per Hand hochgezählt. Vergisst man es, bleibt der
Cache stehen. Genau das hat schon einmal Zeit gekostet.

**Lösung.** Version aus dem Inhalt ableiten — ein kleines Skript, das beim Commit (oder in
der CI) eine Prüfsumme über die Hüllen-Dateien in `sw.js` schreibt.

**Komplexität.** Niedrig.
**Dateien.** `sw.js`, `tools/huelle.py`, CI.
**Teststrategie.** Vorhanden — „Neue Fassung kommt von selbst an" deckt den Fall bereits ab.

---

### MITTEL

---

#### M-1 · `app.js` trägt noch zu viel

2.145 Zeilen, 97 Methoden. Größte Brocken: `valsSheets()` mit 172 Zeilen,
`valsDokumentliste()` mit 85, der Konstruktor mit 81. 33 Zeilen sind länger als 200 Zeichen,
die längste hat 1.572.

Bereits ausgelagert: `mitglieder`, `erfassen`, `suche`, `vorschau`, `ordnung`, `betrieb`.
**Noch offen:** Sitzung/Anmeldung, Navigation, Dokumentliste, Einstellungen.

*Lösung:* dem eingeschlagenen Muster folgen — `sitzung.js`, `navigation.js`, `dokumente.js`,
`einstellungen.js`. **Komplexität:** mittel. **Test:** `aufrufe_check` und `template_check`
fangen Ausrutscher; nach jeder Verschiebung die volle Suite.

#### M-2 · Zustand ist flach

Rund 90 Schlüssel auf einer Ebene. Die vorgeschlagene Gruppierung (`session`, `documents`,
`preview`, …) ist richtig, aber **teuer**: jeder Zugriff in 13 Modulen ändert sich, und
`template_check` prüft die Bindungen, nicht die Zustandsform.

*Empfehlung:* **nach v1.0.** Der Nutzen ist Lesbarkeit, das Risiko eine breite Regression.
Vorher lohnt M-1.

#### M-3 · Fehlermeldungen zeigen Technik

`api.js` übersetzt Statuscodes bereits (`humanize`), aber an mehreren Stellen steht
`e.message` direkt in der Oberfläche — dort können Django-Fehlertexte durchschlagen.

*Lösung:* eine Stelle für Meldungen, die technische Reste abfängt; `note()` als einziger Weg.
*Test:* Browserprüfung mit erzwungenen 403/409/500 (Route abfangen), die auf verständlichen
Text prüft.

#### M-4 · Ladezustände uneinheitlich

Es gibt `docsBusy`, `ordnerLaden`, `qBusy`, `scanBusy` — aber keine gemeinsame Form. Manche
Bildschirme zeigen nichts, während sie laden.

*Lösung:* ein Baustein „lädt" in `stile.js`, überall derselbe.

#### M-5 · Zwei tote Werte in `renderVals`

`dsQuelle` und `otPfad` werden geliefert und von niemandem gelesen. `template_check` meldet
sie bereits als Hinweis — der Hinweis sollte ein Fehler werden.

#### M-6 · Dokumentation unvollständig

Vorhanden: `README.md` (126 Zeilen), `docs/ROADMAP.md` (523), `CLAUDE.md` (168).
Gefordert und fehlend: `Architecture`, `Development`, `Deployment`, `Security`,
`Troubleshooting`, `FAQ`, `Contributing`, `Support`, `Compatibility`.

Ein Teil lässt sich aus vorhandenem Material ziehen: die Modulübersicht steckt in den
Dateiköpfen, die Betriebsanleitung in `CLAUDE.md`, die Sicherheitslage in diesem Bericht.

---

### NIEDRIG

- **N-1** `manifest.webmanifest` hat keine `screenshots` — ohne sie zeigt Chrome den
  schmalen Installationsdialog statt der reichen Ansicht.
- **N-2** `dangerouslySetInnerHTML` an drei Stellen in `tabs.js` für Symbole. Die Quelle ist
  fest verdrahtet, also kein Vektor — aber es ist eine Form, die bei jeder künftigen Prüfung
  wieder erklärt werden muss. Besser als Komponenten.
- **N-3** Keine `NOTICE`/`THIRD-PARTY`-Datei. React, htm, Inter und Manrope liegen unter
  `vendor/` und tragen eigene Lizenzen (MIT bzw. OFL). Für eine öffentliche Auslieferung
  gehören ihre Texte mitgeliefert.
- **N-4** Keine Datenschutzerklärung als Dokument. Der Text im Sheet ist gut und wahr — für
  einen Store braucht es ihn zusätzlich unter einer URL.
- **N-5** Kein Absturzbericht. Die Fehlergrenze fängt Abstürze, meldet sie aber nirgends.
  Datensparsam wäre: lokal sammeln, auf Wunsch teilen.

---

## 3. Empfohlene Reihenfolge

Nicht nach Priorität sortiert, sondern nach **Abhängigkeit und Hebelwirkung**.

### Meilenstein A — „Belastbar" (≈ 1 Woche)

| # | Aufgabe | Aufwand |
|---|---|---|
| H-2 | API-Adresse prüfen | 0,5 Tage |
| K-4 | Inline-Code auslagern, CSP setzen | 1 Tag |
| K-3.1 | Obergrenze fürs Nachladen | 0,5 Tage |
| H-4 | `package.json` + CI für die statischen Stufen | 1 Tag |
| H-5 | Hüllenversion automatisch | 0,5 Tage |
| M-5 | Tote Werte entfernen, Hinweis → Fehler | 0,25 Tage |

*Warum zuerst:* alles klein, alles unabhängig, und die CI sichert alles Folgende ab.

### Meilenstein B — „Für alle bedienbar" (≈ 1,5 Wochen)

| # | Aufgabe | Aufwand |
|---|---|---|
| K-2 | Barrierefreiheit: Semantik, Labels, Fokus, Reduced Motion | 5 Tage |
| — | Neue Prüfstufe `a11y_check` | 1 Tag |
| M-3 | Fehlermeldungen vereinheitlichen | 1 Tag |
| M-4 | Ladezustände vereinheitlichen | 0,5 Tage |

*Warum hier:* der größte Einzelposten und der, der „consumer-grade" am meisten im Weg steht.

### Meilenstein C — „Im Großen" (≈ 1 Woche)

| # | Aufgabe | Aufwand |
|---|---|---|
| K-3.2 | Fensterung der Liste | 3 Tage |
| — | Lasttest als Prüfstufe mit Schwellwerten | 1 Tag |
| H-4.2 | CI für Browser- und API-Stufen gegen Wegwerf-Instanz | 1 Tag |

### Meilenstein D — „Auslieferbar" (≈ 1 Woche)

| # | Aufgabe | Aufwand |
|---|---|---|
| M-6 | Neun Dokumente | 2 Tage |
| N-3, N-4 | NOTICE, Datenschutz als Dokument | 0,5 Tage |
| N-1 | Screenshots im Manifest | 0,25 Tage |
| H-4.3 | Release-Workflow | 0,5 Tage |
| N-5 | Absturzbericht, lokal | 1 Tag |

### Meilenstein E — „Store" (Aufwand hängt an K-1)

Erst nach der Entscheidung zu K-1. Bei Capacitor: 3–5 Tage Hülle, danach Store-Material.

**Gesamt bis v1.0 ohne Store: ≈ 4,5 Wochen.** Mit Store: ≈ 6 Wochen.

---

## 4. Risikobewertung

| Risiko | Wahrscheinlichkeit | Auswirkung | Gegenmaßnahme |
|---|---|---|---|
| Barrierefreiheits-Umbau bricht Layouts | hoch | mittel | Mechanisch umsetzen, Bildvergleich vorher/nachher über alle 38 Stationen |
| Fensterung bricht Wischgesten an Zeilen | mittel | hoch | Fensterung zuletzt; die vorhandenen Gestenprüfungen laufen mit |
| CSP bricht `style=`-Attribute | mittel | hoch | Vorab in einer Zweitinstanz messen, nicht raten |
| Zustandsumbau (M-2) erzeugt breite Regression | hoch | hoch | **Auf nach v1.0 verschoben** |
| Store-Abnahme scheitert an Barrierefreiheit | mittel | hoch | Meilenstein B vor E |
| CI gegen echte Paperless-Instanz ist flatterig | mittel | mittel | Feste Image-Version, Wegwerf-Datenbank je Lauf |

---

## 5. Definition of Done — je Aufgabe

Eine Aufgabe gilt als fertig, wenn **alle sechs** Punkte zutreffen:

1. Die Änderung ist umgesetzt und im Code erklärt — warum, nicht was.
2. Es gibt eine Prüfung, die die **Wirkung** misst, nicht die Anwesenheit.
3. Die Gegenprobe ist gemacht: nimmt man die Änderung zurück, schlägt die Prüfung fehl.
4. Alle sieben Stufen laufen grün.
5. Der visuelle Durchlauf über drei Varianten (schmal, breit, dunkel) zeigt keine Abweichung.
6. `docs/ROADMAP.md` nennt den Befund und die Entscheidung dahinter.

Punkt 3 ist nicht optional. Drei Fehler in diesem Projekt sind durch Prüfungen gerutscht,
die nur die Anwesenheit von Bedienelementen geprüft haben.

---

## 6. Regressionsstrategie

**Vorhandenes Netz** (7 Stufen, ≈ 2.900 Testzeilen):

| Stufe | Deckt ab | Blinder Fleck |
|---|---|---|
| `syntax_check` | Ladbarkeit aller Skripte | Semantik |
| `logik_check` | 53 Fälle reiner Logik | alles mit DOM |
| `template_check` | jede Bindung hat einen Wert | was hinter der Bindung liegt |
| `aufrufe_check` | jedes `this.x()` existiert | ob es etwas bewirkt |
| `pwa_check` | Manifest, Hülle, Einstiegspunkt | Laufzeitverhalten |
| `api_check` | 24 Zusagen der Paperless-API | Nutzung in der Oberfläche |
| `browser_check` | 35 Prüfungen gegen echten Server | Fehlerpfade, Langsamkeit |

**Zu ergänzen, nach Nutzen sortiert:**

1. `a11y_check` — Tastaturdurchlauf, erreichbare Namen, Fokusfallen.
2. Fehlerpfade — Route abfangen und 403/409/500/Zeitüberschreitung erzwingen; die App muss
   verständlich reagieren statt zu schweigen.
3. Lasttest mit Schwellwerten — die Tabelle aus K-3 als Prüfung.
4. Langsame Verbindung — CDP-Drosselung auf 3G; keine leeren Bildschirme, kein Springen.
5. Abgebrochener Upload — Verbindung mitten im POST kappen.

**Regel für jede Änderung:** die volle Suite vorher und nachher, und bei allem Sichtbaren der
Dreier-Durchlauf. Bei allem, was an einer Geräteeigenheit hängt (Berührung, Dateidialog,
installierte App), **so prüfen, wie es dort auftritt** — nicht mit der Maus. Diese Lehre hat
in diesem Projekt drei Anläufe gekostet.

---

## 7. Empfehlungen für Pull Requests

Bisher wurde direkt auf `main` gearbeitet. Für eine öffentliche Auslieferung:

- **Ein PR je Befund**, Titel mit Kennung: `K-2: Barrierefreiheit — Semantik und Fokus`.
- **Höchstens 400 geänderte Zeilen** je PR. K-2 wird dadurch zu fünf PRs (je Bildschirmgruppe).
- **Beschreibung nach diesem Muster:** Problem · Risiko · Lösung · Messung vorher/nachher ·
  Gegenprobe.
- **Pflichtprüfungen** in der CI: alle sieben Stufen grün, sonst kein Merge.
- **`main` schützen**, sobald die CI steht.
- **Kein PR ohne Prüfung**, die den behobenen Fehler fängt.

---

## 8. Was ich nicht geprüft habe

Damit der Bericht nicht mehr behauptet, als er belegt:

- **Echte Geräte.** Alles im Browser gemessen, teils mit Berührungssimulation. iOS Safari,
  Android Chrome und die installierten Fassungen sind **nicht** geprüft. Genau dort lagen in
  diesem Projekt drei Fehler, die im Testbrowser unsichtbar waren.
- **Bestände über 5.000 Dokumenten am echten Server.** Die Zahlen in K-3 sind
  clientseitig mit synthetischen Daten gemessen. Serverseitige Antwortzeiten bei 50.000
  Dokumenten sind offen.
- **Screenreader.** Kein VoiceOver-, kein TalkBack-Durchlauf. Der Befund K-2 stützt sich auf
  die Abwesenheit jeder Semantik, nicht auf einen Durchlauf.
- **Kontrast systematisch.** Ein Fall wurde früher gemessen und behoben (weiß auf Mint);
  eine vollständige Prüfung aller Paarungen steht aus.
- **Mehrbenutzerbetrieb.** Rechte, Sichtbarkeit und Übergabe sind mit zwei Konten geprüft,
  nicht mit widersprüchlichen Rechten.
- **Lange Laufzeit.** Kein Dauertest über Stunden; Speicherwachstum über die Zeit ist offen.
  `performance.memory` meldete in allen Messungen konstant 10 MB — dieser Wert ist im
  Testbrowser gedrosselt und **nicht belastbar**.

---

## 9. Was gut ist

Damit die Liste der Befunde nicht das Bild verzerrt:

- **Die Testsuite ist der stärkste Teil des Projekts.** Sieben Stufen, Gegenproben,
  Prüfungen auf Wirkung statt Anwesenheit. Das ist mehr, als die meisten Projekte dieser
  Größe haben.
- **Keine Attrappen mehr.** Neun ehemals wirkungslose Bedienelemente wurden gefunden und
  entweder echt gemacht oder entfernt.
- **Keine Fremdabhängigkeit zur Laufzeit.** React, htm und die Schriften liegen lokal;
  `vendor/` wiegt 336 KB. Kein CDN, kein Tracker, kein Analytics.
- **Kein Build-Schritt.** Der ausgelieferte Code ist der geschriebene Code — für ein
  quelloffenes Projekt ein Vorteil, der selten geworden ist.
- **Die Kommentare erklären Entscheidungen**, nicht Syntax. Wer in einem Jahr hineinsieht,
  findet die Gründe.

---

## 10. Die eine Frage, die zuerst beantwortet werden muss

**Sollen es wirklich die App Stores sein?**

Als PWA ist DocuWunder heute installierbar, offlinefähig und aktualisiert sich selbst — ohne
Store, ohne Abnahme, ohne Jahresgebühr. Der Weg in die Stores kostet eine native Hülle, zwei
Entwicklerkonten und bei jeder Version eine Abnahme.

Wenn die Antwort ja lautet, gehört K-1 an den Anfang, weil es die Reihenfolge aller anderen
Arbeiten bestimmt. Wenn nein, fällt Meilenstein E weg und v1.0 rückt um anderthalb Wochen
näher.


## Meilenstein B — Accessibility-Fortschritt 2026-08-02

- Neue Teststufe `tests/a11y_check.py` mit Baseline fuer klickbare div/span und Button-Type-Regel.
- Erste Batch: Entsperr-Dialog nutzt native Buttons mit `DWStile.buttonReset`.
- ADR `docs/adr/0004-accessibility-semantics.md` dokumentiert die Migrationsstrategie.
- Restschuld: 188 klickbare div/span; manuelle Screenreader-/Geraetetests stehen aus.
