# DocuWunder — Architektur der nativen Hüllen

Stand: 2. August 2026 · Machbarkeitsprüfung, keine Auslieferung

---

## 1. Gewählte Architektur

Eine Codebasis, drei Vertriebswege:

```
DocuWunder (Weboberfläche, unverändert)
├── Browser und installierbare PWA      ← bleibt vollwertiger Kanal
├── iOS-App     über Capacitor
└── Android-App über Capacitor
```

Die Weboberfläche liegt im Wurzelverzeichnis. `native/` enthält ausschließlich die Hülle;
`native/vorbereiten.mjs` kopiert die auszuliefernden Dateien nach `native/web/`, von wo
Capacitor sie in die nativen Pakete bündelt. **An der Weboberfläche ändert sich dafür
nichts** — das war die Bedingung und ist gemessen erfüllt (Abschnitt 4).

Kein Build-Schritt, kein Bundler, keine Transpilation. Was ausgeliefert wird, ist der
geschriebene Code — auch in der Hülle.

---

## 2. Geprüfte Alternativen

| Weg | Warum nicht |
|---|---|
| **Swift + Kotlin nativ** | Zwei zusätzliche Codebasen für dieselbe Anwendung. Bei einem Zwei-Personen-Projekt heißt das: jede Änderung dreimal. Ausdrücklich ausgeschlossen. |
| **React Native** | Die Oberfläche ist React, aber kein React Native — `htm`, DOM-Elemente, CSS-Zeichenketten. Eine Portierung wäre eine Neuentwicklung mit demselben Aussehen. |
| **Flutter** | Vollständige Neuentwicklung in Dart. Kein Anteil der bestehenden 6.800 Zeilen bliebe. |
| **TWA (nur Android)** | Billig und schnell, aber es gibt kein Gegenstück für iOS — und iOS ist der Kanal, in dem die PWA-Installation am schwächsten ist. Bleibt als Rückfallebene für Android, falls Capacitor dort Probleme macht. |
| **Capacitor** | **Gewählt.** Bettet die vorhandene Weboberfläche ein, öffnet den Weg zu nativen Fähigkeiten über Plugins, und die PWA bleibt derselbe Code. |

### Gründe für Capacitor im Einzelnen

1. **Die Oberfläche läuft unverändert.** Gemessen: aus fremder Herkunft serviert baut sie
   sich vollständig auf, alle 26 Dateien laden, kein Fehler in der Konsole.
2. **Die nativen Fähigkeiten der Wunschliste haben gepflegte Plugins** (Abschnitt 6).
3. **Die Hülle ist dünn.** 1,6 MB Android-Projekt, 1,4 MB iOS-Projekt — beide erzeugt und
   im Repo nachvollziehbar.
4. **Rückzug bleibt möglich.** Fällt die Entscheidung später gegen die Stores, wird
   `native/` gelöscht und nichts anderes ist betroffen.

---

## 3. Auswirkungen auf die bestehende PWA

**Keine.** Das ist die wichtigste Aussage dieses Dokuments und sie ist geprüft:
`native/vorbereiten.mjs` kopiert nur, es verändert nichts. Die sieben Prüfstufen laufen
gegen die Weboberfläche wie bisher.

Zwei Stellen brauchen allerdings eine **Erweiterung**, die auch der PWA nützt:

- **Die API-Adresse.** In der Hülle liegt die App unter `https://localhost`.
  `defaultBase()` rechnet daraus `https://localhost/paperless/api` — eine Adresse, die es
  nicht gibt. Gemessen. Die Hülle muss die Adresse also ausdrücklich setzen, und das
  Onboarding darf keinen sinnlosen Vorschlag machen. Siehe Meilenstein A, „API-Adresse".
- **Die Herkunftsprüfung.** Dieselbe Arbeit deckt beide Fälle ab: Same-Origin als
  Voreinstellung, fremde Herkunft nur nach ausdrücklicher Bestätigung.

---

## 4. Was die Machbarkeitsprüfung ergeben hat

Alles gemessen, nicht angenommen.

