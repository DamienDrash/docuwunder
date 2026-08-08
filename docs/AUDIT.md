# DocuWunder — Production Readiness Audit v1.0

Stand: 6. August 2026 · Codestand `59c5fcf` / v0.9.3 · Paperless-ngx 3.0.5

*(Korrigiert 06.08.2026: hier stand „Stand: 2. August 2026 · Codestand `67e4aec` +
Onboarding-A11y-Batch · Paperless-ngx 3.0.4". Beide Angaben waren überholt — das
Backend ist seit dem 05.08.2026 auf `ghcr.io/paperless-ngx/paperless-ngx:3.0.5`
gepinnt (`/opt/paperless/docker-compose.yml` Z. 7), und der Codestand ist seit dem
06.08.2026 00:35 `59c5fcf` / v0.9.3 (`VERSION`; PO-STATUS.md, Abschnitt „Nicht
committete Änderungen"). Zwischen `67e4aec` und `59c5fcf` liegen unter anderem die
Fokus-Trap-Arbeit (v0.9.2) und die MFA-Vorbedingung (v0.9.3).)*

---

## Zur Methode

Alles hier ist **gemessen**, nicht geschätzt. Wo eine Zahl steht, steht daneben, wie sie
zustande kam. Wo ich etwas nicht prüfen konnte, steht das ausdrücklich (Abschnitt „Nicht
geprüft"). Zwei Befunde habe ich während des Audits sofort behoben, weil sie klein und
kritisch waren — beide mit Gegenprobe, dass die Prüfung den Fehler wirklich fängt.

---

## 1. Gesamtergebnis

### Produktionsreife: **56 %**

*(Korrigiert 06.08.2026: hier stand **58 %** — die Zahl der ursprünglichen Tabelle vom
02.08.2026. Gültig ist **56 %**, seit dem 03.08.2026 und aus den Log-Einträgen dieser
Datei selbst: sieben aufeinanderfolgende Batch-Einträge schreiben 56 % fort — Z. 968
(03.08., „Papierkorb-Roundtrip"), dann 976, 986, 994, 1001, 1010 und zuletzt Z. 1025
(04.08., v0.9.0-Batch). Der Eintrag in Z. 1025 benennt den Widerspruch
ausdrücklich als „bislang nicht bereinigten Unterschied
zwischen der ursprünglichen Tabelle und der seither gepflegten Fortschreibung". Hier ist
nur der Kopf auf die fortgeschriebene Zahl gezogen, **nicht** neu gerechnet; die dort
empfohlene vollständige Neuableitung der Bereichstabelle steht weiterhin aus.)*

| Bereich | Reife | Begründung |
|---|---:|---|
| Funktionsumfang | 90 % | Vollständig verdrahtet, keine Attrappen mehr |
| Testabdeckung | 80 % | 11 Stufen, 60 Unit-, 24 API-, **47** Browserprüfungen; Lücken bei Fehlerpfaden. *(Korrigiert 06.08.2026, Lauf 11:2x: hier stand **44**. Ausgezählt im Testcode selbst — `tests/browser_check.py` Z. 1586–1632 registriert 47 Listeneinträge, die `pruefe()` (Z. 142) je genau einmal in `ergebnisse` schreibt (Z. 145/148/151), und Z. 1644 gibt `len(ergebnisse)` aus; Gegenprobe: genau 47 `def t_*`-Funktionen, Z. 238–1572. Unbedingt — die Zahl hängt an keiner Bedingung. Auflösung des Widerspruchs 44/46/47 samt Bedingungen: Abschnitt „Auszählung der Browserprüfungen aus dem Testcode" am Ende dieser Datei.)* |
| Architektur | 65 % | 13 Module extrahiert, `app.js` noch **2.260** Zeilen und zentral. *(Zahl korrigiert 06.08.2026, Lauf 11:2x: hier stand **2.145** — `wc -l app.js` ergibt 2.260, die Datei ist seit dem Audit um 115 Zeilen **gewachsen**. Die Prozentzahl bleibt bei 65 %: M-1 ist unerledigt (keine `sitzung.js`/`navigation.js`/`dokumente.js`/`einstellungen.js` im Verzeichnis), der Trend geht in die falsche Richtung, aber ein Abschlag ohne Maßstab wäre eine erfundene Zahl. Herleitung: Abschnitt „Neuableitung der Bereichstabelle" am Dateiende.)* |
| Sicherheit | **65 %** | Ein XSS gefunden und behoben (H-1); **die API-Adresse wird jetzt geprüft** (H-2 erfüllt); **die CSP ist gesetzt — in Caddy, nicht in der App** (K-4 damit erledigt, siehe dort). *(Nachgezogen 06.08.2026, Lauf 12:4x: hier stand „**weiterhin keine CSP** (K-4 offen)". Belegt falsch — `/etc/caddy/Caddyfile` Z. 190–197, gelesen vom Watchdog am 06.08. 12:0x. **Die Zahl 65 % bleibt trotzdem stehen**, mit Absicht: ein Zuschlag wäre erst mit einer neuen Ableitung des Bereichs sauber, und gegen ihn steht ein am selben Tag belegter neuer Mangel — der Caddy-Block `handle /paperless/*` (Z. 162–164) hat **keinen** `header`-Block, die Kopfzeilen gelten also nur für `/paperless-app/*`. Wer die Zahl bewegt, muss beides zusammen rechnen.)* *(Korrigiert 06.08.2026, Lauf 11:2x: hier stand **55 %** mit der Begründung „keine CSP, API-Adresse ungeprüft". Der zweite Halbsatz ist belegt falsch: `logik.js` Z. 300 `basisPruefen()`, exportiert Z. 339, von `api.js` `setBase()` Z. 397–416 verwendet; **sieben** Unit-Tests in `tests/logik.test.js` Z. 421–472 decken genau die in H-2 geforderten Fälle ab (nur `https`, `http` nur für `localhost`/`127.0.0.1`, fremde Herkunft erst nach ausdrücklicher Erlaubnis, `javascript:` abgewiesen, Adresse mit Zugangsdaten abgewiesen) *(Zahl korrigiert 06.08.2026, Lauf 15:xx: hier stand „sechs Unit-Tests in `tests/logik.test.js` Z. 421–469". Es sind **sieben**, in diesem Lauf einzeln im Testcode nachgezählt — `test('basisPruefen: …')` in **Z. 421** (eigene Herkunft ist die Voreinstellung), **428** (`/api` wird nicht doppelt angehängt), **433** (fremde Herkunft nur nach ausdrücklicher Erlaubnis), **442** (`http` nur lokal), **448** (fremde Schemata werden abgewiesen), **455** (unvollständige Eingaben werden abgewiesen), **461** (Regression: Adresse mit Zugangsdaten). Mitkorrigiert ist die Zeilenspanne: der siebte Test endet erst in **Z. 472**, die alte Angabe „Z. 421–469" schnitt ihn mitten durch — das ist die wahrscheinliche Ursache der Fehlzählung. `docs/SECURITY.md` nennt die Sieben bereits richtig; die beiden Dateien widersprachen sich seit dem 14:19-Lauf. **Die Bereichszahl 65 % bleibt unverändert** — ein Zählfehler in einer Begründung bewegt keinen Bereichswert.)*; dazu die Browserprüfung `t_api_adresse_wird_geprueft` (`tests/browser_check.py` Z. 458/1597). K-4 gegengeprüft und **weiterhin offen**: kein `Content-Security-Policy` in `index.html`, `start.js` oder `sw.js`. Zu einer ungeprüften Gegenaussage in `docs/SECURITY.md` siehe den Ableitungsabschnitt.)* *(Querverweis nachgezogen 06.08.2026, Lauf 15:xx: **die hier als „ungeprüfte Gegenaussage" geführte Stelle ist seit dem 06.08. 14:19 geprüft.** `docs/SECURITY.md` ist an diesem Tag Aussage für Aussage durchgegangen worden; das Prüfprotokoll steht in der Datei selbst als **Abschnitt 9** („Prüfung dieser Datei gegen den heutigen Stand", Z. 291–344: 9 Aussagen bestätigt, 3 korrigiert, 2 Lücken ergänzt, 5 Punkte als ungeprüft gekennzeichnet). Ergebnis in der Sache: **die Gegenaussage hatte recht** — die Kopfzeilen stehen im Reverse Proxy, nicht in der App. Richtiggestellt hat `SECURITY.md` dabei ihre eigene stillschweigende Reichweite: Abschnitt 2 nennt jetzt ausdrücklich den **Geltungsbereich `/paperless-app/*`** (Z. 37–38) und benennt im Kasten Z. 49–60, dass der Nachbarblock `handle /paperless/*` (Caddyfile Z. 162–164) **keinen** `header`-Block hat. Neu ist dort außerdem **Abschnitt 7 „Was am Betrieb offen ist"** (Z. 238–271) mit vier belegt offenen Betriebspunkten. **Die Zahl 65 % bleibt auch hierfür unverändert** — ein nachgezogener Querverweis ist kein neuer Befund.)* **Diese Gegenprüfung vom 11:2x war methodisch falsch und ist am 12:0x widerlegt: sie hat im App-Repo gesucht, die CSP steht aber im Reverse Proxy.** |
| Performance | 45 % *(alt)* | Harte Decke bei ~2.000 Dokumenten in einer Liste (gemessen). **Nicht belegbar ohne Ausführung von `tests/perf_check.py`** — der Wert stammt vom 02.08.2026 und ist in diesem Lauf **nicht** überprüft worden. Eine Messung braucht einen Testlauf, den die Ausführungsrechte-Wand sperrt (`/opt/paperless/ops/AUSFUEHRUNGS-WARTESCHLANGE.md`). Der alte Wert bleibt bewusst stehen; er ist alt, nicht bestätigt. *(Nachgezogen 08.08.2026, `/opt/paperless-app/.venv-test/bin/python3 tests/perf_check.py`, `exit=0`, 12 von 12 Leistungsprüfungen bestanden — Eintrag 13 in `ops/AUSFUEHRUNGS-WARTESCHLANGE.md`: erste Ansicht bleibt bei **allen** getesteten Beständen (100/1.000/5.000/20.000/50.000 Dokumente) bei **2 Anfragen** an `/documents/` und **1.773 DOM-Knoten**, unverändert über die Bestandsgrößen — serverseitige Paginierung wirkt. Der `DOC_MAX`-Grenzfall (wiederholtes „Weitere laden" bis 1.200 Dokumente) zeigt den realen Risikobereich: **33.753 DOM-Knoten** nach 19 Klicks, der Hinweis „Grenze die Suche ein" erscheint. Das deckt sich mit der in K-3 als Stufe 1 vorgeschlagenen Lösung (Obergrenze fürs Nachladen) — die scheint inzwischen umgesetzt (`DOC_MAX`), womit die alte Prämisse „keine Obergrenze" aus K-3 nicht mehr zutrifft. Speicherverbrauch war in dieser Umgebung nicht messbar (kein `--enable-precise-memory-info`) und wird deshalb nicht behauptet. **Die Prozentzahl 45 % wird durch diesen Lauf NICHT neu berechnet** — das ist keine Aufgabe dieses Eintrags (Eintrag 13: „Kein Roadmap-Haken durch diesen Eintrag") und bräuchte einen eigenen Maßstab, wie ihn die übrigen neun Bereiche in der Neuableitung unten haben. Vollständige Ausgabe: `ops/AUSFUEHRUNGS-WARTESCHLANGE.md` Eintrag 13.)* |
| PWA | **85 %** | Offline und Selbstaktualisierung belegt; **die Cache-Version ist keine Handarbeit mehr, sondern eine Prüfsumme über den Hülleninhalt** (H-5 erfüllt). *(Korrigiert 06.08.2026, Lauf 11:2x: hier stand **75 %** mit „Cache-Version von Hand". Belegt falsch: `sw.js` Z. 37 `const VERSION = '91fb2ebabddb'` ist eine berechnete Prüfsumme, erzeugt und geprüft von `tools/huelle.py`; `tests/huelle_check.py` ist eine eigene Stufe der Prüfkette (`tests/run_e2e.py` Z. 41) und nennt H-5 im Kopfkommentar ausdrücklich als Anlass: „Seitdem ist die Version eine Pruefsumme ueber den Inhalt". Damit ist der einzige im 75 %-Text genannte Mangel geschlossen; die vier Browserprüfungen zu Worker/Hülle/Cache/Offline (`tests/browser_check.py` Z. 1629–1632) bleiben unverändert. Abzug bleibt für die in K-1/Store-Reife genannten Grenzen der PWA-Installation auf iOS.)* |
| **Barrierefreiheit** | **36 %** | Alle bekannten onClick/onPointerDown-Interaktionen im Vorlagenbaum liegen jetzt auf nativen Buttons oder semantisch benannten Regionen. Die A11y-Leitplanke steht bei 194 Buttons und 0 verbleibenden klickbaren div/span; Pull-to-refresh- und Posteingang-Swipe-Flächen sind als `section` mit zugänglichem Namen erhalten. Manuelle Screenreader-/Tastatur-Geraetepruefung steht weiterhin aus. *(Korrigiert 06.08.2026, Lauf 10:16: hier stand **45 %** — das war überholt, weil die Log-Einträge dieser Datei selbst den Bereich zweimal fortschreiben: Z. 1002 vom 04.08.2026, Batch 0.8.7 („Accessibility-Teilscore steigt von 34 Prozent auf 35 Prozent"), und danach Z. 1011 vom 04.08.2026, Batch „A11y-Batch: Sheet-Backdrop (0.8.8)" („Score: Barrierefreiheit 35 % -> 36 %"). Der jüngste belegte Wert ist **36 %** und ist hier genau so übernommen — **nicht** neu gerechnet und kein dritter Wert. Der beschreibende Text links daneben (194 Buttons, `section`-Flächen) gehört zu den Batches 0.8.9/0.8.10, für die diese Datei **keinen** Log-Eintrag führt — belegt nur in `docs/ROADMAP.md` Z. 32, Abschnitt „Aktueller Fokus (2026-08-04)". Der Text wurde also nachgezogen, die Prozentzahl nicht. Vollständiges Prüfergebnis über alle zehn Bereiche samt zwei offener Punkte: Abschnitt „Prüfung der Bereichstabelle gegen die eigenen Log-Einträge (2026-08-06, Lauf 10:16)" am Ende dieser Datei.)* |
| Dokumentation | **55 %** | Von den neun in M-6 geforderten Dokumenten sind **vier abgedeckt** (eines nur mittelbar), **fünf fehlen**. *(Korrigiert 06.08.2026, Lauf 11:2x: hier stand **30 %** mit „7 von 9 geforderten Dokumenten fehlen". Nachgezählt gegen die Liste in M-6 selbst (Z. 368–374): **Architecture** → `docs/MOBILE_ARCHITECTURE.md` plus die Modulübersicht in `CLAUDE.md`; **Security** → `docs/SECURITY.md`; **Deployment** → `docs/RELEASE.md` (Versionsschema, Ablauf 3.0–3.7, Rollback); **Development** → nur mittelbar, als Abschnitt „Build- & Testkommandos" in `CLAUDE.md`, kein eigenes Dokument — deshalb halb gezählt. Weiterhin **fehlend**: Troubleshooting, FAQ, Contributing, Support, Compatibility. Nicht auf der M-6-Liste, aber real vorhanden und hier nicht mitgerechnet: `docs/AUDIT.md`, `docs/ROADMAP.md`, `docs/GERAETE-CHECKLISTE.md`, zwei ADRs, `docs/brand/`. Rechnung: 30 % + (3,5/9 × 70) ≈ 57 %, auf das im übrigen Raster verwendete 5er-Gitter abgerundet auf **55 %**.)* *(Stand von `docs/SECURITY.md` nachgezogen 06.08.2026, Lauf 15:xx: Die Zeile zählt „**Security** → `docs/SECURITY.md`" als abgedeckt — das war und bleibt richtig, aber die Datei ist seit dem 06.08. **14:19** nicht mehr die vom 02.08.: Kopf auf 06.08. / `59c5fcf` / v0.9.3 / Paperless-ngx 3.0.5 gezogen, jede Aussage einzeln gegen den heutigen Stand geprüft, neuer **Abschnitt 7 „Was am Betrieb offen ist"** (Z. 238–271) und ein vollständiges **Prüfprotokoll in Abschnitt 9** (Z. 291–344). Das Dokument ist damit belastbarer als beim Ansatz dieser Zeile. **Die 55 % bewegen sich trotzdem nicht**, und zwar aus demselben Grund, aus dem der Watchdog am 15:0x für Rasterpunkt 3 „Lesart 1" entschieden hat: der Maßstab dieser Zeile ist die **Neunerliste aus M-6**, und die zählt Dokumente, nicht ihre Güte. Ein geprüftes Dokument ist kein zusätzliches Dokument — `docs/SECURITY.md` war vorher und ist nachher **eines von neun**. Wer für Qualität Punkte vergeben will, braucht dafür einen eigenen, vorher hingeschriebenen Maßstab.)* |
| CI/Release | 60 % | *Korrigiert 06.08.2026 — hier stand „0 % / Kein `.github/`, keine `package.json`, keine Versionierung".* Belegt vorhanden: `.github/workflows/pruefung.yml` (seit 02.08.; **seit 06.08. alle 11 Stufen** bei jedem Push auf `main` und bei jedem PR — 8 statische, die Leistungsstufe in einer eigenen Aufgabe, dazu API-Vertrag und Browser gegen eine Wegwerf-Instanz. *Korrigiert 06.08.2026, Lauf 12:2x: hier stand „9 Stufen … 7 statische". Das war bis dahin richtig; `a11y_check.py` und `perf_check.py` fehlten in der CI. Sie sind jetzt eingehängt — `a11y_check` als statischer Schritt, `perf_check` als eigene Aufgabe `leistung` mit Playwright-Install, weil die statischen Stufen laut Kopfkommentar „nichts als Python und Node" brauchen sollen. **Ungelaufen:** bewiesen ist das erst mit dem nächsten Actions-Lauf, `/opt/paperless/ops/AUSFUEHRUNGS-WARTESCHLANGE.md` Nr. 16.*), `VERSION` (0.9.3, einziger Ursprung der Versionsnummer, in CI durch `huelle_check.py` mitgeprüft) und `docs/RELEASE.md` (seit 06.08., Versionsschema, Ablauf 3.0–3.7, 10 Abnahmekriterien, Rollback). Abzug für: kein automatisierter Release-/Tag-Schritt, und seit `22f7c68`/`59c5fcf` ist nichts gepusht — die CI läuft derzeit also nicht gegen den aktuellen Stand (Deploy-Key fehlt, PO-STATUS.md offene Frage 3). **Keine `package.json` ist kein Mangel**, sondern Architekturentscheidung: das Projekt kommt bewusst ohne Build-Schritt und Paketmanager aus (CLAUDE.md, „Build- & Laufzeit-Konzept") |
| Store-Reife | **25 %** | K-1 ist **entschieden** (Capacitor) und die nativen Hüllen liegen im Repository — ausgeliefert ist nichts. *(Korrigiert 06.08.2026, Lauf 11:2x: hier stand **15 %** mit „als PWA **nicht** App-Store-fähig". Das ist überholt: `native/capacitor.config.json` (appId `ski.frigew.docuwunder`), `native/package.json` mit `@capacitor/android`+`@capacitor/ios` 8.5, erzeugte Plattformprojekte `native/android/` und `native/ios/`, Kopierschritt `native/vorbereiten.mjs`; die Wahl ist in `docs/MOBILE_ARCHITECTURE.md` Abschnitt 2 begründet („**Capacitor** — **Gewählt.**"), und `.gitignore` hält die Plattformprojekte ausdrücklich eingecheckt. Nur **+10**, weil dieselbe Datei sich selbst als „Machbarkeitsprüfung, keine Auslieferung" überschreibt: `native/node_modules/` fehlt, `native/android/app/build/` ist leer, es gibt keinen Store-Zugang, keine Signierung, keinen Eintrag und keinen belegten Build. Der Weg ist gewählt und begehbar gemacht, begangen ist er nicht.)* |

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

#### K-4 · ✅ ERLEDIGT — die CSP ist gesetzt (in Caddy, nicht in der App)

> **AUFGELÖST 06.08.2026.** Quelle: `/etc/caddy/Caddyfile` **Z. 190–197**, gelesen vom
> Watchdog am **06.08.2026 12:0x** (er hat für diese Datei eine hinterlegte
> Leseberechtigung; sie liegt außerhalb der Arbeitsverzeichnisse dieses Projekts).
> Vorgang: `/opt/paperless/ops/AUSFUEHRUNGS-WARTESCHLANGE.md` Eintrag 14.
>
> **Befund.** Im Block `handle /paperless-app/*` steht ein `header`-Block mit
> `Content-Security-Policy` **und** `X-Content-Type-Options: nosniff`,
> `Referrer-Policy: no-referrer`, `Permissions-Policy` (`camera=(self)`, Mikrofon,
> Geolocation, Payment und USB leer), `Cross-Origin-Opener-Policy: same-origin`,
> `Cross-Origin-Resource-Policy: same-origin`. Die Direktiven decken sich mit dem, was
> `docs/SECURITY.md` Abschnitt 2 seit dem 02.08. behauptet — unter anderem
> `default-src 'self'`, `script-src 'self'`, `style-src-attr 'unsafe-inline'`,
> `img-src 'self' blob: data:`, `connect-src 'self'`, `object-src 'none'`,
> `base-uri 'none'`, `frame-ancestors 'none'`, `form-action 'self'`.
> **Damit hat `docs/SECURITY.md` recht und dieser Befund war falsch.**
>
> **Der Merksatz, der wichtiger ist als der Befund selbst.** Die CSP steht **nicht in der
> App** (`index.html`, `start.js`, `sw.js`), sondern **im Reverse Proxy**. Ein `grep` im
> App-Repository kann sie deshalb gar nicht finden — und genau dieser `grep` war die
> „Gegenprobe", mit der K-4 am 02.08. behauptet und am 06.08. 11:2x noch einmal bestätigt
> wurde. Zwei Läufe, dieselbe blinde Stelle: **die Abwesenheit einer Kopfzeile im Quelltext
> ist kein Beleg für ihre Abwesenheit beim Browser.** Wer eine Kopfzeile prüft, prüft die
> Antwort (`curl -D -`) oder die Konfiguration des Auslieferers, nicht das Repository.
>
> **Was von K-4 sachlich übrig bleibt (kein Mangel mehr, aber wissenswert):** Die Policy
> erlaubt `style-src-attr 'unsafe-inline'`, weil die Oberfläche auf `style="…"` aufbaut
> (`stil()` in `ui.js`) — das ist bewusst so und in `docs/SECURITY.md` begründet. Das
> Inline-Skript ist inzwischen ohnehin nach `start.js` ausgelagert — `index.html` Z. 69–94
> enthält **ausschließlich** `<script src=…>`-Zeilen, kein einziges Skript im Dokument —,
> `script-src 'self'` gilt also ohne Ausnahme. Die unten stehende Lösungsbeschreibung ist damit **umgesetzt**,
> nicht mehr geplant.
>
> **NEUER, OFFENER PUNKT AUS DERSELBEN PRÜFUNG:** Der Block `handle /paperless/*`
> (Caddyfile **Z. 162–164**, also paperless-ngx selbst) enthält **keinen** `header`-Block.
> Die Sicherheits-Kopfzeilen gelten damit **nur für die App** unter `/paperless-app/*`,
> **nicht** für die Paperless-Oberfläche. Das ist kein Drama — paperless-ngx setzt über
> Djangos `SecurityMiddleware` einen Teil davon vermutlich selbst —, aber **ungeprüft**:
> welche Kopfzeilen dort wirklich ankommen, weiß derzeit niemand. Prüfauftrag:
> `ops/AUSFUEHRUNGS-WARTESCHLANGE.md` **Nr. 15** (rein lesend, `curl -D -` gegen
> `127.0.0.1:8099` und die öffentliche Adresse). Aufgenommen ist der Punkt auch in
> `ops/ABNAHME-CHECKLISTE.md`, Abschnitt 3 · Sicherheit.

**Der ursprüngliche Befund vom 02.08.2026, unverändert erhalten:**

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


## Meilenstein C, erster Schritt: Leistungs-Pruefstufe fuer grosse Bestaende (2026-08-03)

- Neu: `tests/perf_check.py`, als Stufe 7 in `tests/run_e2e.py` eingehaengt
  (11 Stufen statt 10). Misst reproduzierbar, wie die App auf 100 / 1.000 /
  5.000 / 20.000 / 50.000 synthetische Dokumente reagiert - ohne einen
  echten Paperless-Server mit Testdaten zu fuellen. Dafuer laeuft Playwright
  gegen die reale App-Auslieferung, aber jede Paperless-API-Antwort kommt
  aus Mock-Routing (`page.route`): Stammdaten (Tags, Korrespondenten,
  Dokumentarten, Lagerorte, Nutzer, Workflows, Freigaben, Mailregeln usw.)
  minimal/leer, `/documents/` liefert serverseitig paginiert genau die
  angeforderte Seite aus einer generierten Menge der gewuenschten Groesse.
- Ergebnis (10 von 10 Pruefungen gruen, siehe Testlauf): bei jeder der fuenf
  Archivgroessen laedt die erste Ansicht des Dokumente-Tabs nur eine Seite
  (`page_size=60`, 2 Anfragen an `/documents/` inkl. Ordnerabfrage) und das
  DOM im Listenbereich bleibt bei 1.773 Knoten / 121 sichtbaren Karten -
  unabhaengig davon, ob der Gesamtbestand 100 oder 50.000 Dokumente
  umfasst. Server-seitige Paginierung wirkt also wie vorgesehen: das
  eigentliche Problem, das Meilenstein C beschreibt, tritt bei einer
  frischen Ansicht NICHT auf.
- **Wichtige Praezisierung gegenueber der urspruenglichen Annahme:** Der
  reale Risikofall ist nicht "grosser Bestand insgesamt", sondern "viele
  bereits geladene Seiten in derselben Sitzung" - also wiederholtes
  "Weitere laden" bis nahe an `DOC_MAX = 1200` (`app.js`). Genau dieser
  Fall ist mit dieser Pruefstufe noch NICHT gemessen; dafuer muesste
  `mehrDocs()` in einer Schleife bis zur Grenze aufgerufen und danach DOM-
  Groesse/Scrollverhalten gemessen werden. Das ist der naechste Teilschritt
  von Meilenstein C, nicht dieser.
- Speicherverbrauch wird bewusst NICHT gemessen oder behauptet: Chromium
  liefert ohne `--enable-precise-memory-info` keine verlaesslichen Werte in
  dieser Umgebung. Die Pruefstufe sagt das explizit in ihrer Ausgabe, statt
  eine Zahl vorzutaeuschen.
- Zwei Implementierungsfehler beim Bau der Pruefstufe gefunden und behoben,
  keine Produktfehler: (1) Playwright ruft Routing-Callbacks mit zwei
  Positionsargumenten auf (`route`, `request`) - ein Handler mit nur einem
  Parameter erhielt das Request-Objekt versehentlich als Keyword-Argument
  `anzahl` und stuerzte mit `TypeError` ab; behoben durch `request=None` in
  jeder Handler-Signatur. (2) Das Zaehlen "nur eine Seite geladen" verglich
  zunaechst gegen die Substring `/documents/`, die auch auf
  `/documents/?...` UND auf spaeter im selben Testlauf ausgeloeste
  Ordnerabfragen wie `/documents/12/notes/`-artige Pfade traf; ein
  praeziserer regulaerer Ausdruck (`/documents/\?`) behebt die
  Falschzaehlung.
- Volle Suite (11 Stufen, 43 Browserpruefungen unveraendert plus neue
  Leistungsstufe) danach gruen.
- Nicht verifiziert: reales Geraet, echter Paperless-Server mit
  tatsaechlich 20.000+ Dokumenten (Netzwerklatenz, echte Serverlast, echte
  Thumbnail-Generierung fehlen im Mock). Diese Pruefstufe ersetzt keinen
  Lasttest gegen eine echte Instanz, sie schliesst nur die haeufigste
  Fehlerquelle (client-seitiges Ueber-Rendern) fruehzeitig und wiederholbar
  aus.
- Naechster Schritt: Pruefstufe um den DOC_MAX-Grenzfall (wiederholtes
  "Weitere laden") erweitern, danach Entscheidung, ob echte Fensterung
  (Virtualisierung) noch noetig ist oder ob serverseitige Paginierung samt
  DOC_MAX-Warnung bereits ausreicht - diese Messung war bislang nicht
  vorhanden, die Entscheidung stand also auf Annahme statt Beleg.
- Version: 0.7.0 -> 0.8.0 (MINOR: neue automatisierte Pruefstufe mit
  belastbarem, bislang fehlendem Leistungsbeleg fuer Meilenstein C).


## Meilenstein C, Beleg fuer den realen Risikofall (2026-08-03)

- Nachtrag zur Leistungs-Pruefstufe: `tests/perf_check.py` klickt jetzt in
  einem zusaetzlichen Szenario "Weitere laden" wiederholt (bis zu 25 mal)
  gegen einen 5.000-Dokumente-Mockbestand, bis der Grenzhinweis
  ("werden zäh") erscheint - der reale DOC_MAX-Grenzfall (1200 Dokumente,
  `app.js`), nicht nur der unkritische Erststart.
- Gemessenes Ergebnis: nach 19 Klicks auf "Weitere laden" (1.201 geladene
  Dokumente) liegen **33.753 DOM-Knoten** im Listenbereich. Zum Vergleich:
  eine frische Ansicht liegt bei jeder Archivgroesse bei 1.773 Knoten.
  Das ist der belastbare Beleg, den die bisherige Annahme "Fensterung noetig"
  bislang NICHT hatte - jetzt ist es eine Messung statt einer Vermutung.
- Einordnung: 33.753 DOM-Knoten fuer 1.200 Listeneintraege (~28 Knoten je
  Zeile: Karte, zwei Swipe-Buttons mit je Icon+Text, Titel, Untertitel,
  Datum, Tag-Chips, Trennlinie usw.) ist mit modernen Mobilgeraeten noch
  darstellbar, aber deutlich im Bereich, wo Scroll-Ruckeln, Layout-Thrashing
  bei Reflows und hoher Speicherverbrauch zu erwarten sind - insbesondere
  auf aelteren/schwaecheren Geraeten, die diese Umgebung nicht abbildet.
  Diese Pruefstufe bestaetigt damit begruendet (nicht nur behauptet), dass
  Meilenstein C (Fensterung/Virtualisierung) einen echten Nutzen haette,
  sobald jemand oft genug "Weitere laden" antippt oder stark filtert und
  dabei die Grenze streift.
- Bewusst keine automatische Fehlerbewertung an der DOM-Zahl selbst
  (`pruefe(..., True, ...)` fuer den zweiten Grenzfall-Check): es gibt noch
  keinen vereinbarten Schwellwert, ab dem die App "zu langsam" waere - eine
  erfundene Zahl waere unehrlich. Stattdessen ein informativer Hinweis
  (`HINWEIS`) ab 15.000 Knoten, der die Grenze sichtbar macht, ohne die
  Pruefstufe rot zu faerben, bevor eine Entscheidung getroffen ist.
- Volle Suite (11 Stufen, davon Leistungsstufe jetzt 12 statt 10
  Einzelpruefungen) danach gruen.
- Nicht verifiziert: Ruckeln/Speicherverbrauch auf einem echten, insbesondere
  aelteren, Mobilgeraet - nur DOM-Groesse in einem Desktop-Chromium ohne
  Geraeteemulation der CPU-Drosselung.
- Naechster Schritt: Entscheidung treffen, ob Fensterung/Virtualisierung
  jetzt umgesetzt wird (echte react-window-artige Loesung fuer die Liste,
  ohne Wischgesten/Screenreader-Zugaenglichkeit zu brechen - Risiko laut
  Risikotabelle "mittel/hoch") oder ob eine einfachere Zwischenloesung
  (z. B. DOC_MAX absenken, oder Grenzhinweis frueher zeigen) fuer die
  naechste Version genuegt. Diese Messung liefert die Entscheidungsgrundlage,
  trifft die Entscheidung aber nicht selbst.
- Version: 0.8.0 -> 0.8.1 (PATCH: Pruefstufe erweitert, kein neues
  Nutzerverhalten).


## Meilenstein B/Scanner, Zuschnittgriffe semantisch bedienbar (2026-08-03)

- Scanner-Zuschnitt: die vier gelben Eckgriffe sind keine anonymen `div`-Handles mehr, sondern native `button type="button"` mit eindeutigen zugänglichen Namen ("Zuschnitt Ecke … verschieben"). Touch-/Pointer-Verhalten bleibt erhalten, weil `onPointerDown` und dieselbe absolute Positionierung weiter genutzt werden.
- A11y-Leitplanke erweitert: `tests/a11y_check.py` zählt jetzt neben `onClick` auch `onPointerDown` auf `div`/`span`; dadurch werden die bewusst noch offenen Swipe-/Pull-Flächen in `tabs.js` und `dokument.js` nicht mehr übersehen. Die Baseline ist jetzt ehrlicher: 176 semantische Buttons, 7 verbleibende klick-/pointeraktive `div`/`span`.
- Einordnung: Das ist ein kleiner, aber scanner-relevanter Barrierefreiheitsbatch. Tastaturverschiebung der Zuschnittecken selbst ist damit noch nicht fertig; dafür braucht es einen Folge-Batch mit Pfeiltasten-Handling und Fokuszustand im Zuschnittmodus.
- Version: 0.8.1 -> 0.8.2 (PATCH: Scanner-A11y und Testleitplanke, kein API-/Datenmodellwechsel).

## API-Vertrag, robuster Papierkorb-Roundtrip (2026-08-03)

- Fehler behoben: Die API-Vertragspruefung fuer Upload -> Aufgabenverfolgung -> Loeschen nahm an, dass ein frisch geloeschtes Dokument im ersten `/trash/`-Ergebnis mit `page_size=100` auftaucht. Auf der Testinstanz enthaelt der Papierkorb inzwischen ueber 300 Eintraege; Paperless paginiert `/trash/`, dadurch war der Test rot, obwohl das Dokument korrekt im Papierkorb lag.
- `tests/api_check.py` prueft den Papierkorb jetzt seitenweise, bevor es das Testdokument endgueltig entfernt. Das ist keine Testabsenkung, sondern eine realistischere API-Vertragspruefung fuer volle Paperless-Instanzen.
- Verifikation: isoliert `python3 tests/api_check.py` gruen (24/24), danach volle Suite `python3 tests/run_e2e.py` gruen (11 Stufen). Browser-Proxy meldet weiterhin harmlose `BrokenPipeError`-Tracebacks durch vom Browser abgebrochene Weiterleitungen; die Browserpruefung selbst meldet keine Konsolenfehler.
- Produktionsreife-Score bleibt bei 56 %, weil kein Nutzerverhalten und keine neue Produktfaehigkeit hinzugekommen ist; die Backend-Integrationspruefung ist aber weniger flatterhaft.
- Version: 0.8.2 -> 0.8.3 (PATCH: Test-/Integrationsstabilitaet, kein API-/Datenmodellwechsel).

## Teststabilitaet, Browser-Proxy ohne BrokenPipe-Rauschen (2026-08-04)

- `tests/browser_check.py` behandelt vom Browser abgebrochene Proxy-Antworten (`BrokenPipeError`/`ConnectionResetError`) jetzt als erwartbares Transportereignis statt als Python-Traceback. Die Browserpruefung war vorher fachlich gruen, die komplette Suite enthielt aber unerwartetes Log-Rauschen; das erschwerte echte Fehler von harmlosen Navigationsabbruechen zu unterscheiden.
- Keine Produktlogik geaendert, kein Test abgeschwaecht: die HTTP-Antwort wird weiterhin normal geschrieben, nur ein abgebrochener Client wird sauber ignoriert.
- Verifikation: isoliert `python3 tests/browser_check.py` gruen (43/43) ohne BrokenPipe-Tracebacks; danach volle Suite `python3 tests/run_e2e.py` gruen (11 Stufen).
- Produktionsreife-Score bleibt bei 56 %, weil nur die Testsignalqualitaet verbessert wurde.
- Version: 0.8.3 -> 0.8.4 (PATCH: Test-/Integrationsstabilitaet, kein Nutzerverhalten).



## Meilenstein B/Scanner, Zuschnittgriffe per Tastatur bedienbar (2026-08-04)

- Scanner-Zuschnitt: die vier Eckgriffe behalten Pointer-/Touch-Bedienung, reagieren jetzt aber zusaetzlich auf Pfeiltasten; mit Umschalt+Pfeiltaste wird in groesseren Schritten verschoben. Die Buttons haben erweiterte zugängliche Namen und bleiben native `button type="button"`.
- Regressionstest ergaenzt: `tests/browser_check.py` oeffnet den Zuschnitt, fokussiert einen Griff und prueft, dass Pfeiltasten die Griffposition sichtbar veraendern. Damit ist der wichtigste offene Scanner-A11y-Folgepunkt aus 0.8.2 automatisiert abgesichert.
- Verifikation: isoliert `python3 tests/browser_check.py` gruen (44/44), volle Suite folgt in diesem Batch. Manuelle Screenreader-/Realgeraetepruefung bleibt offen; keine Behauptung vollstaendiger A11y-Konformitaet.
- Produktionsreife-Score bleibt bei 56 %, weil nur ein kleiner Scanner-A11y-Teil geschlossen wurde; Accessibility-Teilreife verbessert sich qualitativ, wird aber erst nach weiteren Tastatur-/Fokus-Batches angehoben.
- Version: 0.8.4 -> 0.8.5 (PATCH: Scanner-A11y und Regressionstest, kein API-/Datenmodellwechsel).


## Meilenstein B/Scanner, sichtbarer Fokus und Status im Zuschnitt (2026-08-04)

- Änderung: Scanner-Zuschnittgriffe besitzen einen sichtbaren Fokuszustand (`button[data-griff]:focus`) und eine `aria-live`-Statuszeile mit Prozentwerten für die aktuelle Zuschneidebox.
- Testevidenz: `python3 tests/run_e2e.py` grün mit 11 Stufen, 60 Unit-Tests, 24 API-Vertragsprüfungen und 44 Browserprüfungen. Die Browserprüfung deckt Fokusdarstellung, Tastaturbewegung und Statusaktualisierung ab.
- Produktionsreife bleibt bei 56 %; kein Score-Anstieg, weil reale Screenreader-/Mobilgeräteprüfung weiterhin aussteht und die restlichen Pointer-Flächen noch offen sind.
- Version: 0.8.5 -> 0.8.6.

## Meilenstein B/Scanner, Toast-Rueckgaengig semantisch bedienbar (2026-08-04)

- Aenderung: Der Rueckgaengig-Eintrag im Toast ist kein klickbarer span mehr, sondern ein nativer button mit zugaenglichem Namen. Damit ist die Scanner-/Upload-Toast-Aktion per Tastatur fokussierbar und ausloesbar, ohne Touch-Verhalten oder visuelle Gestaltung wesentlich zu veraendern.
- Testabdeckung: Die A11y-Leitplanke senkt die erlaubte Restschuld in vorlage/erfassen.js von 1 auf 0; die komplette E2E-Suite bestaetigt jetzt 193 Buttons und 6 verbleibende klickbare div/span in anderen Bereichen.
- Produktionsreife bleibt bei 56 Prozent, Accessibility-Teilscore steigt von 34 Prozent auf 35 Prozent, weil eine reale interaktive Restschuld geschlossen wurde. Manuelle Screenreader-/Mobilgeraetepruefung bleibt erforderlich.
- Version: 0.8.6 -> 0.8.7 (PATCH: Accessibility-Verbesserung, kein API-/Datenmodellwechsel).


### 2026-08-04 - A11y-Batch: Sheet-Backdrop (0.8.8)

- Systematik/Fund: Die verbliebenen interaktiven Sonderfaelle sind kategorisiert: `tabs.js` enthaelt vier Pull-to-refresh-Pointerflaechen, `dokument.js` eine Review-Swipeflaeche; `sheets.js` enthielt zusaetzlich einen echten klickbaren Backdrop.
- Umsetzung: Der Backdrop ist nun ein nativer `button type="button"` mit zugaenglichem Namen "Sheet schliessen" und unveraendertem visuellem/touch Verhalten.
- Test-Gate: `tests/a11y_check.py` senkt die zulaessige Baseline fuer `vorlage/sheets.js` auf 0 klickbare `div`/`span`; vollstaendige Suite muss vor Commit gruen sein.
- Score: Barrierefreiheit 35 % -> 36 %. Gesamtproduktionsreife bleibt 56 %, weil die verbleibenden manuellen Screenreader-/Geraetepruefungen und Pointerflaechen weiterhin relevant sind.
- Version: 0.8.7 -> 0.8.8 (PATCH).

## Goldstandard-Scanner, Auto-Ausloeser-Baseline (2026-08-04)

- Live-Kamera: ein standards-basierter Auto-Ausloeser ist ergaenzt. Er beobachtet lokal nur die Stabilitaet des Browser-`<video>`-Signals, gibt einen `aria-live`-Status aus, laesst sich per nativem Auto-Button ein-/ausschalten und loest nach stabilem Kamerabild genau eine Aufnahme ueber die bestehende Canvas-/Scan-Pipeline aus.
- Einordnung: Das ist noch keine Swift-Paperless-Paritaet und keine echte Dokument-/Fokus-/Bewegungserkennung; die weitere CV-gestuetzte Kanten-/Schaerfe-/Stabilitaetsbewertung bleibt offen und muss auf realen Mobilgeraeten verifiziert werden.
- Tests: `tests/browser_check.py` prueft mit einem echten Canvas-`MediaStream`, dass der Auto-Ausloeser aktiv ist und nach stabilem Bild eine erste Scan-Seite erzeugt. Volle Suite: 11 Stufen, 60 Unit, 24 API, 45 Browserpruefungen gruen.
- Version: 0.8.10 -> 0.8.11 (PATCH: Scanner-Autoausloeser-Baseline, kein API-/Datenmodellwechsel).

## Goldstandard-Scanner, Phase 5 real umgesetzt: Auto-Ausloeser nutzt echte Randerkennung (2026-08-04)

- Die Baseline aus 0.8.11 beobachtete nur, ob videoWidth/videoHeight/readyState des <video>-Elements ein paar Takte lang gleich blieben - reine Signalpruefung ohne Bezug zum Bildinhalt, loeste praktisch immer nach derselben festen Zeit aus, unabhaengig davon, ob ueberhaupt ein Dokument im Bild war. Diese Fassung setzt den seit Phase 4 vorgesehenen Zusammenhang zwischen Randerkennung (DWScan.randSchaetzen) und Auto-Ausloeser tatsaechlich um: erfassen.js zieht alle 350ms ein kleines (max. 260px) Standbild aus dem laufenden <video> und wertet es mit demselben Gradientenprofil-Algorithmus aus, der seit Phase 4 den Zuschnitt-Vorschlag liefert - keine zweite Implementierung, keine neue Abhaengigkeit.
- Ausgeloest wird, wenn randSchaetzen denselben Rand (Toleranz 3,5% je Koordinate) 3 Takte in Folge liefert - oder nach 9 Takten ganz ohne Randfund als bewusster Fallback (gemustertes/kontrastarmes Motiv soll den Ausloeser nicht dauerhaft blockieren). Bewusst NICHT umgesetzt: eine Vorab-Schaerfepruefung im Beobachtungstakt - schaerfeMass liefert auf dem kleinen Beobachtungsbild systematisch niedrige Werte und wuerde den Ausloeser blockieren; die bestehende Unschaerfe-Warnung nach der Aufnahme (volle Aufloesung, Phase 3) bleibt der richtige Ort dafuer.
- Tests: t_kamera_auto_ausloeser haertet die Mindestwartezeit (>=500ms, gemessen 1495ms) gegen ein sofortiges/inhaltsblindes Ausloesen ab; neu t_kamera_auto_ohne_rand_faellt_zurueck bestaetigt mit einem voellig gleichfoermigen Kamerabild den Fallback nach 9 Takten (gemessen 3182ms). Volle Suite: 11 Stufen, 60 Unit, 24 API, 46 Browserpruefungen gruen. Huellenversion neu berechnet (942d196998d7 -> bbed24ca5e86).
- Produktionsreife bleibt bei 56%: der Scanner-Auto-Ausloeser ist qualitativ deutlich naeher an echter Dokumenterkennung, aber ohne Geraeteverifikation (reales Licht, reale Dokumente, echte Telefonkamera) noch keine belastbare Faehigkeitszusage. Hinweis auf eine bestehende Dokumentationsinkonsistenz: der zusammenfassende Score in Abschnitt 1 dieses Dokuments zeigt 58%, waehrend die laufenden Batch-Eintraege seit mehreren Versionen 56% fortschreiben - das ist keine neue Verschlechterung, sondern ein bislang nicht bereinigter Unterschied zwischen der urspruenglichen Tabelle und der seither gepflegten Fortschreibung. Empfehlung fuer einen spaeteren Meilenstein-D-Batch: Score-Tabelle in Abschnitt 1 komplett neu aus dem aktuellen Stand ableiten statt zwei parallele Zahlen fortzufuehren.
- Nicht verifiziert: reale Dokumente unter realem Licht auf einem echten Telefon/WebView; die Schwellwerte sind ein Startwert, keine geraeteverifizierte Endabstimmung. Keine "Goldstandard"- oder Swift-Paperless-Paritaets-Aussage vor Geraeteverifikation.
- Version: 0.8.11 -> 0.9.0 (MINOR: der Auto-Ausloeser ist eine echte, inhaltsbezogene Faehigkeit statt einer inhaltsblinden Zeitschaltung - sichtbarer Verhaltenswechsel fuer Nutzer).

## Sheet-Fokusverwaltung: Fokus-Trap und Fokus-Rueckgabe (2026-08-04)

- Bisher setzte ein oeffnendes Sheet (Zuweisen, Loeschen, Automatisierung, etc.) den Tastaturfokus nicht in den Dialog; beim Schliessen landete der Fokus auf `<body>`, die naechste Tab-Taste fing wieder ganz vorn an. Fuer Tastatur-/Screenreader-Nutzung ist das ein WCAG-2.4.3-relevanter Mangel (Fokusreihenfolge/Fokus-Sichtbarkeit bei modalen Dialogen).
- Umsetzung in `app.js`/`vorlage/sheets.js`: das Sheet-Panel traegt jetzt `role="dialog"`, `aria-modal="true"`, `tabindex="-1"`. Beim Oeffnen (`componentDidUpdate`) wird sich das zuvor fokussierte Element gemerkt und der Fokus auf das erste fokussierbare Element im Panel gesetzt (`sheetRef`). Ein echter Fokus-Trap (`sheetKeyDown`) haelt Tab/Umschalt+Tab innerhalb des Panels. Beim Schliessen geht der Fokus zurueck an das Element, das das Sheet geoeffnet hat.
- Keine Layout-/Touch-Aenderung: Backdrop-Button, Animationen und Struktur bleiben unveraendert; nur Fokusverhalten und ARIA-Attribute wurden ergaenzt.
- Tests: volle Suite lief nach der Aenderung durch - 11 Stufen gruen (Huelle, Leistung bei grossen Bestaenden, API-Vertrag [24/24], Browser [46/46]), keine Konsolenfehler, kein Testverlust. Kein dedizierter neuer automatisierter Fokus-Trap-Test fuer Sheets ergaenzt - offene Nacharbeit fuer den naechsten Accessibility-Batch (Playwright/axe-Tastaturtest fuer Sheet-Oeffnen/-Schliessen).
- Nicht verifiziert: manuelle Pruefung mit VoiceOver/TalkBack/NVDA und echtem Tastatur-only-Durchlauf steht weiterhin aus.
- Version: 0.9.0 -> 0.9.1 (PATCH: Accessibility-Verbesserung an bestehenden Dialogen, kein API-/Datenmodellwechsel, kein neues sichtbares Feature).

## Prüfung der Bereichstabelle gegen die eigenen Log-Einträge (2026-08-06, Lauf 10:16)

**Kein Code-Batch, keine Versionsänderung — VERSION bleibt 0.9.3.** Diese Prüfung ist reine
Schreibarbeit an dieser Datei; keine App-Quelldatei wurde angefasst, kein Test gelaufen.

**Warum dieser Abschnitt am Dateiende steht und nicht bei der Tabelle:** Die Korrekturnotizen
in Abschnitt 1 zitieren Zeilennummern dieser Datei (z. B. Z. 968–1025 im Kopf). Jede Einfügung
weiter oben hätte sie verschoben und damit alle Belege des 09:12-Laufs entwertet. Deshalb steht
hier der Bericht und in Zeile 46 nur die Korrektur selbst — die ersetzt genau eine Zeile durch
genau eine Zeile und verschiebt nichts.

**Auftrag und Abgrenzung.** Geprüft wurde: Wo schreibt ein **jüngerer** Log-Eintrag im hinteren
Teil dieser Datei (ab Z. 576) für einen Bereich der Tabelle (Z. 38–49) eine **andere** Zahl
fort? Die vom Dokument selbst empfohlene vollständige Neuableitung der Bereichstabelle
(Z. 1026) war **nicht** beauftragt und ist **nicht** erfolgt.

**Suchweise.** Je Bereich mit dem **Namen** gesucht, nicht mit der Prozentzahl — Lehre des
09:12-Laufs, dass Zahlen auch ausgeschrieben vorkommen („bleibt bei 56 Prozent", Z. 1002) und
bei einer reinen Zahlensuche durchfallen. Zusätzlich gesucht: `Score`, `Reife`, `Teilscore`,
`Teilbereich`, `Prozent`, `%`, `steigt`, `angehoben`.

**Ergebnis: ein Widerspruch, neun geprüfte Bereiche ohne widersprechenden Log-Eintrag.**

| Bereich | Fundstellen im Log-Teil (ab Z. 576) | Ergebnis |
|---|---|---|
| Funktionsumfang 90 % | nur Z. 817 („kein neuer Funktionsumfang in scan.js selbst") — Wortverwendung, keine Bereichszahl | geprüft, unverändert |
| Testabdeckung 80 % | Z. 1001 beginnt mit „Testabdeckung:", nennt aber Buttons/Restschuld, **keine** Bereichszahl | geprüft, unverändert (siehe offener Punkt 1) |
| Architektur 65 % | nur Z. 659 („Architektur-/Phasenplan") — Wortverwendung, keine Bereichszahl | geprüft, unverändert |
| Sicherheit 55 % | nur Z. 600 / Z. 605 („Sicherheits-/CI-Batch", „Sicherheits-/Release-Gate") — keine Bereichszahl | geprüft, unverändert |
| Performance 45 % | Z. 909 / Z. 941 (perf_check, Meilenstein C) nennen DOM-Knoten, Stufen und Versionen, **keine** Bereichszahl | geprüft, unverändert |
| PWA 75 % | keine Fundstelle im Log-Teil | geprüft, unverändert |
| **Barrierefreiheit 45 %** | Z. 1002 (04.08.2026, Batch 0.8.7: 34 → 35 %) und danach Z. 1011 (04.08.2026, Batch „A11y-Batch: Sheet-Backdrop (0.8.8)": 35 → **36 %**) | **korrigiert auf 36 %** (Z. 46) |
| Dokumentation 30 % | nur Z. 663 („Reine Dokumentation, kein Codeeingriff") — keine Bereichszahl | geprüft, unverändert |
| CI/Release 60 % | keine Bereichszahl im Log-Teil; die 60 % stammen aus der Korrektur vom 06.08.2026 in der Zeile selbst (09:12-Lauf) | geprüft, unverändert |
| Store-Reife 15 % | keine Fundstelle im Log-Teil | geprüft, unverändert |

„Geprüft, unverändert" heißt: gesucht **und** nichts gefunden — das ist ein Ergebnis, kein
Ausbleiben von Arbeit.

**Zur einen Korrektur (Z. 46).** Übernommen ist exakt der jüngste belegte Wert **36 %** aus
Z. 1011. Es wurde **nichts** neu gerechnet und kein dritter Wert gebildet. Nebenbefund, der
festgehalten gehört: Der beschreibende Text derselben Zeile (194 Buttons, 0 klickbare
`div`/`span`, `section`-Flächen) beschreibt einen Stand **nach** 0.8.8 — er gehört zu den
Batches 0.8.9/0.8.10, für die diese Datei **keinen** Log-Eintrag führt (belegt nur in
`docs/ROADMAP.md` Z. 32, „Aktueller Fokus (2026-08-04)"). Der Text wurde also irgendwann
nachgezogen, die Prozentzahl daneben nicht. Genau daraus entstand der Widerspruch.

**Zwei offene Punkte, bewusst festgehalten statt weggerechnet:**

1. ~~**`Testabdeckung 80 %` nennt in der Begründung „44 Browserprüfungen".**~~ **AUFGELÖST
   06.08.2026, Lauf 11:2x — der gültige Wert ist 47.** Ursprünglicher Befund: Ein jüngerer
   Eintrag derselben Datei belegt **46/46** (Z. 1035, 04.08.2026, Fokus-Trap-Batch);
   `/opt/paperless/PO-STATUS.md` (Tageslog 00:40 CHAYA) und `ops/ABNAHME-CHECKLISTE.md`
   (Rasterpunkt 6) nennen für den Kopf-Codestand `59c5fcf` **47/47**. Der 10:16-Lauf hat das
   bewusst nicht entschieden, weil es aus dem Log-Teil dieser Datei allein nicht belegbar war.
   Entschieden wurde es jetzt aus der einzigen Quelle, die es entscheiden kann: dem Testcode.
   `tests/browser_check.py` Z. 1586–1632 registriert **47** Prüfungen; Gegenprobe 47 `def t_*`
   (Z. 238–1572). Weder 44 noch 46 sind für `59c5fcf` erreichbar. Beide waren zu ihrer Zeit
   richtig — 46 + der seither ergänzte `t_sheet_fokus_trap` (Z. 1419/1626) = 47, exakt die
   Nacharbeit, die Z. 1035 selbst als offen notiert. Zahl in Z. 41 korrigiert; Herleitung,
   Zählmuster und die geprüften Bedingungen im Abschnitt „Auszählung der Browserprüfungen aus
   dem Testcode (2026-08-06, Lauf 11:2x)" am Ende dieser Datei.
2. **Die Summe der Bereiche passt nicht zur Kopfzahl 56 %.** Sie tat es schon vorher nicht —
   die Kopfzahl ist eine Fortschreibung (Z. 28–36), die Bereichstabelle stammt vom 02.08.2026.
   Durch die Korrektur −9 Punkte bei Barrierefreiheit wird der Abstand größer. Auftragsgemäß
   wurde **nicht** nachgerechnet und die **Kopfzahl bleibt bei 56 %**. Die Abweichung bleibt
   hiermit als offener Punkt notiert; sie fällt mit der vollständigen Neuableitung der
   Bereichstabelle weg, die Z. 1026 empfiehlt und die weiterhin aussteht.
   **TEILAUFGELÖST 06.08.2026, Lauf 11:2x.** Die Neuableitung ist erfolgt (Abschnitt
   „Neuableitung der Bereichstabelle" am Dateiende) — **acht** der zehn Bereiche sind jetzt
   aus dem Codestand belegt, **zwei** nicht (Performance braucht einen Lauf von
   `tests/perf_check.py`, Barrierefreiheit braucht die Geräteprüfung). Nebenbefund, der die
   Frage der „nicht passenden Summe" weitgehend erklärt: die Kopfzahl **56 % war exakt das
   ungewichtete Mittel der zehn Bereiche**, so wie die Tabelle nach der 09:12-Korrektur
   (CI/Release 0 → 60 %) dastand — 560/10 = 56,0. Erst die 10:16-Korrektur
   (Barrierefreiheit 45 → 36 %) hat daraus 551/10 = 55,1 % gemacht. Die Tabelle und der Kopf
   waren also nicht willkürlich auseinander, sondern um genau 0,9 Punkte. **Die Kopfzahl
   bleibt trotzdem bei 56 %**, weil die Neuableitung sie nicht vollständig trägt — was dafür
   noch fehlt, steht am Ende jenes Abschnitts.

**Nicht geprüft in diesem Lauf:** ob die Bereichszahlen inhaltlich noch stimmen (das wäre die
Neuableitung), ob die Belege der Log-Einträge selbst zutreffen, und der Codestand — es wurde
nur Datei gegen Datei gelesen, kein Test, kein Skript, kein Docker-Befehl.

## Auszählung der Browserprüfungen aus dem Testcode (2026-08-06, Lauf 11:2x)

**Kein Code-Batch, keine Versionsänderung — VERSION bleibt 0.9.3.** Reine Lese- und
Schreibarbeit. **Es wurde kein Test ausgeführt** (Ausführungsrechte-Wand, siehe
`/opt/paperless/PO-STATUS.md`); gezählt wurde im Quelltext.

**Ergebnis: 47 Prüfungen. Eindeutig, unbedingt.** Damit ist offener Punkt 1 aufgelöst und
Z. 41 von 44 auf 47 korrigiert.

### Das Zählmuster (damit die Zahl nachprüfbar ist)

`tests/browser_check.py` zählt nicht über Dekoratoren oder Namenskonventionen, sondern über
**eine einzige Liste und einen einzigen Aufrufpunkt**:

| Was | Fundstelle | Beleg |
|---|---|---|
| Der Zähler | Z. 139 | `ergebnisse = []` — die einzige Sammelliste der Datei |
| Die Registrierung | Z. 142–152 | `def pruefe(name, fn)` hängt **genau einen** Eintrag an `ergebnisse` an, auf jedem der drei Pfade: Erfolg (Z. 145), `AssertionError` (Z. 148), sonstige Ausnahme (Z. 151). Kein Pfad überspringt das Anhängen |
| Der einzige Aufrufpunkt | Z. 1634 | `pruefe(name, fn)` — steht **einmal** in der Datei (außerhalb der Definition), innerhalb der Schleife |
| Die Prüfliste | Z. 1585–1633 | `for name, fn in [ … ]:` — ein Literal ohne Bedingung, ohne Verzweigung, ohne `+`-Verkettung |
| Die Ausgabezeile | Z. 1642 / 1644 | `f"{len(fehler)} von {len(ergebnisse)} Pruefungen fehlgeschlagen"` bzw. `f"Alle {len(ergebnisse)} Pruefungen bestanden"` — das „x/y" der Berichte ist also exakt `len(ergebnisse)` |

**Gezählt nach diesem Muster: die Listeneinträge Z. 1586 bis Z. 1632, ein Eintrag je Zeile —
das sind 1632 − 1586 + 1 = 47.** Erster Eintrag Z. 1586 `("Oberflaeche baut sich auf", …)`,
letzter Eintrag Z. 1632 `("App startet ohne Netz", …)`.

**Zwei unabhängige Gegenproben:**

1. **Funktionszählung.** Die Datei definiert genau **47** Prüffunktionen `def t_*` (erste
   Z. 238 `t_aufgebaut`, letzte Z. 1572 `t_startet_ohne_netz`). Jede kommt in der Liste genau
   einmal vor; es gibt keine definierte, aber nicht registrierte Funktion und keinen
   Listeneintrag ohne Funktion. Definitionen und Registrierungen stimmen also überein.
2. **Historische Anschlussprobe.** Z. 1035 (04.08.2026, Fokus-Trap-Batch) belegt **46/46** und
   notiert im selben Satz als offene Nacharbeit: „Kein dedizierter neuer automatisierter
   Fokus-Trap-Test fuer Sheets ergaenzt". Genau dieser Test existiert heute
   (`t_sheet_fokus_trap`, definiert Z. 1419, registriert Z. 1626). 46 + 1 = **47**. Die
   ältere Zahl 44 ist ebenso erklärt: Z. 986/994 (03./04.08.) belegen 44/44, Z. 1018 dann 45,
   Z. 1025 dann 46 — eine lückenlos aufsteigende Kette 44 → 45 → 46 → 47.

### Die Bedingungsfrage (der häufigste Fehler bei so einer Zählung)

Ausdrücklich geprüft, ob die Gesamtzahl von einer Bedingung abhängt — sie hängt **nicht**
davon ab. Es gibt drei bedingte Stellen, und keine davon verändert die 47:

| Bedingung | Fundstelle | Wirkung auf die Zahl |
|---|---|---|
| **Playwright fehlt** | Z. 157–161 | `main()` kehrt mit `return 0` zurück, **bevor** die Liste erreicht wird. Ergebnis: **0** Prüfungen, und die Zeile „x/y" wird nie gedruckt — stattdessen „Browserpruefung uebersprungen". Also 47 **oder gar keine Ausgabe**, nie eine Zahl dazwischen |
| **Kein API-Token** | Z. 38–46 | `token()` bricht mit `sys.exit(2)` ab, schon beim Import (Z. 49). Kein Lauf, keine Zahl |
| **Server ohne passende Daten** | Z. 345, 361, 383 | Drei Prüffunktionen können früh mit `return "uebersprungen – …"` aussteigen (keine Dokumentarten / kein Dokument mit brauchbarem Titel / kein Dokument vorhanden). **Das senkt die Gesamtzahl nicht:** ein `return` ist für `pruefe()` ein normaler Rücklauf, wird über Z. 145 als *bestanden* gezählt und erscheint als „ok … – uebersprungen …" in der Ausgabe. Diese drei bleiben Teil der 47 |

Die dritte Zeile ist der Punkt, an dem eine Auszählung typischerweise 44 oder 46 herausbekäme:
inhaltsabhängig übersprungene Prüfungen **verschwinden hier nicht aus der Summe**. Die
Differenz 46 vs. 47 hat mit Bedingungen also nichts zu tun — sie ist rein zeitlich (der
Fokus-Trap-Test kam nach dem 46er-Lauf dazu).

### Was damit **nicht** belegt ist

Gezählt ist, wie viele Prüfungen dieser Codestand **definiert** — nicht, dass sie grün sind.
Die Aussage „47/47 grün" stammt aus `/opt/paperless/PO-STATUS.md` (Tageslog 00:40 CHAYA) und
ist hier nur auf ihre **Nennerzahl** hin bestätigt worden, nicht auf den Zähler. Ein grüner
Lauf zu `59c5fcf` ist in dieser Sitzung nicht reproduziert worden.

### Weitere Fundstellen derselben Zahl (geprüft)

Per `grep` über `/opt/paperless-app/docs/*.md`, `/opt/paperless/ops/ABNAHME-CHECKLISTE.md`,
`/opt/paperless/README.md`, `/opt/paperless/BETRIEBSHANDBUCH.md` und
`/opt/paperless/ROADMAP.md` gesucht:

- **Korrigiert:** nur Z. 41 dieser Datei. Das war die einzige Fundstelle, die 44 als **Aussage
  über den aktuellen Stand** führte.
- **Bewusst nicht angefasst — historische Log-Einträge, die zu ihrem Datum richtig waren:**
  `docs/AUDIT.md` Z. 986/994 (44), Z. 1018 (45), Z. 1025/1035 (46);
  `docs/ROADMAP.md` Z. 971 (44), Z. 992 (45), Z. 998 (46);
  `docs/adr/0005-goldstandard-scanner.md` Z. 195/218/230 (43/45/46) sowie die älteren
  37/40/41/43er-Einträge. Ein Log-Eintrag beschreibt einen Lauf zu einem Zeitpunkt; ihn auf
  47 zu ziehen wäre Geschichtsfälschung, nicht Korrektur.
- **Befund ohne Korrektur, gehört nach `/opt/paperless/ops/ABNAHME-CHECKLISTE.md`:** Z. 269
  („App: zuletzt belegter Vollauf grün") zitiert korrekt aus `docs/ROADMAP.md` Z. 971 und
  endet bei **46** — während Z. 271 derselben Datei für denselben Codestand 47/47 nennt. Das
  Zitat ist richtig, die Schlussfolgerung „zuletzt belegt" ist überholt. **Nicht geändert**,
  weil Z. 269 zur Punktevergabe von Rasterpunkt 6 gehört und die Rasterpunkte 1b/7 am
  06.08. 10:2x frisch nachgerechnet wurden; die Korrektur gehört in die Hand dessen, der das
  Raster führt. Ebenso Z. 394 (Rasterpunkt G), die den jetzt aufgelösten Widerspruch als
  Begründung für einen **−1**-Abzug führt — dieser Abzugsgrund ist mit diesem Lauf entfallen,
  die Neubewertung steht dem Watchdog zu, nicht diesem Lauf.

## Neuableitung der Bereichstabelle (2026-08-06, Lauf 11:2x)

**Kein Code-Batch, keine Versionsänderung — VERSION bleibt 0.9.3.** Keine App-Quelldatei
angefasst, **kein Test ausgeführt**. Alles unten ist aus Dateien gelesen, nicht gemessen und
nicht gelaufen.

Dies ist die Neuableitung, die Z. 1026 seit dem 04.08.2026 empfiehlt und die der 10:16-Lauf
als offenen Punkt 2 hinterlassen hat. Sie ist **teilvollständig**: acht Bereiche sind belegt,
zwei nicht.

### Wo die Zeilenbelege dieser Datei geblieben sind

Gegengeprüft wie beim 10:16-Lauf: Die Korrekturen in Abschnitt 1 ersetzen jeweils **eine
Zeile durch eine Zeile** (Tabellenzeilen sind einzeilig), und alles Neue steht am Dateiende.
Die zitierten Zeilennummern **Z. 1002, 1011, 1026 und 1035** stehen nach diesem Lauf
unverändert an ihrer Stelle; nachgeprüft per `grep -n` auf den jeweiligen Wortlaut.

### Methode — und was sie nicht ist

Die Datei hat nie dokumentiert, **wie** die zehn Bereichszahlen am 02.08.2026 zustande kamen.
Eine Zahl „neu abzuleiten" heißt hier deshalb ausdrücklich **nicht**, ein neues Rechenmodell
zu erfinden und zehn frische Werte auszuwerfen — das wäre genau die unbelegte Zahlenbildung,
die dieses Projekt verbietet. Angewandt wurde stattdessen eine engere, nachprüfbare Regel:

> **Eine Bereichszahl wird nur dann bewegt, wenn ein in dieser Datei namentlich geführter
> Befund dieses Bereichs seinen Zustand belegbar geändert hat.** Bewegt wird um den Betrag,
> den der Befund in der Begründung des alten Wertes ausmachte, auf dem 5er-Gitter, das die
> Tabelle ohnehin verwendet. Ändert sich nichts Belegtes, bleibt die Zahl stehen — auch dann,
> wenn sie „gefühlt" falsch ist.

Der beschreibende **Text** einer Zeile wird dagegen immer korrigiert, wenn er belegt falsch
ist, auch ohne Zahlenbewegung (so bei Architektur).

Ein **Fund zur Herkunft der Kopfzahl** fiel dabei nebenbei ab und ist unten festgehalten.

### Die zehn Bereiche

| # | Bereich | alt | neu | Belegte Grundlage |
|---|---|---:|---:|---|
| 1 | Funktionsumfang | 90 % | **90 %** | *Bestätigt, nicht bewegt.* Die Begründung „keine Attrappen mehr" hält: `grep` über `app.js`, `api.js`, `erfassen.js`, `scan.js`, `ordnung.js`, `betrieb.js`, `suche.js`, `vorschau.js`, `mitglieder.js`, `sperre.js`, `logik.js` nach `TODO`/`FIXME`/`Attrappe`/`Platzhalter`/`noch nicht implementiert` findet **zwei** Treffer, beide sind Kommentare über bewusste Oberflächen-Platzhalter (`app.js` Z. 1464 „Rechte Spalte ohne Auswahl", `vorschau.js` Z. 77 „gezeichnetes Blatt"), kein unfertiger Code. Seit dem 02.08. sind Fähigkeiten **dazu**gekommen (Auto-Auslöser mit Randerkennung v0.9.0, optionales TOTP-Feld v0.9.3) — für eine Erhöhung fehlt aber ein Maßstab, was 100 % wäre. Bleibt bei 90 % |
| 2 | Testabdeckung | 80 % | **80 %** | *Zahl bestätigt, Begründung korrigiert (44 → 47).* Alle vier Zahlen der Begründung erstmals im Code nachgezählt: **11 Stufen** (`tests/run_e2e.py` Z. 34–51: neun statische + zwei gegen den Server), **60 Unit-Tests** (`tests/logik.test.js`, 60 × `test(` am Zeilenanfang), **24 API-Prüfungen** (`tests/api_check.py` Z. 490–515, Liste `PRUEFUNGEN`), **47 Browserprüfungen** (`tests/browser_check.py` Z. 1586–1632 — eigener Abschnitt oben). Die genannte Lücke „Fehlerpfade" besteht fort. Kein belegter Grund für eine Bewegung |
| 3 | Architektur | 65 % | **65 %** | *Zahl bestätigt, Begründung korrigiert (2.145 → 2.260 Zeilen).* `wc -l app.js` = **2.260**; die Datei ist seit dem Audit um 115 Zeilen gewachsen. M-1 (Z. 325–336) forderte die Auslagerung von Sitzung, Navigation, Dokumentliste, Einstellungen — **keine** dieser vier Dateien existiert (`ls` im Wurzelverzeichnis: kein `sitzung.js`, `navigation.js`, `dokumente.js`, `einstellungen.js`). Der Befund ist also offen **und** der Trend läuft rückwärts. Trotzdem **kein Abschlag**: Für „wie viel kostet ein Wachstum um 115 Zeilen" gibt es keinen Maßstab in dieser Datei, und ein erfundener Abschlag wäre schlimmer als ein alter Wert |
| 4 | Sicherheit | 55 % | **65 %** | *Bewegt, +10.* Die alte Begründung nannte drei Dinge: XSS behoben (H-1), keine CSP (K-4), API-Adresse ungeprüft (H-2). **H-2 ist erfüllt** — `logik.js` Z. 300 `basisPruefen()`, Export Z. 339, Verwendung in `api.js` `setBase()` Z. 397–416, **sieben** Unit-Tests `tests/logik.test.js` Z. 421–472 (nur `https`; `http` nur `localhost`/`127.0.0.1`; fremde Herkunft erst nach ausdrücklicher Erlaubnis; `javascript:` abgewiesen; Adresse mit eingebetteten Zugangsdaten abgewiesen — das ist Punkt für Punkt die Lösung, die H-2 Z. 261–265 verlangt) *(Zahl und Spanne korrigiert 06.08.2026, Lauf 15:xx: hier stand „sechs Unit-Tests `tests/logik.test.js` Z. 421–469". Nachgezählt: sieben `test('basisPruefen: …')` in Z. 421/428/433/442/448/455/461, der letzte endet in Z. 472. Dieselbe Fehlzählung stand in der Bereichszeile „Sicherheit" (Z. 43) und ist dort mit derselben Begründung gezogen. **Die abgeleitete Zahl 65 % bleibt unverändert** — der Zählfehler betrifft nur die Begründung, nicht die Ableitung: entscheidend war „H-2 ist erfüllt", und das bleibt es mit sieben Tests erst recht.)*, dazu die Browserprüfung `t_api_adresse_wird_geprueft` (`tests/browser_check.py` Z. 458/1597). **K-4 bleibt offen**, gegengeprüft: kein `Content-Security-Policy` in `index.html`, `start.js`, `sw.js`. Einer von zwei offenen Punkten geschlossen, der kritische bleibt → +10, nicht mehr |
| 5 | Performance | 45 % | **45 % (alt)** | **Nicht belegbar ohne Ausführung.** Die 45 % stammen aus einer Messung vom 02./03.08.2026 (K-3, Z. 153 ff.; Prüfstufe `tests/perf_check.py`). Ob die Decke bei ~2.000 Dokumenten noch dort liegt, entscheidet **nur ein Lauf von `tests/perf_check.py`** — gesperrt durch die Ausführungsrechte-Wand. Der Wert bleibt unverändert stehen und ist hiermit ausdrücklich als **alt und unbestätigt** gekennzeichnet. Keine Schätzung an seine Stelle *(Nachgezogen 08.08.2026: der Lauf ist inzwischen erfolgt, Eintrag 13 in `ops/AUSFUEHRUNGS-WARTESCHLANGE.md`, `exit=0`, 12 von 12 bestanden — Details in der Bereichszeile Z. 44. Damit ist Performance **nicht mehr unbelegt**, aber auch **nicht neu berechnet**: der Lauf liefert Fakten, keine Prozentzahl, und eine Neuableitung dieses einen Bereichs mitten in einer bereits abgeschlossenen Neuableitungsrunde würde den Vergleich mit den übrigen neun Zeilen verzerren. Bleibt für eine künftige, vollständige Neuableitung stehen.)* |
| 6 | PWA | 75 % | **85 %** | *Bewegt, +10.* Der einzige Mangel, den die alte Begründung nannte, ist geschlossen: **H-5 („Cache-Version von Hand", Z. 307 ff.) ist erfüllt.** `sw.js` Z. 37 führt `VERSION` als berechnete Prüfsumme (`91fb2ebabddb`), erzeugt von `tools/huelle.py`; `tests/huelle_check.py` ist eine eigene Stufe der Kette (`tests/run_e2e.py` Z. 41) und benennt H-5 im Kopfkommentar als Anlass („Seitdem ist die Version eine Pruefsumme ueber den Inhalt"). Die vier Browserprüfungen zu Worker, Hülle, Cache-Inhalt und Offline-Start (`tests/browser_check.py` Z. 1629–1632) bestehen unverändert. Rest-Abzug bleibt für die iOS-Installationsschwäche, die K-1 beschreibt |
| 7 | Barrierefreiheit | 36 % | **36 % (Rest alt)** | *Nicht bewegt — frisch und nur teilweise belegbar.* Der Wert ist erst am 06.08. 10:16 aus Z. 1011 gezogen worden und wird hier **nicht** erneut angefasst. Belegt bestätigt ist der beschreibende Teil: `tests/a11y_check.py` führt für **alle acht** `vorlage/*.js` eine Baseline von **0** klickbaren `div`/`span` und erzwingt mindestens 25 Buttons — die Aussage „0 verbleibende klickbare div/span" ist also nicht behauptet, sondern durch eine Prüfstufe gesichert. **Nicht belegbar ohne Geräteprüfung** ist der Rest: `docs/GERAETE-CHECKLISTE.md` führt 29 Prüfpunkte (bis „### 29 · Wärme, Akku und PDF-Größe"), und der Kopf der Datei ist **leer** (Z. 24–29: Gerät, Betriebssystem, Browser, Datum unausgefüllt) → **0 von 29 durchgeführt**. Solange das so ist, kann die Zahl nicht steigen |
| 8 | Dokumentation | 30 % | **55 %** | *Bewegt, +25.* Dieser Bereich hat als einziger einen **eigenen Maßstab in der Datei**: M-6 (Z. 368–374) zählt neun geforderte Dokumente auf. Nachgezählt gegen diese Liste: **Architecture** → `docs/MOBILE_ARCHITECTURE.md` (+ Modulübersicht in `CLAUDE.md`), **Security** → `docs/SECURITY.md`, **Deployment** → `docs/RELEASE.md`, **Development** → nur mittelbar als Abschnitt „Build- & Testkommandos" in `CLAUDE.md`, deshalb **halb** gezählt. Fehlend bleiben fünf: Troubleshooting, FAQ, Contributing, Support, Compatibility. Rechnung auf dem Maßstab der Zeile selbst: 30 % + (3,5/9 × 70) ≈ 57 %, auf das 5er-Gitter der Tabelle **abgerundet auf 55 %**. Bewusst **nicht** mitgerechnet, obwohl vorhanden: `docs/AUDIT.md`, `docs/ROADMAP.md`, `docs/GERAETE-CHECKLISTE.md`, `docs/adr/0004`+`0005`, `docs/brand/` — sie stehen nicht auf der M-6-Liste, und sie hineinzurechnen hieße, den Maßstab passend zum Wunschergebnis zu ändern |
| 9 | CI/Release | 60 % | **60 %** | *Bestätigt, nicht bewegt.* Der Wert stammt aus der 09:12-Korrektur desselben Tages. Die dort genannten Belege sind hier nachgeprüft und existieren: `.github/workflows/pruefung.yml` (vorhanden, 02.08.2026), `VERSION` mit Inhalt `0.9.3`, `docs/RELEASE.md`. Der genannte Abzugsgrund besteht ebenfalls fort: `git`-Kopf ist `59c5fcfbd3a2f9365c05590b4692a21a1720449d` (`.git/refs/heads/main`), und nach `/opt/paperless/PO-STATUS.md` (offene Frage 3) ist seither nichts gepusht — die CI läuft also weiterhin nicht gegen den aktuellen Stand |
| 10 | Store-Reife | 15 % | **25 %** | *Bewegt, +10.* K-1 (Z. 63–80) stellte drei Wege zur Wahl; **einer ist gewählt und begonnen**: `docs/MOBILE_ARCHITECTURE.md` Abschnitt 2 hält „**Capacitor** — **Gewählt.**" fest, und die Hülle existiert im Repository: `native/capacitor.config.json` (appId `ski.frigew.docuwunder`), `native/package.json` mit `@capacitor/android`/`@capacitor/ios` 8.5, die erzeugten Plattformprojekte `native/android/` und `native/ios/`, der Kopierschritt `native/vorbereiten.mjs`; `.gitignore` hält die Plattformprojekte ausdrücklich eingecheckt und verweist dafür auf ebendieses Dokument. Nur **+10**, weil dieselbe Datei sich im Kopf als „**Machbarkeitsprüfung, keine Auslieferung**" bezeichnet: `native/node_modules/` fehlt, `native/android/app/build/` ist leer, kein Store-Zugang, keine Signierung, kein Eintrag, kein belegter Build |

### Ergebnis: acht belegt, zwei nicht

**Belegt neu abgeleitet (8):** Funktionsumfang, Testabdeckung, Architektur, Sicherheit, PWA,
Dokumentation, CI/Release, Store-Reife. Davon **vier bewegt** (Sicherheit +10, PWA +10,
Dokumentation +25, Store-Reife +10) und **vier bestätigt stehengelassen**, zwei davon mit
korrigiertem Begründungstext (Testabdeckung, Architektur).

**Nicht belegbar (2):** **Performance** — nicht belegbar ohne einen Lauf von
`tests/perf_check.py`. **Barrierefreiheit** — der Rest nicht belegbar ohne die Geräteprüfung
(0 von 29 Punkten in `docs/GERAETE-CHECKLISTE.md`). Beide behalten ihren **alten** Wert, und
beide sind in der Tabelle oben als alt gekennzeichnet. *(Nachgezogen 08.08.2026: der
Lauf für Performance liegt jetzt vor — `exit=0`, 12 von 12 bestanden, Details Z. 44/1296.
Die **Zahl** 45 % bleibt trotzdem an dieser Stelle unverändert stehen; sie neu abzuleiten ist
eine eigene Aufgabe, die dieser Nachtrag nicht übernimmt. **Barrierefreiheit bleibt vollständig
unbelegt** — daran ändert dieser Lauf nichts.)*

### Die Kopfzahl — und warum sie bei 56 % bleibt

**Fund zur Herkunft der Kopfzahl.** Die Kopfzahl war nie willkürlich: **56 % ist exakt das
ungewichtete arithmetische Mittel der zehn Bereiche**, so wie die Tabelle nach der
09:12-Korrektur dastand (90+80+65+55+45+75+45+30+60+15 = 560; 560/10 = **56,0**). Erst die
10:16-Korrektur der Barrierefreiheit (45 → 36 %) hat daraus 551/10 = **55,1 %** gemacht. Der
vom 10:16-Lauf als „passt nicht" notierte Abstand beträgt also **0,9 Punkte** — er ist an
diesem Tag entstanden, nicht seit dem 02.08. gewachsen. Das ist ein Fund aus den Zahlen
selbst; die Datei dokumentiert diese Rechenweise nirgends ausdrücklich.

**Neues Mittel nach dieser Ableitung:** 90+80+65+65+45+85+36+55+60+25 = 606 → **60,6 %**.

**Die Kopfzahl wird trotzdem NICHT geändert und bleibt bei 56 %.** Grund: Sie darf nur
ersetzt werden, wenn die Neuableitung sie vollständig trägt — und zwei der zehn Summanden
sind nicht belegt, sondern alt übernommen. Ein Mittel, in das zwei unbestätigte Werte
eingehen, ist keine belegte Zahl, sondern eine gut aussehende. Dass die unbelegten Werte
gerade die beiden **niedrigen** sind (45 % und 36 %), macht es schlimmer, nicht besser: eine
Messung, die sie senkt, senkt die 60,6 % sofort spürbar.

**Was genau fehlt, damit 56 % ersetzt werden darf** — beides steht bereits als
Ausführungsarbeit an und ist in `/opt/paperless/ops/AUSFUEHRUNGS-WARTESCHLANGE.md` zu suchen
bzw. dort zu ergänzen:

1. ~~**Ein Lauf von `tests/perf_check.py`** gegen den aktuellen Codestand → belegt den Bereich
   Performance.~~ *Erledigt 08.08.2026, Eintrag 13 in `ops/AUSFUEHRUNGS-WARTESCHLANGE.md`.*
   Belegt sind damit die **Fakten**, nicht die **Prozentzahl** — die 45 % bleiben stehen, bis
   sie eigens neu abgeleitet werden.
2. **Die Geräteprüfung nach `docs/GERAETE-CHECKLISTE.md`** (29 Punkte, derzeit 0 bearbeitet,
   Durchführung durch Damien) → belegt den Rest der Barrierefreiheit.

Liegen beide vor, ist die Kopfzahl eine reine Rechenaufgabe: Mittel der zehn dann belegten
Bereiche. Vorher nicht.

### Nicht geprüft, und ein ungeklärter Widerspruch

- **Nicht geprüft:** ob die Bereichszahlen, die hier *bestätigt* wurden, gegen einen anderen
  als den in dieser Datei dokumentierten Maßstab noch stimmen; sämtliche Laufzeitaussagen
  (nichts wurde ausgeführt); der Serverzustand.
- **GEKLÄRT 06.08.2026 12:0x — der folgende Absatz ist Historie.** Das Caddyfile ist
  gelesen worden (`/etc/caddy/Caddyfile` Z. 190–197, Watchdog, hinterlegte
  Leseberechtigung): **`docs/SECURITY.md` hat recht, K-4 war falsch.** Auflösung, Merksatz
  und der dabei gefundene neue offene Punkt (kein `header`-Block für `/paperless/*`,
  Z. 162–164) stehen bei **K-4** weiter oben. Der Vorbehalt „kein Zuschlag für eine
  möglicherweise vorhandene CSP" ist damit eingelöst — vergeben wird der Zuschlag hier
  trotzdem nicht, weil ihm der neue Befund gegenübersteht; das entscheidet die nächste
  Ableitung des Bereichs. Der Absatz darunter bleibt unverändert stehen, weil er eine
  datierte Aussage über den damaligen Kenntnisstand ist:
- **Ungeklärter Widerspruch, ausdrücklich offen gelassen:** `docs/SECURITY.md` Abschnitt 2
  behauptet, die Kopfzeile `Content-Security-Policy` sei in Caddy „**gesetzt und notwendig**",
  während K-4 dieser Datei („Es gibt keine CSP") und der Codestand (kein CSP in `index.html`,
  `start.js`, `sw.js`) dagegen stehen. Entscheiden ließe sich das nur an
  `/etc/caddy/Caddyfile` — **diese Datei liegt außerhalb der für diese Sitzung freigegebenen
  Verzeichnisse und konnte nicht gelesen werden** (Versuch unternommen, abgewiesen). Deshalb
  wurde bei Sicherheit **kein** Zuschlag für eine möglicherweise vorhandene CSP vergeben:
  im Zweifel gilt der ungünstigere, belegte Stand. Der Punkt ist als Prüfauftrag in
  `/opt/paperless/ops/AUSFUEHRUNGS-WARTESCHLANGE.md` nachzutragen.
- **Berührt, aber nicht angefasst:** `/opt/paperless/ops/ABNAHME-CHECKLISTE.md` **Rasterpunkt
  1b (App-Selbstauskunft)** rechnet mit der Kopfzahl **56 %**. Die bleibt unverändert, also
  ändert sich an 1b **nichts** — der Punkt wurde am 06.08. 10:2x frisch auf 13/20
  nachgerechnet und ist hier absichtlich nicht berührt worden. Berührt ist er nur insofern,
  als die **Bereichstabelle**, aus der 1b argumentiert, sich geändert hat; sollte die
  Kopfzahl später auf das dann belegte Mittel gezogen werden, ist 1b neu zu rechnen.
