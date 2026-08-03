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
| **Barrierefreiheit** | **32 %** | Tableiste, Onboarding, Sperrdialog, Auswahlleiste, Ordnung, Erfassen, Dokument-Detail, Sheets und Tabs migriert (Kernnavigation vollständig, 217 Buttons gesamt). Nur `verwaltung.js` (30 klickbare div/span) und ein bewusst offener Undo-Link verbleiben. Automatisierte a11y-Baseline (`tests/a11y_check.py`) grün; manuelle Screenreader-/Tastatur-Geräteprüfung steht weiterhin aus |
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

**Fortschritt 2026-08-02.** Migriert sind Onboarding, Sperrdialog, Auswahlleiste, die
Ordnung-Bildschirme und die **Tableiste** — 29 native `button type="button"`, Icon-Aktionen mit
`aria-label`, der aktive Reiter mit `aria-current="page"`.

**Wichtige Einordnung, damit die Zahl nicht mehr verspricht, als sie hält.** `tests/a11y_check.py`
zählt Buttons in den Vorlagen. Das ist eine Leitplanke gegen Rückschritte und **misst nicht, ob
man die App bedienen kann**. Gemessen am 2. August, nach den ersten vier Migrations-Commits:

| Reiter | vorher erreichbar | nach der Tableiste |
|---|---:|---:|
| Übersicht | 1 | 5 |
| Dokumente | 1 | 5 |
| Posteingang | 0 | 4 |
| Mehr | 1 | 5 |

Vorher waren auf allen vier Hauptreitern **0 fokussierbare Elemente** — trotz 25 Buttons in den
Vorlagen. Die migrierten Bildschirme waren durchweg solche, die man selten sieht. Seitdem misst
die Browserprüfung „Tastatur erreicht die Bedienung" die **Wirkung** und hebt ihre Schwelle mit
jedem migrierten Bildschirm.

Offen: 161 klickbare `div`/`span` in Dokument-, Erfassungs-, Sheet-, Tab- und Verwaltungsbereich.
Nicht ersetzt durch Automatik: Screenreader- und Geräteprüfung.

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
- Zweite Batch: Auswahlleiste fuer Mehrfachauswahl nutzt native Buttons mit sprechenden Namen fuer Verschlagworten, Export, Loeschen und Fertig.
- Restschuld: 175 klickbare div/span; manuelle Screenreader-/Geraetetests stehen aus.
- Vierte Batch: vorlage/erfassen.js (Scan-Bildschirm, Zuschnitt, Werkzeugleiste) komplett auf
  native Buttons umgestellt (14 -> 1 klickbare div/span, 13 neue Button-Elemente mit aria-label
  und title). Nur der Undo-Link im Toast bleibt bewusst offen. Nummern-Badge auf Seitenkacheln
  erhielt pointer-events:none, da es sonst Klicks auf die darunterliegenden Werkzeuge abfing.
  Volle Suite (60 Unit + 24 API + 37 Browser) danach gruen, Huellenversion neu gesetzt.
- Restschuld nach Batch 4: 147 klickbare div/span in dokument.js, sheets.js, tabs.js, verwaltung.js.
- Fuenfte Batch: vorlage/dokument.js (Dokument-Detail, Posteingang-Pruefung, Suche) komplett auf
  native Buttons umgestellt (33 -> 0 klickbare div/span, 26 neue Button-Elemente). Segment-
  Umschalter und Favorit-Knopf mit aria-pressed, Vor/Zurueck-Pfeile im Posteingang mit disabled
  statt reiner Opazitaet, Suchfeld mit verknuepftem (visuell verstecktem) Label. Volle Suite
  (9 Stufen, 37 Browserpruefungen) danach gruen, Huellenversion neu gesetzt (4fe11d3e5ea2).
- Restschuld nach Batch 5: 115 klickbare div/span in sheets.js (50), tabs.js (34),
  verwaltung.js (30), erfassen.js (1 bewusst offen gelassener Undo-Link).
- Neu: VERSION-Datei als Versions-Ursprung angelegt (semantische Versionierung ab jetzt).
  Zustand vor diesem Batch war unversioniert; erste Fassung 0.1.0, mit dieser Batch 0.1.1
  (PATCH: A11y-Batch, keine oeffentliche Aenderung).

