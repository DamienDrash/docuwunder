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
| Offene Schuld | `renderVals()` mit 414 gelesenen Werten — der letzte grosse Block in einer Hand |

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
