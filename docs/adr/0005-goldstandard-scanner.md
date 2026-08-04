# ADR 0005: Goldstandard-Scanner — Architektur und Phasenplan

Datum: 2026-08-03
Status: Angenommen (Phase 0 beschlossen, weitere Phasen geplant)

## Kontext

Der aktuelle Scan-Bildschirm (`erfassen.js` / `vorlage/erfassen.js` / `scan.js`)
nutzt bewusst **keine** eigene Kameravorschau. Aufnahme laeuft ueber
`<input type="file" accept="image/*" capture="environment">`: das System-Foto-UI
uebernimmt Autofokus, Belichtung und Blitz, danach macht `scan.js` (DWScan)
client-seitig Drehung, Zuschnitt (manueller Rahmen mit vier Griffen) und
PDF-Zusammenbau aus mehreren Seiten. Diese Entscheidung ist im Code dokumentiert
und war zum Zeitpunkt der Einfuehrung richtig: eine fruehere gemalte
Kamera-Attrappe ("Dokument erkannt") ohne echte Bildverarbeitung war schlechter
als gar keine Vorschau.

Damien hat nun explizit einen Scanner mindestens auf Swift-Paperless-Niveau
gefordert, mit Perspektive dieses Niveau langfristig zu uebertreffen
("Goldstandard"). Beobachtete Referenzmerkmale von Swift Paperless:
Vollbild-Live-Kamera, Schliessen/Abbrechen, automatische Kantenerkennung mit
gruenem Viereck-Overlay, automatischer Ausloeser, Blitz- und Filtersteuerung,
manueller Ausloeser, Einhand-Bedienung, visuelles Feedback waehrend der
Erkennung.

## Entscheidung

Der Scanner wird in **kleinen, einzeln freigebbaren Phasen** ausgebaut, jede
Phase eigenstaendig testbar, ohne den bestehenden, funktionierenden
Datei-Dialog-Weg zu brechen, bis ein vollwertiger Ersatz verifiziert steht.

### Phase 0 (dieser Batch): Bestandsaufnahme und Architekturentscheidung
- Ist-Zustand von `erfassen.js`, `scan.js`, `vorlage/erfassen.js` und dem
  Upload-Pfad zu `post_document` erfasst (siehe oben).
- Diese ADR als verbindliche Leitplanke fuer die folgenden Phasen.
- Kein Verhaltensbruch, keine neue Abhaengigkeit.

### Phase 1: Live-Kamera-Huelle mit Fallback - UMGESETZT (2026-08-03, v0.5.0)
- Neue Kamera-Ansicht ueber `navigator.mediaDevices.getUserMedia` mit
  `facingMode: 'environment'`, Vollbild-Vorschau via `<video>`.
- Robuste Fallback-Kette, in dieser Reihenfolge:
  1. `getUserMedia` verfuegbar und Berechtigung erteilt -> Live-Vorschau.
  2. `getUserMedia` verfuegbar, aber Berechtigung verweigert/Fehler ->
     sichtbarer Hinweis + sofortiger Rueckfall auf den bestehenden
     `capture="environment"`-Dateidialog.
  3. `getUserMedia` nicht verfuegbar (z. B. kein sicherer Kontext, kein
     Kamera-Geraet, Desktop ohne Kamera) -> direkt der bestehende Dateidialog,
     ohne Zwischenschritt.
  4. Immer zusaetzlich: expliziter "Datei waehlen"-Weg, unabhaengig vom
     Kamerastatus (bestehender Pfad bleibt erhalten).
- Manueller Ausloeser zuerst; kein Auto-Capture in dieser Phase.
- Kein CV, keine neue Abhaengigkeit: Standard-Web-APIs
  (`MediaDevices.getUserMedia`, `ImageCapture`/`canvas.drawImage` fuer den
  Snapshot) reichen fuer die Huelle.
- Tests: Zustandsautomat der Fallback-Kette (mock `getUserMedia` erfolgreich/
  abgelehnt/fehlend), Playwright-Check dass der Datei-Weg immer erreichbar
  bleibt.

### Phase 2: Aufnahme/Review/Upload an bestehende Pipeline andocken
- Vom `<video>` erzeugte Snapshots durchlaufen dieselbe `scan.js`-Pipeline
  (Drehen, Zuschnitt, PDF-Zusammenbau, Upload) wie Dateidialog-Bilder.
- Keine Aenderung an `post_document`/Metadaten-Fluss.

