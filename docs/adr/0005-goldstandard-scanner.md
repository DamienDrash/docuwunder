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