| Frage | Ergebnis |
|---|---|
| Minimales iOS-Projekt | ✅ erzeugt (`native/ios`, 1,4 MB) |
| Minimales Android-Projekt | ✅ erzeugt (`native/android`, 1,6 MB) |
| `cap sync` läuft durch | ✅ beide Plattformen, 0,3 s |
| Lokale Assets laden | ✅ alle 26 Einträge, Einstiegspunkt in beiden Paketen vorhanden |
| Oberfläche baut sich auf | ✅ aus fremder Herkunft, ohne Konsolenfehler |
| **API-Verbindung** | ❌ **von CORS blockiert** — siehe unten |
| App startet in der Hülle | ⚠️ **nicht geprüft** — kein Android-SDK, kein macOS in dieser Umgebung |

### Der blockierende Befund: CORS

Gemessen gegen den echten Server:

```
Preflight  OPTIONS /paperless/api/documents/   Origin: capacitor://localhost
→ HTTP 200, aber KEIN Access-Control-Allow-Origin

GET aus http://127.0.0.1:xxxxx
→ blocked by CORS policy: Response to preflight request doesn't pass access control check
```

`Vary: origin` ist gesetzt — Paperless wertet die Herkunft also aus, hat aber keine
freigegeben. Im Quelltext bestätigt:

```python
CORS_ALLOWED_ORIGINS = get_list_from_env("PAPERLESS_CORS_ALLOWED_HOSTS", ...)
CORS_ALLOW_CREDENTIALS = True
```

**Notwendige Serverkonfiguration** (in `/opt/paperless/.env`, danach Neustart):

```
PAPERLESS_CORS_ALLOWED_HOSTS=https://localhost,capacitor://localhost
```

Zwei Punkte dazu:

- `CORS_ALLOW_CREDENTIALS = True` schließt eine Wildcard aus. Die Herkünfte müssen einzeln
  stehen.
- Ob `django-cors-headers` ein eigenes Schema wie `capacitor://` akzeptiert, ist **offen**.
  Deshalb steht in `capacitor.config.json` bereits `scheme: https` für beide Plattformen —
  damit ist die Herkunft `https://localhost` und ein gewöhnlicher Eintrag genügt.

> Diese Änderung ist **nicht** vorgenommen worden. Sie verlangt einen Neustart des Dienstes
> und betrifft die laufende Installation. Sie gehört an den Anfang von Meilenstein E.

---

## 5. Sicherheitsmodell

### Herkunft und Isolation

In der Hülle ist die Herkunft `https://localhost` — **für jede Capacitor-App auf dem Gerät
dieselbe**. Das hat zwei Folgen:

1. **`localStorage` ist pro App isoliert** (eigener WebView-Datenbereich), also kein
   Datenaustausch zwischen Apps. Unkritisch.
2. **WebAuthn-Anmeldedaten sind an `localhost` gebunden.** Das ist der Grund, warum die
   Bildschirmsperre in der Hülle nicht so bleiben kann wie sie ist (Abschnitt 7).

### Token

Heute liegt der Zugangsschlüssel im `localStorage`, wahlweise mit WebAuthn-PRF
verschlüsselt. In der Hülle ist das **schlechter** als das, was die Plattform anbietet:

| | PWA heute | Hülle künftig |
|---|---|---|
| Ablage | `localStorage`, optional PRF-verschlüsselt | iOS Keychain / Android Keystore |
| Schutz im Ruhezustand | nur bei eingerichteter Sperre | durch das Betriebssystem |
| Biometrie | WebAuthn PRF | Face ID / Touch ID / BiometricPrompt |
| Bei Deinstallation | mit den Websitedaten weg | mit der App weg |

Die Umstellung ist **kein Ersatz, sondern eine Weiche**: `api.js` bekommt eine
Ablage-Schnittstelle mit zwei Rückseiten (Web und nativ). Die PWA behält ihren Weg.

### CSP

Die in Meilenstein A vorbereitete Policy gilt in der Hülle ebenso — dort allerdings über
ein `<meta http-equiv>`, weil es keinen Server gibt, der Kopfzeilen setzt. `connect-src`
muss dann die konfigurierte Paperless-Adresse enthalten, was bei frei wählbarem Server eine
Lockerung bedeutet (`connect-src 'self' https:`). Offene Entscheidung, siehe Abschnitt 9.

