# Paperless-ngx PWA & Desktop-App Project (Chaya-PO managed)

Dieses Projekt dient dem Aufbau und der Wartung einer modernen, performanten, benutzerfreundlichen PWA/Desktop-App für das Paperless-ngx-Backend auf `server-eins`.

## System-Architektur
- **Backend:** Paperless-ngx Django Container (`paperless-webserver`) auf Port 8099.
- **Frontend-Pfad:** `/opt/paperless-app/` auf `server-eins` (ausgeliefert via Caddy unter `/paperless-app/`).
- **REST API:** `/paperless/api/` (Session/Cookie und LocalStorage Token auth).

## Build- & Laufzeit-Konzept
- Kein Build-Schritt, kein Paketmanager. React wird direkt geladen, JSX-nahe Schreibweise
  liefert **htm** (1,2 KB, `vendor/htm.js`) als Tagged Template — kein Compiler nötig.
- **Eine** Oberfläche für alle Geräte. Sie schaltet ab `WIDE_MIN` (900px) selbst zweispaltig
  um (Liste links, Detail rechts). Eine Geräteweiche gibt es nicht.
- Reihenfolge in `index.html` zählt: React → htm → `ui.js` → `logik.js` → `api.js` →
  `vorlage/*` → `vorlage.js` → `app.js`.

## Dateien
- `ui.js` — Grundlage. `html` (htm an React gebunden), `stil()` übersetzt CSS-Zeichenketten in
  die Style-Objekte, die React verlangt, und merkt sie sich (die Oberfläche hat rund 940
  solcher Zeichenketten). Dazu ein Fehlerfang und `starten()`.
- `app.js` — Zustand und Verhalten. `renderVals()` liefert alles, was die Bildschirme brauchen;
  `render()` reicht es an `DWVorlage.wurzel()` weiter. Es ist **kein** einzelnes Literal mehr:
  `renderKontext()` rechnet die Zwischenwerte einmal aus, vierzehn Abschnitte (`valsRahmen`,
  `valsNavigation`, `valsStart`, `valsDokumentliste`, `valsPosteingang`, `valsMehr`,
  `valsDokument`, `valsSuche`, `valsOrdnung`, `valsEinstellungen`, `valsVerwaltung`,
  `valsSheets`, `valsErfassen`, `valsOnboarding`) liefern je ein Sachgebiet, `renderVals()`
  legt sie zusammen. Ein neuer Wert gehört in **einen** Abschnitt; ein neuer Abschnitt muss in
  der Liste in `renderVals()` stehen, sonst schlägt `tests/template_check.py` an.
- `vorlage/*.js` — die Bildschirme, nach Bereichen getrennt (tabs, dokument, ordnung,
  verwaltung, sheets, erfassen, onboarding). Jeder Bildschirm ist eine Funktion
  `(v, html, stil)`. **Werte kommen ausschließlich über `v`** — Schleifenvariablen sind
  unqualifiziert. `tests/template_check.py` prüft beide Richtungen.
- `logik.js` — reine Logik ohne Zustand, DOM oder Netz. Lädt im Browser als Script und in Node
  per `require`; `tests/logik.test.js` prüft sie ohne Browser.
- `api.js` — Zugriffsschicht auf die REST-API (`window.PaperlessAPI`).
- Eigenständige Module neben `app.js`, je ein Sachgebiet: `sperre.js` (WebAuthn/PRF),
  `scan.js` (JPEGs zu einem PDF), `stile.js`, `mitglieder.js` (Mitglieder und Gruppen),
  `erfassen.js` (Scannen und Hochladen).
  Sie liefern `start()` (Zustandswerte für den Konstruktor), teils `beimSchliessen()`, und
  `methoden`; `app.js` hängt letztere mit `Object.assign(Oberflaeche.prototype, …)` an —
  `this.mitgliedAnlegen()` und `this.scanOeffnen()` bleiben also unverändert aufrufbar. Ein
  neues Modul muss in `index.html` **vor** `app.js` stehen und in `sw.js` (HUELLE, `VERSION`
  hoch) sowie in `tests/syntax_check.py` eingetragen werden.
  `erfassen.js` hält den Weg **ins** Archiv hinein: Dateidialog des Systems, Seiten eines
  Scans (Drehung und Zuschnitt werden stets neu auf das Original angewendet, deshalb verliert
  wiederholtes Drehen nichts), das PDF über `DWScan` und das Verfolgen der Serveraufgabe.
  Es liest keine Liste, keinen Filter und keinen Cache — zurück in den Bestand führt allein
  `reloadDocs()`. Welche Dateitypen der Server annimmt (`DOKUMENT_TYPEN`), steht dort und
  nicht in `app.js`; die Knopfleiste ruft `this.dokumentWaehlen()`.
