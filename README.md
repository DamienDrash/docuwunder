<p align="center">
  <img src="assets/brand/docuwunder-logo-horizontal-claim.svg" alt="DocuWunder" width="640">
</p>

<p align="center"><strong>Deine Dokumente. Ohne Technikstress.</strong></p>

<p align="center">
  Die freundliche, unabhängige Oberfläche für Paperless-ngx.<br>
  Progressive Web App heute, native iOS- und Android-Clients geplant.
</p>

---

## Worum es geht

DocuWunder macht ein bestehendes Paperless-ngx-Archiv für Menschen nutzbar, die Dokumente
erfassen, finden und ordnen wollen — ohne sich durch eine technische Verwaltungsoberfläche
arbeiten zu müssen.

Es ist keine abgespeckte Fassung: Fortgeschrittene Funktionen von Paperless-ngx bleiben
erreichbar, sie drängen sich nur nicht in den Vordergrund.

## Was die App kann

- **Anmelden** an einem bestehenden Paperless-ngx-Archiv per Benutzername und Passwort;
  der Zugangsschlüssel wird lokal abgelegt
- **Dokumente** durchsuchen, filtern und sortieren — serverseitig, damit die Anzeige auch
  bei großen Archiven stimmt
- **Volltextsuche** mit hervorgehobenen Fundstellen, mit Rückfall auf eine einfache Suche,
  wenn die Eingabe die Suchsyntax verletzt
- **Ansehen und bearbeiten**: Vorschau, erkannter Text, Angaben, Schlagwörter, Favoriten
- **Hinzufügen** per Datei, Foto oder Kamera
- **Ordner** — abgeleitet aus den Ablageorten, die per `/` geschachtelt sind
- **Zuweisen** eines Dokuments an eine Person; sie wird Besitzerin und findet es in ihrem
  Posteingang, der Zuweisende behält Lese- und Schreibzugriff
- **Mitglieder und Gruppen** anlegen, zuordnen und entfernen
- **Teilen** über Freigabelinks mit Ablaufdatum
- **Papierkorb** mit Wiederherstellen und endgültigem Löschen
- **Offline lauffähig** als installierbare PWA — die App lädt nichts aus dem Netz nach

## Aufbau

Kein Build-Schritt, kein Paketmanager. Die App besteht aus statischen Dateien, die neben
Paperless ausgeliefert werden.

| Datei | Zweck |
|---|---|
| `index.html` | Einstiegspunkt, lädt Laufzeit und API-Schicht |
| `mobile.dc.html` | Die gesamte Oberfläche: Vorlage und Komponentenlogik |
| `api.js` | Zugriffsschicht auf die Paperless-ngx-REST-API |
| `sw.js` | Service Worker, hält die Hülle für den Offline-Start vor |
| `support.js`, `vendor/` | Laufzeitumgebung und lokale Kopien von React, Babel und den Schriften |
| `tests/` | Vierstufige Prüfung, siehe unten |

Es gibt **eine** Oberfläche für alle Geräte. Ab 900 px Fensterbreite schaltet sie selbst
zweispaltig um — Liste links, Dokument rechts. Eine Geräteweiche gibt es nicht.

Die App lädt **nichts** von fremden Servern: React, Babel und die Schriften liegen unter
`vendor/`. Das ist Voraussetzung dafür, dass sie offline und im LAN ohne Internet läuft.

## Voraussetzungen

- Ein erreichbares Paperless-ngx (getestet gegen 3.0.4)
- Auslieferung von derselben Origin wie Paperless, damit es keine CORS-Hürde gibt.
  Beispiel: Paperless unter `/paperless/`, DocuWunder unter `/docuwunder/`

## Tests

```bash
python3 tests/run_e2e.py              # alles
python3 tests/run_e2e.py --statisch   # nur ohne Server
```

Die Stufen bauen aufeinander auf und laufen von schnell nach langsam:

1. **syntax_check** — Syntax der Komponentenskripte und JS-Dateien
2. **template_check** — jede `{{ Bindung }}` bekommt einen Wert aus `renderVals`
3. **api_check** — die Zusagen der Paperless-API, auf die die App baut
4. **browser_check** — die App im echten Browser gegen den echten Server

Für die letzten beiden wird ein Zugangsschlüssel gebraucht:

```bash
PAPERLESS_TOKEN=… python3 tests/run_e2e.py
```

Ersatzweise aus `tests/.token` — die Datei ist bewusst nicht versioniert.

## Marke

Farben, Typografie und Sprachregeln stehen in [`docs/brand/BRAND_GUIDELINES.md`](docs/brand/BRAND_GUIDELINES.md),
die Gestaltungsmittel unter `assets/brand/`.

## Lizenz

[GNU Affero General Public License v3.0](LICENSE).

Copyleft, das auch den Betrieb als Netzwerkdienst erfasst: Wer DocuWunder verändert und
anderen zugänglich macht — auch nur über das Netz — muss den Quelltext dieser Fassung
ebenfalls unter der AGPL zugänglich machen.

## Marke

Der Name **DocuWunder**, die Wortmarke und die Gestaltungsmittel unter `assets/brand/` sind
**nicht** Teil der Softwarelizenz. Die AGPL erlaubt das Verändern und Weitergeben des
Quelltextes; sie gewährt keine Rechte an der Marke.

Forks und abgeleitete Fassungen dürfen daher nicht unter dem Namen DocuWunder, unter einem
verwechselbar ähnlichen Namen oder mit dem DocuWunder-Logo verbreitet werden. Ein sachlicher
Hinweis auf die Herkunft ("basiert auf DocuWunder") ist selbstverständlich zulässig.

## Unabhängigkeitshinweis

DocuWunder ist ein unabhängiger Client für Paperless-ngx von dritter Seite. Das Projekt steht
in keiner Verbindung zum Paperless-ngx-Projekt, wird von ihm weder unterstützt noch betreut.