- Sicherheits-/CI-Batch: Neue Stufe `tests/geheim_check.py` durchsucht versionierte Dateien
  nach Paperless-Token-Mustern, Zugangsdaten in URLs und langen Secret-Zuweisungen; `.env`
  und `tests/.token` werden als nie zu versionierende Dateien kontrolliert. Zwei Testwerte
  wurden so umgebaut, dass sie keinen Secret-Scanner-Fehlalarm mehr ausloesen. Die GitHub-
  Pruefung und `tests/run_e2e.py` fuehren die Stufe jetzt mit aus. Version 0.1.1 -> 0.1.2
  (PATCH: Sicherheits-/Release-Gate, keine neue Benutzerfunktion).


- Meilenstein B, Batch 6: vorlage/sheets.js - 45 neue native Buttons mit aria-label/
  aria-pressed statt klickbarer div/span (50 -> 1 verbleibend: der Sheet-Hintergrund
  bleibt eine reine Dekorationsflaeche, schliesst aber weiterhin per Escape - global in
  app.js verdrahtet). tests/a11y_check.py-Baseline entsprechend gesenkt. Huellenversion
  neu berechnet. Volle Suite (10 Stufen, 37 Browserpruefungen) danach gruen.
  Restschuld jetzt: 34 in tabs.js, 31 in verwaltung.js, 1 bewusst offen (erfassen.js).
  Version 0.1.2 -> 0.2.0 (MINOR: sichtbarer A11y-Fortschritt, kein Verhaltensbruch).


- Meilenstein B, Batch 7: vorlage/tabs.js - 34 neue native Buttons mit aria-label statt
  klickbarer div/span (34 -> 0 verbleibend). tests/a11y_check.py-Baseline entsprechend
  gesenkt. tests/browser_check.py auf die neue Semantik umgestellt (Ansicht-Umschalter,
  Ordnerklicks und Einstellungen-Einstieg jetzt ueber Button-/Attribut-Selektoren statt
  CSS-Heuristiken auf ehemaligen div-Elementen). Huellenversion neu berechnet. Volle
  Suite (10 Stufen, 60 Unit, 24 API/Geheimnis-Checks, 37 Browserpruefungen) danach gruen.
  Restschuld jetzt: 30 in verwaltung.js, 1 bewusst offen (erfassen.js).
  Version 0.2.0 -> 0.3.0 (MINOR: sichtbarer A11y-Fortschritt, kein Verhaltensbruch,
  Testsuite an neue Semantik angepasst).


## Meilenstein B, Batch 8 (2026-08-03) - Meilenstein B abgeschlossen

- vorlage/verwaltung.js: 30 klickbare div/span -> 0. 30 neue native Buttons mit
  aria-label/aria-pressed fuer Automatisierungen-Liste und -Detail, Aktiv-Schalter,
  Ausloeser-Wahl, Loeschen, E-Mail-Regeln, Darstellung-Segmente (Hell/Dunkel/System),
  Standardansicht, Server wechseln, Lokale Daten loeschen, Geraetesperre-Schalter,
  Hilfe/Datenschutz/Abmelden, Aufgaben-Erneut-Knopf, Benutzer- und Gruppenzeilen,
  Gruppe anlegen. app.js liefert dafuer neu aktiv/aria-Zustaende (adAktiv, modeAktuell,
  sperreAn, autoRows[].aktiv, mailRules[].aktiv) statt nur CSS-Klassen.
- tests/a11y_check.py-Baseline fuer verwaltung.js auf 0 gesenkt.
- Huellenversion neu berechnet (12acb9781f46 -> cd719411963f). Volle Suite (10 Stufen,
  60 Unit, 24 API/Geheimnis-Checks, 37 Browserpruefungen) danach gruen.
- **Meilenstein B (Accessibility-Semantik) ist damit strukturell abgeschlossen:**
  0 klickbare div/span in dokument.js, onboarding.js, ordnung.js, sperre.js, tabs.js,
  verwaltung.js. Nur 2 bewusst offen gelassene Ausnahmen verbleiben: der Undo-Link in
  erfassen.js (Toast-Kontext, kein primaerer Bedienweg) und der Sheet-Hintergrund in
  sheets.js (reine Dekorationsflaeche, schliesst per Escape). 169 native Buttons
  insgesamt.