---

## 6. Erwartete native Plugins

| Fähigkeit | Plugin | Ersetzt heute |
|---|---|---|
| Sichere Ablage | `@capacitor/preferences` + Keychain/Keystore | `localStorage` in `api.js` |
| Biometrie | `capacitor-native-biometric` | WebAuthn PRF in `sperre.js` |
| Kamera / Scanner | `@capacitor/camera` | `<input type=file capture>` in `erfassen.js` |
| Dateiauswahl | `@capacitor/filesystem` + `@capawesome/capacitor-file-picker` | `<input type=file>` |
| Teilen (heraus) | `@capacitor/share` | Download über `<a download>` |
| Teilen (herein) | Share Extension (iOS) / Share Target (Android) | — neu |
| Deep Links | `@capacitor/app` | `?tab=`-Kurzbefehle |
| Statusleiste | `@capacitor/status-bar` | `theme-color` |
| Pause / Fortsetzen | `@capacitor/app` | `visibilitychange` |
| Push (später) | `@capacitor/push-notifications` | — |

**Regel für alle:** Die Weboberfläche ruft nie direkt ein Plugin auf. Jede Fähigkeit
bekommt in `api.js` beziehungsweise dem zuständigen Sachgebiet eine Funktion mit zwei
Rückseiten, und die Weiche fragt `Capacitor.isNativePlatform()`. So bleibt die PWA
lauffähig und die Prüfstufen laufen unverändert.

---

## 7. Authentifizierungs- und Token-Modell

Unverändert: **Token-Authentifizierung gegen Paperless**, kein eigener Dienst dazwischen.
Das war die Bedingung aus der ursprünglichen Anforderung und gilt weiter.

Was sich ändert:

1. **Ablage** → Keychain / Keystore statt `localStorage`.
2. **Entsperren** → native Biometrie statt WebAuthn-PRF. Der PRF-Weg funktioniert in einem
   WebView **voraussichtlich nicht**: Android WebView bringt keine brauchbare
   WebAuthn-Unterstützung mit, und WKWebView bindet Anmeldedaten an die Associated Domains
   der App. Das ist **nicht gemessen** — mangels Gerät — und der wichtigste offene Punkt.
3. **Serveradresse** → muss in der Hülle ausdrücklich gesetzt werden. Das Onboarding
   braucht dort ein Pflichtfeld statt eines Vorschlags.

`sperre.js` bleibt für die PWA erhalten. Die Sachgebietsgrenze ist bereits richtig gezogen.

---

## 8. Update-Modell

| Kanal | Aktualisierung | Frist |
|---|---|---|
| PWA | Service Worker, beim Wechsel in den Vordergrund | sofort |
| Hüllen | Store-Abnahme | 1–3 Tage (Apple), Stunden (Google) |

**Entscheidung:** Die Hüllen bündeln die Weboberfläche (kein Nachladen vom Server). Das ist
langsamer bei Korrekturen, aber:

- Apple sieht Nachladen von Programmcode kritisch (Richtlinie 2.5.2). Gebündelt gibt es
  keine Diskussion.
- Die App muss offline starten. Gebündelt ist das ohnehin gegeben.
- Der Service Worker bleibt in der Hülle wirkungslos, weil alles schon lokal liegt — das
  ist kein Verlust, aber es heißt: **die Selbstaktualisierung aus `index.html` greift dort
  nicht.** Sie stört auch nicht; sie findet schlicht nie eine neue Fassung.

---

## 9. Risiken

