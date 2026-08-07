# DocuWunder — Sicherheit

Stand: 6. August 2026 · Codestand `59c5fcf` / v0.9.3 · Paperless-ngx 3.0.5

*(Korrigiert 06.08.2026, Lauf 14:2x: hier stand nur „**Stand: 2. August 2026**", ohne
Codestand und ohne Backend-Version. Beide Angaben, die dahinterstanden, waren überholt:
das Backend ist seit dem 05.08.2026 auf `ghcr.io/paperless-ngx/paperless-ngx:3.0.5`
gepinnt (`/opt/paperless/docker-compose.yml` Z. 7, selbst gelesen), der Codestand ist
seit dem 06.08.2026 00:35 `59c5fcf` / v0.9.3 (`VERSION` enthält `0.9.3`, selbst gelesen).
**Der Kopf ist dabei nicht allein umdatiert worden** — das wäre genau der Fehler, den
`ROADMAP.md` MS-3 mit dieser Aufgabe benennt. Jede Aussage dieser Datei ist einmal gegen
den heutigen Stand geprüft; das Ergebnis steht an Ort und Stelle und vollständig in
Abschnitt 9. Vorgang und Form nach dem Vorbild von `docs/AUDIT.md`, dessen Kopf am
06.08. 09:12 im selben Verfahren nachgezogen wurde.)*

Dieses Dokument beschreibt, wogegen DocuWunder schützt, wogegen **nicht**, und was der
Betreiber dafür einstellen muss.

---

## 1. Das Modell in einem Satz

DocuWunder ist eine Oberfläche für den eigenen Paperless-Server. Es gibt keinen Dienst
dazwischen — alle Daten liegen auf dem Server des Betreibers, alle Rechte verwaltet
Paperless. Die App hält lokal nur den Zugangsschlüssel, den Suchverlauf und zuletzt
geöffnete Dokumente.

*(Geprüft 06.08.2026, unverändert richtig: `api.js` spricht ausschließlich die
Paperless-REST-API an, ein Zwischendienst existiert nirgends im Projekt —
`/opt/paperless/ops/AUTH-UEBERSICHT.md` Abschnitt 6 beschreibt denselben Weg von der
Serverseite her.)*

---

## 2. Notwendige Kopfzeilen

Die App wird von Caddy ausgeliefert. Die folgenden Kopfzeilen sind **für den Pfad
`/paperless-app/*`** gesetzt und **notwendig**:

| Kopfzeile | Wert | Wozu |
|---|---|---|
| `Content-Security-Policy` | siehe unten | Zweiter Schutzwall hinter der Eingabebehandlung |
| `X-Content-Type-Options` | `nosniff` | Kein Raten des Inhaltstyps |
| `Referrer-Policy` | `no-referrer` | Dokumentadressen verlassen den Server nicht über den Referrer |
| `Permissions-Policy` | `camera=(self), microphone=(), geolocation=(), payment=(), usb=()` | Nur die Kamera, und die nur für uns |
| `Cross-Origin-Opener-Policy` | `same-origin` | Kein fremdes Fenster erhält eine Referenz |
| `Cross-Origin-Resource-Policy` | `same-origin` | Kein fremder Kontext bindet unsere Dateien ein |