- **Wichtige Einschraenkung:** Dies deckt nur die strukturelle Semantik (native Buttons,
  aria-label/aria-pressed, Labels an Formularfelder) ab. Noch NICHT verifiziert:
  Fokus-Reihenfolge im Detail, Fokus-Ruecksprung nach Sheet-Schluss ueberall,
  echte Screenreader-Tests (VoiceOver, TalkBack, NVDA), Kontrastpruefung, reduced-motion,
  Touch-Target-Groessen im Detail. Diese bleiben offene Punkte fuer eine manuelle
  Pruefrunde vor einer "vollstaendige Barrierefreiheit"-Aussage.
- Naechster Schritt: Meilenstein C (Virtualisierung grosser Archive) oder der
  Goldstandard-Scanner-Meilenstein; danach manuelle A11y-Geraetetests nachholen.
- Version: 0.3.0 -> 0.4.0 (MINOR: Meilenstein B strukturell abgeschlossen).


## Goldstandard-Scanner, Phase 0 (2026-08-03)

- ADR 0005 (docs/adr/0005-goldstandard-scanner.md): Architektur-/Phasenplan fuer den
  von Damien geforderten Goldstandard-Scanner (Ziel: mindestens Swift-Paperless-
  Niveau). Ist-Zustand analysiert, sechs Phasen definiert, bewusste Nicht-Ziele
  (keine grosse CV-Abhaengigkeit blind, kein Cloud-Processing, Datei-Dialog bleibt
  Fallback bis Geraeteverifikation). Reine Dokumentation, kein Codeeingriff.
- Version 0.4.0 -> 0.4.1 (PATCH). Produktionsreife-Score unveraendert (kein neuer
  Code, kein neu getesteter Zustand) - naechster Batch (Phase 1: Live-Kamera-
  Huelle mit Fallback-Kette) bringt die erste messbare Scanner-Verbesserung.


## Fehlerbehebung: doppeltes Blaettern im Posteingang (2026-08-03)

- Wiedereinstieg in den geplanten naechsten Schritt (Goldstandard-Scanner Phase 1)
  begann mit dem vorgeschriebenen Schritt 2 der Routine: volle Testsuite vor neuer
  Arbeit. Dabei schlug "Posteingang blaettern: nach links" reproduzierbar fehl
  (Stand blieb bei 3 von 3 statt 2 von 3).
- Ursache: revZiehEnde im JSX-Callback (app.js, render()-Objekt) hatte anders als
  revZiehStart/revZiehZug keine pointerType-Wache. Auf Touch-Geraeten feuert
  onPointerUp am [data-rev]-Container zusaetzlich zum globalen touchend-Listener
  aus componentDidMount (_revAus). Beide riefen this.revZiehEnde() auf - eine
  Wischgeste loeste die Index-Aenderung zweimal aus und blaetterte de facto zwei
  Karten statt einer weiter (bzw. federte in Randfaellen falsch).
- Fix: revZiehEnde erhielt dieselbe pointerType-Wache wie Start/Zug
  ((e) => { if (!e || !e.pointerType || e.pointerType === 'mouse') this.revZiehEnde(); }),
  sodass Touch-Ereignisse ausschliesslich ueber den globalen Touch-Pfad laufen.
  Kein Verhaltensbruch fuer Maus/Trackpad (Pointer-Events dort weiterhin aktiv).
- Huellenversion neu berechnet (cd719411963f -> 5738f0e0c67d). Volle Suite (10
  Stufen, 60 Unit, 24 API/Geheimnis-Checks, 37 Browserpruefungen) danach gruen,
  inklusive der zuvor fehlgeschlagenen Pruefung.
- Kein automatisierter Test wurde geschwaecht oder entfernt - der bestehende Test
  hat den echten Fehler korrekt gefunden.
- Version: 0.4.1 -> 0.4.2 (PATCH: Fehlerbehebung, kein neues Verhalten fuer
  Nutzer:innen ausser dem korrekten Blaettern).
- Naechster Schritt: Goldstandard-Scanner Phase 1 (Live-Kamera-Huelle mit
  Fallback-Kette) gemaess ADR 0005.


## Goldstandard-Scanner, Phase 1 (2026-08-03)