| Risiko | Wahrscheinlichkeit | Auswirkung | Umgang |
|---|---|---|---|
| **WebAuthn-PRF funktioniert im WebView nicht** | hoch | mittel | Native Biometrie ist ohnehin geplant; PRF bleibt der PWA |
| CORS lässt sich mit `capacitor://` nicht freigeben | mittel | hoch | Bereits umgangen: `scheme: https` in der Konfiguration |
| Apple lehnt „nur eine Website" ab (Richtlinie 4.2) | mittel | hoch | Native Kamera, Teilen-Ziel und Biometrie einbauen, bevor eingereicht wird |
| Datei-Upload im WebView verhält sich anders | mittel | mittel | Über `@capacitor/camera` und Datei-Plugin ersetzen, nicht über `<input>` |
| Zwei Store-Konten, jährliche Kosten | sicher | gering | 99 $/Jahr Apple, 25 $ einmalig Google |
| Abnahme scheitert an Barrierefreiheit | mittel | hoch | Meilenstein B liegt vor E — bewusst so geordnet |
| `native/` veraltet gegenüber der Weboberfläche | hoch | mittel | `vorbereiten.mjs` in die CI; Abweichung bricht den Lauf |

---

## 10. Offene Entscheidungen

1. **Werden `native/android` und `native/ios` eingecheckt?** Derzeit ja (3 MB), weil sie
   ohne SDK nicht reproduzierbar erzeugt werden können. Alternative: nur die Konfiguration
   einchecken und in der CI erzeugen.
2. **CSP in der Hülle.** Bei frei wählbarem Server lässt sich `connect-src` nicht eng
   fassen. Entweder `https:` erlauben oder die Adresse beim ersten Start in die Policy
   schreiben (geht nur über `<meta>`, also vor dem ersten Laden nicht bekannt).
3. **Mindestversionen.** iOS 14 (Capacitor 8) und Android 6? Höher ansetzen erlaubt
   modernere APIs.
4. **App-Kennung.** Derzeit `ski.frigew.docuwunder` — vor der ersten Einreichung
   festzulegen, danach unveränderlich.
5. **Bündeln oder nachladen** — vorläufig entschieden (Abschnitt 8), vor der Einreichung
   zu bestätigen.

---

## 11. Definition of Done für Meilenstein E

Meilenstein E gilt als abgeschlossen, wenn **alle** Punkte belegt sind:

1. `PAPERLESS_CORS_ALLOWED_HOSTS` gesetzt und ein API-Aufruf aus `https://localhost`
   nachweislich erfolgreich.
2. Beide Hüllen bauen auf einem Rechner mit den nötigen SDKs — Android auf Linux, iOS auf
   macOS — und starten auf einem Gerät.
3. Anmeldung, Liste, Suche, Vorschau, Upload und Scannen sind auf je einem echten iOS- und
   Android-Gerät durchgespielt.
4. Der Zugangsschlüssel liegt in Keychain beziehungsweise Keystore, nicht im `localStorage`.
5. Entsperren läuft über native Biometrie; `sperre.js` wird in der Hülle nicht mehr benutzt.
6. Kamera, Dateiauswahl und Teilen laufen über Plugins, nicht über `<input>`.
7. Die sieben Prüfstufen laufen unverändert grün gegen die Weboberfläche.
8. `vorbereiten.mjs` läuft in der CI; eine Abweichung zwischen Weboberfläche und `native/web`
   bricht den Lauf.
9. Die PWA verhält sich unverändert — nachgewiesen durch denselben Durchlauf im Browser.
10. Store-Material vollständig (Meilenstein D) und eine Testflight- beziehungsweise
    Internal-Testing-Fassung von einer zweiten Person installiert und benutzt.

---

## 12. Was diese Prüfung nicht beantwortet

Ehrlichkeitshalber, weil die Umgebung es nicht hergab:

- **Kein Start in einer echten Hülle.** Ohne Android-SDK und ohne macOS ließ sich keines
  der beiden Projekte bauen. Die Aussage „die Oberfläche läuft" stützt sich darauf, dass sie
  aus fremder Herkunft im Browser fehlerfrei startet — das ist ein starkes, aber kein
  vollständiges Indiz.
- **Kein WebAuthn-Test im WebView.** Der wichtigste offene technische Punkt.
- **Kein Datei-Upload aus einem WebView.**
- **Kein Verhalten bei Pause und Wiederaufnahme.**

Diese vier gehören an den Anfang von Meilenstein E, sobald ein Rechner mit den nötigen
Werkzeugen bereitsteht.