### Phase 3: Bildverstaerkung (Enhancement-Pipeline)
- Modi: Graustufe/Farbe/Original, Kontrast, Helligkeit, Schaerfen,
  Schatten-/Hintergrundbereinigung.
- Warnungen bei Unschaerfe/Blendung/Dunkelheit ueber einfache Heuristiken auf
  Canvas-Pixeldaten (z. B. Laplace-Varianz fuer Unschaerfe-Schaetzung),
  keine externe CV-Bibliothek in dieser Phase.
- Alles synchron/lazy im Browser (`OffscreenCanvas` wo verfuegbar), damit die
  App-Huelle nicht blockiert wird.

### Phase 4: Kantenerkennung und Overlay
- Automatische Dokumentkanten-Erkennung mit gruenem Viereck-Overlay als
  *Zusatz*, nicht als Ersatz fuer den manuellen Zuschnitt-Rahmen (der bleibt
  Fallback, siehe bestehende vier Zuschnittgriffe in `vorlage/erfassen.js`).
- Bibliothekswahl erst nach Pruefung von Bundle-Groesse, Lizenz und
  Mobil-Performance; kein CV-Framework "blind" einbinden. Kandidaten fuer
  spaetere Recherche: reines Canvas-basiertes Kantenverfahren (Sobel/Canny in
  wenigen KB eigenem Code) vor grossen WASM-CV-Paketen wie OpenCV.js
  (mehrere MB), da die App bewusst schlank bleibt (siehe bestehende
  Huellenversion/Cache-Strategie).

### Phase 5: Automatischer Ausloeser
- Stabilitaets-/Flaechen-/Fokus-Heuristik ueber mehrere Frames, erst nach
  Phase 4 verfuegbar (baut auf Kantenerkennung auf). Manueller Ausloeser
  bleibt immer zusaetzlich bedienbar.

### Phase 6: Native-Wrapper-Haertung
- Kamera-Berechtigungen in Capacitor (iOS/Android) pruefen, Info.plist/
  AndroidManifest-Eintraege dokumentieren, echte Geraetetests vor jeder
  "goldstandard"-Aussage.

## Nicht-Ziele / bewusste Abgrenzung
- Keine Cloud-/Drittanbieter-Bildverarbeitung; alles lokal im Client.
- Keine Analytics/Telemetrie im Scanner.
- Keine grosse CV-Abhaengigkeit ohne dokumentierten Groessen-/Lizenz-Vergleich.
- Der bestehende Dateidialog-Weg (`capture="environment"`) wird nicht entfernt,
  bevor die Live-Kamera-Kette in Phase 1-2 echte Geraeteverifikation bestanden
  hat. Er bleibt die dauerhafte Fallback- und Desktop-Loesung.

## Konsequenzen
- Der Scanner-Ausbau ist bewusst in nachvollziehbare, einzeln testbare Batches
  zerlegt statt eines grossen Sprungs; das passt zur bestehenden Batch-Historie
  aus Meilenstein B.
- "Swift-Paperless-Paritaet" oder "Goldstandard" duerfen erst nach echter
  Geraeteverifikation (Kamera-Berechtigungen, reale Dokumente, Upload zu
  Paperless-ngx) behauptet werden — nicht nach Implementierung allein.


## Nachtrag: Umsetzung Phase 1 (2026-08-03)

Wie geplant implementiert, keine Abweichung vom Entwurf:
- `logik.js:kameraNutzbar(nav, win)` prueft sicheren Kontext + API-Vorhandensein
  reine Faehigkeitspruefung ohne Berechtigungsdialog.
- `erfassen.js`: `scanOeffnen()` verzweigt jetzt zwischen `scanKameraOeffnen()`
  (Live-Vorschau) und dem alten `scanAufnehmen()` (Dateidialog), je nach
  `kameraNutzbar`. `scanKameraFehler()` faengt jede Ablehnung/jeden Fehler ab
  und faellt sofort auf den Dateidialog zurueck. `scanKameraSchliessen()` stoppt
  alle Tracks. `scanKameraAufnehmen()` erzeugt aus dem `<video>` per Canvas
  einen Snapshot und speist ihn in dieselbe `scanAufnahmen()`-Pipeline wie der
  Dateidialog - keine zweite Bildverarbeitung.
- `vorlage/erfassen.js`: neuer Vollbild-`<video>`-Block mit manuellem Ausloeser
  (grosser runder Knopf) und explizitem "Aus Dateien waehlen"-Knopf, immer
  parallel erreichbar.
