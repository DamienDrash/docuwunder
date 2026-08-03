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