- `tools/konvert.py` — hat die frühere DC-Vorlage nach htm übersetzt. **Kein laufendes
  Werkzeug**: Änderungen gehören in `vorlage/`, nicht in eine erneute Übersetzung. Steht im
  Repository, weil er die Herkunft der Dateien belegt.
- `manifest.webmanifest` / `sw.js` / `icons/` — installierbare App. Der Worker hält **nur die
  Hülle** vor, nichts unter `/paperless/`: Dokumente gehören nicht in einen Cache, den kein
  Abmelden leert, und eine zwischengespeicherte Liste wäre wieder eine Aussage über den
  Bestand (siehe Datenfluss). Ändert sich `HUELLE`, muss `VERSION` hoch — sonst wird der alte
  Cache weitergeführt.

**Das DC-Runtime ist Geschichte.** `support.js` lief ohne Quelltext (das Projekt `dc-runtime`
lag nirgends vor), war nicht neu baubar und in einem AGPL-Repository heikel. Mit ihm sind
`mobile.dc.html`, `vendor/resources.js`, `vendor/babel.min.js` (3 MB) und die Design-Vorschau
entfallen. `vendor/` liegt bei 336 KB.

## Installierter Zustand
- `theme-color` steht zweimal in `index.html`, je Systemschema. Sobald die App läuft, hat **ihre**
  Einstellung Vorrang: `app.js` meldet das tatsächliche Schema über `onDark` zurück, und `leiste()` in
  `index.html` schreibt beide Angaben auf dieselbe Farbe. Ohne das stünde eine helle
  Systemleiste über einer dunklen Oberfläche, sobald jemand „Dunkel“ ausdrücklich wählt.
- Die Ränder, die das Gerät für sich beansprucht, meldet das System nur mit `viewport-fit=cover`
  (`index.html`) als `env(safe-area-inset-*)`; ausgewertet werden sie in `app.js` als
  Polsterung des äußersten Kastens (`SICHER`). Oben bewusst nicht — die Bildschirme setzen ihre
  Überschriften ohnehin 64px unter die Oberkante.
- Kurzbefehle des Manifests springen über `?tab=…` an ein Ziel aus `startZiel()`; `adresseAufraeumen()`
  entfernt den Parameter danach wieder, sonst landete jedes Neuladen dort. `launch_handler:
  navigate-existing` sorgt dafür, dass dabei kein zweites Fenster aufgeht.
- **Caddy ist fertig konfiguriert**: `sw.js` mit `no-store` (sonst ließe sich eine kaputte Fassung
  nicht mehr ersetzen), `*.webmanifest` mit `Content-Type: application/manifest+json`.

