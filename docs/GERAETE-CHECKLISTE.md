# Geräte-Checkliste: Scanner und Erfassung auf einem echten Telefon

Stand: 06.08.2026 · App-Fassung: 0.9.3 · Prüfling: <https://services.frigew.ski/paperless-app/>

Diese Liste ist zum Abhaken auf dem Telefon gedacht — kurze Punkte, jeder für sich prüfbar.
Sie prüft **Verhalten**, nicht Anwesenheit: es zählt, was tatsächlich passiert, nicht ob ein
Knopf da ist.

Warum es diese Liste gibt: die gesamte Scanner-Kette (Live-Kamera, Auto-Auslöser,
Randvorschlag, Bildmodi, Unschärfe-Hinweis) ist bisher **nur gegen synthetische Testbilder in
Playwright** geprüft. ADR `docs/adr/0005-goldstandard-scanner.md` hält ausdrücklich fest: die
Aussage „Goldstandard" oder „Swift-Paperless-Parität" darf erst nach echter
Geräteverifikation fallen. Diese Liste ist genau diese Verifikation.

**Wichtig:** Es genügt, wenn Punkte rot sind — das ist ein Ergebnis, kein Fehler des Testers.
Ein rot abgehakter Punkt mit Notiz ist wertvoller als ein wohlwollendes Häkchen.

---

## Vorher ausfüllen

| Angabe | Wert |
|---|---|
| Gerät (Modell) | |
| Betriebssystem + Version | |
| Browser + Version | |
| Als PWA installiert oder im Browser-Tab? | |
| Datum / Uhrzeit des Durchlaufs | |
| Netz (WLAN / Mobilfunk / beides) | |
| App-Fassung | 0.9.3 (aus `VERSION` — die App zeigt sie **nicht** selbst an) |

Am besten zwei Blätter Papier bereitlegen: ein normal bedrucktes A4-Blatt und ein
mehrseitiges Dokument (2–3 Blätter, z. B. ein Vertrag oder eine Rechnung mit Anlage).

---

## A · Installation und Start

### 1 · Seite im Browser öffnen
**Was tun:** <https://services.frigew.ski/paperless-app/> im mobilen Browser öffnen.
**Was muss passieren:** Der Startbildschirm „DocuWunder — Deine Dokumente. Ohne
Technikstress." erscheint mit dem Knopf „Los geht's". Keine leere Seite, keine
Fehlermeldung, keine sichtbar falschen Schriften.
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz:** ______________________________________________

### 2 · Zum Startbildschirm hinzufügen (PWA)
**Was tun:** Über das Browsermenü „Zum Home-Bildschirm" / „Installieren" wählen. Danach die
App über das neue Symbol starten.
**Was muss passieren:** Eigenes Symbol mit DocuWunder-Zeichen; die App startet **ohne
Browserleiste** (Vollbild). Die Statusleiste des Systems hat dieselbe Farbe wie die
Oberfläche — keine helle Leiste über dunkler App oder umgekehrt.
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz:** ______________________________________________

### 3 · Zweiter Start
**Was tun:** App schließen (aus dem App-Umschalter wischen) und erneut über das Symbol
starten.
**Was muss passieren:** Start ohne erneutes Onboarding, sichtbar schnell (unter ~2 Sekunden
bis zur bedienbaren Oberfläche). Keine „Verbindung nicht möglich"-Meldung.
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz:** ______________________________________________

---

## B · Anmeldung

### 4 · Serveradresse und Anmeldung
**Was tun:** Im Onboarding die Serveradresse eintragen
(`https://services.frigew.ski/paperless`), dann Benutzername und Passwort eingeben,
„Anmelden" tippen. Das Feld **„Zweifaktor-Code"** dabei leer lassen.
**Was muss passieren:** Grüner Punkt mit der Serveradresse auf dem Anmeldeschirm, danach
„Verbunden" und der Sprung in die App. Der Bestand ist zu sehen (Dokumentenzahl plausibel).
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz:** ______________________________________________

