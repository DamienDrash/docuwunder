# Paperless-ngx PWA & Desktop-App Project (Chaya-PO managed)

Dieses Projekt dient dem Aufbau und der Wartung einer modernen, performanten, benutzerfreundlichen PWA/Desktop-App für das Paperless-ngx-Backend auf `server-eins`.

## System-Architektur
- **Backend:** Paperless-ngx Django Container (`paperless-webserver`) auf Port 8099.
- **Frontend-Pfad:** `/opt/paperless-app/` auf `server-eins` (ausgeliefert via Caddy unter `/paperless-app/`).
- **REST API:** `/paperless/api/` (Session/Cookie und LocalStorage Token auth).

## Build- & Laufzeit-Konzept
- Kein schwerer Build-Prozess (Vite/Webpack). Statische, dynamisch durch `support.js` im Browser evaluierte React-Komponenten.
- **Eine** Oberfläche für alle Geräte: `mobile.dc.html`. Sie schaltet ab 900px Viewport-Breite selbst auf zwei Spalten um (Liste links, Detail rechts). Eine Geräteweiche gibt es nicht.
- `index.html` ist der Einstiegspunkt und lädt `api.js` + `support.js`. `iphone.html` ist nur eine Design-Vorschau derselben Komponente in einer simulierten iOS-Hülle.

## Dateien
- `api.js` — Zugriffsschicht auf die REST-API (`window.PaperlessAPI`). Token im `localStorage`, Zeitlimits, Abbruch überholter Anfragen.
- `mobile.dc.html` — Vorlage (`{{ Bindungen }}`, `sc-if`, `sc-for`) plus Komponentenlogik im `<script type="text/x-dc">`. **`sc-else` gibt es im Runtime nicht** — stattdessen zwei `sc-if` mit gegenläufigen Flags.
- `support.js` / `vendor/` — generiertes DC-Runtime und lokale Kopien von React/Babel. Nicht von Hand ändern.
  `support.js` hat die CDN-URLs für React, ReactDOM und Babel fest eingebaut (unpkg.com) und lässt sich
  nicht neu bauen: das Quellprojekt `dc-runtime` liegt nirgends vor. Der vorgesehene Ausweg ist
  `window.__resources` — `vendor/resources.js` biegt die URLs dort auf die lokalen Kopien um und **muss
  vor `support.js` geladen werden**. Deshalb kommt die App ohne Internet aus (Voraussetzung für T4).
  Beim Aktualisieren einer Version: Datei neu laden und ihren sha384-Hash gegen den SRI-Wert in
  `support.js` prüfen — nur dann ist es dasselbe Artefakt.

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
- Stufen: `syntax_check` (node --check) → `template_check` (jede `{{ Bindung }}` hat einen Wert aus `renderVals`) → `api_check` (Zusagen der Paperless-API) → `browser_check` (App im Chromium gegen den echten Server).
- Token für die letzten beiden Stufen: `PAPERLESS_TOKEN=…` oder `tests/.token` (nicht versioniert).

## Roadmap & Status
Aktueller Status und Fortschritt werden über den Chaya PO-Cronjob verwaltet.
- **T1: Weichenstellung:** erledigt — durch eine responsive Oberfläche ersetzt, Geräte-Sniffing entfällt.
- **T2: API-Anbindung (Read):** erledigt — Liste, Suche, Filter, Vorschau, Stammdaten, Papierkorb, Aufgaben.
- **T3: API-Anbindung (Write):** erledigt — Upload, Metadaten, Notizen, Massenaktionen, Freigaben, gespeicherte Suchen.
- **T4: PWA Manifest & PWA Standalone CSS:** offen. Caddy leitet bereits `/paperless-app/sw.js` weiter; Manifest und Service Worker fehlen noch.
