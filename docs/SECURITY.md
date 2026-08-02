# DocuWunder — Sicherheit

Stand: 2. August 2026

Dieses Dokument beschreibt, wogegen DocuWunder schützt, wogegen **nicht**, und was der
Betreiber dafür einstellen muss.

---

## 1. Das Modell in einem Satz

DocuWunder ist eine Oberfläche für den eigenen Paperless-Server. Es gibt keinen Dienst
dazwischen — alle Daten liegen auf dem Server des Betreibers, alle Rechte verwaltet
Paperless. Die App hält lokal nur den Zugangsschlüssel, den Suchverlauf und zuletzt
geöffnete Dokumente.

---

## 2. Notwendige Kopfzeilen

Die App wird von Caddy ausgeliefert. Die folgenden Kopfzeilen sind gesetzt und **notwendig**:

| Kopfzeile | Wert | Wozu |
|---|---|---|
| `Content-Security-Policy` | siehe unten | Zweiter Schutzwall hinter der Eingabebehandlung |
| `X-Content-Type-Options` | `nosniff` | Kein Raten des Inhaltstyps |
| `Referrer-Policy` | `no-referrer` | Dokumentadressen verlassen den Server nicht über den Referrer |
| `Permissions-Policy` | `camera=(self), microphone=(), geolocation=(), payment=(), usb=()` | Nur die Kamera, und die nur für uns |
| `Cross-Origin-Opener-Policy` | `same-origin` | Kein fremdes Fenster erhält eine Referenz |
| `Cross-Origin-Resource-Policy` | `same-origin` | Kein fremder Kontext bindet unsere Dateien ein |

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

**Was die Bildschirmsperre leistet:** Schutz gegen ein verlorenes Gerät und gegen fremde
Blicke. Ohne bestandene Biometrie existiert der Schlüssel zum Entschlüsseln nirgends.

**Was sie nicht leistet:** Schutz gegen jemanden, der Code in die Herkunft einschleusen
kann. Wer das kann, wartet die Entsperrung ab.

---

## 4. Die API-Adresse

Sie entscheidet, wohin der Zugangsschlüssel im `Authorization`-Kopf geht. Geprüft wird nach
vier Regeln (`DWLogik.basisPruefen`, 7 Unit-Tests):

1. Absolute `http:`- oder `https:`-Adresse — keine anderen Schemata.
2. `https` ist Pflicht, außer bei `localhost`/`127.0.0.1` und der eigenen Herkunft.
3. Fremde Herkunft nur nach ausdrücklicher Bestätigung im Onboarding.
4. Auch die beim Start gelesene Adresse wird geprüft.

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

---

## 6. Bekannte Grenzen

- **`localStorage` ist gegen XSS nicht zu schützen.** Deshalb ist die CSP kein Beiwerk. In
  den nativen Hüllen wandert der Schlüssel in Keychain/Keystore (siehe MOBILE_ARCHITECTURE.md).
- **Keine serverseitige Sitzungsverwaltung.** Ein einmal ausgegebener Token gilt, bis er in
  Paperless widerrufen wird. Ein Fernabmelden gibt es nicht.
- **Der Service Worker speichert nur die Hülle.** Dokumente, Vorschaubilder und alles unter
  `/paperless/` fasst er nicht an — fremde Rechnungen gehören nicht in einen Browsercache,
  den kein Abmelden leert. Eine Prüfstufe hält das fest.
- **Kein Schutz gegen einen kompromittierten Server.** Wer Paperless kontrolliert,
  kontrolliert die Daten.

---

## 7. Eine Lücke melden

Über die Sicherheitsfunktion des Repositorys (privates Advisory), nicht über ein
öffentliches Issue: https://github.com/DamienDrash/docuwunder/security/advisories/new