- Getestet mit drei Playwright-Faellen, die `getUserMedia` mocken: Erfolg (echter
  `MediaStream` via `canvas.captureStream()`), Verweigerung (`NotAllowedError`),
  fehlende API. In allen Faellen bleibt der Dateidialog-Weg erreichbar.
- Ein echter Absturz wurde beim ersten Anlauf gefunden (`srcObject`-Zuweisung
  bei einem Nicht-MediaStream-Mock) und behoben, siehe docs/AUDIT.md.
- Kein Auto-Capture, keine Kantenerkennung, keine Bildverstaerkung in dieser
  Phase - wie geplant. Kein reales Geraet getestet - "Goldstandard" oder
  "Swift-Paperless-Paritaet" bleiben bis zur Geraeteverifikation unbelegt.


## Nachtrag: Umsetzung Phase 3 (2026-08-03)

Wie geplant implementiert, mit einer bewussten Abweichung: Kontrast/
Helligkeit sind in `scan.js: seiteAus` als Parameter vorbereitet (echte
Pixelrechnung), bekommen aber noch kein eigenes UI-Element - ein Regler ohne
sinnvoll erprobte Wertebereiche waere schlechter als gar keiner. Umgesetzt und
sichtbar ist der Modus-Umschalter Original/Graustufe (`erfassen.js:
scanModusSetzen`, `scan.js: seiteAus` mit `opt.modus`), der fuer den gesamten
Scan gilt und bei jedem Wechsel alle Seiten aus ihrem unveraenderten Original
neu rendert - nichts geht verloren.

Die Schatten-/Hintergrundbereinigung aus der urspruenglichen Phase-3-
Beschreibung ist noch offen; sie braucht mehr als einen einfachen Pixel-
Durchlauf (lokale Adaptivschwelle statt globaler Kontrast) und wurde bewusst
zurueckgestellt, um keine grobe/haessliche erste Fassung zu verspielen.

Neu: `scan.js: schaerfeMass` schaetzt Unschaerfe ueber die Varianz eines
vereinfachten Laplace-Filters auf einem verkleinerten Graustufenbild - eine
billige Heuristik ohne echte Kantenerkennung (die kommt erst in Phase 4).
Nicht blockierend, nur ein Hinweis-Toast.

Getestet mit einem neuen Browser-Test ("Bildmodus wirkt auf den Scan").
Nicht verifiziert: reale Unschaerfe-Erkennung mit echten verwackelten Fotos
(nur mit synthetischen Testbildern geprueft) - das bleibt Teil der spaeteren
Geraeteverifikationsrunde.


## Nachtrag: Teilumsetzung Phase 4 - Randvorschlag im Zuschnitt (2026-08-03)

Umgesetzt ist ein erster, bewusst kleiner Schritt in Richtung Phase 4: eine
automatische Randerkennung als *Startvorschlag* fuer den bestehenden
manuellen Zuschnitt-Rahmen, nicht das in der Ursprungsplanung beschriebene
Echtzeit-Overlay mit gruenem Viereck waehrend der Live-Vorschau. Bewusste
Abweichung/Praezisierung:

- `scan.js: randSchaetzen` schaetzt ein **achsenparalleles Rechteck**
  (kein perspektivisches Viereck) ueber ein 1D-Gradientenprofil auf einem
  auf 260px verkleinerten Graustufenbild: Summe der Helligkeitsspruenge je
  Zeile/Spalte, die Aussenraender mit geringem Wert werden abgeschnitten.
  Reines Canvas/JS, keine externe CV-Bibliothek - wie in der ADR als
  bevorzugter Weg vor OpenCV.js vorgemerkt.
- Liefert `null`, wenn kein plausibler Rand gefunden wird (Vorschlag waere
  fast das ganze Bild oder ein winziger Fleck) - der Aufrufer faellt dann
  auf den vollen Rahmen zurueck. Bewusst konservativ: ein falscher
  Vorschlag, der Dokumentinhalt abschneidet, waere schlechter als gar
  keiner.
- `erfassen.js: scanZuschnittOeffnen` startet weiterhin sofort mit dem
  vollen Rahmen (damit der Zuschnitt-Bildschirm nie leer/verzoegert
  aufgeht) und ersetzt ihn asynchron durch den Vorschlag, sobald er
  vorliegt und derselbe Zuschnitt-Dialog noch offen ist. "Ganz" (voller
  Rahmen) bleibt jederzeit ein Klick entfernt - keine Sackgasse.