> **Belegt seit 06.08.2026, mit einer wichtigen Einschränkung.** Diese Tabelle war bis
> zum 06.08. eine unbelegte Behauptung — `docs/AUDIT.md` K-4 hat ihr sogar ausdrücklich
> widersprochen („Es gibt keine CSP"), weil ein `grep` im App-Repo nichts fand. Der Grund
> ist inzwischen geklärt: **die Kopfzeilen stehen nicht in der App, sondern im Reverse
> Proxy.** Der Watchdog hat `/etc/caddy/Caddyfile` am 06.08. 12:0x gelesen und die
> Direktiven im Block `handle /paperless-app/*` (Z. 190–197) bestätigt; K-4 ist daraufhin
> korrigiert worden. Protokoll: `/opt/paperless/ops/AUSFUEHRUNGS-WARTESCHLANGE.md`
> Eintrag 14.
>
> **Die Einschränkung, die dabei herauskam und die hierher gehört:** Der Nachbarblock
> `handle /paperless/*` — die Paperless-Oberfläche selbst, über die täglich gearbeitet
> wird — hat **keinen** `header`-Block (Caddyfile Z. 162–164). **Diese Tabelle gilt also
> für DocuWunder, nicht für Paperless.** Welche Kopfzeilen paperless-ngx über Djangos
> `SecurityMiddleware` selbst setzt, ist **ungeprüft** — unbelegt ist nicht dasselbe wie
> belegt schlecht. Die Erhebung steht als Warteschlangen-Eintrag **Nr. 15** bereit (rein
> lesend, `curl -D -`, 2 Minuten). Siehe auch Abschnitt 7.

*(Korrekturvermerk 06.08.2026, Lauf 14:2x: Der Einleitungssatz lautete „**Die App wird von
Caddy ausgeliefert. Die folgenden Kopfzeilen sind gesetzt und notwendig:**" — ohne
Pfadangabe. Er las sich, als gälte die Tabelle für alles unter `services.frigew.ski`. Das
ist belegt falsch; ergänzt ist deshalb nur der Geltungsbereich, an den Werten selbst
wurde nichts geändert.)*

### Die Policy im Einzelnen

```
default-src 'self';
script-src 'self';            # kein Inline-Skript – deshalb start.js
style-src 'self';
style-src-attr 'unsafe-inline';   # style="…" an Elementen; darauf baut die Oberfläche auf
img-src 'self' blob: data:;   # Vorschaubilder und erzeugte PDFs
font-src 'self';
connect-src 'self';           # ← der wirksame Schutz gegen eine umgebogene API-Adresse
worker-src 'self';
manifest-src 'self';
object-src 'none';
base-uri 'none';
frame-ancestors 'none';
form-action 'self'
```

*(Belegstand dieser Liste, 06.08.2026: **wörtlich bestätigt** aus der Watchdog-Lesung
sind `default-src 'self'`, `script-src 'self'`, `style-src-attr 'unsafe-inline'`,
`img-src 'self' blob: data:`, `connect-src 'self'`, `object-src 'none'`,
`base-uri 'none'`, `frame-ancestors 'none'` und `form-action 'self'`
(`ops/AUSFUEHRUNGS-WARTESCHLANGE.md` Eintrag 14, Ergebnisblock). Die vier übrigen Zeilen
— `style-src 'self'`, `font-src 'self'`, `worker-src 'self'`, `manifest-src 'self'` —
sind in jener Lesung unter „u. a." zusammengefasst und hier **ungeprüft**: die
Zeile-für-Zeile-Gegenprobe braucht einen erneuten Blick ins Caddyfile, und
`/etc/caddy/` liegt außerhalb der für diese Sitzungsart freigegebenen Verzeichnisse — ein
Leseversuch am 06.08. 14:1x wurde mit genau dieser Begründung abgewiesen, wie schon am
11:2x. Das ist eine Verzeichnisgrenze, keine Ausführungsrechte-Frage.)*

**`connect-src 'self'` ist der wichtigste Eintrag.** Er ist der Grund, warum eine
eingeschleuste API-Adresse den Zugangsschlüssel nicht abfließen lassen kann: der Browser
verweigert die Verbindung, unabhängig davon, was die App versucht.

> **Getrennter Paperless-Server?** Dann muss dessen Herkunft in `connect-src` stehen —
> und erst dann funktioniert die Einrichtung mit fremder Adresse. Das ist beabsichtigt:
> die Lockerung soll eine bewusste Handlung des Betreibers sein.

---

## 3. Der Zugangsschlüssel

| | |
|---|---|
| Ablage | `localStorage`, als Datensatz mit Ablaufzeit |
| Gültigkeit | 30 Tage, gleitend (Nutzung verlängert, höchstens einmal täglich geschrieben) |
| Bei Abmeldung | gelöscht, ebenso Cache, Suchtreffer und Vorschaubilder |
| Optionaler Schutz | Bildschirmsperre: WebAuthn-PRF leitet einen AES-GCM-Schlüssel ab, der Zugangsschlüssel liegt dann **verschlüsselt** da |

*(Geprüft 06.08.2026 gegen den Quelltext, **unverändert richtig**: `api.js` Z. 34
`var GUELTIG_TAGE = 30;`, Ablage als JSON mit Feld `bis` (Z. 62–64), Ablauf beim Lesen
(Z. 48–51), gleitendes Fenster mit Tagesbremse (Z. 68–77, „Hoechstens einmal taeglich
schreiben"). Bildschirmsperre: `sperre.js` — PRF-Ergebnis → `HKDF` → `AES-GCM` 256
(Z. 62–68), Verschlüsselung des Tokens Z. 108. Die Freigabe der Vorschaubilder beim
Abmelden ist in `CLAUDE.md` beschrieben (`alleBilderFreigeben()` bei Abmelden und
„Lokale Daten löschen").)*

**Was die Bildschirmsperre leistet:** Schutz gegen ein verlorenes Gerät und gegen fremde
Blicke. Ohne bestandene Biometrie existiert der Schlüssel zum Entschlüsseln nirgends.

**Was sie nicht leistet:** Schutz gegen jemanden, der Code in die Herkunft einschleusen
kann. Wer das kann, wartet die Entsperrung ab.

### Zweiter Faktor beim Holen des Schlüssels *(neu 06.08.2026 — fehlte hier)*

Der Zugangsschlüssel entsteht über `POST /api/token/`. Paperless **erzwingt** dort den
TOTP-Code, sobald für das Konto MFA aktiv ist (`PaperlessAuthTokenSerializer`, geprüft
05.08.2026 22:30, `/opt/paperless/ops/AUTH-UEBERSICHT.md` Abschnitt 6.3): ohne oder mit
falschem Code antwortet der Server mit 400 („MFA code is required" / „Invalid MFA code").
Ein zweiter Faktor schützt also auch den API-Weg — kein falsches Sicherheitsgefühl.

Die App ist seit **v0.9.3** (`59c5fcf`) darauf vorbereitet: `api.js` `login()` nimmt ein
drittes, optionales Argument `code` und schickt es nur mit, wenn es gesetzt ist (Z. 461–465);
die beiden MFA-Fehlerfälle werden unterschieden (Z. 478–481), und das Onboarding hat ein
Code-Feld. Ein **bestehender** Token bleibt nach dem Einschalten von TOTP gültig — die
Umstellung kostet keinen Ausfall (`AUTH-UEBERSICHT.md` Abschnitt 8).

**Eingerichtet ist TOTP nicht.** Siehe Abschnitt 7, erster Punkt.

*(Warum dieser Abschnitt neu ist: Die Fassung vom 02.08.2026 kannte den zweiten Faktor
nicht — sie ist älter als die Erhebung vom 05.08. 22:30 und älter als v0.9.3. Es ist
nichts korrigiert, sondern eine Lücke geschlossen.)*

---

## 4. Die API-Adresse

Sie entscheidet, wohin der Zugangsschlüssel im `Authorization`-Kopf geht. Geprüft wird nach
vier Regeln (`DWLogik.basisPruefen`, 7 Unit-Tests):

1. Absolute `http:`- oder `https:`-Adresse — keine anderen Schemata.
2. `https` ist Pflicht, außer bei `localhost`/`127.0.0.1` und der eigenen Herkunft.
3. Fremde Herkunft nur nach ausdrücklicher Bestätigung im Onboarding.
4. Auch die beim Start gelesene Adresse wird geprüft.

*(Geprüft 06.08.2026, **unverändert richtig, einschließlich der Zahl**: in
`tests/logik.test.js` stehen zwischen Z. 421 und Z. 469 genau **sieben** `test(…)`-Blöcke
zu `basisPruefen` — eigene Herkunft als Voreinstellung (Z. 421), `/api` nicht doppelt
(Z. 428), fremde Herkunft nur nach Erlaubnis (Z. 433), `http` nur lokal (Z. 442), fremde
Schemata abgewiesen (Z. 448), unvollständige Eingaben abgewiesen (Z. 455), Regression
„Adresse mit Zugangsdaten" (Z. 461). Am Rande, ohne Änderung an einer fremden Datei:
`docs/AUDIT.md` Z. 43 spricht für denselben Zeilenbereich von „**sechs** Unit-Tests" —
nachgezählt sind es sieben; diese Datei hat recht.)*

**Grenze, klar gesagt:** Der gespeicherte Zustimmungs-Merker ist eine Hürde, kein Schutz.
`localStorage` ist für jede Lücke vollständig beschreibbar — wer die Adresse einschleust,
schreibt den Merker mit. Der Schutz ist `connect-src`.

---

## 5. Behobene Befunde

### XSS über den Suchausschnitt (behoben)

`nurText()` entfernte Auszeichnungen über `el.innerHTML` an einem losgelösten `<div>`. Ein
losgelöstes Element ist **nicht inert** — gemessen führen `<img src=x onerror>` und
`<video src=x onerror>` ihren Handler aus. Der Text kommt aus dem Dokumentinhalt, also aus
der Texterkennung: wer ein Dokument ins Archiv bekommt, bestimmte diesen String.

Behoben über `DOMParser.parseFromString`, der nachweislich nichts ausführt.
Regressionstest mit vier Nutzlasten, Gegenprobe gemacht.

*(Geprüft 06.08.2026, **unverändert richtig**: `suche.js` Z. 156–157 —
`nurText(t) { const doc = new DOMParser().parseFromString(String(t || ''), 'text/html'); … }`,
mit der Begründung in den Kommentarzeilen Z. 146–154. Der Fund wird unter H-1 auch in
`docs/AUDIT.md` und in `/opt/paperless/ops/ABNAHME-CHECKLISTE.md` Rasterpunkt 3
(Kriterium H, 1 von 1) als behoben geführt.)*

---

## 6. Bekannte Grenzen

- **`localStorage` ist gegen XSS nicht zu schützen.** Deshalb ist die CSP kein Beiwerk.
  In den nativen Hüllen **soll** der Schlüssel in Keychain/Keystore wandern
  (`MOBILE_ARCHITECTURE.md` Abschnitt 7). **Umgesetzt ist das nicht** — heute liegt der
  Schlüssel auch dort im `localStorage`.
  *(Korrigiert 06.08.2026, Lauf 14:2x: hier stand „**In den nativen Hüllen wandert der
  Schlüssel in Keychain/Keystore (siehe MOBILE_ARCHITECTURE.md).**" — im Präsens, als sei
  es der Ist-Zustand. Belegt ist das Gegenteil: `MOBILE_ARCHITECTURE.md` führt
  `@capacitor/preferences` + Keychain/Keystore unter „**Erwartete** native Plugins"
  (Abschnitt 6) und nennt in derselben Tabelle als „Ersetzt heute" ausdrücklich
  „`localStorage` in `api.js`"; Abschnitt 7 listet die Ablage unter „**Was sich ändert**".
  `native/package.json` enthält nur `@capacitor/{android,cli,core,ios}` — **kein**
  Speicher-Plugin. Die eingebetteten Kopien unter `native/android/…/public/api.js` und
  `native/ios/…/public/api.js` sind unveränderte Kopien der Weboberfläche. Der Satz war
  ein Plan, der wie ein Zustand gelesen wurde — genau die Stelle, an der ein
  Sicherheitsdokument eine spätere Prüfung in die Irre führt. `docs/AUDIT.md` führt die
  Store-Reife passend dazu mit 25 % und die Hüllen als „Machbarkeitsprüfung, keine
  Auslieferung".)*
- **Keine serverseitige Sitzungsverwaltung.** Ein einmal ausgegebener Token gilt, bis er in
  Paperless widerrufen wird. Ein Fernabmelden gibt es nicht.
  *(Geprüft 06.08.2026, unverändert richtig — `AUTH-UEBERSICHT.md` Abschnitt 6.1 sagt
  dasselbe von der Serverseite her und verweist seinerseits hierher. Bestand am
  05.08. 22:30: genau **ein** API-Token, für `damien`, keine verwaisten.)*
- **Der Service Worker speichert nur die Hülle.** Dokumente, Vorschaubilder und alles unter
  `/paperless/` fasst er nicht an — fremde Rechnungen gehören nicht in einen Browsercache,
  den kein Abmelden leert. Eine Prüfstufe hält das fest.
  *(Geprüft 06.08.2026, unverändert richtig: `sw.js` Z. 200 behandelt „Alles ausserhalb von
  .../paperless-app/ - vor allem /paperless/ selbst -" gesondert; die Hüllenliste
  (Z. 50 ff.) enthält keinen API-Pfad. Die Prüfstufe ist `tests/pwa_check.py` Z. 159:
  `pruefe("/paperless/" not in "".join(huelle), "die Huelle enthaelt keine API-Antworten")`.)*
- **Kein Schutz gegen einen kompromittierten Server.** Wer Paperless kontrolliert,
  kontrolliert die Daten.

---

## 7. Was am Betrieb offen ist *(neu 06.08.2026)*

Die Abschnitte oben beschreiben die App. Vier Punkte betreffen den **Betrieb** dieser
Instanz (`services.frigew.ski/paperless`) und sind belegt offen. Sie stehen hier, weil ein
Sicherheitsdokument, das nur die eigene Hälfte zeigt, denselben Fehler macht wie eine
falsche Kopfzeile in Abschnitt 2. Alle vier sind in
`/opt/paperless/ops/ABNAHME-CHECKLISTE.md` Rasterpunkt 3 als ❌ oder 🟡 geführt (dort
9 von 15 Punkten) und haben je eine offene Box in `/opt/paperless/ROADMAP.md` MS-3.

1. **TOTP für `damien` ist nicht eingerichtet.** Technisch ist alles bereit — allauth
   65.16.1, MFA-Routen aktiv, `POST /api/token/` erzwingt den Code, die App sendet ihn
   seit v0.9.3 (Abschnitt 3). Registriert sind **0 Authenticatoren**
   (`AUTH-UEBERSICHT.md` Abschnitt 7.1, erhoben 05.08. 22:30). Der Zugang zum Archiv hängt
   damit an genau einem Passwort. Den QR-Code kann nur der Kontoinhaber scannen; dazu
   gehören die Wiederherstellungscodes an einem benannten Ort — **nicht** ihr Inhalt,
   nirgendwo.
2. **Die Sicherungsarchive liegen im Klartext.** Sie enthalten die `.env` unverschlüsselt
   und damit sämtliche Zugangsdaten der Datenbank
   (`/opt/paperless/BETRIEBSHANDBUCH.md` Abschnitt 7). Lokal ist das Risiko begrenzt; mit
   der ersten Off-Server-Kopie wird daraus die Weitergabe aller Passwörter. Die
   Verschlüsselung gehört **vor** den ersten Off-Server-Lauf.
3. **`handle /paperless/*` hat keinen `header`-Block.** Die Kopfzeilen aus Abschnitt 2
   gelten nur für `/paperless-app/*` (Caddyfile Z. 190–197), nicht für die
   Paperless-Oberfläche selbst (Z. 162–164). Was Djangos `SecurityMiddleware` davon selbst
   setzt, ist **ungeprüft** — die Erhebung ist Warteschlangen-Eintrag Nr. 15, rein lesend.
   Ob der Block ausgeweitet wird, ist danach eine **eigene** Entscheidung mit eigener
   Gegenprobe: eine zu strenge CSP kann die Angular-Oberfläche von paperless-ngx zerlegen.
4. **Es gibt keinen Alarm auf ein Sicherheitsereignis.** Der seit 06.08. 11:45 laufende
   Monitor beobachtet Container, Healthcheck und Consume-Fehler — **keinen**
   Sicherheitsvorfall. Fehlgeschlagene Anmeldeversuche stehen in
   `data/log/paperless.log` und werden von niemandem ausgewertet. Was überhaupt als
   Ereignis und was als Nachweis gilt, gehört vor der Umsetzung festgelegt; die
   Abnahme-Checkliste formuliert für diese Zeile als einzige **keinen** akzeptierten
   Nachweis, sondern stellt nur fest: „Es gibt keinen."

---

## 8. Eine Lücke melden

Über die Sicherheitsfunktion des Repositorys (privates Advisory), nicht über ein
öffentliches Issue: https://github.com/DamienDrash/docuwunder/security/advisories/new

*(Geprüft 06.08.2026: Der Repositoriumspfad `DamienDrash/docuwunder` ist mit dem Rest des
Projekts konsistent — `app.js` Z. 108 `const PROJEKT_URL = 'https://github.com/DamienDrash/docuwunder'`,
`docs/ROADMAP.md` Z. 53, `docs/brand/NAME_SCREENING.md` Z. 34. **Ungeprüft** bleibt, ob
die Advisory-Seite erreichbar und die Sicherheitsfunktion im Repositorium eingeschaltet
ist: dafür wäre ein Netzzugriff nötig, den diese Sitzungsart nicht hat. Am Rande, ohne
Änderung an einer fremden Datei: `/opt/paperless/ops/AUSFUEHRUNGS-WARTESCHLANGE.md`
Eintrag 10 schreibt den Eigentümer „DamienFrash" — eine der beiden Schreibweisen ist
falsch, entscheidbar ist das hier nicht.)*

---

## 9. Prüfung dieser Datei gegen den heutigen Stand (06.08.2026, Lauf 14:2x)

**Anlass.** `/opt/paperless/ROADMAP.md` MS-3, Box „Sicherheitsdokumentation der App auf den
heutigen Stand gezogen" (🟡-Zeile „Aktualität der Sicherheitsdokumentation" aus
`ops/ABNAHME-CHECKLISTE.md` Rasterpunkt 3). Der Kopf trug den 02.08.2026 und beschrieb
Codestand `67e4aec` und paperless 3.0.4; Produktion ist 3.0.5 / v0.9.3. **Verlangt war
nicht das Umdatieren des Kopfes, sondern eine Aussage-für-Aussage-Prüfung** — das Ergebnis
steht hier vollständig, auch dort, wo es unbequem ist.

**Bestätigt — unverändert übernommen** (Beleg jeweils an Ort und Stelle):

| Aussage | Beleg |
|---|---|
| Abschnitt 1, Modell ohne Zwischendienst | `api.js`; `AUTH-UEBERSICHT.md` Abschnitt 6 |
| Abschnitt 2, die sechs Kopfzeilen und neun von dreizehn CSP-Direktiven | Watchdog-Lesung `/etc/caddy/Caddyfile` Z. 190–197 (06.08. 12:0x), protokolliert in `ops/AUSFUEHRUNGS-WARTESCHLANGE.md` Eintrag 14 |
| Abschnitt 3, 30 Tage gleitend, höchstens täglich geschrieben, Ablage mit Ablaufzeit | `api.js` Z. 34, 48–51, 62–64, 68–77 |
| Abschnitt 3, WebAuthn-PRF → AES-GCM | `sperre.js` Z. 62–68, 108 |
| Abschnitt 4, vier Regeln und **7** Unit-Tests | `tests/logik.test.js` Z. 421–472, sieben `test(…)`-Blöcke, einzeln nachgezählt *(Spanne korrigiert 06.08.2026, Lauf 16:1x: hier stand „Z. 421–469". Die Zahl **sieben** war und bleibt richtig, falsch war allein die Endzeile — der siebte Block beginnt in Z. 461 und endet in **Z. 472**; „469" schnitt ihn mitten durch. Blockanfänge nachgezählt: Z. 421/428/433/442/448/455/461. Dieselbe Korrektur ist in `/opt/paperless/ROADMAP.md` gezogen; `docs/AUDIT.md` Z. 43/1295 führen die 472 bereits seit dem 15:0x-Lauf.)* |
| Abschnitt 5, XSS über `DOMParser` behoben | `suche.js` Z. 146–157 |
| Abschnitt 6, keine serverseitige Sitzungsverwaltung | `AUTH-UEBERSICHT.md` Abschnitt 6.1 |
| Abschnitt 6, Service Worker hält nur die Hülle | `sw.js` Z. 50 ff. und Z. 200; `tests/pwa_check.py` Z. 159 |
| Abschnitt 8, Repositoriumspfad | `app.js` Z. 108; `docs/ROADMAP.md` Z. 53 |

**Veraltet — korrigiert, alter Wortlaut jeweils als Zitat erhalten:**

1. **Kopfzeile** „Stand: 2. August 2026" → 6. August 2026, Codestand `59c5fcf` / v0.9.3,
   Paperless-ngx 3.0.5.
2. **Abschnitt 2, Einleitungssatz** „Die folgenden Kopfzeilen sind gesetzt und
   **notwendig**" → um den Geltungsbereich `/paperless-app/*` ergänzt. Die Werte selbst
   sind unverändert; falsch war die stillschweigende Reichweite.
3. **Abschnitt 6, Keychain/Keystore** — Präsens („wandert") → Plan („soll wandern,
   umgesetzt ist das nicht"). Beleg: `MOBILE_ARCHITECTURE.md` Abschnitte 6 und 7,
   `native/package.json` ohne Speicher-Plugin.

**Ergänzt, weil es fehlte** (keine Korrektur, eine Lücke):

- Abschnitt 3, Unterabschnitt „Zweiter Faktor beim Holen des Schlüssels" — die Datei ist
  älter als die MFA-Erhebung vom 05.08. 22:30 und älter als v0.9.3.
- Abschnitt 7, „Was am Betrieb offen ist" — die vier belegt offenen Punkte.

**Ungeprüft — ausdrücklich so gekennzeichnet, nicht stillschweigend stehen gelassen:**

| Was | Warum, und was es klären würde |
|---|---|
| Die vier CSP-Direktiven `style-src`, `font-src`, `worker-src`, `manifest-src` | In der Watchdog-Lesung unter „u. a." zusammengefasst, nicht wörtlich zitiert. Klären würde es ein erneuter Blick ins Caddyfile — außerhalb der freigegebenen Verzeichnisse, Versuch am 14:1x abgewiesen |
| Welche Kopfzeilen paperless-ngx über Djangos `SecurityMiddleware` selbst setzt | Nie erhoben. Warteschlangen-Eintrag **Nr. 15** (rein lesend, `curl -D -`, 2 Minuten) |
| Ob die tatsächlich beim Browser ankommenden Kopfzeilen den Werten dieser Tabelle entsprechen | Belegt ist die **Konfiguration**, nicht die Auslieferung. Dieselbe Erhebung Nr. 15 beantwortet auch das |
| Ob die Advisory-Seite erreichbar und die Sicherheitsfunktion eingeschaltet ist | Braucht Netzzugriff, den diese Sitzungsart nicht hat |
| Die Wirksamkeit der Bildschirmsperre auf einem echten Gerät | WebAuthn-PRF ist im Quelltext belegt, **nie auf einem Telefon durchgespielt**. Die Geräteverifikation steht mit 0 von 29 Prüfpunkten aus (`docs/GERAETE-CHECKLISTE.md`) |

**Nicht angefasst.** Keine Quelldatei der App, keine Zahl in `docs/AUDIT.md`, keine
Punktzahl in `ops/ABNAHME-CHECKLISTE.md`, kein Wert aus `/opt/paperless/.env` — Pfade und
Mechanismen stehen hier, Werte nicht. `VERSION` bleibt `0.9.3`, die Hüllenversion in
`sw.js` bleibt unverändert: `docs/` ist nicht Teil der Hülle.