### 5 · Falsches Passwort
**Was tun:** Abmelden (Mehr → Abmelden), erneut anmelden, diesmal mit falschem Passwort.
**Was muss passieren:** Eine **verständliche** rote Meldung („Benutzername oder Passwort
falsch" o. ä.), kein technischer Fehlertext, kein Hängenbleiben im Ladezustand. Erneuter
Versuch mit richtigem Passwort funktioniert sofort.
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz:** ______________________________________________

### 6 · Anmeldung mit Zwei-Faktor-Code (TOTP)
**Nur prüfen, wenn für das Konto der zweite Faktor im Paperless-Profil eingerichtet ist.**
Hintergrund: der Paperless-Server **erzwingt** den TOTP-Code auch beim App-Weg
(`POST /api/token/`), sobald MFA für das Konto aktiv ist. Ein bereits gespeicherter
Zugangsschlüssel bleibt dagegen gültig — die Umstellung wirft niemanden aus der App.
**Was tun:** (a) Anmelden **ohne** Code. (b) Anmelden **mit falschem** 6-stelligem Code.
(c) Anmelden **mit richtigem** Code aus der Authenticator-App.
**Was muss passieren:** (a) und (b) liefern je eine eigene, unterscheidbare Meldung — nicht
denselben Text wie bei falschem Passwort. (c) meldet erfolgreich an.
**Ergebnis:** ☐ ok  ☐ nicht ok  ☐ nicht anwendbar (kein TOTP eingerichtet)
**Notiz:** ______________________________________________

---

## C · Kamera und Berechtigung

### 7 · Kamera-Berechtigung erteilen
**Was tun:** Scannen öffnen (Plus-Knopf → „Scannen"). Beim Systemdialog **„Erlauben"** wählen.
**Was muss passieren:** Vollbild-Livebild der **rückwärtigen** Kamera (nicht Selfie-Kamera).
Oben mittig ein Statustext („Auto-Auslöser sucht Dokumentkanten …"), oben rechts der Knopf
„Auto", unten der große weiße Auslöser und links davon ein Symbol „Aus Dateien wählen".
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz:** ______________________________________________

### 8 · Kamera-Berechtigung verweigern
**Was tun:** Berechtigung in den Systemeinstellungen für die Seite/App auf „Ablehnen" setzen
(oder beim Dialog „Nicht erlauben" wählen), dann Scannen erneut öffnen.
**Was muss passieren:** **Keine Sackgasse.** Ein kurzer Hinweis („Kamerazugriff verweigert.
Dateiauswahl wird geöffnet.") und unmittelbar danach der **Dateiauswahl-Dialog des Systems**.
Ein Foto aus der Mediathek lässt sich dort auswählen und wird als Seite übernommen.
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz:** ______________________________________________

> Danach die Berechtigung wieder auf „Erlauben" stellen — die folgenden Punkte brauchen sie.

### 9 · Kamera wird sauber freigegeben
**Was tun:** Scannen öffnen (Livebild sichtbar), dann über das X oben links abbrechen.
**Was muss passieren:** Das System zeigt **kein** „Kamera aktiv"-Symbol / keinen grünen Punkt
mehr, sobald der Scan-Bildschirm zu ist. Kein warmes Gerät, kein weiterlaufendes Bild.
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz:** ______________________________________________

---

## D · Einseitiges Dokument scannen

### 10 · Automatischer Auslöser
**Was tun:** Ein A4-Blatt auf einen **kontrastierenden**, ruhigen Untergrund legen (helles
Papier auf dunklen Tisch). „Auto" muss aktiv sein (eingefärbt). Kamera darüber halten und
still halten.
**Was muss passieren:** Der Statustext wechselt von „sucht Dokumentkanten …" auf **„Dokument
erkannt, bitte ruhig halten …"** und löst danach **von selbst** aus (rund 1 Sekunde ruhiges
Halten). Es entsteht genau **eine** Seite, keine Serie.
**Wichtig zu prüfen:** Löst er auch dann aus, wenn **kein** Papier im Bild ist (auf eine leere
Wand halten)? Nach etwa 3 Sekunden ohne Randfund ist ein Auslösen **beabsichtigt** (bewusster
Rückfall, damit der Auslöser nie dauerhaft stumm bleibt) — bitte nur notieren, wie lange es
dauerte.
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz (Zeit bis Auslösen, mit und ohne Papier):** ______________________________________

### 11 · Manueller Auslöser
**Was tun:** „Auto" ausschalten (Knopf wird grau, Status „Auto-Auslöser ist aus."), dann den
großen weißen Knopf drücken.
**Was muss passieren:** Sofortige Aufnahme, keine automatische zweite Aufnahme, Status bleibt
auf „aus".
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz:** ______________________________________________

### 12 · Automatischer Randvorschlag beim Zuschneiden
**Was tun:** Auf der Seitenkachel das Zuschneiden-Symbol (Winkel) tippen.
**Was muss passieren:** Der gelbe Rahmen startet am ganzen Bild und **springt kurz darauf auf
das erkannte Blatt** — ein achsenparalleles Rechteck. Er darf **keinen Text abschneiden**.
Bei unklarem Bild bleibt er auf „ganz", das ist gewollt.
**Wichtig:** Der Vorschlag ist ein **Rechteck, keine Perspektivkorrektur.** Ein schräg
fotografiertes Blatt wird nicht „geradegezogen" — das ist der aktuelle Stand, nicht ein
Defekt. Bitte notieren, ob das für den Alltag reicht.
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz:** ______________________________________________

### 13 · Zuschnitt von Hand, Drehen, „Ganz"
**Was tun:** Die vier gelben Eckgriffe mit dem Finger ziehen. Dann „Ganz" tippen, danach
„Übernehmen". Zurück auf der Kachel zweimal das Dreh-Symbol tippen.
**Was muss passieren:** Griffe folgen dem Finger **ohne Abreißen**, auch wenn man schnell
zieht oder den Finger über den Bildrand hinaus bewegt. „Ganz" stellt den vollen Rahmen
wieder her. Drehen ändert die Ausrichtung ohne sichtbaren Qualitätsverlust — auch beim
dritten und vierten Mal (jede Änderung wird neu aus dem Original gerechnet).
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz:** ______________________________________________

---

## E · Mehrseitiger Scan

### 14 · Drei Seiten erfassen
**Was tun:** Mit „+ Seite" zwei weitere Blätter aufnehmen, sodass drei Kacheln liegen.
**Was muss passieren:** Kacheln sind mit **1, 2, 3** nummeriert, alle zeigen ein Vorschaubild
(kein grauer Platzhalter, der nicht verschwindet).
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz:** ______________________________________________

### 15 · Seiten sortieren und entfernen
**Was tun:** Mit den Pfeilen oben links Seite 3 nach vorn holen. Dann eine Seite über das
kleine X in der Ecke entfernen.
**Was muss passieren:** Nummerierung stimmt danach wieder durchgehend (1, 2 …). Es
verschwindet **genau die angetippte** Seite.
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz:** ______________________________________________

### 16 · Ein PDF aus mehreren Seiten
**Was tun:** „Weiter", Titel eingeben (z. B. `Geraetetest 06.08. mehrseitig`), „Hochladen".
Danach das Dokument in der App öffnen.
**Was muss passieren:** **Ein** Dokument mit **allen** Seiten in der gewählten Reihenfolge —
nicht drei Einzeldokumente. Seitenverhältnis normal (nicht gestaucht), alle Seiten gleich
groß auf dem Blatt.
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz:** ______________________________________________

---

## F · Licht und Ausrichtung

### 17 · Schlechte Lichtverhältnisse
**Was tun:** Licht dimmen oder nur mit Zimmerbeleuchtung am Abend scannen. Danach die Regler
**Kontrast** und **Helligkeit** über den Kacheln bewegen und zusätzlich **Graustufe**
einschalten.
**Was muss passieren:** Die Vorschaubilder **ändern sich sichtbar** (die Regler wirken auf die
Pixel, nicht nur auf die Anzeige). Beim Umschalten Original ↔ Graustufe geht nichts verloren
— jede Rückstellung ist möglich. Text bleibt lesbar; wenn nicht, ist das eine Notiz wert.
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz (bei welcher Einstellung wurde es brauchbar?):** _________________________________

### 18 · Verwacklungs-Hinweis
**Was tun:** Absichtlich verwackelt aufnehmen (Kamera beim Auslösen bewegen).
**Was muss passieren:** Kurz nach der Aufnahme erscheint ein Hinweis „Seite N wirkt unscharf.
Nochmal aufnehmen?" — als **Hinweis**, der nichts blockiert; die Seite bleibt verwendbar.
**Wichtig zu prüfen:** Erscheint der Hinweis auch bei **scharfen** Aufnahmen (Fehlalarm)? Die
Schwelle ist bisher nur an synthetischen Bildern eingestellt — Fehlalarme sind der
wahrscheinlichste Befund und unbedingt zu notieren.
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz (wie oft Hinweis bei scharf / bei unscharf, z. B. 3 von 5):** ____________________

### 19 · Hochformat und Querformat
**Was tun:** Ein Blatt im Hochformat scannen, ein zweites im **Querformat** (Telefon drehen).
Dann das Telefon **während** eines offenen Scans drehen.
**Was muss passieren:** Beide Aufnahmen behalten ihre Ausrichtung im fertigen PDF. Beim Drehen
mitten im Scan bleiben Livebild bzw. Kacheln bedienbar, nichts wird abgeschnitten, der Scan
bricht nicht ab, die aufgenommenen Seiten bleiben erhalten.
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz:** ______________________________________________

---

## G · Upload und Wiederfinden

### 20 · Upload läuft im Hintergrund
**Was tun:** Einen Scan hochladen und **sofort** in einen anderen Bereich der App wechseln
(z. B. Suche).
**Was muss passieren:** Die App bleibt bedienbar. Es erscheint „Wird hochgeladen …", dann
„Wird verarbeitet …", schließlich der Hinweis **„Dokument hinzugefügt"** mit dem Knopf
„Anzeigen". Der Server braucht für die Texterkennung typischerweise einige Sekunden bis
etwa eine Minute.
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz (Dauer bis „hinzugefügt"):** ______________________________________________

### 21 · Dokument in der App wiederfinden
**Was tun:** Nach dem vergebenen Titel suchen. Dokument öffnen, Vorschau und erkannten Text
ansehen.
**Was muss passieren:** Treffer erscheint, Vorschau zeigt die richtigen Seiten, der erkannte
Text enthält Wörter aus dem Blatt (deutsche Umlaute korrekt). Absender/Dokumentart dürfen
leer sein — die schlägt der Server erst später vor und werden im Posteingang geprüft.
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz:** ______________________________________________

### 22 · Gegenprobe in Paperless selbst
**Was tun:** Im Browser <https://services.frigew.ski/paperless> öffnen, dasselbe Dokument
suchen.
**Was muss passieren:** Dasselbe Dokument, gleiche Seitenzahl, gleicher Titel. Damit ist
belegt, dass die App wirklich in das Archiv geschrieben hat und nicht nur lokal etwas anzeigt.
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz:** ______________________________________________

---

## H · Offline und Funkloch

### 23 · Start im Flugmodus
**Was tun:** Flugmodus einschalten, App über das Symbol starten.
**Was muss passieren:** Die **Oberfläche baut sich auf** (das ist der Zweck des Service
Workers). Beim Laden von Dokumenten erscheint ein **ehrlicher Fehler** — **keine** alten
Dokumente, keine leere Liste, die wie „Archiv ist leer" aussieht. Dokumente werden bewusst
nicht zwischengespeichert.
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz:** ______________________________________________

### 24 · Scannen ohne Netz
**Was tun:** Im Flugmodus einen Scan mit zwei Seiten anlegen und „Hochladen" drücken.
**Was muss passieren:** Eine klare Meldung „Upload fehlgeschlagen: …".
**Besonders genau prüfen:** Sind die **aufgenommenen Seiten danach noch da**, oder ist der
Scan verloren? Nach dem aktuellen Code werden die Seiten beim Absenden verworfen — es gibt
**keine Warteschlange**, die den Upload später nachholt. Wenn die Seiten weg sind, ist das
kein Bedienfehler, sondern ein zu notierender Befund (die Aufnahmen müssten dann wiederholt
werden).
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz (Seiten noch vorhanden? ja/nein):** ______________________________________________

### 25 · Netz kommt mitten im Upload zurück
**Was tun:** Upload starten und **währenddessen** Flugmodus ein- und nach ~10 Sekunden wieder
ausschalten.
**Was muss passieren:** Entweder wird der Upload erkennbar abgeschlossen, oder es erscheint
eine ehrliche Meldung. **Nicht** erlaubt: ein Hinweis „hinzugefügt", ohne dass das Dokument
im Archiv liegt — oder ein Zustand, der ewig auf „Wird verarbeitet …" stehen bleibt.
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz:** ______________________________________________

---

## I · Unterbrechung und Wiederaufnahme

### 26 · App-Wechsel mitten im Scan
**Was tun:** Livebild offen lassen, zu einer anderen App wechseln (Telefonat annehmen, Mail
lesen), nach ~30 Sekunden zurückkommen. Danach dasselbe mit bereits **aufgenommenen** Seiten
(Kachel-Ansicht).
**Was muss passieren:** Nach der Rückkehr entweder ein **wieder laufendes** Livebild oder ein
klarer Weg zurück (Auslöser bedienbar, notfalls „Aus Dateien wählen") — **kein** schwarzes
Standbild, das nichts tut. Aufgenommene Kacheln sind unverändert vorhanden.
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz (Livebild lief weiter? schwarz? Seiten erhalten?):** ______________________________

### 27 · Bildschirm sperren, App aus dem Speicher werfen
**Was tun:** Mit zwei aufgenommenen Seiten den Bildschirm sperren, 2 Minuten warten,
entsperren. Danach die App aus dem App-Umschalter wischen und neu starten.
**Was muss passieren:** Nach dem Entsperren ist der Scan noch da. Nach dem **Beenden** der App
ist er erwartungsgemäß **weg** — ein laufender Scan wird nicht gespeichert. Wichtig ist nur:
die App startet danach sauber, ohne Fehlerbildschirm, und man ist weiterhin angemeldet.
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz:** ______________________________________________

---

## J · Speicher und Akku bei langem Scan

### 28 · Zehn bis fünfzehn Seiten in einem Durchgang
**Was tun:** In einem Scan 10–15 Seiten aufnehmen. Zwischendurch **einmal** von Original auf
Graustufe umschalten (dabei werden **alle** Seiten neu gerechnet). Danach hochladen.
**Was muss passieren:** Die App bleibt bedienbar, wird nicht spürbar langsamer, stürzt nicht
ab und lädt nicht von selbst neu (typisches Zeichen für Speichermangel auf iOS ist ein
plötzlicher Neustart der Seite). Das Umschalten darf dauern, muss aber durchlaufen — alle
Kacheln müssen am Ende wieder scharf und nicht abgedunkelt sein.
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz (ab welcher Seite wurde es langsam? Neustart erlebt?):** ___________________________

### 29 · Wärme, Akku und PDF-Größe
**Was tun:** Nach Punkt 28 den Akkustand vorher/nachher vergleichen und das Gerät anfassen.
Anschließend das hochgeladene PDF in Paperless ansehen: Dateigröße und Lesbarkeit.
**Was muss passieren:** Kein Abschalten wegen Überhitzung. Die Datei sollte für 10–15 Seiten
im Bereich weniger Megabyte liegen (längste Bildkante 2200 Pixel — reichlich für die
Texterkennung) und der Text gut lesbar sein.
**Ergebnis:** ☐ ok  ☐ nicht ok
**Notiz (Akku vorher/nachher, Dateigröße, Wärme):** ________________________________________

---

## Gesamteindruck

Bitte in eigenen Worten, unabhängig von den Häkchen:

- Würdest du mit diesem Scanner deinen Papierstapel abarbeiten? Was fehlt am meisten?
  ______________________________________________________________________
- Der auffälligste Punkt (positiv oder negativ):
  ______________________________________________________________________
- Reicht das achsenparallele Zuschneiden, oder fehlt echte Perspektivkorrektur
  (schräg fotografiertes Blatt geradeziehen)?
  ______________________________________________________________________

---

## Was tun, wenn ein Punkt rot ist

Nicht weiterprobieren, bis es zufällig doch geht — sondern **gleich melden**. Ein Befund mit
Uhrzeit ist nachvollziehbar, ein Befund ohne Uhrzeit oft nicht (die Serverprotokolle lassen
sich nur über die Zeit zuordnen).

**Wohin:** in das übliche Telegram-Topic für Paperless (Topic 208) oder als Notiz direkt in
dieser Datei bei dem betroffenen Punkt. Beides ist in Ordnung — Hauptsache, es geht nicht
verloren.

**Was dazugehört (bitte vollständig, das erspart Rückfragen):**

1. **Nummer des Prüfpunkts** aus dieser Liste (z. B. „Punkt 18 rot").
2. **Uhrzeit** möglichst auf die Minute — daran hängt die Zuordnung im Protokoll
   (`/opt/paperless/data/log/paperless.log`).
3. **Gerät, Betriebssystem und Browser mit Version** (aus der Tabelle oben — einmal ausfüllen
   genügt für den ganzen Durchlauf).
4. **Was du getan hast** und **was stattdessen passiert ist** — beides in je einem Satz.
   „Auslöser gedrückt, nichts passierte" ist brauchbar; „geht nicht" nicht.
5. **Screenshot oder kurzes Video.** Bei Fehlermeldungen den **ganzen** Meldungstext im Bild,
   nicht abgeschnitten. Beim Scanner ist ein Video oft aussagekräftiger als ein Standbild.
6. **Wortlaut der Meldung**, falls lesbar, zusätzlich als Text — Text ist suchbar, ein Bild
   nicht.
7. **Reproduzierbar?** Zweimal versucht: beide Male gleich, oder nur einmal aufgetreten?
   Sporadische Fehler sind schwerer zu finden — das zu wissen ist deshalb besonders wertvoll.
8. Falls möglich: **Titel des betroffenen Dokuments** oder seine Nummer, damit es im Archiv
   auffindbar ist.

**Nicht mitschicken:** Passwörter, Zwei-Faktor-Codes, Zugangsschlüssel/Token. Falls ein
Screenshot versehentlich einen Token zeigt (Anmeldeschirm im Token-Modus), bitte
unkenntlich machen oder das Bild weglassen.

**Wenn Dokumente betroffen sind** (z. B. ein Testdokument liegt doppelt im Archiv oder im
Papierkorb): bitte **nicht selbst aufräumen**, nur melden. Dokumente sind echte Nutzdaten;
Löschen passiert nur mit frischem Backup und Sichtprüfung.
