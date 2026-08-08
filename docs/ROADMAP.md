# DocuWunder — Roadmap

Stand: 1. August 2026 · 17 Commits · Instanz Paperless-ngx 3.0.4

Diese Roadmap sammelt, was beim Aufbau und beim vollständigen visuellen Durchlauf
tatsächlich gefunden wurde — keine Wunschliste, sondern belegte Befunde mit Fundstelle.
Sortiert nach dem, was zuerst weh tut.

**Legende:** ✅ erledigt · 🔴 blockiert Weiterentwicklung · 🟠 wichtig · 🟡 sollte · ⚪ später

---

## Wo das Projekt steht

| | |
|---|---|
| Oberfläche | Eine für Telefon und Desktop, ab 900 px zweispaltig |
| Verdrahtet | Anmeldung, Lesen, Suchen, Filtern, Bearbeiten, Upload, Löschen, Papierkorb, Ordner, Zuweisen, Mitglieder, Freigaben, Scannen, Automatisierungen |
| Offline | Läuft ohne Internet, keine externen Requests |
| Tests | 6 Stufen, 2039 Zeilen: Syntax, Logik (46 Unit-Tests), Template-Bindungen, API-Vertrag (24), Browser (18), PWA |
| Visuell geprüft | 38 Stationen × 3 Varianten (schmal, Split-View, dunkel) |
| Aufbau | React direkt, htm statt JSX, kein Build-Schritt. Bildschirme einzeln in `vorlage/` |
| Offene Schuld | `renderVals()` ist aufgeteilt (4.5); offen bleibt die Länge von `app.js` selbst |

---

## Aktueller Fokus (2026-08-04)

- ✅ Scanner-Zuschnittgriffe auf native, benannte Buttons umgestellt; Pointer-basierte A11y-Leitplanke erweitert.
- ✅ Scanner-Zuschnittecken sind per Pfeiltasten verschiebbar; Browser-Regressionstest prüft fokussierten Griff und Positionsänderung.
- ✅ Sichtbarer Fokuszustand im Zuschnittmodus wird browserseitig geprüft; Zuschnittänderungen liefern einen `aria-live`-Status für Screenreader.
- ✅ Pull-to-refresh- und Posteingang-Swipe-Flächen aus klickbaren `div`-Resten zu semantisch benannten `section`-Regionen migriert; A11y-Leitplanke verlangt jetzt 0 klickbare `div/span`.
- 🟠 Nächster Scanner-Schritt: Zuschnitt-Status/Bedienhinweise auf echten Mobilgeräten mit VoiceOver/TalkBack prüfen und danach die nächste Scanner-Phase priorisieren.

---

## Phase 0 — Erledigt

- ✅ **Keine CDN-Abhängigkeit mehr.** React, ReactDOM, Babel und die Schriften liegen unter
  `vendor/`; `window.__resources` biegt die in `support.js` fest verdrahteten unpkg-URLs um.
  Voraussetzung für echten Offline-Betrieb. SRI-Hashes gegen die Vorgaben geprüft.
- ✅ **Eine Oberfläche statt zwei.** Die separate Desktop-Shell (866 Zeilen, eigener
  Datenbestand) ist entfallen; `index.html` schrumpfte auf 119 Zeilen.
- ✅ **Split-View ab 900 px**, an der Grenze nachgemessen.
- ✅ **Mockdaten entfernt**, alle Lese- und Schreibpfade an der echten API.
- ✅ **PWA**: Manifest, Service Worker, Icons, installierbar, startet offline. Im installierten
  Zustand folgt die Systemleiste dem in der App gewählten Schema statt dem des Systems — ein
  Browser-Test prüft die *Wirkung* des Schalters, nicht seine Anwesenheit.