## Datenfluss
Gefiltert, sortiert und gesucht wird **auf dem Server**, nicht lokal: die App hält immer nur die geladenen Seiten. Lokal zu filtern wäre eine Aussage über den gesamten Bestand, die sie nicht treffen kann.
- Dokumente-Tab: `docParams()` → `/documents/?ordering=…&tags__id__in=…&…`, seitenweise mit „Weitere laden“.
- Startseite, Favoriten, Geteilt, Posteingang: eigene Abfragen (`ladeNeben`), damit sie den Filtern des Dokumente-Tabs nicht folgen.
- Suche: `/documents/?query=` (Volltextindex, Hervorhebung aus `__search_hit__.highlights`), bei Syntaxfehler Rückfall auf `title_content=`.
- Upload: `post_document` liefert eine Aufgaben-UUID, verfolgt über `/tasks/?task_id=`.
- Favoriten kennt Paperless nicht — abgebildet auf das Schlagwort `Favorit`.
- Ordner kennt Paperless nicht. Die Hierarchie wird aus den **Namen der Ablageorte** abgeleitet, die per `/`
  geschachtelt sind: `Privat` + `Privat/Steuern` ergibt einen Ordner mit Unterordner. Ein Zwischenordner muss
  nicht selbst als Ablageort existieren — er erscheint dann als reiner Durchgang („nur Unterordner"). Beim
  Anlegen wird das `path`-Template aus dem Namen abgeleitet (`Privat/Steuern/{{ title }}`), damit Ordnername
  und Ablage auf der Platte übereinstimmen. **Paperless verlangt `path` zwingend** — ein Name allein ergibt HTTP 400.
- Zuweisen an eine Person: Besitz (`owner`) geht über, der Zuweisende behält per `set_permissions` ausdrücklich
  view+change, und das Posteingang-Schlagwort kommt dazu. Der Posteingang filtert deshalb zusätzlich nach
  `owner__id` — sonst sähe jeder alles, was irgendwem zugewiesen wurde. Gruppen können in Paperless **nicht**
  Besitzer sein; dort bleibt der Besitz beim Zuweisenden und die Gruppe bekommt nur Rechte.
- Ein per API angelegter Benutzer hat **keinerlei Grundrechte** und läuft schon beim Auflisten in 403. Er braucht
  Django-Permissions (`documents.view_document` usw.), üblicherweise über eine Gruppe. Sonst ist das Konto blind.

## Mitglieder und Gruppen

Verwaltet wird über die native API (`/api/users/`, `/api/groups/`): anlegen, Gruppen zuordnen, Administratorrecht
setzen, entfernen. Alles ohne Zwischendienst — das Projekt soll dauerhaft mit Paperless-Server plus App auskommen.

**Einen Einladungslink kann es in dieser Architektur nicht geben.** Ein Konto anzulegen erfordert Administrator-
rechte, die ein Eingeladener per Definition noch nicht hat; ein Admin-Token im Link oder im Browser wäre der
Generalschlüssel zum Archiv. Paperless kennt für Selbstregistrierung nur den globalen Schalter
`ACCOUNT_ALLOW_SIGNUPS` — an heißt: jeder im Internet. Deshalb ist die Richtung umgedreht: der Administrator legt
das Konto in der App an, das Passwort wird **einmalig** angezeigt (danach liegt serverseitig nur der Hash) und über
`navigator.share` weitergegeben, mit Rückfall auf die Zwischenablage.

Beim Passwort steckt die Gruppierung in Vierergruppen (`6syX-TyZx-…`) **im Passwort selbst** — die Bindestriche
gehören dazu und müssen mit weitergegeben werden.

Paperless kennt weder einen Gruppenbesitzer noch Rollen innerhalb einer Gruppe. Rechte hängen an der Gruppe, nicht
am einzelnen Mitglied. Die App bildet deshalb nur ab, was existiert: Gruppenzugehörigkeit und das Superuser-Flag.
Das eigene Konto lässt sich weder herabstufen noch entfernen — das wäre die einzige unumkehrbare Aktion.

## Build- & Testkommandos
- **Alle Tests:** `python3 /opt/paperless-app/tests/run_e2e.py`
- **Nur ohne Server:** `python3 tests/run_e2e.py --statisch`
- Stufen: `syntax_check` → `logik_check` (Unit-Tests ohne Browser) → `template_check` (jeder gelesene Wert kommt aus `renderVals`) → `pwa_check` → `api_check` → `browser_check`.
- Token für die letzten beiden Stufen: `PAPERLESS_TOKEN=…` oder `tests/.token` (nicht versioniert).

## Roadmap & Status
Aktueller Status und Fortschritt werden über den Chaya PO-Cronjob verwaltet.
- **T1: Weichenstellung:** erledigt — durch eine responsive Oberfläche ersetzt, Geräte-Sniffing entfällt.
- **T2: API-Anbindung (Read):** erledigt — Liste, Suche, Filter, Vorschau, Stammdaten, Papierkorb, Aufgaben.
- **T3: API-Anbindung (Write):** erledigt — Upload, Metadaten, Notizen, Massenaktionen, Freigaben, gespeicherte Suchen.
- **T4: PWA Manifest & PWA Standalone CSS:** erledigt — Manifest mit Symbolen (`any` und `maskable`),
  Kurzbefehlen und `launch_handler`, Service Worker für den Start ohne Netz, Safe-Area und
  `theme-color` nach dem in der App gewählten Schema. Geprüft von `tests/pwa_check.py` (statisch) und
  im Browser: Worker übernimmt, Hülle im Cache, keine Serverdaten im Cache, Start im Flugmodus.
  Bewusst **nicht** enthalten: Push-Benachrichtigungen (bräuchte VAPID und serverseitige Auslöser,
  die Paperless nicht mitbringt) und `apple-touch-startup-image` (ein Satz Startbilder je Gerätemaß).
