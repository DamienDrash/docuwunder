# DocuWunder — Roadmap

Stand: 31. Juli 2026 · 4 Commits · Instanz Paperless-ngx 3.0.4

Diese Roadmap sammelt, was beim Aufbau und beim vollständigen visuellen Durchlauf
tatsächlich gefunden wurde — keine Wunschliste, sondern belegte Befunde mit Fundstelle.
Sortiert nach dem, was zuerst weh tut.

**Legende:** ✅ erledigt · 🔴 blockiert Weiterentwicklung · 🟠 wichtig · 🟡 sollte · ⚪ später

---

## Wo das Projekt steht

| | |
|---|---|
| Oberfläche | Eine für Telefon und Desktop, ab 900 px zweispaltig |
| Verdrahtet | Anmeldung, Lesen, Suchen, Filtern, Bearbeiten, Upload, Löschen, Papierkorb, Ordner, Zuweisen, Mitglieder, Freigaben |
| Offline | Läuft ohne Internet, keine externen Requests |
| Tests | 5 Stufen, 1.403 Zeilen: Syntax, Template-Bindungen, API-Vertrag, Browser, PWA |
| Visuell geprüft | 38 Stationen × 3 Varianten (schmal, Split-View, dunkel) |
| Bekannte Schuld | `mobile.dc.html` mit 3.617 Zeilen, `renderVals()` mit 259 Schlüsseln |

---

## Phase 0 — Erledigt

- ✅ **Keine CDN-Abhängigkeit mehr.** React, ReactDOM, Babel und die Schriften liegen unter
  `vendor/`; `window.__resources` biegt die in `support.js` fest verdrahteten unpkg-URLs um.
  Voraussetzung für echten Offline-Betrieb. SRI-Hashes gegen die Vorgaben geprüft.
- ✅ **Eine Oberfläche statt zwei.** Die separate Desktop-Shell (866 Zeilen, eigener
  Datenbestand) ist entfallen; `index.html` schrumpfte auf 119 Zeilen.