- ✅ **Fünf Attrappen entfernt** (siehe „Was gelogen war").
- ✅ **Kontrast im dunklen Schema**: weiß auf Mint hatte 1.46, jetzt Navy auf Mint mit 11.9.
- ✅ **Escape** schließt Sheets und navigiert zurück — vorher gab es keinerlei Tastaturbedienung.
- ✅ **Marke** übernommen: Farben, Manrope-Wortmarke, Bildmarke, Favicon-Kit, Begriffe.
- ✅ **Repository** öffentlich unter `DamienDrash/docuwunder`, AGPL-3.0 mit Markenvorbehalt,
  History ohne den geleakten Zugangsschlüssel.

---

## Phase 1 — Bevor irgendetwas Neues dazukommt

Diese drei entscheiden, ob DocuWunder in sechs Monaten noch änderbar ist.

### ✅ 1.1 `mobile.dc.html` zerschlagen
3.617 Zeilen, 751 Inline-Styles, 121 Methoden, 91 Zustandsfelder in **einer** Datei.
Die längste Zeile hat 3.240 Zeichen. Kein Diff ist reviewbar, zwei Leute können nicht
parallel daran arbeiten.

Vorschlag: Vorlage nach Bildschirm trennen, Stile in benannte Konstanten, Logik in Module
nach Sachgebiet (Dokumente, Ordner, Team, Onboarding). Das DC-Runtime erlaubt mehrere
Komponenten — genutzt wird es bisher nur für `mobile` und `IOSDevice`.

### ✅ 1.2 Das DC-Runtime ersetzen
`support.js:1` sagt: *„GENERATED from dc-runtime/src/*.ts — do not edit. Rebuild with
`cd dc-runtime && bun run build`."* **Dieses Projekt existiert nirgends** — nicht im
Repository, nicht auf dem Server.

Die ganze App hängt an 69 KB generiertem Code ohne Quelltext. Ein Fehler darin wäre nicht
behebbar, nur umgehbar. Eine neue React-Version ist ausgeschlossen. In einem öffentlichen
AGPL-Repository ist das zusätzlich heikel: Empfänger können den Quelltext nicht bekommen.

Wege: Quelltext von `dc-runtime` beschaffen und beilegen — oder auf React ohne
Zwischenschicht wechseln. Zweiteres ist Arbeit, beendet die Abhängigkeit aber endgültig.

### ✅ 1.3 Unit-Tests für die Übersetzungsschicht
1.403 Zeilen Tests, aber **keine einzige Funktion isoliert geprüft**. `mapDoc()`,
`toApiPatch()`, `ordnerKinder()`, `initialen()`, `felderAus()` — dort sitzen die Fehler,
die man sonst auf Screenshots sucht.

Beleg: „DUNDEFINED" und „undefined Treffer" fielen erst im visuellen Durchlauf auf. Beide
hätte ein dreizeiliger Test beim Schreiben gefunden.

---

**Stand:** Phase 1 ist abgeschlossen. Die Migration lief in einem Zug:

- `tools/konvert.py` hat die Vorlage mechanisch übersetzt — 145 `sc-if`, 46 `sc-for`,
  659 Bindungen, 940 Stil-Attribute. Von Hand wäre das nicht nachvollziehbar gewesen.
- Die Bildschirme liegen jetzt einzeln in `vorlage/` (73–291 Zeilen je Bereich) statt in
  einer Datei mit 3.617 Zeilen.
- `support.js`, `mobile.dc.html`, `vendor/resources.js` und die Design-Vorschau sind
  entfallen. Damit ist die Abhängigkeit ohne Quelltext beendet.
- Der Konverter hat dabei zwei eigene Fehler offengelegt (Alias `f` + Präfix `i` = `if`;
  htm dekodiert keine HTML-Entitäten, `&amp;` stand wörtlich auf dem Schirm). Beide fand
  die Prüfung, nicht das Auge.
- Verifiziert: 6 Teststufen, 114 visuelle Stationen über schmal, Split-View und dunkel.

## Phase 2 — Ehrlichkeit und Sicherheit

### ✅ 2.1 Zugangsschlüssel nicht im Klartext halten
Erledigt, soweit es ohne Nutzergeheimnis geht. Verschlüsselung brächte hier nichts — der
Schlüssel dafür läge daneben. Stattdessen ist der Schaden zeitlich begrenzt und ehrlich
benannt: Ablauf nach 30 Tagen ohne Nutzung, gleitend verlängert durch jede erfolgreiche
Anfrage, gelöscht beim Abmelden. Ältere Ablagen ohne Ablauf werden beim Start migriert.
Die Einstellungen sagen unter „Zugangsschlüssel" klar, wo er liegt und wer ihn lesen kann.

**Offen bleibt echter Schutz**: dafür braucht es ein Geheimnis, das der Nutzer beisteuert
(PIN) oder das Gerät verwahrt (WebAuthn-PRF) — siehe 2.2.

### ✅ 2.2 Biometrie — mit echtem Schutz
Geprüft, gebaut, belegt. Die PRF-Erweiterung ist vorhanden (`extension:prf: true`), also
gibt es keine Oberflächensperre, sondern **echte Verschlüsselung**: der Authentifikator des
Geräts leitet aus einem festen Salz Schlüsselmaterial ab, daraus wird ein AES-GCM-Schlüssel,
und der Zugangsschlüssel liegt nur noch verschlüsselt (`sperre.js`).

Drei Gegenbeweise mit virtuellem Authentifikator:

| Angriff | Ergebnis |
|---|---|
| Gerät weg (Authentifikator entfernt) | abgewiesen |
| Biometrie schlägt fehl | abgewiesen |
| **Ablage auf ein anderes Gerät kopiert** | **abgewiesen** |

Der dritte ist der entscheidende: eine kopierte `localStorage`-Ablage nützt nichts. Bei
aktiver Sperre gibt es keine unverschlüsselte Zweitkopie — der Schlüssel lebt nur im
Speicher der laufenden Sitzung.

**Was nicht versprochen wird:** Schutz gegen jemanden, der Code in die Origin einschleusen
kann. Wer das kann, wartet die Entsperrung ab. Das schützt gegen ein verlorenes Gerät und
fremde Blicke, nicht gegen einen kompromittierten Server. Ohne Plattform-Authentifikator
wird die Funktion gar nicht erst angeboten.

### ✅ 2.3 Drei stille `catch`
`.catch(() => {})` verschluckt Fehler, ohne dass Nutzer, Log oder Entwickler es erfahren.
Entweder behandeln oder wenigstens protokollieren.

### ✅ 2.4 Berechtigungen beim Anlegen eines Mitglieds
Ein per API angelegter Benutzer hat **keinerlei Django-Rechte** und läuft schon beim
Auflisten in 403 — das Konto ist blind, bis es einer Gruppe mit Rechten angehört. Die App
sollte beim Anlegen entweder eine Gruppe erzwingen oder unmissverständlich warnen.

### ✅ 2.5 Social Preview hochladen
`assets/brand/github-social-preview.png` liegt bereit, muss aber von Hand in den
Repository-Einstellungen gesetzt werden — dafür gibt es keine API.

---


---

## Milestone B — Barrierefreiheit

- ✅ **A11y-Leitplanke im Testlauf aktiv.** `tests/a11y_check.py` zählt nicht-semantische Klickziele pro Vorlage, verlangt `type="button"` bei nativen Buttons und schlägt fehl, wenn die Onboarding-Migration zurückfällt.
- ✅ **Onboarding semantisch migriert.** Start, Zurück, Verbindung, Anmeldung, SSO, Token-Umschaltung und Abschluss sind native Buttons; Server-, Benutzer-, Passwort- und Tokenfelder haben zugängliche Namen.
- 🟠 **Verbleibende Migration:** 179 klickbare `div`/`span` in Dokumenten, Erfassung, Ordnung, Sheets, Tabs und Verwaltung systematisch in Bereichs-Batches ersetzen.
- 🟠 **Noch nötig:** echte Keyboard-Flows, Fokus-Rückgabe bei Sheets/Dialogen, Fokusfalle wo modal, Live-Regionen für dynamische Fehler/Laden, reduzierte Bewegung und spätere manuelle Tests mit VoiceOver/TalkBack/NVDA.

## Phase 3 — Was die App noch nicht kann

### 🟠 3.1 Einladungen
Der ausdrückliche Wunsch: ein eindeutiger Einladungslink, an eine E-Mail gebunden, der
jemanden einer Gruppe zuordnet.

**Mit „nur Paperless-Server + App" ist das nicht lösbar.** Ein Konto anzulegen erfordert
Administratorrechte, die ein Eingeladener per Definition nicht hat; ein Admin-Schlüssel im
Link wäre der Generalschlüssel zum Archiv. Paperless kennt für Selbstregistrierung nur
einen globalen Schalter — an heißt: jeder im Internet.

Heutiger Ersatz: Der Administrator legt das Konto an, das Passwort wird einmalig angezeigt
und über den Teilen-Dialog weitergegeben.

Echte Einladungen brauchen eine Entscheidung:
- **Authentik** (läuft bereits, `auth.frigew.ski`) kann genau das nativ — Einladung mit
  Ablauf, an Gruppe gebunden, per Postal versendet. Paperless ist über
  `allauth.socialaccount` für OIDC vorbereitet. Widerspricht der Vorgabe „kein
  Zwischendienst", ist aber der einzige Weg ohne Eigenbau.
- **Eigener kleiner Dienst** — mehr Kontrolle, aber ein zusätzlicher Dienst mit
  Administratorrechten auf das Archiv.

**✅ ENTSCHIEDEN (Damien, 05.08.2026): Status quo.** Der Administrator legt das Konto in der
App an, das Passwort wird einmalig angezeigt und weitergegeben — genau der heute umgesetzte
Weg. Es wird also **kein** Einladungslink gebaut und **kein** Zwischendienst eingeführt.
**Authentik bleibt dokumentierte Spätoption**, nicht verworfen: Paperless ist über
`allauth.socialaccount` für OIDC vorbereitet, und die Instanz läuft bereits. Damit ist diese
Grundsatzfrage geschlossen und blockiert nichts mehr; die Beschreibung darüber bleibt als
Begründung stehen.
Wieder aufmachen würde die Entscheidung nur ein neuer Bedarf, den der Status quo nicht mehr
trägt — etwa Konten für Personen außerhalb des Haushalts oder eine Anzahl von Mitgliedern,
bei der händisches Anlegen nicht mehr praktikabel ist.
Beleg: `/opt/paperless/ROADMAP.md` (Entscheidung 3 von 5) und `/opt/paperless/PO-STATUS.md`.

### 🟡 3.2 Gruppenbesitzer und Rollen
Paperless kennt beides nicht: Django-Gruppen haben keinen Besitzer, Rechte hängen an der
Gruppe statt am Mitglied. Die App bildet deshalb nur ab, was existiert. Ein echtes
Rollenmodell wäre eine eigene Ebene — dieselbe Grundsatzfrage wie bei 3.1.

### ✅ 3.3 Verhalten bei grossem Bestand — gemessen

Gemessen an **5.001 Dokumenten** (5.000 erzeugte plus der echte Bestand), Median aus je
fünf Läufen. Ergebnis: die App trägt das, ohne Umbau.

**Serverseitig**

| | Dauer |
|---|---:|
| Liste, 60 Zeilen | 273 ms |
| Liste, Seite 20 (tiefes Blättern) | 278 ms |
| Liste, 250 Zeilen | 486 ms |
| Sortiert nach Titel | 233 ms |
| Sortiert nach Absender | 299 ms |
| Einfache Suche, 630 Treffer | 689 ms |
| Volltextsuche über den Index | 144 ms |
| Nur zählen | 165 ms |

**In der App**

| Geladen | DOM-Knoten | Speicher | Scrollschritt |
|---:|---:|---:|---:|
| 60 | 1.044 | 10 MB | 60 ms |
| 300 | 5.124 | 10 MB | 61 ms |
| 660 | 11.244 | 10 MB | 64 ms |

Start bis zur bedienbaren Oberfläche: **139 ms**.

**Was die Zahlen sagen**

- `DOC_PAGE = 60` ist gut gewählt. 250 Zeilen kosten fast doppelt so lange, ohne dass mehr
  auf den Schirm passt.
- **Tiefes Blättern kostet nichts extra** — Seite 20 ist so schnell wie Seite 1. Die
  Befürchtung, dass Paginierung bei grossen Beständen einbricht, bestätigt sich nicht.
- Der Baum wächst linear mit rund 17 Knoten je Dokument, aber **Speicher und Scrollzeit
  bleiben flach** bis mindestens 11.000 Knoten. Eine Virtualisierung der Liste ist damit
  vorerst nicht nötig — sie wäre Aufwand ohne messbaren Gewinn.
- Der langsamste Weg ist die **einfache Suche** (689 ms), weil sie ohne Index über den Text
  läuft. Sie greift nur, wenn die Volltextsuche die Eingabe als Syntaxfehler abweist — also
  selten. Der Volltextindex ist mit 144 ms der schnellste Weg überhaupt.

**Bekannte Grenze:** Wer alle 5.000 Dokumente lädt, klickt 83-mal „Weitere laden" und landet
bei rund 85.000 Knoten. Dort wurde nicht gemessen. Falls das je zum Thema wird, ist
Virtualisierung die Antwort — vorher nicht.

**⏸ VERTAGT (Damien, 05.08.2026): Meilenstein C Virtualisierung wird nicht jetzt gebaut.**
Begründung: Die Messungen zeigen unterhalb von `DOC_MAX` keinen Bedarf — Speicher und
Scrollzeit bleiben bis mindestens 11.000 DOM-Knoten flach, tiefes Blättern kostet nichts
extra, und eine frische Ansicht des Dokumente-Tabs hat bei jeder Archivgröße dieselbe
DOM-Größe (server-seitige Paginierung wirkt). Virtualisierung wäre damit Aufwand ohne
messbaren Gewinn — und ein Umbau der Liste ist ein Risiko, das ohne Gegenwert nicht lohnt.
**`tests/perf_check.py` bleibt der Wächter** und läuft in jedem Testlauf mit.
**Welches Signal die Entscheidung wieder aufmacht** (dann ist Meilenstein C erneut zu
bewerten, nicht sofort zu bauen):

1. **`perf_check` schlägt an** — die Stufe wird rot oder ihre Messwerte verschlechtern sich
   deutlich gegenüber der hier festgehaltenen Grundlinie.
2. **`DOC_MAX` wird überschritten** oder heraufgesetzt: die belegte Zahl ist 33.753 DOM-Knoten
   bei 1.201 geladenen Dokumenten (gegen 1.773 bei frischer Ansicht) — das ist der bekannte
   Risikofall. Steigt `DOC_MAX`, steigt er mit.
3. Spürbare Trägheit auf einem echten Gerät nach wiederholtem „Weitere laden" — bisher nur
   im Browser auf dem Rechner gemessen, siehe `docs/GERAETE-CHECKLISTE.md`.

Beleg: `/opt/paperless/ROADMAP.md` (Entscheidung 4 von 5) und `/opt/paperless/PO-STATUS.md`.

### ✅ 3.4 Mehrseitiges Scannen
Aus mehreren Aufnahmen wird **ein** PDF. Vorher wurde ein einzelnes Foto hochgeladen; ein
fünfseitiger Vertrag ergab fünf Dokumente im Posteingang, die niemand mehr zusammenbringt —
Paperless kann sie nicht zusammenfügen, also musste es vor dem Hochladen passieren.

Was der Bildschirm vorher war: gemaltes Papier, gelbe Ecken und die Meldung „Dokument
erkannt – ruhig halten". Es gab keine Kamera. `shutter` erhöhte einen Zähler, das
Löschkreuz verringerte ihn — Seite 2 zu entfernen löschte also Seite 3. Am Ende warf
„Hochladen" alles weg und öffnete den Dateidialog.

Jetzt: Seiten sammeln (mehrere auf einmal), drehen, umsortieren, zuschneiden, entfernen,
Titel vergeben, hochladen. Drehung und Zuschnitt werden bei jeder Änderung neu auf die
Originalaufnahme angewendet — dreimal Drehen verliert nichts.

**PDF ohne Bibliothek** (`scan.js`, rund 120 Zeilen). Die verbreiteten Pakete wiegen 300 KB
bis 1 MB und können Formulare, Schriften, Vektoren, Verschlüsselung; gebraucht wird davon
eines: ein JPEG pro Seite. PDF kennt den Filter `DCTDecode` — das *ist* JPEG. Die Bytes der
Kamera wandern unverändert in die Datei, es wird nichts neu komprimiert.

Geprüft wird auf drei Ebenen, weil ein selbstgeschriebenes Byteformat nur zählt, wenn
fremde Software es liest:

| Ebene | Womit |
|---|---|
| Struktur | 6 Unit-Tests, u. a. ob die Querverweistabelle wirklich auf die Objekte zeigt — genau dort geht ein selbstgebautes PDF kaputt, weil ein eingebettetes Bild jede folgende Byte-Position verschiebt |
| Fremde Leser | poppler (`pdfinfo`, `pdftoppm`) und pypdf öffnen die Datei, Seitengrößen und eingebettete Bilder stimmen |
| Der eigentliche Zweck | Paperless nimmt den Upload an, meldet 2 Seiten und erkennt den Text **beider** Seiten |

Der Browser-Test misst die Wirkung am Bild (`naturalWidth`/`naturalHeight` der Kachel),
nicht das Vorhandensein der Knöpfe. Der alte Kamerabildschirm hätte jede Prüfung bestanden,
die nur nach Knöpfen sucht.

### ✅ 3.5 Automatisierungen bearbeiten
Anlegen, umbenennen, Auslöser wechseln, schalten und löschen gehen jetzt in der App.
Bewusst **nicht** übernommen: Bedingungen und Aktionen. Daran hängen in Paperless 27
Filter- und 14 Aktionsfelder — ein Bildschirm, der die alle abbildet, ist keine App
mehr, sondern eine zweite Verwaltungsoberfläche. Der Hinweis im Detail sagt das offen.

Dabei kamen vier eigene Fehler ans Licht, die vorher niemand bemerkt hätte:

| Fund | Wirkung |
|---|---|
| Auslöser- und Aktionsnamen um eins verschoben | „Aufnahme begonnen“ hiess in der App „Dokument hinzugefügt“ — jede Anzeige war falsch beschriftet. Jetzt durch einen Vertragstest gegen die API abgesichert. |
| Auswahl-Sheet ausserhalb des Sheet-Rahmens | Wurde oben am Rand hinter der Abdunklung gezeichnet: sichtbar, aber nicht anklickbar. |
| Hinweis und Löschen ausserhalb des Scrollbereichs | Lagen unter der Kopfleiste. |
| `S.trenner` fing Klicks ab | Die Trennlinie liegt absolut über der Zeile — ohne `pointer-events:none` gehen Klicks an sie statt an den Eintrag. |

Die ersten drei sahen im Bild richtig aus. Gefunden hat sie erst der Test, der auf die
**Wirkung am Server** prüft statt auf das Vorhandensein der Knöpfe — dieselbe Lehre wie
bei Face ID.

### ⚪ 3.6 Benachrichtigungen
Entfernt, weil nie implementiert. Bräuchte Push-Infrastruktur (VAPID, Push-Dienst) und
serverseitige Auslöser — Paperless liefert das nicht mit.

---

### ✅ 3.7 Bedienungen, die nur geredet haben

Nach dem Hinweis, „Scannen, Foto und Datei" seien Attrappen, habe ich **alle 118 Bedienungen
der Bildschirme** statisch auf ihre Wirkung abgebildet. Ergebnis: 114 unauffällig, 5 nicht.

| Bedienung | Was sie tat | Jetzt |
|---|---|---|
| „Foto", „Datei" | riefen `this.dateiWaehlen(...)` — eine Methode, die es **nirgends gab**. Jeder Klick warf still in die Konsole. | echter Dateidialog, Upload nachgemessen |
| „Hilfe & Support" | Hinweis „Hilfe öffnet sich im Browser" — es öffnete sich nichts | öffnet den Quelltext |
| „Datenschutz" | Hinweis „Datenschutzerklärung öffnet sich" — dito | echter Text: was auf dem Gerät bleibt, was den Server erreicht, wie man es nachmisst |
| „Textgröße" | sah aus wie ein Schalter, zeigte nur einen Hinweis | Anzeige ohne `cursor:pointer` — die App kann daran nichts ändern |
| „Jetzt abrufen" | „Der Abruf läuft nach dem Zeitplan des Servers" | `POST /mail_accounts/{id}/process/`; im Server-Log als `trigger_source: manual` belegt. Ohne Konto heißt der Knopf „Kein Konto eingerichtet" |

**Nachtrag:** „Foto" und „Datei" öffneten auf dem Gerät dieselbe Systemauswahl — inklusive
Dateien und Google Drive. Eine Seite kann dem System nur mitteilen, *welche Typen* sie annimmt
(`accept`); welche Quellen es daraufhin anbietet, entscheidet es selbst. Einen Foto-Picker
kann das Web nicht anfordern, das können nur native Apps. Zwei Einträge, die dieselbe Auswahl
öffnen, sind keine zwei Wege, sondern ein Versprechen, das das System nicht hält — deshalb
gibt es jetzt zwei statt drei: **Dokument scannen** (Kamera, mehrere Aufnahmen werden ein
Dokument) und **Datei hochladen** (PDF, Bild, Text oder Office, auch mehrere).

Zwei neue Netze, beide mit Gegenprobe:

- **`tests/aufrufe_check.py`** — jedes `this.name()` muss eine Definition haben, in der Klasse
  oder über `Object.assign` aus einem Sachgebiet. Entfernt man `dateiWaehlen`, meldet die Stufe
  die Zeile.
- Vier neue Browserprüfungen, die die **Wirkung** messen: ein geöffnetes Fenster mit der
  richtigen Adresse, ein `POST … /process/` mit Antwort 200, ein `cursor` der nicht `pointer` ist.

Nebenbei zwei Fehler in der Vorlagenprüfung selbst: sie las Kommentare mit. Ein `zusagt:` in
einem Erklärsatz galt als geliefertes Feld, ein einzelnes Anführungszeichen im Fließtext
verschluckte alles bis zum nächsten. Der Filter dagegen muss reguläre Ausdrücke mitlesen —
in `/^https?:\/\//` steht die Folge `\/\/`, und wer nur nach zwei Schrägstrichen sucht,
frisst den Rest der Datei.

### ✅ 3.8 Vorschaubilder statt gezeichneter Striche

Die Listen zeigten für jedes Dokument dasselbe gemalte Blatt mit grauen Strichen. Zwischen
zwanzig Rechnungen unterscheidet das nichts. Paperless legt zu jedem Dokument ein
Vorschaubild ab — jetzt steht es an sechs Stellen: Dokumentliste, Raster, „Zuletzt
hinzugefügt", „Zuletzt geöffnet", Posteingang und Ordneransicht.

Zwei Dinge waren dabei zu lösen:

- **Authentifizierung.** Vorschaubilder brauchen den Auth-Header, den ein `<img src>` nicht
  mitschickt. Sie kommen deshalb als Blob und liegen als Object-URL vor.
- **Speicher.** Object-URLs gibt der Browser nie von selbst frei. Bei 5000 Dokumenten wären
  das hunderte Megabyte, nur weil jemand durchgescrollt hat. Es gilt eine Obergrenze von 120;
  was am längsten nicht gebraucht wurde, fällt heraus. Die Verdrängung liegt als reine
  Funktion in `logik.js` und ist mit vier Fällen abgedeckt — eine Browserprüfung könnte sie
  bei fünf Testdokumenten gar nicht erreichen und hätte nur so ausgesehen, als täte sie es.

Das gezeichnete Blatt bleibt als Platzhalter darunter liegen: es ist sofort da, das Bild legt
sich darüber, sobald es geladen ist. Beim Scrollen springt dadurch nichts.

**Nebenbefund:** `Math.absender(...)` in der Wischgeste — die frühere Umbenennung `abs` →
`absender` hatte `Math.abs` mit erwischt. Jedes Wischen an einer Listenzeile warf
`Math.absender is not a function`.

### ✅ 3.9 Dateimanager-Ansicht im Reiter Dokumente

Der Umschalter oben rechts kennt jetzt drei Ansichten statt zwei: **Liste → Raster → Ordner →
Liste**. Die Ordneransicht ist ein Dateimanager — Pfadleiste, eine Ebene höher, Unterordner mit
Anzahl, darunter die Dokumente des Ordners mit ihrer Vorschau.

Die Hierarchie entsteht wie schon unter „Mehr → Ordner" aus den Ablageorten: ein Name wie
`Arbeit/Freelancer/CycleCoin/Vertrag` ergibt vier Ebenen. Beide Stellen teilen sich das Laden,
haben aber getrennte Zustände — ein Wechsel an der einen zieht die andere nicht mit.

Zwei Entscheidungen, die der Ehrlichkeit dienen:

- **Jeder Ordner fragt den Server.** Die Anzeige meint damit den Bestand, nicht die geladene
  Seite — dieselbe Regel wie beim Filtern und Suchen.
- **Filter und Sortierung verschwinden im Ordnermodus.** Sie wirken auf die Liste, nicht auf
  Ordner. Stehen zu lassen, was dort nichts tut, wäre genau die Sorte Bedienung, gegen die
  dieses Projekt schon zweimal antreten musste. Aus demselben Grund zählt die Zeile darunter
  im Ordnermodus „2 Ordner · 2 Dokumente" statt der Gesamtzahl.

### ✅ 3.10 Der Umschalter war unsichtbar

Die Ordneransicht aus 3.9 war nicht erreichbar — nicht wegen eines Fehlers in ihr, sondern
weil der Umschalter **in der waagerecht scrollenden Filterzeile** lag. Bei vier aktiven
Filtern stand er bei x = 700 in einem 390 px breiten Fenster: vorhanden, im Baum auffindbar,
jeder Test hätte ihn geklickt — und für niemanden sichtbar. Man hätte die Filterzeile bis ans
Ende schieben müssen, um ihn zu finden.

Er sitzt jetzt fest neben der Zeile. Die Prüfung fragt nicht mehr, ob es ihn gibt, sondern ob
er im Bild liegt (`getBoundingClientRect` gegen `innerWidth`) — eine dritte Art von Attrappe
nach „Knopf ohne Funktion" und „Knopf, dessen Menü nichts unterscheidet".

### ✅ 3.11 Ziehen zum Aktualisieren

Am oberen Rand nach unten ziehen lädt neu — in allen vier Reitern. Was dabei geladen wird,
hängt davon ab, worauf man sieht: im Ordnermodus der aktuelle Ordner, sonst Liste und
Stammdaten.

Selbst gebaut, weil es dafür nichts Eingebautes gibt: der Browser kennt nur sein eigenes
Überziehen, und das ist in `index.html` abgeschaltet — in einer installierten App ist ein
federnder Bildschirm falsch.

**Der Fehler beim ersten Anlauf:** Die Geste hing an Zeiger-Ereignissen. Mit der Maus geprüft
funktionierte sie, auf dem Gerät nicht. Nachgemessen mit echten Berührungsereignissen: nach
**einem** `pointermove` kommt `pointercancel` — der Browser nimmt die Bewegung für sich —
während `touchmove` weiterläuft. React hängt `touchmove` passiv ein, und ein passiver Zuhörer
darf die Bewegung nicht abfangen. Sie hängt jetzt an eigenen, ausdrücklich **nicht passiven**
Zuhörern am Dokument, die `preventDefault()` aufrufen.

Die Prüfung läuft seitdem über `Input.dispatchTouchEvent` statt über die Maus. Gegenprobe
gemacht: setzt man den Zuhörer wieder auf passiv, schlägt sie fehl.

Drei Details, die den Unterschied machen:

- **Nur ganz oben.** Sonst wäre die Geste dieselbe wie Scrollen, und man würde mitten in der
  Liste versehentlich neu laden. Eigens geprüft: mittendrin nach unten ziehen scrollt und lädt
  nichts.
- **Gedämpft (Faktor 0,45) und mit Schwelle (62 px).** Der Finger legt mehr Weg zurück als der
  Inhalt; das macht den Widerstand spürbar und verhindert ein Auslösen beim Wischen.
- **Kein Markieren.** Mit der Maus gezogen markierte der Browser sonst den Text unter dem
  Zeiger. Auf dem Telefon fällt das nicht an, am Rechner schon.

### ✅ 3.12 Der Posteingang blieb leer, obwohl etwas darin lag

Beim Anlegen eines Testdokuments aufgefallen: Der Server hatte ein Dokument mit dem
Posteingangs-Schlagwort, die App zeigte „Keine neuen Dokumente".

Grund: die Abfrage filterte auf `owner__id=<ich>`. Das stammt aus der Zuweisung an
Teammitglieder — nach der Übergabe soll nur die betreffende Person das Dokument sehen. Nur:
**alles, was über den `consume/`-Ordner, einen Scanner oder den E-Mail-Import hereinkommt, hat
gar keinen Eigentümer.** Genau die Dokumente, für die der Posteingang da ist, waren damit für
niemanden sichtbar.

Richtig ist „mir gehörend **oder** herrenlos" — dieselbe Grenze zieht Paperless selbst
(`documents/filters.py`, `objects_owned` und `objects_unowned`). Weil Filter serverseitig mit
UND verknüpft werden, sind es zwei Abfragen, die zusammengeführt werden.

Dazu: die Prüfansicht des Posteingangs zeigte noch das gemalte Blatt statt der echten Seite —
ausgerechnet dort, wo man gerade entscheidet, was das Dokument ist.

### ✅ 3.13 Blättern im Posteingang

Waagerecht wischen wechselt das Dokument, das gerade geprüft wird. Die Knöpfe bleiben —
die Geste nimmt nur den häufigsten Fall ab: ansehen, weiterblättern, zurückblättern.

Der heikle Teil ist nicht das Blättern, sondern die **Koexistenz**: senkrecht muss weiterhin
gescrollt werden. Die Achse wird beim ersten Zug entschieden (ab 10 px, je nachdem welche
Richtung überwiegt) und dann festgehalten. Ohne das wäre jeder senkrechte Wisch auch ein
bisschen waagerecht, und die Liste der erkannten Angaben ließe sich nicht mehr scrollen.

Dazu zwei Pfeile neben der Zählung: eine Geste, die niemand vermutet, ist keine Bedienung —
und sie sind der Weg für alle, die nicht wischen können oder wollen. Am Anfang und am Ende
federt es nur, statt ins Leere zu blättern.

**Nebenbefund:** Beim Einbau habe ich `s` in `valsPosteingang` benutzt, wo es nicht im
Gültigkeitsbereich stand. Die Oberfläche stürzte ab — und die Fehlergrenze aus 1.2 fing es
sauber ab: „Da ist etwas schiefgegangen. Deine Dokumente sind davon nicht betroffen."

### 🟡 3.14 Die Testreihe füllt das echte Archiv — Teil b umgesetzt, a/c offen

Nachgetragen am 06.08.2026 aus `/opt/paperless/ops/OCR-BEFUND.md`, **Abschnitt 4**
(„Nebenbefund: Duplikate und Papierkorb"). Der Befund stammt vom 05.08. und war dort
ausdrücklich als „gehört in die App-Roadmap" markiert, stand hier aber noch nicht.

**Das Problem:** Die Testreihe lädt bei jedem Durchlauf dieselben Dateien erneut hoch —
`hoch.jpg`, `quer.jpg`, `zz-Pruefung-Scan.pdf`, `app-test.pdf`. Paperless legt sie brav
erneut an und protokolliert dabei nur eine Warnung:

```
[WARNING] [paperless.consumer] Consuming duplicate hoch.jpg:
          215 existing document(s) share the same content.
[WARNING] [paperless.consumer] Consuming duplicate zz-Pruefung-Scan.pdf:
          58 existing document(s) share the same content.
```

**Der Beleg, dass es weiterläuft:** Der Zähler für `hoch.jpg` stieg allein am Abend des
05.08. von 213 auf 215. Und der Dokumentenbestand der **produktiven** Instanz wuchs
zwischen dem Backup vom 05.08. 21:30 und dem vom 06.08. 03:33 von **445 auf 465**
Dokumente, ohne dass in dieser Zeit jemand echte Belege eingelesen hätte
(`/opt/backups/paperless/backup.log`).

**Die Tragweite:** Das ist die belegte Ursache für die über 300 Papierkorb-Einträge aus
dem App-Testbericht und für einen erheblichen Teil der Dokumentenzahl. Es passiert nicht
in einer Sandkiste, sondern **im echten Archiv mit echten Nutzdaten daneben**. Zwei
Folgeschäden, die schwerer wiegen als der Speicherplatz:

- Jede Zählung über die Datenbank ist verfälscht — auch die Kennzahlen im Backup-Manifest
  und in den Leistungsmessungen.
- Die Testartefakte sind im Nachhinein **nicht sicher von echten Dokumenten zu
  unterscheiden** (siehe `/opt/paperless/ops/PAPIERKORB-PLAN.md`). Jeder Testlauf macht
  das Aufräumen teurer.

**Drei Auswege — bewertet, keiner umgesetzt:**

| Weg | Was er löst | Was er kostet / offen lässt |
|---|---|---|
| **a) Aufräumen am Ende des Testlaufs** | Der Bestand wächst nicht weiter; die Testreihe hinterlässt nichts. | Löst nur die *Zukunft*. Ein abgebrochener oder roter Lauf räumt nicht auf — dann bleibt genau der Fall übrig, den man nicht mehr zuordnen kann. Und ohne (b) muss das Aufräumen die Dokumente über den Dateinamen finden, also über ein Kriterium, das ein echtes Dokument theoretisch auch tragen kann. |
| **b) Eindeutige Kennzeichnung der Testuploads** (Schlagwort und/oder Titelpräfix, z. B. `ZZ-TEST-<Zeitstempel>`) | Macht Testdokumente **zweifelsfrei identifizierbar** — vorwärts wie rückwärts. Danach ist Aufräumen ein sicherer Filter statt einer Sichtprüfung. | Verhindert das Anwachsen **nicht**. Ist für sich genommen nur die halbe Lösung — aber die Hälfte, die alle anderen Wege erst sicher macht. Kleiner Eingriff: die Testreihe setzt beim Upload ein Schlagwort bzw. einen Titelpräfix. |
| **c) Getrennte Testinstanz oder eigener Testbenutzer** | Die sauberste Trennung: echte Nutzdaten werden von der Testreihe gar nicht mehr berührt. Ein eigener Testbenutzer ist die kleine Variante (Besitz-Filter statt eigener Instanz), eine zweite Instanz die große. | Eine zweite Instanz heißt: zweiter Container, zweite Datenbank, zweiter Speicher, zweiter Update-Pfad — echter Betriebsaufwand für ein Nebenprodukt. Ein eigener Testbenutzer ist billig, trennt aber nur logisch: dieselbe Datenbank, dieselbe OCR-Warteschlange, dieselben Duplikatzähler. |

**Empfehlung (Entscheidung bleibt offen):** **b) zuerst, a) unmittelbar danach.** Die
Kennzeichnung ist der kleinste Eingriff mit der größten Wirkung, weil sie das eigentlich
teure Problem löst — die Unterscheidbarkeit — und das Aufräumen aus (a) überhaupt erst
gefahrlos macht. Umgekehrt wäre (a) allein ein Löschlauf, der sich auf Dateinamen
verlässt. **c)** ist die technisch sauberste Antwort und bleibt das Fernziel; sie lohnt
sich, sobald ohnehin eine zweite Instanz gebraucht wird (etwa zum Erproben eines
paperless-Updates vor dem Fenster). Vorher steht der Betriebsaufwand nicht im Verhältnis.

Das nachträgliche Aufräumen des bereits entstandenen Bestands ist **nicht** Teil dieses
Punktes: es betrifft die produktive Instanz, braucht ein frisches Backup und Damiens
Sichtprüfung und ist in `/opt/paperless/ops/PAPIERKORB-PLAN.md` vorbereitet (offene
Frage 5).

**Teil b umgesetzt (08.08.2026, Commit `f45ae30`), gemäß Damiens Freigabe vom 08.08.2026
(„erst Testuploads eindeutig kennzeichnen, danach aufräumen"; siehe `/opt/paperless/PO-STATUS.md`,
Abschnitt „Freigaben und Entscheidungen von Damien (08.08.2026)", Punkt 7).** Alle drei
Upload-Stellen der Testreihe tragen jetzt einen zur Laufzeit erzeugten Titelpräfix nach dem
Muster `ZZ-TEST-<Zeitstempel>`:

- `tests/api_check.py`, `t_upload_roundtrip` — Titel-Override beim Upload-Aufruf (die API
  unterstützt das bereits über `multipart({"title": …}, …)`).
- `tests/browser_check.py`, `t_scan_wird_ein_pdf` — Titel-Override über das ohnehin vorhandene
  Titelfeld im Scan-Bildschirm.
- `tests/browser_check.py`, `t_datei_kommt_beim_server_an` — dieser Weg fragt keinen Titel ab;
  der Server leitet ihn aus dem Dateinamen ab. Die Testdatei wird deshalb zur Laufzeit in eine
  temporäre, markierte Kopie umbenannt, bevor sie ausgewählt wird — kein Eingriff in `app.js`
  nötig.

Nachweis: `tests/run_e2e.py --statisch` 9/9 grün; `tests/api_check.py` 24/24 grün (Upload-Test
belegt den neuen Präfix im Titel); `tests/browser_check.py` lief mehrfach mit denselben,
umgebungsbedingten Fehlschlägen (403 auf einzelne Ressourcen, Cache-Abweichung,
`net::ERR_ABORTED`), die nachweislich **nicht** mit dieser Änderung zusammenhängen — beide
Upload-Prüfungen liefen in mehreren Läufen sauber grün, sobald der davonstehende 403-Fehler
ausblieb; Details im Tageslog von `/opt/paperless/PO-STATUS.md`.

**Ausdrücklich offen bleiben Teil a) Aufräumen und Teil c) eigene Testinstanz/-benutzer** —
beide waren nicht Gegenstand dieses Auftrags. Der Bestand wächst mit jedem Testlauf weiterhin;
diese Änderung macht die Testartefakte nur zuverlässig auffindbar, verhindert ihr Entstehen
nicht.

### 🟠 3.15 Veralteter Suchparameter `title_content` — tickt auf das nächste Update-Fenster

Ebenfalls am 06.08.2026 nachgetragen, Quelle `/opt/paperless/ops/OCR-BEFUND.md`,
**Abschnitt 5** („Nebenbefund: zwei Meldungen aus der API"). Auch dieser Punkt war dort
als App-Thema markiert und fehlte hier.

**Der Beleg im Code:** `api.js`, **Zeile 514** — in `documents.search()`:

```js
return request('GET', '/documents/', Object.assign({ params: mit({ query: q }) }, opts || {}))
  .catch(function (e) {
    if (e.status !== 400) throw e;
    return request('GET', '/documents/', Object.assign({ params: mit({ title_content: q }) }, opts || {}))
```

Die Suche fragt zuerst den Volltextindex (`query=`, Whoosh-Syntax). Quittiert der Server
das mit `400`, fällt sie auf `title_content=` zurück — die schlichte Teilstringsuche über
Titel und Inhalt, damit die Suche „nie einfach nichts tut".

**Was der Server dazu protokolliert** — beide Meldungen treten regelmäßig **zusammen** mit
den App-Testläufen auf, weil sie zwei Hälften desselben Vorgangs sind:

```
[WARNING] [paperless.api] An error occurred listing search results: Syntax Error: :::[
[WARNING] [paperless.api] Deprecated document filter parameter 'title_content' used; use `text` instead.
```

Die erste Zeile ist der fehlgeschlagene `query=`-Versuch: Ein Suchtext wie `:::[` ist
keine gültige Whoosh-Syntax und wird vor dem Absenden nicht maskiert. Die zweite Zeile ist
der Rückfall, der genau dadurch ausgelöst wird.

**Wie dringend ist das? Heute gar nicht — und irgendwann auf einen Schlag.**

- Es läuft. Das Backend ist auf `ghcr.io/paperless-ngx/paperless-ngx:3.0.5` **gepinnt**
  (kein `:latest`), `title_content` ist dort noch vorhanden und funktioniert. Es gibt
  **keine Eile**.
- Aber es ist eine tickende Uhr, und man weiß, wann sie klingelt: beim nächsten
  Versionssprung. Das Update-Fenster ist der **1. Dienstag im Monat, 20:00–21:00**,
  nächster Termin **01.09.2026** —
  `/opt/paperless/ops/UPDATE-RUNBOOK.md`, **Abschnitt 0**. Fällt der Parameter in der
  Zielversion weg, liefert der Rückfallpfad einen Fehler statt Ergebnissen, und zwar
  ausgerechnet dann, wenn ohnehin alles neu ist. Deshalb gehört dieser Punkt in die
  Vorbereitung des Fensters (Runbook Abschnitt 1: „geänderte oder entfallene
  Parameter prüfen"), nicht in eine Notfallschicht danach.

**Zwei getrennte Aufgaben, nicht eine:**

1. **`title_content` → `text`.** Ein Parametername in einer Zeile. Braucht einen
   Vertragstest gegen die API (`tests/api_check.py` prüft bereits Auslöser- und
   Aktionsnummern gegen den Server — dasselbe Muster), damit der Rückfallpfad nicht
   wieder unbemerkt veraltet. Der Rückfall als *Mechanismus* bleibt richtig und soll
   bleiben.
2. **Den Syntaxfehler gar nicht erst erzeugen.** Der `400` ist heute kein sichtbarer
   Schaden — der Rückfall greift, die Nutzerin bekommt Treffer (die Antwort ist mit
   `einfach: true` markiert). Der Preis ist eine zusätzliche Rundreise zum Server bei
   jeder Suche mit Sonderzeichen und eine Warnung im Serverprotokoll bei jedem Versuch.
   Eingaben mit Whoosh-Sonderzeichen (`: [ ] ( ) * ?`) also entweder maskieren oder
   erkennen und direkt einfach suchen. **Anmerkung zur Quelle:** OCR-BEFUND Abschnitt 5
   schreibt, für den Benutzer heiße das „Suche ohne Treffer statt Fehlermeldung" — das
   trifft so nicht zu, weil der Rückfall in `api.js` genau das abfängt. Der Befund selbst
   (Syntaxfehler wird erzeugt, Parameter ist veraltet) bleibt richtig.

**In diesem Nachtrag wurde `api.js` nicht angefasst** — der Punkt ist dokumentiert, nicht
umgesetzt.

---

## Phase 4 — Aufräumen

### ✅ 4.1 Drei Megabyte Babel
`vendor/` wiegt 3,4 MB, davon 3,0 MB Babel — gebraucht **nur** von `iphone.html`, der
Design-Vorschau mit simulierter iPhone-Hülle. 88 % des Vendor-Gewichts für ein
Entwicklerspielzeug im öffentlichen Repository. Vorschlag: `iphone.html`, `ios-frame.jsx`
und Babel in einen Zweig oder ein eigenes Verzeichnis, das nicht mit ausgeliefert wird.

### ✅ 4.2 Zwei Vokabulare für dieselben Daten
Die Übersetzungsschicht bleibt — sie ist die richtige Grenze zwischen API-Form und
Oberfläche. Was weg musste, waren die kryptischen Kürzel: `abs` las sich wie `Math.abs`,
`ocr` benannte den Dokumentinhalt falsch. Jetzt heissen sie `absender`, `dokumentart`,
`ablageort`, `archivnummer`, `seitenzahl`, `inhalt`, `favorit`, `hinzugefuegt`.

**Dabei kam eine zweite `mapDoc` ans Licht** — eine in `logik.js`, die die Tests prüften,
und eine in `app.js`, die tatsächlich lief. Die laufende war die reichere (Notizen,
`is_shared_by_requester`). Jetzt gibt es eine Fassung, und vier neue Testfälle decken ab,
was die Doppelung verdeckt hatte. Ebenso lag `benutzernameAus` doppelt vor — und die
Kollisionsprüfung beim Anlegen lief ins Leere, weil `username` gar nicht im Zustand stand.

### ✅ 4.3 Zurück-Pfeil vereinheitlichen
Das Dokument-Detail nutzt ein anderes Glyph (`M10 2L2 10l8 8`) als alle übrigen Bildschirme
(`M8.5 1.5L1.5 8.5l7 7`). Rein kosmetisch, aber uneinheitlich.

### ✅ 4.4 Wiederholte Stilfragmente
159 Stellen in 15 benannte Konstanten überführt (`stile.js`) — die Karte stand 24-mal
wörtlich da, der Trenner 20-mal, der runde Kopfknopf 17-mal. Aufgenommen ist nur, was
mindestens fünfmal wortgleich vorkam: eine Konstante für einen einzigen Ort verschiebt
die Suche nur.

### ✅ 4.5 `renderVals()` aufgeteilt
543 Zeilen, 419 Schlüssel, ein Objektliteral — der letzte grosse Block in einer Hand. Wer
einen Wert suchte, las alles; zwei Änderungen an verschiedenen Bildschirmen trafen sich
im selben Diff.

Jetzt rechnet `renderKontext()` die 25 Zwischenwerte einmal aus (`dDoc`, `rev`, `pickOpts`
und so fort) und reicht sie als Kontext weiter; vierzehn Abschnitte liefern je ein
Sachgebiet — `valsRahmen`, `valsNavigation`, `valsStart`, `valsDokumentliste`,
`valsPosteingang`, `valsMehr`, `valsDokument`, `valsSuche`, `valsOrdnung`,
`valsEinstellungen`, `valsVerwaltung`, `valsSheets`, `valsErfassen`, `valsOnboarding`.
Jeder destrukturiert vorne genau das, was er braucht — daran lässt sich seine Abhängigkeit
ablesen, statt sie zu suchen. `renderVals()` legt die Abschnitte zusammen und ist damit
zwanzig Zeilen lang.

**Kein Wert hat sich geändert**: jede Zeile wurde wortgleich verschoben, die 418 Schlüssel
sind dieselben. Entfallen ist genau einer — `shUser` stand zweimal im Literal, die erste
Zuweisung war seit jeher tot (die spätere, mit `!!userS`, hat immer gewonnen). Genau so
etwas verbirgt ein 543-Zeilen-Block.

`tests/template_check.py` folgt der Aufteilung und prüft weiterhin beide Richtungen. Neu
ist ein dritter Fehlerfall: ein `vals`-Abschnitt in `app.js`, den `renderVals()` nicht
zusammenlegt, bricht die Prüfung ab — sonst wären seine Werte im Browser leer und die
Prüfung stillschweigend löchrig.

---

## Was gelogen war

Fünf Bedienelemente versprachen etwas, das die App nicht leistete. Alle bereinigt, hier als
Mahnung, weil es bis zur Nachfrage des Nutzers unbemerkt blieb — auch durch einen
38-Stationen-Durchlauf hindurch, der geprüft hat, ob ein Schalter *da* ist, statt ob er
*etwas tut*.

| Element | Was es tat |
|---|---|
| „Mit Face ID schützen" | Speicherte einen Boolean. Kein WebAuthn, keine Sperre. Beide Onboarding-Knöpfe führten an dieselbe Stelle. |
| Benachrichtigungen | Keine Nutzung der Notification-API im Projekt. |
| Automatisch zuschneiden | Beim Upload nirgends ausgewertet. |
| Selbstsigniertes Zertifikat erlauben | Aus JavaScript grundsätzlich unmöglich — das entscheidet der Browser. |
| Standardansicht Liste/Raster | Galt nur bis zum nächsten Start. |

**Regel daraus:** Ein Test muss prüfen, ob ein Bedienelement *wirkt*, nicht ob es
*existiert*. Gehört zu 1.3.

---

## Reihenfolge

```
1.1 Datei zerschlagen  ─┐
1.3 Unit-Tests         ─┼─→  2.1 Schlüssel  ─→  3.1 Einladungen (Grundsatzentscheidung)
1.2 Runtime ersetzen   ─┘        2.3 catch
                                 2.4 Rechte
```

1.1 und 1.3 gehören zusammen: Tests schreiben sich beim Zerschlagen fast von selbst, und
sie sind das Netz, das den Umbau überhaupt erst verantwortbar macht. 1.2 ist unabhängig und
die größte Einzelentscheidung.

Alles in Phase 3 wartet auf Phase 1 — neue Funktionen in einer 3.600-Zeilen-Datei ohne
Unit-Tests machen die Lage nur schlechter.


## Meilenstein B — Accessibility-Fortschritt 2026-08-02

- Neue Teststufe `tests/a11y_check.py` mit Baseline fuer klickbare div/span und Button-Type-Regel.
- Erste Batch: Entsperr-Dialog nutzt native Buttons mit `DWStile.buttonReset`.
- ADR `docs/adr/0004-accessibility-semantics.md` dokumentiert die Migrationsstrategie.
- Zweite Batch: Auswahlleiste fuer Mehrfachauswahl nutzt native Buttons mit sprechenden Namen fuer Verschlagworten, Export, Loeschen und Fertig.
- Restschuld: 175 klickbare div/span; manuelle Screenreader-/Geraetetests stehen aus.
- Dritte Batch: vorlage/ordnung.js (Dokumentliste, Organisation, Papierkorb) komplett auf native Buttons
  umgestellt (10 -> 0 klickbare div/span, 10 neue Button-Elemente mit aria-label). Volle Suite (7 statische
  Stufen + 24 API + 36 Browser) danach gruen, Huellenversion neu gesetzt.
- Restschuld: 165 klickbare div/span in dokument.js, erfassen.js, sheets.js, tabs.js, verwaltung.js.

## Meilenstein B — Accessibility-Fortschritt 2026-08-02 (Fortsetzung)

- Vierte Batch: vorlage/erfassen.js (Scan-Bildschirm) auf native Buttons umgestellt.
  14 -> 1 klickbare div/span, 13 neue Button-Elemente. title-Attribute neben aria-label
  beibehalten, da die Browser-E2E-Tests per title selektieren.
- Restschuld: 147 klickbare div/span in dokument.js, sheets.js, tabs.js, verwaltung.js.

## Meilenstein B — Accessibility-Fortschritt 2026-08-02 (Fuenfte Batch)

- Fuenfte Batch: vorlage/dokument.js (Dokument-Detail, Posteingang-Pruefung, Suche)
  komplett auf native Buttons umgestellt: 33 -> 0 klickbare div/span, 26 neue
  Button-Elemente. Segment-Umschalter (Vorschau/Text/Info) und Favorit-Knopf erhielten
  aria-pressed; die Vor/Zurueck-Pfeile im Posteingang nutzen disabled statt nur
  optischem opacity. Suchfeld bekam ein verknuepftes (visuell verstecktes) Label.
  Huellenversion neu berechnet (4fe11d3e5ea2). Volle Suite (9 Stufen, 37 Browser-
  pruefungen) danach gruen.
- Restschuld: 115 klickbare div/span in sheets.js (50), tabs.js (34), verwaltung.js (30),
  erfassen.js (1 bewusst offen gelassener Undo-Link).


## Sicherheits-/CI-Fortschritt 2026-08-02

- Neue Pflichtstufe `tests/geheim_check.py`: versionierte Dateien werden auf Paperless-Token-
  Muster, Zugangsdaten in URLs und direkte Secret-Zuweisungen geprueft; `.env` und
  `tests/.token` duerfen nicht versioniert sein. Die Stufe ist in `tests/run_e2e.py` und
  `.github/workflows/pruefung.yml` eingebunden.
- Bestehende Testwerte fuer Zugangstext und URL-Credentials werden aus Teilen gebaut, damit
  externe Secret-Scanner keine harmlosen, aber erziehungsgefaehrlichen Fehlalarme melden.
- Version: 0.1.1 -> 0.1.2 (PATCH: Sicherheits-/Release-Gate).


## Meilenstein B, Batch 6 (2026-08-03)

- vorlage/sheets.js: 50 klickbare div/span -> 1 (Sheet-Hintergrund, schliesst per Escape).
  45 native Buttons mit aria-label, Umschalter (Filter-Chips, Auswahl-Zeilen) nutzen
  aria-pressed. Eingabefelder (Titel, Notiz, Name, E-Mail, Suche-nach-neu) erhielten
  verknuepfte aria-label.
- Restschuld: 65 klickbare div/span in tabs.js (34) und verwaltung.js (31), plus 1
  bewusst offen gelassener Undo-Link in erfassen.js.
- Naechster Schritt: tabs.js und verwaltung.js in derselben Systematik migrieren, danach
  Meilenstein C (Virtualisierung) und der Goldstandard-Scanner-Meilenstein.
- Version: 0.1.2 -> 0.2.0 (MINOR).


## Meilenstein B, Batch 7 (2026-08-03)

- vorlage/tabs.js: 34 klickbare div/span -> 0. 34 neue native Buttons mit aria-label
  fuer Einstellungen-Avatar, Suche, Scannen/Datei-Kacheln, Erledigen-Karten (Posteingang,
  Duplikat, fehlende Angaben), Zuletzt-hinzugefuegt/-geoeffnet/-Favoriten-Zeilen,
  Ordner-Navigation (Pfadleiste, Ordner- und Dateizeilen), Raster-Kacheln, Bibliothek/
  Organisation/Verwaltung-Zeilen in "Mehr" sowie die Kontokarte mit Einstellungen-Zugang.
  Alle Aktionszeilen nutzen `S.buttonReset` plus `width:100%;text-align:left`, damit sich
  am sichtbaren Layout nichts aendert.
- tests/browser_check.py an die neue Semantik angepasst: der Listen/Raster/Ordner-
  Umschalter wird jetzt ueber `button[aria-label='Ansicht wechseln']` statt einer
  CSS-Heuristik auf einem `<div>` angesprochen, die Ordner-Klicks in der Reiter-Pruefung
  ueber `button[aria-label="Ordner „…" öffnen"]`, die Pfadleisten-Pruefung akzeptiert jetzt
  auch `<button>`-Textknoten (der letzte, aktive Ort bleibt ein `<span>`), und der
  Einstellungen-Einstieg wird ueber `[data-konto]` statt einer Positions-Heuristik
  angesprochen.
- tests/a11y_check.py-Baseline fuer tabs.js auf 0 gesenkt.
- Huellenversion neu berechnet. Volle Suite (10 Stufen, 60 Unit, 24 API/Geheimnis-Checks,
  37 Browserpruefungen) danach gruen.
- Restschuld jetzt: 30 klickbare div/span in verwaltung.js, 1 bewusst offen (erfassen.js,
  Undo-Link).
- Naechster Schritt: verwaltung.js migrieren (letzte grosse Restschuld aus Meilenstein B),
  danach Meilenstein C (Virtualisierung) und der Goldstandard-Scanner-Meilenstein.
- Version: 0.2.0 -> 0.3.0 (MINOR: sichtbarer A11y-Fortschritt, kein Verhaltensbruch,
  Testsuite an neue Semantik angepasst).


## Meilenstein B, Batch 8 (2026-08-03) - Meilenstein B strukturell abgeschlossen

- vorlage/verwaltung.js: 30 klickbare div/span -> 0. Letzte grosse Restschuld aus
  Meilenstein B behoben. Details siehe docs/AUDIT.md.
- Verbleibend bewusst offen: 1 Undo-Link (erfassen.js, Toast-Kontext), 1 Sheet-
  Hintergrund (sheets.js, reine Dekoration, schliesst per Escape).
- Manuelle Screenreader-/Geraetetests (VoiceOver, TalkBack, NVDA, Kontrast,
  reduced-motion, Touch-Targets) stehen weiterhin aus - automatisierte Pruefung
  deckt nur strukturelle Semantik ab.
- Naechster Schritt: Meilenstein C (Virtualisierung fuer grosse Archive, Performance-
  Tests 100/1000/5000/20000/50000 Dokumente) oder der Goldstandard-Scanner-Meilenstein.
- Version: 0.3.0 -> 0.4.0 (MINOR).


## Goldstandard-Scanner, Phase 0 (2026-08-03)

- ADR 0005 (docs/adr/0005-goldstandard-scanner.md) legt die Architektur und den
  Phasenplan fuer den Goldstandard-Scanner fest: Ist-Zustand (Datei-Dialog mit
  capture=environment, keine eigene Kameravorschau, client-seitige Drehung/
  Zuschnitt/PDF-Pipeline in scan.js) dokumentiert, Referenzvergleich zu Swift
  Paperless festgehalten, sechs Phasen definiert (Live-Kamera-Huelle mit
  Fallback -> Aufnahme/Review/Upload an bestehende Pipeline -> Bildverstaerkung
  -> Kantenerkennung/Overlay -> Automatischer Ausloeser -> Native-Wrapper-
  Haertung).
- Bewusste Entscheidung: der bestehende, funktionierende Datei-Dialog-Weg
  bleibt bis zur echten Geraeteverifikation der neuen Kette die dauerhafte
  Fallback- und Desktop-Loesung. Keine grosse CV-Abhaengigkeit ohne
  dokumentierten Groessen-/Lizenzvergleich.
- Keine Codeaenderung in diesem Batch (nur ADR). Naechster Schritt: Phase 1
  (Live-Kamera-Huelle mit robuster Fallback-Kette zu getUserMedia, manueller
  Ausloeser, kein Auto-Capture) als eigener, testbarer Batch.
- Version: 0.4.0 -> 0.4.1 (PATCH: Architekturentscheidung dokumentiert, kein
  Verhaltensbruch).


## Fehlerbehebung: doppeltes Blaettern im Posteingang (2026-08-03)

- Vor dem geplanten Start von Goldstandard-Scanner Phase 1 fand die vorgeschriebene
  volle Testsuite einen echten Regressionsfehler: Wisch-Blaettern im Posteingang
  ueberspringt auf Touch-Geraeten eine Karte, weil revZiehEnde doppelt ausgeloest
  wurde (Pointer- und Touch-Pfad liefen parallel, siehe docs/AUDIT.md fuer Details).
  Behoben durch dieselbe pointerType-Wache wie bei Start/Zug. Volle Suite (10
  Stufen, 37 Browserpruefungen) danach gruen.
- Version: 0.4.1 -> 0.4.2 (PATCH).


## Goldstandard-Scanner, Phase 1 (2026-08-03) - Live-Kamera-Huelle mit Fallback

- Umgesetzt gemaess ADR 0005: `getUserMedia`-Faehigkeitspruefung (`logik.js:
  kameraNutzbar`), Vollbild-`<video>`-Vorschau mit manuellem Ausloeser und
  "Aus Dateien waehlen" als Parallelweg, robuste dreistufige Fallback-Kette
  (erlaubt -> Vorschau, verweigert/Fehler -> Hinweis + Dateidialog, API fehlt
  -> direkt Dateidialog). Snapshot aus dem Video laeuft durch dieselbe
  Aufnahme-Pipeline (`scanAufnahmen`) wie der Dateidialog - keine zweite
  Bildverarbeitung, `scan.js`/DWScan unveraendert.
- Drei neue Playwright-Tests fuer die Fallback-Kette (echter `MediaStream`
  via Canvas, Verweigerung, fehlende API); ein echter Absturz-Fehler
  (`srcObject` bei fehlerhaftem Stream-Objekt) wurde dabei gefunden und
  behoben, nicht nur der Test angepasst. Details: docs/AUDIT.md.
- Volle Suite (10 Stufen, 60 Unit, 24 API/Geheimnis-Checks, 40
  Browserpruefungen) danach gruen. Huellenversion neu berechnet.
- Nicht verifiziert: echtes Kameragerat/echtes Telefon. Keine "Goldstandard"-
  oder Paritaets-Aussage vor Geraeteverifikation.
- Naechster Schritt: ADR-0005-Phase 3 (Bildverstaerkung: Graustufe/Kontrast/
  Helligkeit/Schaerfen, Unschaerfe-/Blend-Warnung) oder Phase 4
  (Kantenerkennung/Overlay) - Reihenfolge noch offen, beide bauen nicht
  zwingend aufeinander auf.
- Version: 0.4.2 -> 0.5.0 (MINOR: erste real nutzbare Kamera-Faehigkeit).


## Goldstandard-Scanner, Phase 3 (2026-08-03) - Bildverstaerkung

- Modus-Umschalter Original/Graustufe fuer den gesamten Scan, echte
  Pixelrechnung statt CSS-Filter (siehe docs/AUDIT.md fuer Details).
  Kontrast/Helligkeit in `scan.js: seiteAus` bereits als Parameter
  vorbereitet, noch ohne eigenes UI-Element.
- Nicht blockierende Unschaerfe-Heuristik nach jeder Aufnahme (vereinfachter
  Laplace-Filter, Hinweis-Toast statt Verbot).
- Ein neuer Browser-Test, volle Suite danach gruen (10 Stufen, 41
  Browserpruefungen). Huellenversion neu berechnet.
- Naechster Schritt: ADR-0005-Phase 4 (Kantenerkennung/Overlay) oder
  Kontrast/Helligkeit-UI, danach weiterhin Meilenstein C (Virtualisierung)
  und Meilenstein D (Release-Dokumentation) gemaess Prioritaetsreihenfolge.
- Version: 0.5.0 -> 0.6.0 (MINOR).


## Goldstandard-Scanner, Kontrast/Helligkeit-UI (2026-08-03)

- Zwei Schieberegler (Kontrast, Helligkeit) im Scan-Bildschirm ergaenzen den
  bestehenden Original/Graustufe-Umschalter aus Phase 3. Der Rechenweg in
  `scan.js: seiteAus` war bereits vorbereitet, es fehlte nur die Bedienflaeche
  - siehe docs/AUDIT.md fuer Details.
- Volle Suite (10 Stufen, 41 Browserpruefungen) danach gruen. Huellenversion
  neu berechnet.
- Naechster Schritt: eigener Browser-Test fuer die neuen Regler, danach
  ADR-0005-Phase 4 (Kantenerkennung/Overlay) oder Meilenstein C
  (Virtualisierung fuer grosse Archive) gemaess Prioritaetsreihenfolge.
- Version: 0.6.0 -> 0.6.1 (PATCH).


## Test-Haertung: eigener Browser-Test fuer Kontrast/Helligkeit (2026-08-03)

- Die Kontrast/Helligkeit-Regler aus 0.6.1 hatten noch keinen eigenen
  Browser-Test - sie liefen nur "huckepack" ueber Sichtpruefung. Ergaenzt:
  `t_scan_regler_wirken` in `tests/browser_check.py` prueft, dass beide
  Regler echte Pixelrechnung ausloesen (neue Bildquelle je Regler, nicht nur
  ein CSS-Filter), der Anzeigewert dem Regler folgt (160%, +40) und keine
  Seite beim Rechnen verloren geht. Regler werden danach zurueckgesetzt,
  damit nachfolgende Pruefungen (Zuschnitt, Massvergleich) vom bekannten
  Ausgangszustand starten.
- Volle Suite danach gruen (10 Stufen, 42 Browserpruefungen, vorher 41).
  Huellenversion neu berechnet.
- Naechster Schritt: ADR-0005-Phase 4 (Kantenerkennung/Overlay) oder
  Meilenstein C (Virtualisierung fuer grosse Archive) gemaess
  Prioritaetsreihenfolge.
- Version: 0.6.1 -> 0.6.2 (PATCH).


## Goldstandard-Scanner, Randvorschlag beim Zuschnitt (2026-08-03)

- Teilumsetzung von ADR-0005-Phase 4: `scan.js: randSchaetzen` schaetzt ein
  achsenparalleles Rechteck um das Dokument (Gradientenprofil auf
  verkleinertem Graustufenbild, keine externe CV-Bibliothek). Der
  Zuschnitt-Bildschirm startet weiterhin sofort mit dem vollen Rahmen und
  ersetzt ihn asynchron durch den Vorschlag, sobald er vorliegt - "Ganz"
  bleibt jederzeit erreichbar. Details und bewusste Abweichungen von der
  urspruenglichen Phase-4-Beschreibung (kein Live-Overlay, kein
  perspektivisches Viereck): docs/adr/0005-goldstandard-scanner.md.
- Ein neuer Browser-Test ("Randerkennung schlaegt Zuschnitt vor") prueft
  Fund und Nicht-Fund an synthetischen Bildern. Volle Suite (10 Stufen, 43
  Browserpruefungen, davon 1 neu) danach gruen. Huellenversion neu
  berechnet.
- Nicht verifiziert: echte fotografierte Dokumente unter realem Licht.
  Keine "Goldstandard"- oder Paritaets-Aussage vor Geraeteverifikation.
- Naechster Schritt: echte Geraeteverifikation der bisherigen
  Scanner-Phasen oder Meilenstein C (Virtualisierung fuer grosse Archive)
  gemaess Prioritaetsreihenfolge.
- Version: 0.6.2 -> 0.7.0 (MINOR).


## Meilenstein C, erster Schritt: Leistungs-Pruefstufe (2026-08-03)

- Neue Pruefstufe `tests/perf_check.py` (Details: docs/AUDIT.md) misst
  reproduzierbar DOM-Groesse und Anzahl der `/documents/`-Anfragen bei
  100 / 1.000 / 5.000 / 20.000 / 50.000 synthetischen Dokumenten via
  Playwright-Mock-Routing, ohne echten Server oder Testdaten.
- Kernbefund: eine frische Ansicht des Dokumente-Tabs bleibt bei jeder
  Archivgroesse bei derselben DOM-Groesse (server-seitige Paginierung
  wirkt). Der eigentliche Risikofall fuer Meilenstein C ist wiederholtes
  "Weitere laden" bis nahe `DOC_MAX = 1200`, nicht der Gesamtbestand -
  das ist noch nicht gemessen und der naechste Teilschritt.
- Volle Suite (11 Stufen) danach gruen.
- Version: 0.7.0 -> 0.8.0 (MINOR).


## Meilenstein C, Beleg fuer den realen Risikofall (2026-08-03)

- `tests/perf_check.py` misst jetzt zusaetzlich den DOC_MAX-Grenzfall
  (wiederholtes "Weitere laden"): bei 1.201 geladenen Dokumenten liegen
  33.753 DOM-Knoten im Listenbereich (vs. 1.773 bei einer frischen Ansicht,
  unabhaengig vom Gesamtbestand). Das ist der belastbare Beleg fuer den
  Nutzen von Fensterung/Virtualisierung, den Meilenstein C bisher nur
  vermutet hatte. Details: docs/AUDIT.md.
- Naechster Schritt: Entscheidung ueber Umsetzung (echte Virtualisierung
  vs. einfachere Zwischenloesung), danach ggf. Umsetzung selbst.
- Version: 0.8.0 -> 0.8.1 (PATCH).

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



## Meilenstein B/Scanner, sichtbarer Fokus und Status im Zuschnitt (2026-08-04)

- Scanner-Zuschnitt: fokussierte Eckgriffe haben jetzt einen expliziten, kontrastreichen Fokuszustand.
- Screenreader erhalten während der Zuschnittänderung einen höflichen Live-Status mit Prozentwerten für links/oben/rechts/unten.
- Browser-Regressionstest erweitert: prüft Fokusdarstellung, Pfeiltastenbewegung und aktualisierten Zuschnittstatus.
- Volle Suite (11 Stufen, 60 Unit, 24 API, 44 Browserprüfungen) danach grün; Hüllenversion neu berechnet.
- Version: 0.8.5 -> 0.8.6 (PATCH: Scanner-A11y und Regressionstest, kein API-/Datenmodellwechsel).

## Meilenstein B/Scanner, Toast-Rueckgaengig semantisch bedienbar (2026-08-04)

- Aenderung: Der Rueckgaengig-Eintrag im Toast ist kein klickbarer span mehr, sondern ein nativer button mit zugaenglichem Namen. Damit ist die Scanner-/Upload-Toast-Aktion per Tastatur fokussierbar und ausloesbar, ohne Touch-Verhalten oder visuelle Gestaltung wesentlich zu veraendern.
- Testabdeckung: Die A11y-Leitplanke senkt die erlaubte Restschuld in vorlage/erfassen.js von 1 auf 0; die komplette E2E-Suite bestaetigt jetzt 193 Buttons und 6 verbleibende klickbare div/span in anderen Bereichen.
- Produktionsreife bleibt bei 56 Prozent, Accessibility-Teilscore steigt von 34 Prozent auf 35 Prozent, weil eine reale interaktive Restschuld geschlossen wurde. Manuelle Screenreader-/Mobilgeraetepruefung bleibt erforderlich.
- Version: 0.8.6 -> 0.8.7 (PATCH: Accessibility-Verbesserung, kein API-/Datenmodellwechsel).


### 2026-08-04 - A11y-Batch: Sheet-Backdrop

- Der Sheet-Backdrop wurde von einem klickbaren `div` auf einen nativen `button type="button"` mit zugaenglichem Namen "Sheet schliessen" umgestellt. Touch-Verhalten bleibt gleich, Tastatur und Screenreader bekommen jetzt ein echtes Bedienelement.
- `tests/a11y_check.py` senkt die Baseline fuer `vorlage/sheets.js` von 1 auf 0 klickbare `div`/`span`; verbleibend sind nur noch die Pointer-Flaechen in `tabs.js`/`dokument.js`.
- Version: 0.8.7 -> 0.8.8 (PATCH: Accessibility-Verbesserung, kein API-/Datenmodellwechsel).

## Goldstandard-Scanner, Auto-Ausloeser-Baseline (2026-08-04)

- Live-Kamera: ein standards-basierter Auto-Ausloeser ist ergaenzt. Er beobachtet lokal nur die Stabilitaet des Browser-`<video>`-Signals, gibt einen `aria-live`-Status aus, laesst sich per nativem Auto-Button ein-/ausschalten und loest nach stabilem Kamerabild genau eine Aufnahme ueber die bestehende Canvas-/Scan-Pipeline aus.
- Einordnung: Das ist noch keine Swift-Paperless-Paritaet und keine echte Dokument-/Fokus-/Bewegungserkennung; die weitere CV-gestuetzte Kanten-/Schaerfe-/Stabilitaetsbewertung bleibt offen und muss auf realen Mobilgeraeten verifiziert werden.
- Tests: `tests/browser_check.py` prueft mit einem echten Canvas-`MediaStream`, dass der Auto-Ausloeser aktiv ist und nach stabilem Bild eine erste Scan-Seite erzeugt. Volle Suite: 11 Stufen, 60 Unit, 24 API, 45 Browserpruefungen gruen.
- Version: 0.8.10 -> 0.8.11 (PATCH: Scanner-Autoausloeser-Baseline, kein API-/Datenmodellwechsel).

## Goldstandard-Scanner, Phase 5 real umgesetzt: Auto-Ausloeser nutzt echte Randerkennung (2026-08-04)

- Der Auto-Ausloeser nutzt jetzt DWScan.randSchaetzen (Phase 4) statt einer inhaltsblinden Videosignal-Stabilitaetspruefung: ausgeloest wird erst, wenn ein aehnlicher Dokumentrand mehrfach in Folge gefunden wird, mit bewusstem Zeit-Fallback fuer randlose/kontrastarme Motive. Details und Testevidenz: docs/AUDIT.md und docs/adr/0005-goldstandard-scanner.md.
- Volle Suite (11 Stufen, 46 Browserpruefungen, davon 1 neu) danach gruen. Huellenversion neu berechnet.
- Naechster Schritt: echte Geraeteverifikation der Scanner-Kette, oder Fortsetzung mit Meilenstein B (restliche Pointer-Flaechen in tabs.js/dokument.js), Meilenstein C (Virtualisierungsentscheidung) oder Meilenstein D (Release-Dokumentation).
- Version: 0.8.11 -> 0.9.0 (MINOR).

## Sheet-Fokusverwaltung: Fokus-Trap und Fokus-Rueckgabe (2026-08-04)

- Modale Sheets (Zuweisen, Loeschen, Automatisierung, etc.) setzen jetzt beim Oeffnen den Tastaturfokus in den Dialog, halten Tab/Umschalt+Tab per echtem Fokus-Trap darin, und geben den Fokus beim Schliessen an das aufrufende Element zurueck. `role="dialog"`/`aria-modal="true"` ergaenzt. Details und Testevidenz: docs/AUDIT.md.
- Naechster Schritt: dedizierter automatisierter Fokus-Trap-Test fuer Sheets, danach Fortsetzung mit Meilenstein B (verbleibende Pointer-/Tastaturfaelle), Meilenstein C (Virtualisierungsentscheidung) oder Meilenstein D (Release-Dokumentation).
- Version: 0.9.0 -> 0.9.1 (PATCH).

## Zwei offene Grundsatzfragen entschieden, Meilenstein D erledigt (2026-08-06)

Reiner Dokumentations-Batch, **keine Code-Aenderung**: keine Quelldatei angefasst, `VERSION`
und die Huellenversion in `sw.js` bleiben unveraendert (Doku ist nicht Teil der Huelle).

- **Meilenstein C Virtualisierung: VERTAGT** (Damien, 05.08.2026). Kein Bedarf unterhalb
  `DOC_MAX` messbar, `tests/perf_check.py` bleibt Waechter. Zwei Signale machen die
  Entscheidung wieder auf (perf_check schlaegt an / `DOC_MAX` ueberschritten oder
  heraufgesetzt) — Einzelheiten stehen bei **3.3**, wo die Messwerte liegen.
- **Einladungen 3.1: ENTSCHIEDEN** (Damien, 05.08.2026). Status quo, der Administrator legt
  Konten in der App an; Authentik bleibt dokumentierte Spaetoption. Einzelheiten bei **3.1**.
  Damit ist die letzte Grundsatzfrage aus Phase 3 geschlossen.
- **Meilenstein D erledigt:** neue Datei `docs/RELEASE.md` — Versionsschema, Umfang eines
  Release (inkl. Service-Worker-Cache-Busting ueber die Huellen-Pruefsumme), Ablauf Schritt
  fuer Schritt, Abnahmekriterien, Rollback, Stolperfallen (Subpath `/paperless`, Arbeitsbaum
  ist die Auslieferung, CI 2.18.4 vs. Produktion 3.0.5). Der Push-Schritt ist als aktuell
  blockiert markiert (Deploy-Key noch nicht eingetragen).
- **Geraeteverifikation vorbereitet:** neue Datei `docs/GERAETE-CHECKLISTE.md` — 29 Pruefpunkte
  zum Abhaken auf einem echten Telefon (Kamera-Berechtigung inkl. Verweigerung, Auto- und
  Handausloeser, Randvorschlag, Mehrseiten-Scan, schlechtes Licht, Offline, App-Wechsel,
  Dauerlast). Erst nach diesem Durchlauf darf laut ADR 0005 von „Goldstandard" oder
  Swift-Paperless-Paritaet gesprochen werden.
- Nicht verifiziert in diesem Batch: **kein Testlauf** (`tests/run_e2e.py` nicht ausgefuehrt —
  die Sitzung, die diesen Batch geschrieben hat, hatte keine Ausfuehrungsrechte fuer neue
  Shell-Befehle). Da keine Quelldatei geaendert wurde, ist kein Testergebnis betroffen; ein
  Lauf mit Rechten sollte die Suite dennoch einmal bestaetigen, bevor committet wird.
- Version: unveraendert 0.9.3 (reiner Doku-Batch, keine ausgelieferte Datei betroffen).

## Zwei offene Befunde aus dem Backend-Protokoll nachgezogen (2026-08-06)

Ebenfalls reiner Dokumentations-Batch, **keine Code-Aenderung**. Beide Punkte standen
seit dem 05.08. in `/opt/paperless/ops/OCR-BEFUND.md` ausdruecklich als „gehoert in die
App-Roadmap", fehlten hier aber; am 06.08. per `grep` gegengeprueft (kein Treffer fuer
`title_content` und `Syntax Error` in dieser Datei) und jetzt additiv ergaenzt.

- **3.14 Die Testreihe fuellt das echte Archiv** (neu, offen). Die App-Testreihe laedt bei
  jedem Lauf dieselben Dateien erneut in die **produktive** Instanz; Duplikatzaehler
  `hoch.jpg` 215, `zz-Pruefung-Scan.pdf` 58, steigend (OCR-BEFUND Abschnitt 4).
  Zusaetzlicher Beleg fuer „laeuft weiter": 445 → 465 Dokumente zwischen den
  Backup-Laeufen vom 05.08. 21:30 und 06.08. 03:33. Drei Auswege bewertet
  (Aufraeumen am Laufende / eindeutige Kennzeichnung der Testuploads / getrennte
  Testinstanz oder Testbenutzer), Empfehlung: erst kennzeichnen, dann aufraeumen —
  Entscheidung bewusst offen gelassen. Nichts umgesetzt.
- **3.15 Veralteter Suchparameter `title_content`** (neu, offen). Beleg: `api.js`
  Zeile 514, der Rueckfallpfad von `documents.search()` nach einem `400` auf `query=`.
  Dazu die im Serverprotokoll begleitende Meldung `Syntax Error: :::[`. Keine Eile —
  das Backend ist auf 3.0.5 gepinnt —, aber faellig zur Vorbereitung des naechsten
  Update-Fensters am **01.09.2026** (`ops/UPDATE-RUNBOOK.md` Abschnitt 0). `api.js`
  wurde **nicht angefasst**, nur dokumentiert.
- Kleine Korrektur an der Quelle festgehalten: OCR-BEFUND Abschnitt 5 schreibt, die
  Nutzerin sehe „Suche ohne Treffer statt Fehlermeldung". Das stimmt nicht — der
  Rueckfall in `api.js` liefert Treffer (Antwort mit `einfach: true`). Der Befund selbst
  bleibt gueltig.
- Nicht verifiziert in diesem Batch: **kein Testlauf** (`tests/run_e2e.py` nicht
  ausgefuehrt — dieselbe Ausfuehrungsrechte-Wand wie beim Batch davor). Da keine
  Quelldatei geaendert wurde, ist kein Testergebnis betroffen.
- Version: unveraendert 0.9.3 (reiner Doku-Batch, `sw.js`-Huellenversion unveraendert).

### 🟠 3.16 Zwei-Faktor-Einrichtung in der App (UX-Entscheidung Damien, 08.08.2026)

**Warum.** TOTP lässt sich derzeit nur in der Paperless-ngx-Weboberfläche einrichten
(`/paperless/` → My Profile → MFA). Wer DocuWunder nutzt, muss dafür die App verlassen
und eine fremde, ganz anders aussehende Oberfläche bedienen. Damien am 08.08.2026:
Aus UX-Sicht gehört das in unsere App. **Abgrenzung bleibt bestehen:** das ist kein
Einstieg in den Nachbau der Paperless-Kontoverwaltung (Nutzer anlegen, Rechte, Gruppen
— bleibt bewusst draußen), sondern genau **ein** klar begrenzter Selbstbedienungs-Flow
für das eigene Konto, vergleichbar mit `sperre.js` (lokale Gerätesperre).

**Die Vorarbeit ist da.** `api.js` beherrscht MFA beim **Login** bereits vollständig:
`login(username, password, code)` schickt `code` optional mit (Z. 461–465) und
unterscheidet die Fehlerfälle „MFA code is required" und „Invalid MFA code" (Z. 478–481,
seit v0.9.3). Was fehlt, ist ausschließlich die **Einrichtung**.

**Der Server kann es schon — ohne Umweg.** allauth stellt den Headless-Modus bereit,
also genau für eigene Oberflächen gedacht, kein Scraping:

```
GET    /api/auth/headless/browser/v1/account/authenticators/totp
       -> 404 + { "secret": "...", "totp_url": "otpauth://totp/..." }   (noch nicht aktiv)
       -> 200 + Authenticator-Daten                                     (bereits aktiv)
POST   /api/auth/headless/browser/v1/account/authenticators/totp
       { "code": "123456" }  -> aktiviert
DELETE /api/auth/headless/browser/v1/account/authenticators/totp        -> deaktiviert
GET/POST .../authenticators/recovery-codes                              -> Wiederherstellungscodes
GET    /api/auth/headless/browser/v1/account/authenticators             -> Liste (Typ, created_at, last_used_at)
```

Belegt am 08.08.2026 gegen die laufende Instanz (`manage.py shell`, URL-Auflösung) und
gegen den Paketcode `allauth/headless/mfa/views.py` (`ManageTOTPView`) sowie
`allauth/headless/mfa/response.py` (`_authenticator_data`). Das `totp_url` ist die
fertige `otpauth://`-Zeichenkette — der QR-Code wird daraus **im Browser gezeichnet**,
das Geheimnis verlässt den Server nur an den angemeldeten Nutzer selbst.

**Was zu bauen ist.**
- Neues Modul `zweifaktor.js` nach dem Muster der übrigen Sachgebietsmodule
  (`start()` / `methoden`, angehängt per `Object.assign` in `app.js`) — **nicht** in
  `app.js` selbst.
- Einstieg unter „Mehr" → Sicherheit, neben der bestehenden Gerätesperre.
- Ablauf: Status lesen → falls inaktiv: QR-Code + Geheimnis als Text (zum Abtippen, wenn
  die Kamera nicht kann) → Eingabefeld 6-stellig → aktivieren → **Wiederherstellungscodes
  einmalig anzeigen**, mit ausdrücklicher Bestätigung „Ich habe sie gesichert" und einem
  Hinweis, dass sie danach nicht wieder angezeigt werden.
- Deaktivieren mit Rückfrage.
- QR-Erzeugung: eine kleine Bibliothek, die **ohne Build-Schritt** als Script-Tag läuft
  (Architekturvorgabe: kein Bundler, kein npm zur Laufzeit — siehe CLAUDE.md
  „Build- & Laufzeit-Konzept"). Sie gehört in die Hülle (`sw.js`, `VERSION` hoch) und in
  `tests/syntax_check.py`, wie jedes neue Modul.

**Sicherheitsregeln für die Umsetzung.**
- Geheimnis und Wiederherstellungscodes **nie** protokollieren, nie in den Zustand
  schreiben, der in `localStorage` landet, nie in eine Fehlermeldung aufnehmen.
- Nach dem Verlassen des Bildschirms aus dem Speicher entfernen.
- Keine Screenshots der Codes in Tests oder Belegen.

**Abnahme.**
1. Einrichtung vollständig in der App möglich, ohne `/paperless/` zu öffnen.
2. Anmeldung danach mit Code funktioniert (der Weg dafür existiert bereits).
3. Wiederherstellungscodes wurden genau einmal angezeigt und die Bestätigung ist erzwungen.
4. Deaktivieren funktioniert und ist als solches erkennbar.
5. `tests/run_e2e.py --statisch` grün, Hüllenprüfung inbegriffen.
6. Kein Geheimnis in Protokollen, Zustand oder Tests auffindbar (gezielt gegengeprüft).

**Bezug zur Backend-Roadmap.** Erledigt **nicht** den 👤-Punkt „TOTP für `damien`
tatsächlich eingerichtet" in `/opt/paperless/ROADMAP.md` (MS-3) — der verlangt eine
tatsächliche Einrichtung durch Damien. Dieser Punkt macht sie nur bequemer und ist
die Voraussetzung dafür, dass sie in der App stattfinden kann.

#### Nachtrag 08.08.2026 — gemessene Randbedingungen (VOR der Umsetzung lesen)

Diese Punkte sind gegen die laufende Instanz gemessen, nicht angenommen. Sie ändern
den Bauplan an einer entscheidenden Stelle.

**1. Der DRF-Token der App reicht NICHT.** DocuWunder authentifiziert sich überall mit
`Authorization: Token …` (`api.js` Z. 157, Token aus `POST /api/token/`). Gegen die
Headless-MFA-Endpunkte quittiert der Server das mit **HTTP 401**:

```
GET /paperless/api/auth/headless/browser/v1/account/authenticators/totp
    -H "Authorization: Token <gültiger DRF-Token>"
-> 401 {"status":401,"data":{"flows":[{"id":"login"}]},"meta":{"is_authenticated":false}}
```

**Mit Session-Cookie funktioniert derselbe Aufruf** (Login über
`/paperless/accounts/login/` mit CSRF, dann Cookie mitschicken):

```
-> 404 {"status":404,"meta":{"secret":"…","totp_url":"otpauth://totp/…?secret=…&issuer=Paperless-ngx"}}
```

Der Status **404 ist hier die Normalantwort** für „noch kein TOTP eingerichtet" — genau
in dieser Antwort stecken `secret` und `totp_url`. Nicht als Fehler behandeln.

**Konsequenz für den Bauplan:** Der 2FA-Bildschirm braucht eine **eigene, kurzlebige
Session** neben dem Token — CSRF holen, `POST /paperless/accounts/login/`, Cookie für
die Dauer des Einrichtungsvorgangs halten, danach verwerfen. Das ist der einzige
gemessene Weg; es ist **keine** Alternative erfunden worden. Falls der Worker einen
saubereren Weg findet (z. B. eine Paperless-eigene Route, die den Token akzeptiert),
darf er ihn nehmen — aber nur, wenn er ihn ebenso gemessen belegt.

**Vorsicht:** Der Session-Login verlangt das Passwort erneut. Das ist bei einer
Sicherheitsumstellung üblich und vertretbar (Re-Authentifizierung), muss der Nutzerin
aber erklärt werden. Das Passwort darf **nirgends** gespeichert werden, auch nicht im
Zustand — nur für den einen Aufruf im Speicher halten.

**2. Pfad-Präfix.** `FORCE_SCRIPT_NAME=/paperless` — alle Endpunkte liegen unter
`/paperless/api/auth/headless/…`. Die App bildet ihre Basis bereits so
(`defaultBase()` → `../paperless/api`), der Auth-Zweig liegt aber **daneben**, nicht
darunter: `…/paperless/api/auth/headless/browser/v1/…`.

**3. Aussteller-Name.** `MFA_TOTP_ISSUER = "Paperless-ngx"` — steht so im `totp_url`
und erscheint später in der Authenticator-App des Nutzers.

**4. Backend nur LESEN.** Diagnose im laufenden Container (`docker exec … grep/cat`,
`manage.py shell` mit reinen Abfragen) ist ausdrücklich **erlaubt** und erwünscht, um
Annahmen zu prüfen. Verboten bleiben Änderungen: keine Konfiguration, keine Migration,
kein Neustart, kein Schreibzugriff auf DB, `media/`, `consume/` oder Papierkorb.

#### Nachtrag 2 (08.08.2026) — `mfa.totp.secret` in der Session ist NORMAL, kein Leck

Ein Worker-Lauf hat am 08.08. gestoppt, weil er glaubte, durch einen Session-Login ein
Geheimnis in der Datenbank hinterlassen zu haben. Das Anhalten war richtig — die
Einschätzung war es nicht. Nachgeprüft im Paketcode:

```python
# allauth/mfa/totp/internal/auth.py, get_totp_secret()
secret = context.request.session[SECRET_SESSION_KEY] = generate_totp_secret()
```

Das Kandidaten-Geheimnis **gehört** in die Session — es ist der Zustandsträger zwischen
Schritt 1 (GET liefert QR-Code) und Schritt 2 (POST prüft den 6-stelligen Code). Ohne
ihn könnte der Server den eingegebenen Code gar nicht prüfen. Jeder Nutzer, der die
Einrichtung öffnet, erzeugt so einen Eintrag; bei `SESSION_ENGINE=cached_db` landet der
in `django_session`. Gemessen am 08.08.: von den vorhandenen Sessions mit
`mfa.totp.secret` stammten **vier aus Ende Juli**, also aus normalem Betrieb lange vor
diesem Arbeitspaket.

**Wichtig zur Einordnung:** Das Geheimnis ist bis zur Aktivierung wertlos — jeder GET
erzeugt mit `regenerate=True` ein neues, und erst der bestätigte POST macht eines davon
dauerhaft. Ein nicht aktiviertes Kandidaten-Geheimnis schützt nichts und öffnet nichts.

**Folge für die Umsetzung:**
- Session-Einträge dieser Art sind **kein** Verstoß gegen „keine Secrets at rest" und
  **kein** Grund anzuhalten. Nicht aufräumen, nicht löschen — die Sessions laufen ab.
- Die Regel „Geheimnis nie protokollieren, nie in den persistierten Client-Zustand"
  bleibt unverändert bestehen: gemeint ist der **Browser** (localStorage, Logs,
  Fehlermeldungen, Tests) — nicht die serverseitige Django-Session.
- Für Verifikationsläufe gilt weiterhin: **kein** `force_login()` und kein Umweg über
  fremde Passwörter. Der reguläre Weg (CSRF holen, `POST /paperless/accounts/login/`)
  reicht und ist genau der, den die App später selbst geht.

#### Nachtrag 3 (08.08.2026) — Umsetzung, gebauter Weg und Abnahme

**Abweichung vom Bauplan aus Nachtrag 1, gemessen belegt.** Statt die klassische
HTML-Seite `/paperless/accounts/login/` per Formular-POST anzusteuern (das wäre
Scraping), nutzt `zweifaktor.js` für die kurzlebige Sitzung denselben
Headless-JSON-Weg wie für die MFA-Verwaltung selbst:

```
GET    .../auth/headless/browser/v1/config              (setzt das CSRF-Cookie,
                                                           auch anonym — jede
                                                           Browser-Headless-Antwort
                                                           tut das: browser_view()
                                                           ruft get_token() vor
                                                           jeder Antwort,
                                                           allauth/headless/internal/
                                                           decorators.py)
POST   .../auth/headless/browser/v1/auth/login           { username, password }
POST   .../auth/headless/browser/v1/auth/2fa/authenticate { code }   (nur, wenn
                                                           bereits ein zweiter
                                                           Faktor aktiv ist — der
                                                           Fall, der beim späteren
                                                           Deaktivieren eintritt)
DELETE .../auth/headless/browser/v1/auth/session          (Sitzung verwerfen,
                                                           beim Schliessen des
                                                           Bildschirms und beim
                                                           Abmelden — SessionView,
                                                           allauth/headless/account/
                                                           views.py, ruft
                                                           adapter.logout())
```

Grund: `allauth/headless/account/views.py` (`LoginView`) und
`allauth/account/internal/flows/login.py` (`resume_login`) zeigen, dass die
eigentliche Django-Anmeldung (`adapter.login()`) erst **nach** einer noch
ausstehenden MFA-Stufe erfolgt — bei einer klassischen Formular-Anmeldung wäre
das ein Redirect auf eine zweite, ebenfalls klassische HTML-Seite
(`/accounts/2fa/authenticate/`), die diese App gar nicht rendert. Der
Headless-Weg bildet dieselbe Zustandsmaschine rein in JSON ab: bleibt der
zweite Faktor nach dem Passwort noch offen, liefert `POST auth/login` **401**
mit `data.flows` inkl. `{"id":"mfa_authenticate","is_pending":true}`
(`allauth/headless/base/response.py`, `BaseAuthenticationResponse._get_flows`);
`POST auth/2fa/authenticate` (`AuthenticateView`,
`allauth/headless/mfa/views.py`) schliesst dieselbe Anmeldung ab. Das ist der
„sauberere Weg", den Nachtrag 1 ausdrücklich erlaubt, sofern er ebenso
gemessen belegt wird — hier geschehen durch Lesen des Paketcodes
(`allauth/headless/account/views.py`, `allauth/headless/mfa/views.py`,
`allauth/account/internal/flows/login.py`, `allauth/headless/base/response.py`,
`allauth/headless/internal/decorators.py`) und einen echten Aufruf gegen die
laufende Instanz mit absichtlich falschem Passwort (siehe unten).

**Weitere gemessene Randbedingungen, die den Bauplan innerhalb von
`zweifaktor.js` bestimmt haben:**
- `GET .../authenticators/totp` erzeugt bei jedem Aufruf ohne aktives TOTP ein
  **neues** Kandidaten-Geheimnis (`ManageTOTPView.get`, `regenerate=True`).
  `zweifaktor.js` ruft ihn deshalb genau einmal beim Betreten des
  Einrichtungsschritts (`zweiStatusLaden`, Z. 197) und danach nicht erneut —
  ein falscher Aktivierungscode lässt das angezeigte Geheimnis unverändert
  stehen, statt es durch einen erneuten Ladevorgang zu entwerten.
- Fehlerantworten von allauth sind **englisch** (kein deutsches Sprachpaket in
  dieser Instanz, daran wird nichts geändert — CLAUDE.md, „Keine Änderung an
  der Paperless-Konfiguration"). Live gemessen mit absichtlich falschem
  Passwort gegen `POST auth/login`:
  ```
  -> 400 {"status":400,"errors":[{"message":"The username and/or password you
       specified are not correct.","code":"username_password_mismatch",
       "param":"password"}]}
  ```
  `zweifaktor.js` übersetzt bekannte `code`-Werte in eigene deutsche Sätze
  (`FEHLER_TEXT`, Z. 96) und zeigt den englischen Servertext **nie** an — das
  schliesst zugleich aus, dass je ein Serverfehlertext unbeabsichtigt Details
  preisgibt.
- Aktivierung (`POST .../authenticators/totp`) erzeugt Wiederherstellungscodes
  automatisch als Seiteneffekt (`totp/internal/flows.py`,
  `auto_generate_recovery_codes`), liefert sie aber **nicht** in derselben
  Antwort zurück. `zweifaktor.js` holt sie deshalb direkt danach über einen
  eigenen `POST .../authenticators/recovery-codes`-Aufruf
  (`zweiWiederherstellCodesHolen`, Z. 236) — der liefert sie immer sichtbar
  (`can_view=True` fest im View, `ManageRecoveryCodesView.post`), anders als
  ein GET nach dem ersten Anzeigen, das der Server dann verweigert
  (`view_recovery_codes`, `RECOVERY_CODES_SHOW_ONCE`). Schlägt dieser Aufruf
  fehl, bleibt TOTP trotzdem aktiv — die App zeigt dann ausdrücklich einen
  Fehler statt so zu tun, als sei nichts gewesen.

**QR-Bibliothek: `qrcode-generator` (kazuhikoarase), MIT-Lizenz, npm-Version
2.0.4.** Begründung der Wahl:
- Eine einzelne Datei ohne Abhängigkeiten (`vendor/qrcode-generator.js`,
  56.694 Byte, unverändert aus `dist/qrcode.js` des npm-Pakets übernommen,
  SHA-256 `79ec86f8…f778f791c`), lädt als klassisches `<script>` — kein
  Bundler, kein npm zur Laufzeit, genau die Vorgabe aus CLAUDE.md
  „Build- & Laufzeit-Konzept".
- Reine Berechnung, kein DOM-Zugriff: `qrcode(0, 'M').createDataURL(6, 8)`
  liefert eine fertige `data:image/gif;base64,…`-Zeichenkette
  (`zweiQrUrl`, zweifaktor.js Z. 282), die als `<img src>` eingesetzt wird.
  Bewusst **nicht** die vom selben Paket angebotene `createSvgTag()`
  (liefert eine SVG-Zeichenkette, die als Markup in den DOM müsste) — dieses
  Projekt hat bereits ein XSS gefunden und behoben (docs/AUDIT.md, H-1);
  ein Data-URL-Bild vermeidet jede neue Stelle, an der Fremddaten (der
  otpauth-Text selbst enthält das Geheimnis) als HTML interpretiert werden
  könnten.
- Getestet: `node` lädt die Datei unverändert per `require()` (das
  UMD-Ende der Datei exportiert `module.exports`, im Browser bleibt dieser
  Zweig unausgeführt und `qrcode` landet stattdessen als einfache
  Top-Level-`var` im globalen Scope) und erzeugt aus einer echten
  `otpauth://`-Beispieladresse eine gültige Data-URL (4.138 Zeichen,
  `data:image/gif;base64,R0lGODdh…`).

**Modulschnitt.** `zweifaktor.js` liefert `start()` / `methoden`, angehängt
per `Object.assign(Oberflaeche.prototype, …, DWZweifaktor.methoden)` in
`app.js` — wie `betrieb.js`/`ordnung.js`, **nicht** wie `sperre.js` (das ist
eine freistehende Bibliothek ohne Objekt-Assign, siehe CLAUDE.md). Die
Sicherheitsmechanik (Session, CSRF, Fetch) bleibt bewusst **innerhalb** von
`zweifaktor.js` statt in `api.js`: `api.js` spricht überall per DRF-Token und
sagt das in seinem eigenen Kopfkommentar so („Token-Auth in DRF erzwingt
keinen CSRF-Schutz") — das wäre nach Ergänzung einer Session-Ausnahme nicht
mehr richtig. Einstieg: „Mehr" → Einstellungen → Verbindung, unmittelbar unter
der Gerätesperre (`vorlage/verwaltung.js`), Ablauf als Sheet
(`sheet: 'zwei'`, `vorlage/sheets.js`) statt als eigener Bildschirm — wie
`mitglieder.js`s einmalig gezeigte Zugangsdaten (`sheet: 'zugang'`), aus
demselben Grund: die vorhandene Schliessen-Logik (`closeSheet`, Escape-Taste)
räumt den Zustand zuverlässig ab, ohne einen zweiten Mechanismus für
Bildschirm-Stapel zu brauchen.

**Abnahme, Punkt für Punkt.**

1. **Einrichtung vollständig in der App möglich, ohne `/paperless/` zu
   öffnen.** Gebaut: Passwort-Schritt → Status lesen → QR-Code + Geheimnis →
   6-stelliger Code → Aktivieren, alles im Sheet `zwei`. Code- und
   Server-seitig durchgehend belegt (siehe oben); **kein** vollständiger
   Live-Durchlauf mit echter Aktivierung, weil kein Passwort für `damien`
   vorlag und keins beschafft wurde (verboten: Passwort aus `.env`/Backend
   lesen — dort steht es ohnehin nicht — oder erraten). **Nicht abschliessend
   belegt.**
2. **Anmeldung danach mit Code funktioniert.** Unverändert vorhandener Weg
   (`api.js` `login(username, password, code)`, seit v0.9.3) — von diesem
   Arbeitspaket nicht angefasst. **Belegt durch Bestand, nicht neu geprüft.**
3. **Wiederherstellungscodes genau einmal gezeigt, Bestätigung erzwungen.**
   Serverseitig erzwungen (`RECOVERY_CODES_SHOW_ONCE`, ein zweites GET liefert
   keine Codes mehr) und clientseitig zusätzlich: „Fertig" bleibt deaktiviert,
   bis die Checkbox angehakt ist (`zweiCodesFertigAktiv`,
   `vorlage/sheets.js`). **Nicht live durchlaufen**, aus demselben Grund wie
   Punkt 1.
4. **Deaktivieren funktioniert, erkennbar als solches.** Rückfrage-Schritt
   (`zweiDeaktivierenFragen`) vor der eigentlichen Aktion, eigener
   Abschlussschritt `deaktiviert` mit eigenem Status-Punkt. **Nicht live
   durchlaufen**, aus demselben Grund.
5. **`tests/run_e2e.py --statisch` grün, Hüllenprüfung inbegriffen.**
   **Belegt** — Lauf vom 08.08.2026: „Alle Stufen bestanden (9)", `VERSION`
   der Hülle per `tools/huelle.py` neu gesetzt.
6. **Kein Geheimnis in Protokollen, Zustand oder Tests auffindbar.**
   **Belegt**, gezielt gegengeprüft: `tests/geheim_check.py` grün über die
   versionierten Dateien (119 Dateien, inkl. `zweifaktor.js` und
   `vendor/qrcode-generator.js`); `grep` gegen `zweifaktor.js` zeigt **kein**
   `console.*` mit Bezug zu Geheimnis/Code/Zwei und **kein**
   `localStorage`-Zugriff (das Geheimnis liegt ausschliesslich in
   `state.zweiSetup`/`state.zweiCodes`, geräumt von `beimSchliessen()`/
   `beimAbmelden()`); Fehlermeldungen kommen ausschliesslich aus der eigenen
   `FEHLER_TEXT`-Tabelle, nie aus dem Servertext.

**Ergebnis: 3.16 bleibt offen**, trotz vollständig gebauter und statisch
geprüfter Umsetzung — die Punkte 1, 3 und 4 verlangen einen echten
Durchlauf mit dem tatsächlichen Konto, den nur Damien (oder ein Worker mit
seinem Passwort und einem installierten Browser-Testwerkzeug — hier fehlt
zusätzlich Playwright) leisten kann. Diese drei Punkte sind **plausibel
gemacht** (Server-Endpunkte einzeln gegen den Paketcode und teils live
verifiziert, die App-Logik durch alle neun statischen Prüfstufen), aber
nicht **bewiesen**. Vor dem Abhaken: einmal mit Damiens Zugangsdaten durch
den Bildschirm gehen (Einrichten → Codes sichern → Abmelden/Anmelden mit
Code → Deaktivieren) und das Ergebnis hier eintragen.