- Kein Live-Kamera-Overlay, keine Eckenerkennung/Perspektivkorrektur, keine
  automatische Anwendung ohne Bestaetigung durch "Übernehmen" - das bleibt
  fuer eine spaetere Ausbaustufe von Phase 4/5 offen, falls der Bedarf nach
  echter Geraeteverifikation Live-Overlay als notwendig zeigt.

Getestet mit einem neuen Browser-Test ("Randerkennung schlaegt Zuschnitt
vor"): ein synthetisches Bild mit eindeutigem Rechteck liefert einen
plausiblen Vorschlag, ein durchgehend leeres Bild liefert bewusst `null`.
Volle Suite (10 Stufen, 43 Browserpruefungen, davon 1 neu) danach gruen.
Huellenversion neu berechnet (e9753b03a535 -> 65fd89b2d544).

Nicht verifiziert: echte fotografierte Dokumente unter realem Licht mit
Schatten, gemustertem Hintergrund oder mehreren Kontrastkanten - die
Heuristik wurde nur mit einem synthetischen Testbild geprueft. Keine
"Goldstandard"- oder Paritaets-Aussage vor Geraeteverifikation.

Naechster Schritt: entweder echte Geraeteverifikation der bisherigen
Scanner-Phasen (Kamera, Bildmodus, Regler, Randvorschlag) auf einem realen
Telefon, oder Fortsetzung mit Meilenstein C (Virtualisierung fuer grosse
Archive) gemaess Prioritaetsreihenfolge - da Phase 4 bewusst nur teilweise
umgesetzt wurde (kein Live-Overlay), bleibt der Rest von Phase 4/5 als
offener Punkt in dieser ADR stehen statt als "erledigt" markiert zu werden.

Version: 0.6.2 -> 0.7.0 (MINOR: neue, sichtbare Nutzerfaehigkeit - der
Zuschnitt-Rahmen startet jetzt mit einem automatischen Vorschlag statt
immer beim vollen Bildrand).

## Goldstandard-Scanner, Auto-Ausloeser-Baseline (2026-08-04)

- Live-Kamera: ein standards-basierter Auto-Ausloeser ist ergaenzt. Er beobachtet lokal nur die Stabilitaet des Browser-`<video>`-Signals, gibt einen `aria-live`-Status aus, laesst sich per nativem Auto-Button ein-/ausschalten und loest nach stabilem Kamerabild genau eine Aufnahme ueber die bestehende Canvas-/Scan-Pipeline aus.
- Einordnung: Das ist noch keine Swift-Paperless-Paritaet und keine echte Dokument-/Fokus-/Bewegungserkennung; die weitere CV-gestuetzte Kanten-/Schaerfe-/Stabilitaetsbewertung bleibt offen und muss auf realen Mobilgeraeten verifiziert werden.
- Tests: `tests/browser_check.py` prueft mit einem echten Canvas-`MediaStream`, dass der Auto-Ausloeser aktiv ist und nach stabilem Bild eine erste Scan-Seite erzeugt. Volle Suite: 11 Stufen, 60 Unit, 24 API, 45 Browserpruefungen gruen.
- Version: 0.8.10 -> 0.8.11 (PATCH: Scanner-Autoausloeser-Baseline, kein API-/Datenmodellwechsel).

## Goldstandard-Scanner, Phase 5 real umgesetzt: Auto-Ausloeser nutzt echte Randerkennung (2026-08-04)

- Die Baseline aus 0.8.11 beobachtete nur, ob `videoWidth`/`videoHeight`/`readyState` des `<video>`-Elements ein paar Takte lang gleich blieben - das ist eine reine Signalpruefung ohne jeden Bezug zum Bildinhalt und loeste praktisch immer nach derselben festen Zeit aus, unabhaengig davon, ob ueberhaupt ein Dokument im Bild war. Diese Fassung schliesst genau diese Luecke und setzt den in ADR 0005 seit Phase 4 vorgesehenen Zusammenhang zwischen Randerkennung und Auto-Ausloeser tatsaechlich um:
  - `erfassen.js: scanAutoBeobachten` zieht alle 350ms ein kleines (max. 260px) Standbild aus dem laufenden `<video>` und uebergibt es an `DWScan.randSchaetzen` (denselben Gradientenprofil-Algorithmus, der seit Phase 4 den Zuschnitt-Vorschlag liefert - keine zweite Implementierung, keine neue Abhaengigkeit).
  - Ausgeloest wird erst, wenn `randSchaetzen` **denselben** Rand (innerhalb `AUTO_RAND_EPS = 3,5 %` je Koordinate) `AUTO_STABIL_N = 3` Takte in Folge liefert - das Dokument liegt also erkennbar und ruhig im Bild, nicht nur "das Videosignal aendert sich zwei Sekunden lang nicht".
  - Bewusster Fallback: liefert `randSchaetzen` `AUTO_OHNE_RAND_N = 9` Takte in Folge **keinen** Rand (z. B. gemusterter Tisch, randloses Motiv, schwaches Licht), wird trotzdem ausgeloest. Ohne diesen Fallback waere der Auto-Ausloeser fuer manche reale Aufnahmesituationen dauerhaft stumm - das waere schlechter als eine Aufnahme ohne Kantenvorschlag.
  - `this._scanAutoBusy` verhindert ueberlappende Auswertungen, falls eine einzelne laenger braucht als der 350ms-Takt; ein `try/catch` um `drawImage` faengt den seltenen Fall ab, dass ein Videobild kurzzeitig nicht zeichenbar ist (z. B. unmittelbar nach Start auf manchen Geraeten/WebViews), ohne die Beobachtung abzubrechen.
  - Statusmeldungen (`aria-live`) unterscheiden jetzt "sucht Dokumentkanten", "Dokument erkannt, bitte ruhig halten" und die beiden Ausloesegruende - vorher gab es nur "ruhiges Bild"/"bitte ruhig halten" ohne Bezug zu einem tatsaechlichen Dokument.
- Bewusst NICHT umgesetzt: keine Vorab-Schaerfepruefung im Beobachtungstakt. Ein Test ergab, dass `schaerfeMass` auf dem ohnehin kleinen 260px-Beobachtungsbild bei realitaetsnahen (aber auch bei synthetischen) Motiven systematisch niedrige Werte liefert und den Ausloeser dauerhaft blockieren wuerde. Die bestehende Unschaerfe-Warnung nach der Aufnahme (`scanAufnahmen`, volle Aufloesung, Phase 3) bleibt der richtige Ort fuer diese Pruefung.
- Tests: zwei Browserpruefungen ersetzen/ergaenzen die bisherige eine. `t_kamera_auto_ausloeser` prueft weiterhin ein klar abgegrenztes Rechteck (jetzt zusaetzlich mit einer Mindestwartezeit von 500ms, um ein sofortiges/inhaltsblindes Ausloesen auszuschliessen: gemessen 1495ms). Neu: `t_kamera_auto_ohne_rand_faellt_zurueck` mit einem voellig gleichfoermigen Kamerabild (kein Kontrast, kein Randfund) bestaetigt, dass der Fallback nach `AUTO_OHNE_RAND_N`-Takten greift statt den Ausloeser fuer immer zu blockieren (gemessen 3182ms). Volle Suite: 11 Stufen, 60 Unit, 24 API, 46 Browserpruefungen gruen. Huellenversion neu berechnet (942d196998d7 -> bbed24ca5e86), weil `erfassen.js` Teil der Huelle ist.
- Nicht verifiziert: reale Dokumente unter realem Licht auf einem echten Telefon/WebView; die Schwellwerte (`AUTO_STABIL_N`, `AUTO_OHNE_RAND_N`, `AUTO_RAND_EPS`) wurden nur gegen synthetische Testbilder abgestimmt und sind ein Startwert, keine geraeteverifizierte Endabstimmung. Keine "Goldstandard"- oder Swift-Paperless-Paritaets-Aussage vor Geraeteverifikation.
- Naechster Schritt: entweder echte Geraeteverifikation der gesamten bisherigen Scanner-Kette (Kamera, Modi, Regler, Randvorschlag im Zuschnitt, jetzt auch der randbasierte Auto-Ausloeser), oder Fortsetzung mit Meilenstein B (verbleibende Pointer-Flaechen in `tabs.js`/`dokument.js`), Meilenstein C (Virtualisierungsentscheidung) oder Meilenstein D (Release-Dokumentation) gemaess Prioritaetsreihenfolge.
- Version: 0.8.11 -> 0.9.0 (MINOR: der Auto-Ausloeser ist jetzt eine echte, inhaltsbezogene Faehigkeit statt einer inhaltsblinden Zeitschaltung - ein sichtbarer Verhaltenswechsel fuer Nutzer, kein reiner Test-/Doku-Batch).