- ✅ **Split-View ab 900 px**, an der Grenze nachgemessen.
- ✅ **Mockdaten entfernt**, alle Lese- und Schreibpfade an der echten API.
- ✅ **PWA**: Manifest, Service Worker, Icons, installierbar, startet offline.
- ✅ **Fünf Attrappen entfernt** (siehe „Was gelogen war").
- ✅ **Kontrast im dunklen Schema**: weiß auf Mint hatte 1.46, jetzt Navy auf Mint mit 11.9.
- ✅ **Escape** schließt Sheets und navigiert zurück — vorher gab es keinerlei Tastaturbedienung.
- ✅ **Marke** übernommen: Farben, Manrope-Wortmarke, Bildmarke, Favicon-Kit, Begriffe.
- ✅ **Repository** öffentlich unter `DamienDrash/docuwunder`, AGPL-3.0 mit Markenvorbehalt,
  History ohne den geleakten Zugangsschlüssel.

---

## Phase 1 — Bevor irgendetwas Neues dazukommt

Diese drei entscheiden, ob DocuWunder in sechs Monaten noch änderbar ist.

### 🔴 1.1 `mobile.dc.html` zerschlagen
3.617 Zeilen, 751 Inline-Styles, 121 Methoden, 91 Zustandsfelder in **einer** Datei.
Die längste Zeile hat 3.240 Zeichen. Kein Diff ist reviewbar, zwei Leute können nicht
parallel daran arbeiten.

Vorschlag: Vorlage nach Bildschirm trennen, Stile in benannte Konstanten, Logik in Module
nach Sachgebiet (Dokumente, Ordner, Team, Onboarding). Das DC-Runtime erlaubt mehrere
Komponenten — genutzt wird es bisher nur für `mobile` und `IOSDevice`.

### 🔴 1.2 Das DC-Runtime ersetzen
`support.js:1` sagt: *„GENERATED from dc-runtime/src/*.ts — do not edit. Rebuild with
`cd dc-runtime && bun run build`."* **Dieses Projekt existiert nirgends** — nicht im
Repository, nicht auf dem Server.

Die ganze App hängt an 69 KB generiertem Code ohne Quelltext. Ein Fehler darin wäre nicht
behebbar, nur umgehbar. Eine neue React-Version ist ausgeschlossen. In einem öffentlichen
AGPL-Repository ist das zusätzlich heikel: Empfänger können den Quelltext nicht bekommen.

Wege: Quelltext von `dc-runtime` beschaffen und beilegen — oder auf React ohne
Zwischenschicht wechseln. Zweiteres ist Arbeit, beendet die Abhängigkeit aber endgültig.

### 🔴 1.3 Unit-Tests für die Übersetzungsschicht
1.403 Zeilen Tests, aber **keine einzige Funktion isoliert geprüft**. `mapDoc()`,
`toApiPatch()`, `ordnerKinder()`, `initialen()`, `felderAus()` — dort sitzen die Fehler,
die man sonst auf Screenshots sucht.

Beleg: „DUNDEFINED" und „undefined Treffer" fielen erst im visuellen Durchlauf auf. Beide
hätte ein dreizeiliger Test beim Schreiben gefunden.

---

## Phase 2 — Ehrlichkeit und Sicherheit

### 🟠 2.1 Zugangsschlüssel nicht im Klartext halten
Er liegt unbegrenzt gültig im `localStorage`. Jedes Skript auf dieser Origin liest ihn.
Mindestens: Ablauf und ein sichtbarer Hinweis, was das bedeutet. Besser: Verschlüsselung
mit einem Schlüssel, den erst eine Nutzerbestätigung freigibt.

### 🟠 2.2 Biometrie — falls überhaupt, dann ehrlich
Face ID ist entfernt, weil es nur ein Boolean war. Ein Wiederaufbau per WebAuthn sperrt die
**Oberfläche**, schützt aber den Schlüssel im `localStorage` nicht. Echter Schutz braucht
die WebAuthn-PRF-Erweiterung oder eine zusätzliche PIN — **Browserunterstützung vorher
prüfen**. Nichts davon versprechen, bevor es trägt.

### 🟠 2.3 Drei stille `catch`
`.catch(() => {})` verschluckt Fehler, ohne dass Nutzer, Log oder Entwickler es erfahren.
Entweder behandeln oder wenigstens protokollieren.

### 🟡 2.4 Berechtigungen beim Anlegen eines Mitglieds
Ein per API angelegter Benutzer hat **keinerlei Django-Rechte** und läuft schon beim
Auflisten in 403 — das Konto ist blind, bis es einer Gruppe mit Rechten angehört. Die App
sollte beim Anlegen entweder eine Gruppe erzwingen oder unmissverständlich warnen.

### 🟡 2.5 Social Preview hochladen
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

### 🟡 3.3 Paginierung sichtbar machen
`DOC_PAGE = 60`. Bei mehr Treffern lädt die App nach, aber ein großes Archiv ist damit
nicht wirklich erprobt. Verhalten bei 5.000 Dokumenten prüfen: Scrollleistung, Speicher,
Suchdauer.

### 🟡 3.4 Mehrseitiges Scannen
„Scannen" öffnet die Systemkamera und lädt **ein** Foto hoch. Die frühere Mehrseiten-Erfassung
war Attrappe. Echtes Scannen bräuchte Seitenverwaltung, Zuschnitt und PDF-Erzeugung im Browser.

### ⚪ 3.5 Automatisierungen bearbeiten
Workflows werden angezeigt und lassen sich aktivieren — bearbeiten muss man sie in
Paperless. Die Datenstruktur dort ist deutlich reicher als dieser Bildschirm abbildet.

### ⚪ 3.6 Benachrichtigungen
Entfernt, weil nie implementiert. Bräuchte Push-Infrastruktur (VAPID, Push-Dienst) und
serverseitige Auslöser — Paperless liefert das nicht mit.

---

## Phase 4 — Aufräumen

### 🟡 4.1 Drei Megabyte Babel
`vendor/` wiegt 3,4 MB, davon 3,0 MB Babel — gebraucht **nur** von `iphone.html`, der
Design-Vorschau mit simulierter iPhone-Hülle. 88 % des Vendor-Gewichts für ein
Entwicklerspielzeug im öffentlichen Repository. Vorschlag: `iphone.html`, `ios-frame.jsx`
und Babel in einen Zweig oder ein eigenes Verzeichnis, das nicht mit ausgeliefert wird.

### 🟡 4.2 Zwei Vokabulare für dieselben Daten
`titel`/`abs`/`art`/`ort` gegen `title`/`correspondent`/`document_type`/`storage_path`.
Aus dem Mockup geerbt, `mapDoc()` ist die Zollstation. Jedes neue Feld muss durch beide.
Nebenbei liest sich `abs` wie `Math.abs`.

### ⚪ 4.3 Zurück-Pfeil vereinheitlichen
Das Dokument-Detail nutzt ein anderes Glyph (`M10 2L2 10l8 8`) als alle übrigen Bildschirme
(`M8.5 1.5L1.5 8.5l7 7`). Rein kosmetisch, aber uneinheitlich.

### ⚪ 4.4 Wiederholte Stilfragmente
`display:flex;align-items:center;justify-content:center` steht 76-mal wörtlich da,
`border-radius:999px` 19-mal. Gehört in benannte Konstanten — fällt mit 1.1 zusammen.

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