- Live-Kamera-Huelle nach ADR 0005 implementiert: `getUserMedia({video:{facingMode:'environment'}})`
  ueber `logik.js:kameraNutzbar()` (sicherer Kontext + API-Vorhandensein), dann
  `erfassen.js: scanKameraOeffnen/-Fehler/-Schliessen/-Aufnehmen/scanZuDatei`.
  Fallback-Kette wie geplant: nutzbar+erlaubt -> Vollbild-`<video>`-Vorschau mit
  manuellem Ausloeser und "Aus Dateien waehlen"; verweigert/Fehler -> Hinweis +
  sofortiger Ruecksprung auf den bestehenden `capture="environment"`-Dateidialog;
  API nicht vorhanden -> direkt der Dateidialog, kein Zwischenschritt. Kein
  Auto-Capture in dieser Phase (wie in ADR 0005 Phase 1 festgelegt).
- Aufnahme aus dem `<video>` laeuft ueber `scanKameraAufnehmen()` (Canvas-Snapshot)
  in dieselbe `scanAufnahmen()`-Pipeline wie der Dateidialog - keine zweite
  Bildverarbeitung, DWScan bleibt unveraendert.
- Stream wird beim Schliessen/Wechsel explizit ueber `getTracks().forEach(stop)`
  freigegeben (kein haengendes Kamera-Aktiv-Symbol im System).
- Neue Browser-Tests (mit Playwright `add_init_script`, mockt `getUserMedia`):
  Erfolgsfall zeigt echte `<video>`-Vorschau (echter `MediaStream` aus einem
  Canvas via `captureStream()`, kein blosses Mock-Objekt), Verweigerung faellt
  sofort auf den Dateidialog zurueck, fehlende API geht direkt zum Dateidialog -
  in allen drei Faellen bleibt der Dateiweg erreichbar.
- Ein echter Fehler wurde dabei gefunden und behoben: die erste Fassung der
  `srcObject`-Zuweisung liess die App bei einem Stream-Objekt ohne echte
  MediaStream-Eigenschaften abstuerzen (`TypeError`, von "Keine Fehler in der
  Konsole" korrekt erkannt). Fix: `try/catch` um die Zuweisung *und* ein echter
  `MediaStream` im Test statt eines Attrappen-Objekts - beides zusammen, nicht
  nur der Test aufgeweicht.
- Volle Suite (10 Stufen, 60 Unit, 24 API/Geheimnis-Checks, 40 Browserpruefungen,
  davon 3 neu fuer die Kamera-Fallback-Kette) danach gruen. Huellenversion neu
  berechnet (5738f0e0c67d -> 2affe07765ba).
- **Nicht verifiziert (wie in ADR 0005 verlangt vor jeder Parity-/Goldstandard-
  Aussage):** echtes Kamerageraet auf echtem Telefon (iOS/Android), reale
  Berechtigungsdialoge, Bildqualitaet bei echtem Umgebungslicht. Das bleibt
  offen fuer die spaetere Geraeteverifikationsrunde.
- Naechster Schritt: ADR-0005-Phase 2 (Aufnahme/Review/Upload-Andockung ist
  durch die gemeinsame Pipeline faktisch schon vollzogen) oder direkt Phase 3
  (Bildverstaerkung) bzw. Phase 4 (Kantenerkennung/Overlay).
- Version: 0.4.2 -> 0.5.0 (MINOR: erste sichtbare, echt nutzbare Kamera-Faehigkeit,
  kein Verhaltensbruch am bestehenden Dateidialog-Weg).


## Goldstandard-Scanner, Phase 3 (2026-08-03) - Bildverstaerkung

- Umgesetzt gemaess ADR 0005, Phase 3: Modus-Umschalter Original/Graustufe
  fuer den gesamten Scan (`erfassen.js: scanModusSetzen`), echte Pixelrechnung
  in `scan.js: seiteAus` (kein CSS-Filter - der Modus wirkt auf den JPEG-
  Bytestrom, der spaeter im PDF landet). Kontrast/Helligkeit sind als Parameter
  in `seiteAus` bereits vorbereitet (0..255-Versatz bzw. Faktor um 128), aber
  noch ohne eigenes UI-Element - kein totes UI, aber auch keine verfrueht
  gebaute Bedienflaeche ohne Anschluss.
- Unschaerfe-Heuristik `scan.js: schaerfeMass` (vereinfachter Laplace-Filter
  auf einem auf 320px verkleinerten Graustufenbild, Varianz als Mass). Nicht
  blockierend: nach jeder Aufnahme laeuft die Pruefung im Hintergrund und
  zeigt bei Unterschreiten von `SCHAERFE_SCHWELLE=55` einen Hinweis-Toast
  ("Seite N wirkt unscharf. Nochmal aufnehmen?"). Kein hartes Verbot, keine
  Blockade des Workflows - die Heuristik ist grob und darf keine gute
  Aufnahme verhindern.
- Alle bereits aufgenommenen Seiten werden beim Moduswechsel neu aus dem
  unveraenderten Original gerendert (dieselbe scanRendern-Pipeline wie bei
  Drehen/Zuschnitt) - der Wechsel ist jederzeit umkehrbar, nichts geht
  verloren.
- Ein neuer Browser-Test ("Bildmodus wirkt auf den Scan") prueft: Umschalten
  faerbt tatsaechlich um (Bild-URL aendert sich, nicht nur der Knopfzustand),
  `aria-pressed` spiegelt die Auswahl, keine Seite geht beim Wechsel verloren,
  Zuruecksetzen auf Original funktioniert.
- Volle Suite (10 Stufen, 41 Browserpruefungen, davon 1 neu) danach gruen.
  Huellenversion neu berechnet (2affe07765ba -> 9e5b340e3e39).
- Nicht verifiziert: echtes Kameragerat, reale Bildqualitaet unter echtem
  Licht (die Unschaerfe-Heuristik wurde nur mit synthetischen Testbildern
  geprueft, nicht mit echten verwackelten Fotos). Keine "Goldstandard"- oder
  Paritaets-Aussage vor Geraeteverifikation.
- Naechster Schritt: ADR-0005-Phase 4 (Kantenerkennung/Overlay) oder ein
  eigenes Kontrast/Helligkeit-UI-Element (der Rechenweg in scan.js steht
  bereits) - Reihenfolge noch offen.
- Version: 0.5.0 -> 0.6.0 (MINOR: neues, sichtbares Nutzerverhalten -
  Bildmodus-Umschalter und Unschaerfe-Hinweis).


## Goldstandard-Scanner, Kontrast/Helligkeit-UI (2026-08-03)

- Nachtrag zu Phase 3: die in `scan.js: seiteAus` bereits vorbereiteten
  Parameter `kontrast` (Faktor 0.5-2, Neutralwert 1) und `helligkeit`
  (additiver Versatz -80..+80, Neutralwert 0) bekommen jetzt ein eigenes
  UI-Element in `vorlage/erfassen.js`: zwei Schieberegler unterhalb des
  Original/Graustufe-Umschalters, sichtbar sobald mindestens eine Seite
  aufgenommen wurde.
- `erfassen.js`: neue `scanVerstaerkung()` buendelt Modus/Kontrast/Helligkeit
  zu einem Objekt, `scanAlleNeuRendern(patch)` ersetzt die bisherige
  Moduswechsel-Logik als gemeinsamer Weg fuer alle drei Regler - jede
  Aenderung rendert alle Seiten erneut aus ihrem unveraenderten Original,
  nichts geht verloren, jede Aenderung bleibt umkehrbar.
- Schieberegler sind per 180ms-Debounce entkoppelt (`scanKontrastSetzen`,
  `scanHelligkeitSetzen`): beim Ziehen loest nicht jede einzelne Raststufe
  sofort eine Neu-Rechnung aller Seiten aus, sondern erst nach kurzer Ruhe -
  wichtig bei mehrseitigen Scans, wo jede Neu-Rechnung mehrere Canvas-Op-
  erationen pro Seite kostet.
- Zustand `scan.kontrast`/`scan.helligkeit` liegt wie `scan.modus` im
  Scan-State, nicht pro Seite - deckt sich mit der bestehenden Entscheidung
  aus Phase 3, dass Bildverstaerkung fuer den gesamten Scan gilt.
- Kein neuer automatisierter Test fuer die Regler selbst in diesem Batch
  (der bestehende Test "Bildmodus wirkt auf den Scan" deckt die gemeinsame
  Rendern-Pipeline ab, die jetzt auch von Kontrast/Helligkeit genutzt wird).
  Offen: ein eigener Browser-Test, der die Regler bewegt und eine echte
  Pixel-Aenderung im Ergebnis-JPEG prueft - fuer den naechsten Scanner-Batch
  vorgemerkt, damit dieser Batch klein und ueberschaubar bleibt.
- Volle Suite (10 Stufen, 41 Browserpruefungen) nach der Aenderung gruen.
  Huellenversion neu berechnet (9e5b340e3e39 -> e9753b03a535).
- Waehrend dieses Batches wurde ein operativer Fehler im eigenen
  Werkzeugeinsatz gefunden und behoben, kein Produktfehler: das Hochladen
  von Dateien per SSH-Pipe (`cat datei | ssh-vps ... 'cat > ziel'`) schrieb
  die Zieldateien serverseitig leer, weil `bin/ssh-vps` stdin bewusst auf
  `/dev/null` umleitet (Passwort-Auth via SSH_ASKPASS). `git checkout --`
  stellte den vorherigen Stand sofort wieder her, `scp` wurde stattdessen
  fuer den eigentlichen Dateitransfer verwendet. Kein Datenverlust, da vor
  jedem Schreiben committeter Git-Stand vorlag.
- Nicht verifiziert: echtes Kameragerat, reale Bildqualitaet unter echtem
  Licht mit den neuen Reglern. Keine "Goldstandard"- oder Paritaets-Aussage
  vor Geraeteverifikation.
- Naechster Schritt: eigener Browser-Test fuer Kontrast/Helligkeit-Regler,
  danach ADR-0005-Phase 4 (Kantenerkennung/Overlay) oder Meilenstein C
  (Virtualisierung fuer grosse Archive).
- Version: 0.6.0 -> 0.6.1 (PATCH: UI fuer bereits vorbereitete Backend-
  Parameter, kein neuer Funktionsumfang in scan.js selbst).


## Goldstandard-Scanner, Randvorschlag beim Zuschnitt (2026-08-03)

- Neu: `scan.js: randSchaetzen(quelle)` - schaetzt ein achsenparalleles
  Rechteck um das Dokument als Startvorschlag fuer den manuellen
  Zuschnitt-Rahmen (ADR 0005, Phase 4, Teilumsetzung). Verfahren: Bild auf
  260px Kantenlaenge verkleinern, Graustufen, je Zeile/Spalte die Summe der
  absoluten Helligkeitsspruenge zum Nachbarpixel bilden (1D-Gradienten-
  profil), Aussenraender mit geringem Wert abschneiden. Liefert `null` bei
  einem unplausiblen Ergebnis (fast das ganze Bild oder ein winziger
  Fleck) - der Aufrufer faellt dann auf den vollen Rahmen zurueck.
- `erfassen.js: scanZuschnittOeffnen` oeffnet weiterhin sofort mit dem
  vollen Rahmen und ersetzt ihn asynchron, sobald `randSchaetzen` fertig
  ist und derselbe Zuschnitt-Dialog noch fuer dieselbe Seite offen ist.
  "Ganz" (voller Rahmen, `zZuruecksetzen`) bleibt unveraendert jederzeit
  erreichbar - kein Bedienweg geht verloren, keine Sackgasse.
- Neuer Browser-Test `t_rand_erkennung_schlaegt_vor`: prueft `randSchaetzen`
  direkt im Browser mit zwei synthetischen Bildern (eindeutiges dunkles
  Rechteck auf weissem Grund -> plausibler Vorschlag; durchgehend leeres
  Bild -> `null`). Kein Test mit echten Fotos in diesem Batch.
- Volle Suite (10 Stufen, 43 Browserpruefungen, davon 1 neu) danach gruen.
  Huellenversion neu berechnet (e9753b03a535 -> 65fd89b2d544).
- Nicht verifiziert: echte fotografierte Dokumente unter realem Licht mit
  Schatten, gemustertem Hintergrund oder Textur - nur mit einem
  synthetischen Testbild geprueft. Kein Live-Kamera-Overlay in diesem
  Batch (bewusste Abweichung/Praezisierung der urspruenglichen
  Phase-4-Beschreibung, siehe ADR 0005). Keine "Goldstandard"- oder
  Paritaets-Aussage vor Geraeteverifikation.
- Naechster Schritt: echte Geraeteverifikation der bisherigen
  Scanner-Phasen (Kamera, Bildmodus, Regler, Randvorschlag) auf einem
  realen Telefon, oder Meilenstein C (Virtualisierung fuer grosse Archive)
  gemaess Prioritaetsreihenfolge.
- Version: 0.6.2 -> 0.7.0 (MINOR: neue, sichtbare Nutzerfaehigkeit).
