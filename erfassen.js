// Erfassen: wie ein Dokument in das Archiv hineinkommt.
//
// Ein Sachgebiet fuer sich, und deshalb eine Datei fuer sich. Es haengt an
// zwei Dingen: am Dateidialog des Systems und an POST /api/documents/
// post_document. Es liest keine Dokumentliste, keinen Filter, keine Suche und
// keinen Cache - der einzige Weg zurueck in den Bestand ist reloadDocs() am
// Ende eines Uploads, wenn tatsaechlich etwas Neues da ist.
//
// Umgekehrt ruft aus dem uebrigen app.js auch nichts hier herein: die
// Bildschirme greifen ueber valsErfassen und valsNavigation zu, also ueber v,
// wie alle anderen auch.
//
// Warum als Aufsatz auf die Klasse und nicht als eigener Dienst mit eigenem
// Zustand? Aus demselben Grund wie bei mitglieder.js: der Zustand gehoert
// React. Ein zweiter Halter daneben muesste jede Aenderung selbst
// weitermelden. Stattdessen bleibt der Zustand in setState, und diese Datei
// liefert die Startwerte (start) und die Methoden (methoden), die app.js an
// den Prototyp haengt. Aufrufer merken davon nichts, this ist dasselbe.
//
// Was hier ausdruecklich NICHT steht: das Erzeugen des PDF. Das ist reine
// Rechnerei ohne Zustand und steht in scan.js (DWScan) - hier steht nur, wann
// sie angestossen wird und was mit dem Ergebnis geschieht.
(function (global) {
  'use strict';

  // Was der Server annimmt.
  //
  // Es gab hier einmal zwei Wege, "Foto" und "Datei". Die Trennung liess sich
  // nicht durchhalten: eine Seite kann dem System nur mitteilen, WELCHE Typen
  // sie annimmt - welche Quellen es daraufhin anbietet, entscheidet es selbst.
  // Auf Android standen deshalb auch hinter "Foto" die Dateien und Google
  // Drive. Ein Foto-Picker laesst sich aus dem Web nicht anfordern, den koennen
  // nur native Apps. Zwei Eintraege, die dieselbe Auswahl oeffnen, sind aber
  // keine zwei Wege, sondern ein Versprechen, das das System nicht haelt -
  // also ist es jetzt einer.
  //
  // Die Liste stammt aus dem, was diese Instanz tatsaechlich verarbeitet
  // (documents.parsers.get_supported_file_extensions); Office-Formate sind
  // dabei, weil Tika und Gotenberg laufen.
  const DOKUMENT_TYPEN = 'image/*,.pdf,.txt,.csv,.rtf,.eml,.doc,.docx,.odt,.xls,.xlsx,'
                       + '.ods,.ppt,.pptx,.odp,.odg,application/pdf,text/plain';

  // Wie oft nach dem Verarbeitungsstand gefragt wird, bevor aufgegeben wird.
  const VERSUCHE = 40;

  // Kleinster Zuschnitt, als Anteil der Bildkante. Verhindert einen Rahmen
  // ohne Flaeche, aus dem sich kein Bild mehr schneiden liesse.
  const ZUSCHNITT_MIN = 0.08;

  // --- Auto-Ausloeser (ADR 0005, Phase 5) ----------------------------------
  //
  // Die fruehere Baseline (v0.8.11) beobachtete nur, ob videoWidth/videoHeight/
  // readyState eines Videobildes ein paar Ticks lang gleich blieben - das ist
  // keine Dokument-, sondern eine reine Signalpruefung und feuert praktisch
  // sofort, egal ob ueberhaupt Papier im Bild ist. Diese Fassung nutzt den in
  // Phase 4 gebauten Randvorschlag (DWScan.randSchaetzen) auf einem kleinen,
  // regelmaessig aus dem <video> gezogenen Standbild: es zaehlt, wie oft in
  // Folge ein *aehnlicher* Rand gefunden wird - das ist der Unterschied
  // zwischen "das Bild aendert sich nicht" und "hier liegt vermutlich ein
  // Dokument, und es haelt still".
  //
  // Kantenlaenge des Beobachtungsbilds. Klein und bewusst nicht mit der vollen
  // Kameraaufloesung: der Ausloeser braucht nur eine grobe Flaechenschaetzung
  // alle 350ms, keine hochaufgeloeste Analyse - die eigentliche Aufnahme
  // verwendet weiterhin die volle Videoaufloesung (scanKameraAufnehmen).
  const AUTO_BEOB_KANTE = 260;
  // So oft in Folge muss ein aehnlicher Rand gefunden werden, bevor ausgeloest
  // wird (bei 350ms Taktung sind das rund 1 Sekunde ruhiges Halten).
  const AUTO_STABIL_N = 3;
  // Wird in dieser Anzahl Takte in Folge gar kein Rand gefunden (z. B.
  // gemusterter Hintergrund, randloses Motiv, schwaches Licht), wird trotzdem
  // ausgeloest - sonst bliebe der Auto-Ausloeser fuer manche Motive auf ewig
  // stumm, was schlechter waere als eine Aufnahme ohne Kantenvorschlag.
  const AUTO_OHNE_RAND_N = 9;
  // Erlaubte Abweichung je Randkoordinate (Anteil der Bildkante), damit ein
  // minimal zitterndes Kamerabild nicht als "kein stabiler Rand" gilt.
  const AUTO_RAND_EPS = 0.035;

  // Zwei Randvorschlaege als "im Wesentlichen gleich" werten, wenn keine
  // ihrer vier Koordinaten mehr als AUTO_RAND_EPS voneinander abweicht.
  function randAehnlich(a, b) {
    if (!a || !b) return false;
    return Math.abs(a.x0 - b.x0) <= AUTO_RAND_EPS
        && Math.abs(a.y0 - b.y0) <= AUTO_RAND_EPS
        && Math.abs(a.x1 - b.x1) <= AUTO_RAND_EPS
        && Math.abs(a.y1 - b.y1) <= AUTO_RAND_EPS;
  }

  // Der Zustand dieses Sachgebiets, an einer Stelle statt verstreut im
  // Konstruktor.
  //
  //   scan       der laufende Scan: Schritt, Seiten, Zuschnitt-Rahmen
  //   scanTitle  der Titel, den der Scan-Bildschirm anbietet
  //   uploads    was gerade hochgeladen oder verarbeitet wird
  function start() {
    return { scan: null, scanTitle: '', uploads: [] };
  }
  // _scanStream (der aktive MediaStream) liegt bewusst nicht in setState:
  // ein Stream-Objekt ist kein darstellbarer Zustand, sondern eine
  // Handle - React soll bei seiner blossen Existenz nicht neu rendern.

  // --- Scannen ------------------------------------------------------------
  //
  // Ein Scan ist eine Liste von Seiten, die am Ende zu einem PDF wird. Jede
  // Seite haelt ihre Aufnahme unveraendert fest; Drehung und Zuschnitt sind
  // Angaben, die bei jeder Aenderung neu auf das Original angewendet werden.
  // Dadurch verliert dreimal Drehen nichts an Qualitaet, und ein Zuschnitt
  // laesst sich zurueckziehen, ohne dass etwas fehlt.
  var methoden = {

    // Live-Kamera-Vorschau versuchen, sonst direkt den Dateidialog.
    //
    // Reihenfolge der Faehigkeitspruefung: kein sicherer Kontext/keine API ->
    // sofort der Dateidialog, kein Zwischenschritt. Ist die API da, wird die
    // Vorschau geoeffnet; verweigert der Nutzer die Berechtigung oder schlaegt
    // der Aufruf fehl, faellt scanKameraFehler auf denselben Dateidialog
    // zurueck. Der Dateidialog bleibt so in jedem Fall erreichbar.
    scanOeffnen() {
      // modus/kontrast gelten fuer den ganzen Scan, nicht pro Seite - wie
      // bei Swift Paperless. 'original' aendert kein Pixel; Aenderungen sind
      // jederzeit umkehrbar, weil scanRendern immer vom unveraenderten
      // Original (sei.quelle) neu rechnet.
      this.setState({ sheet: null, scan: { schritt: 'seiten', seiten: [], zId: null, zRect: null, busy: false, modus: 'original', autoCapture: true, autoStatus: 'Auto-Auslöser bereit.' } });
      if (global.DWLogik.kameraNutzbar(global.navigator, global)) {
        this.scanKameraOeffnen();
      } else {
        this.scanAufnehmen();
      }
    },

    // Startet die Live-Vorschau. Bei jedem Fehler (Berechtigung verweigert,
    // keine Kamera gefunden, Geraet belegt …) wird sofort und ohne weitere
    // Nutzerinteraktion auf den bestehenden Systemdialog zurueckgefallen -
    // das ist keine Sackgasse, sondern der vorgesehene Normalfall auf dem
    // Rechner und ein Sicherheitsnetz auf dem Telefon.
    scanKameraOeffnen() {
      global.navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      }).then(stream => {
        this._scanStream = stream;
        this.setState(st => (st.scan ? { scan: { ...st.scan, kamera: true, kameraFehler: '', autoStatus: st.scan.autoCapture ? 'Auto-Auslöser sucht Dokumentkanten …' : 'Auto-Auslöser ist aus.' } } : {}));
      }).catch(e => {
        this.scanKameraFehler(e);
      });
    },

    // Kamera meldet einen Fehler oder wurde verweigert: kurzer Hinweis, dann
    // sofort der bestehende Dateidialog - kein Bedienweg geht verloren.
    scanKameraFehler(e) {
      this.scanKameraSchliessen();
      const grund = e && e.name === 'NotAllowedError'
        ? 'Kamerazugriff verweigert.'
        : (e && e.name === 'NotFoundError' ? 'Keine Kamera gefunden.' : 'Kamera nicht verfuegbar.');
      this.note(grund + ' Dateiauswahl wird geoeffnet.');
      this.scanAufnehmen();
    },

    // Stream sauber freigeben - sonst zeigt das System weiter das
    // Kamera-Aktiv-Symbol an, obwohl die Vorschau laengst geschlossen ist.
    scanKameraSchliessen() {
      if (this._scanStream) {
        this._scanStream.getTracks().forEach(t => { try { t.stop(); } catch (e) { /* bereits beendet */ } });
        this._scanStream = null;
      }
      this.scanAutoStoppen();
      this.setState(st => (st.scan ? { scan: { ...st.scan, kamera: false } } : {}));
    },

    scanAutoStoppen() {
      if (this._scanAutoTimer) {
        clearInterval(this._scanAutoTimer);
        this._scanAutoTimer = null;
      }
      this._scanAutoLetzte = null;
      this._scanAutoBusy = false;
    },

    scanAutoUmschalten() {
      this.setState(st => {
        if (!st.scan) return {};
        const an = !st.scan.autoCapture;
        return { scan: { ...st.scan, autoCapture: an, autoStatus: an ? 'Auto-Auslöser sucht Dokumentkanten …' : 'Auto-Auslöser ist aus.' } };
      }, () => {
        if (this.state.scan && this.state.scan.autoCapture && this._scanVideoEl) this.scanAutoBeobachten(this._scanVideoEl);
        else this.scanAutoStoppen();
      });
    },

    // Beobachtet die Live-Vorschau alle 350ms und zieht dabei ein kleines
    // Standbild, das DWScan.randSchaetzen (Phase 4) auf einen moeglichen
    // Dokumentrand hin untersucht. Ausgeloest wird, sobald derselbe Rand
    // AUTO_STABIL_N mal in Folge wiederkehrt (das Dokument liegt ruhig und
    // ist erkennbar) - oder nach AUTO_OHNE_RAND_N Takten ganz ohne Randfund,
    // damit ein Motiv ohne klaren Kontrast (z. B. randlos fotografiert) den
    // Ausloeser nicht dauerhaft blockiert. this._scanAutoBusy verhindert,
    // dass sich zwei Auswertungen ueberlappen, falls eine einzelne laenger
    // braeuchte als der 350ms-Takt.
    scanAutoBeobachten(video) {
      if (!video || this._scanAutoTimer || !(this.state.scan && this.state.scan.autoCapture)) return;
      this._scanAutoLetzte = { box: null, nStabil: 0, nOhneRand: 0 };
      this._scanAutoBusy = false;
      this._scanAutoTimer = setInterval(() => {
        const sc = this.state.scan;
        if (!sc || !sc.kamera || !sc.autoCapture) { this.scanAutoStoppen(); return; }
        if (this._scanAutoBusy) return;
        const w = video.videoWidth || video.clientWidth || 0, h = video.videoHeight || video.clientHeight || 0;
        if (!w || !h) {
          this.setState(st => (st.scan ? { scan: { ...st.scan, autoStatus: 'Auto-Auslöser wartet auf das Kamerabild.' } } : {}));
          return;
        }
        this._scanAutoBusy = true;
        const f = Math.min(1, AUTO_BEOB_KANTE / Math.max(w, h));
        const cw = Math.max(1, Math.round(w * f)), ch = Math.max(1, Math.round(h * f));
        let c;
        try {
          c = global.document.createElement('canvas');
          c.width = cw; c.height = ch;
          c.getContext('2d').drawImage(video, 0, 0, cw, ch);
        } catch (fehler) {
          // Manche Geraete/WebViews liefern kurzzeitig ein Videobild, das sich
          // noch nicht zeichnen laesst (z. B. unmittelbar nach dem Start) -
          // ein einzelner uebersprungener Takt ist kein Fehlerfall.
          this._scanAutoBusy = false;
          return;
        }
        global.DWScan.randSchaetzen(c).then(box => {
          const st0 = this._scanAutoLetzte;
          if (!st0) return; // Beobachtung wurde inzwischen gestoppt
          const stabil = randAehnlich(box, st0.box);
          st0.nStabil = box && stabil ? st0.nStabil + 1 : (box ? 1 : 0);
          st0.nOhneRand = box ? 0 : st0.nOhneRand + 1;
          st0.box = box;

          const feuern = (hinweis) => {
            this.scanAutoStoppen();
            this.setState(sst => (sst.scan ? { scan: { ...sst.scan, autoCapture: false, autoStatus: hinweis } } : {}));
            this.scanKameraAufnehmen(video);
            this.scanKameraSchliessen();
          };

          if (box && st0.nStabil >= AUTO_STABIL_N) {
            feuern('Dokument erkannt, Aufnahme läuft.');
          } else if (!box && st0.nOhneRand >= AUTO_OHNE_RAND_N) {
            feuern('Kein Dokumentrand erkannt, Aufnahme läuft.');
          } else if (box) {
            this.setState(sst => (sst.scan ? { scan: { ...sst.scan, autoStatus: 'Dokument erkannt, bitte ruhig halten …' } } : {}));
          } else {
            this.setState(sst => (sst.scan ? { scan: { ...sst.scan, autoStatus: 'Auto-Auslöser sucht Dokumentkanten …' } } : {}));
          }
        }).catch(() => { /* Heuristik optional, kein harter Fehler */ }).then(() => { this._scanAutoBusy = false; });
      }, 350);
    },

    // Ein Bild aus dem laufenden <video> in ein Foto verwandeln - dieselbe
    // Weiterverarbeitung (scanAufnahmen) wie beim Dateidialog, damit keine
    // zweite Pipeline entsteht.
    scanKameraAufnehmen(video) {
      if (!video) return;
      const breite = video.videoWidth || video.clientWidth || 0;
      const hoehe = video.videoHeight || video.clientHeight || 0;
      if (!breite || !hoehe) return;
      const c = global.document.createElement('canvas');
      c.width = breite; c.height = hoehe;
      const g = c.getContext('2d');
      g.drawImage(video, 0, 0, c.width, c.height);
      c.toBlob(blob => {
        if (!blob) { this.note('Aufnahme fehlgeschlagen.'); return; }
        this.scanAufnahmen([blob]);
      }, 'image/jpeg', 0.92);
    },

    // Zum Dateidialog wechseln, ohne den Scan-Vorgang abzubrechen - z. B. der
    // "Datei"-Weg innerhalb der Live-Vorschau.
    scanZuDatei() {
      this.scanKameraSchliessen();
      this.scanAufnehmen();
    },

    // Der Dateidialog des Systems.
    //
    // Das Feld haengt kurz im Dokument, weil manche Browser an einem losgeloesten
    // Element kein change melden, und verschwindet danach wieder. Abgebrochen
    // wird mit einer leeren Liste beantwortet - dafuer gibt es seit kurzem das
    // cancel-Ereignis; wo es fehlt, bleibt die Zusage offen, und das ist
    // richtig: dann ist auch nichts passiert.
    dateiDialog(opt) {
      return new Promise(fertig => {
        const feld = document.createElement('input');
        feld.type = 'file';
        feld.accept = opt.accept;
        if (opt.mehrere) feld.multiple = true;
        // capture="environment" bittet ein Telefon um die rueckwaertige Kamera.
        // Auf dem Rechner kennt der Browser das Attribut nicht und oeffnet den
        // gewohnten Dialog - beides ist richtig, es braucht keine Weiche.
        if (opt.kamera) feld.setAttribute('capture', 'environment');
        // Nicht display:none. Safari oeffnet den Dialog fuer ein so verstecktes
        // Feld nicht, wenn der Klick aus dem Code kommt - das Feld muss
        // dargestellt werden, nur eben ausserhalb des Sichtbaren.
        feld.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none';
        document.body.appendChild(feld);
        const schliessen = (dateien) => {
          if (feld.parentNode) document.body.removeChild(feld);
          fertig(dateien);
        };
        feld.onchange = () => schliessen(Array.from(feld.files || []));
        feld.oncancel = () => schliessen([]);
        feld.click();
      });
    },

    // Fertige Dateien abgeben - ein Foto aus der Mediathek, eine PDF vom Geraet.
    //
    // Bewusst ohne Nachbearbeitung: wer eine fertige Datei hat, will sie
    // abgeben, nicht bearbeiten. Zuschneiden, Drehen und mehrere Seiten zu
    // einem Dokument zusammenfassen macht "Scannen" (siehe scanOeffnen).
    dateiWaehlen(accept, mehrere, meta) {
      return this.dateiDialog({ accept: accept, mehrere: mehrere }).then(dateien => {
        if (!dateien.length) { this.setState({ sheet: null }); return; }
        dateien.forEach(d => this.uploadDatei(d, meta || {}));
      });
    },

    // Der Weg "Datei hochladen" aus der Knopfleiste. Mehrere sind erlaubt: jede
    // Datei wird ein eigenes Dokument - anders als beim Scannen, wo mehrere
    // Aufnahmen zu einem PDF werden. Welche Typen der Server annimmt, steht in
    // dieser Datei und bleibt damit beim Sachgebiet, das es angeht.
    dokumentWaehlen(meta) {
      return this.dateiWaehlen(DOKUMENT_TYPEN, true, meta);
    },

    scanAufnehmen() {
      return this.dateiDialog({ accept: 'image/*', mehrere: true, kamera: true }).then(dateien => {
        if (dateien.length) this.scanAufnahmen(dateien);
        // Nichts aufgenommen und noch keine Seite da: der Scan-Bildschirm haette
        // nichts zu zeigen.
        else if (!(this.state.scan && this.state.scan.seiten.length)) this.setState({ scan: null });
      });
    },

    scanAufnahmen(dateien) {
      this.setState(st => ({ scan: { ...(st.scan || { schritt: 'seiten', seiten: [], modus: 'original', kontrast: 1, helligkeit: 0 }), busy: true } }));
      const neue = dateien.map(d => ({ id: 's' + (this.scanZaehler = (this.scanZaehler || 0) + 1), datei: d, dreh: 0, zuschnitt: null }));
      const verst = this.scanVerstaerkung();
      return Promise.all(neue.map(sei => this.scanRendern(sei, verst)))
        .then(fertig => {
          this.setState(st => (st.scan ? { scan: { ...st.scan, seiten: [...st.scan.seiten, ...fertig], busy: false } } : {}));
          // Unschaerfe-Hinweis je Aufnahme, nicht blockierend: eine grobe
          // Heuristik soll nie eine gute Aufnahme verhindern, nur auf eine
          // schlechte hinweisen (siehe ADR 0005, Phase 3).
          fertig.forEach(sei => {
            global.DWScan.schaerfeMass(sei.datei).then(mass => {
              if (mass < global.DWScan.SCHAERFE_SCHWELLE) {
                this.note('Seite ' + (this.scanSeitenNr(sei.id)) + ' wirkt unscharf. Nochmal aufnehmen?');
              }
            }).catch(() => { /* Heuristik optional, kein harter Fehler */ });
          });
        })
        .catch(e => {
          this.setState(st => (st.scan ? { scan: { ...st.scan, busy: false } } : {}));
          this.note('Aufnahme nicht verwendbar: ' + e.message);
        });
    },

    scanSeitenNr(id) {
      const liste = (this.state.scan && this.state.scan.seiten) || [];
      const i = liste.findIndex(x => x.id === id);
      return i >= 0 ? i + 1 : '?';
    },

    // Drehung und Zuschnitt auf das Original anwenden und daraus das Bild
    // machen, das spaeter im PDF landet.
    scanRendern(sei, verst) {
      const v = verst || this.scanVerstaerkung();
      return global.DWScan.seiteAus(sei.datei, { dreh: sei.dreh, zuschnitt: sei.zuschnitt, modus: v.modus, kontrast: v.kontrast, helligkeit: v.helligkeit })
        .then(erg => {
          if (sei.url) URL.revokeObjectURL(sei.url);
          return { ...sei, jpeg: erg.jpeg, breite: erg.breite, hoehe: erg.hoehe, url: URL.createObjectURL(erg.blob) };
        });
    },

    scanErsetzen(id, aendern) {
      const sei = (this.state.scan.seiten || []).find(x => x.id === id);
      if (!sei) return;
      const naechste = aendern(sei);
      this.setState(st => ({ scan: { ...st.scan, seiten: st.scan.seiten.map(x => x.id === id ? { ...x, busy: true } : x) } }));
      this.scanRendern(naechste)
        .then(fertig => this.setState(st => (st.scan
          ? { scan: { ...st.scan, seiten: st.scan.seiten.map(x => x.id === id ? { ...fertig, busy: false } : x) } }
          : {})))
        .catch(e => {
          this.setState(st => (st.scan ? { scan: { ...st.scan, seiten: st.scan.seiten.map(x => x.id === id ? { ...x, busy: false } : x) } } : {}));
          this.note('Nicht geändert: ' + e.message);
        });
    },

    scanDrehen(id) { this.scanErsetzen(id, sei => ({ ...sei, dreh: (sei.dreh + 90) % 360 })); },

    // Aktuelle Bildverstaerkung (Modus, Kontrast, Helligkeit) fuer den
    // gesamten Scan - gilt fuer alle Seiten gleich, siehe scanAlleNeuRendern.
    scanVerstaerkung() {
      const sc = this.state.scan || {};
      return {
        modus: sc.modus || 'original',
        kontrast: typeof sc.kontrast === 'number' ? sc.kontrast : 1,
        helligkeit: typeof sc.helligkeit === 'number' ? sc.helligkeit : 0,
      };
    },

    // Modus (Original/Graustufe) fuer den gesamten Scan umschalten. Alle
    // bereits aufgenommenen Seiten werden neu aus ihrem unveraenderten
    // Original gerendert - nichts geht verloren, der Wechsel ist umkehrbar.
    scanModusSetzen(modus) {
      this.setState(st => (st.scan ? { scan: { ...st.scan, modus: modus } } : {}));
      this.scanAlleNeuRendern({ modus: modus });
    },

    // Kontrast/Helligkeit aendern sich per Schieberegler, oft mehrfach kurz
    // hintereinander - ein leichtes Debounce vermeidet, dass jede Rasterstufe
    // sofort eine teure Neu-Rechnung aller Seiten ausloest.
    scanKontrastSetzen(kontrast) {
      this.setState(st => (st.scan ? { scan: { ...st.scan, kontrast: kontrast } } : {}));
      clearTimeout(this._scanVerstTimer);
      this._scanVerstTimer = setTimeout(() => this.scanAlleNeuRendern({ kontrast: kontrast }), 180);
    },

    scanHelligkeitSetzen(helligkeit) {
      this.setState(st => (st.scan ? { scan: { ...st.scan, helligkeit: helligkeit } } : {}));
      clearTimeout(this._scanVerstTimer);
      this._scanVerstTimer = setTimeout(() => this.scanAlleNeuRendern({ helligkeit: helligkeit }), 180);
    },

    // Gemeinsamer Weg fuer Modus/Kontrast/Helligkeit: alle Seiten aus ihrem
    // unveraenderten Original neu rendern, nichts geht verloren.
    scanAlleNeuRendern(patch) {
      const verst = { ...this.scanVerstaerkung(), ...patch };
      const seiten = (this.state.scan && this.state.scan.seiten) || [];
      seiten.forEach(sei => {
        this.setState(st => ({ scan: { ...st.scan, seiten: st.scan.seiten.map(x => x.id === sei.id ? { ...x, busy: true } : x) } }));
        this.scanRendern(sei, verst)
          .then(fertig => this.setState(st => (st.scan
            ? { scan: { ...st.scan, seiten: st.scan.seiten.map(x => x.id === sei.id ? { ...fertig, busy: false } : x) } }
            : {})))
          .catch(e => this.setState(st => (st.scan ? { scan: { ...st.scan, seiten: st.scan.seiten.map(x => x.id === sei.id ? { ...x, busy: false } : x) } } : {})));
      });
    },

    scanEntfernen(id) {
      this.setState(st => {
        if (!st.scan) return {};
        const weg = st.scan.seiten.find(x => x.id === id);
        if (weg && weg.url) URL.revokeObjectURL(weg.url);
        return { scan: { ...st.scan, seiten: st.scan.seiten.filter(x => x.id !== id) } };
      });
    },

    scanSchieben(id, um) {
      this.setState(st => {
        if (!st.scan) return {};
        const liste = st.scan.seiten.slice();
        const i = liste.findIndex(x => x.id === id);
        const j = i + um;
        if (i < 0 || j < 0 || j >= liste.length) return {};
        liste[i] = liste[j];
        liste[j] = st.scan.seiten[i];
        return { scan: { ...st.scan, seiten: liste } };
      });
    },

    // Die Seite, die gerade zugeschnitten wird.
    zSeite() {
      const sc = this.state.scan;
      return sc && sc.zId ? (sc.seiten.find(x => x.id === sc.zId) || null) : null;
    },

    scanZuschnittOeffnen(id) {
      const sei = (this.state.scan.seiten || []).find(x => x.id === id);
      if (!sei) return;
      // Der Rahmen bezieht sich auf das *angezeigte* Bild, das schon gedreht und
      // zugeschnitten ist. Er startet deshalb immer bei ganz, nicht beim
      // vorherigen Zuschnitt - der steckt bereits im Bild.
      this.setState(st => ({ scan: { ...st.scan, schritt: 'zuschnitt', zId: id, zRect: { x0: 0, y0: 0, x1: 1, y1: 1 } } }));
      // Automatischer Vorschlag als *Zusatz*, nicht als Ersatz: kommt er
      // rechtzeitig zurueck und der Zuschnitt-Bildschirm ist noch derselben
      // Seite geoeffnet, ersetzt er den vollen Rahmen. Jederzeit per "Ganz"
      // wieder aufhebbar (siehe zZuruecksetzen in der Vorlage), also nie eine
      // Sackgasse (ADR 0005, Phase 4).
      global.DWScan.randSchaetzen(sei.datei).then(r => {
        if (!r) return;
        this.setState(st => (st.scan && st.scan.zId === id
          ? { scan: { ...st.scan, zRect: r } }
          : {}));
      }).catch(() => { /* Heuristik optional, kein harter Fehler */ });
    },

    // Welcher Griff gerade gefasst ist, steht als this.zGriff neben dem Zustand
    // und nicht darin: er aendert nichts am Bild und soll zwischen zwei
    // Zeigerereignissen kein erneutes Zeichnen ausloesen.
    //
    // setPointerCapture haelt die Bewegung beim Griff fest, auch wenn der
    // Finger den kleinen Kreis verlaesst - ohne das reisst das Ziehen ab,
    // sobald man schneller zieht, als das Bild folgt.
    zGriffFassen(ecke, e) {
      this.zGriff = ecke;
      if (e.currentTarget.setPointerCapture) {
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch (f) { /* aeltere Browser */ }
      }
    },

    zLoslassen() { this.zGriff = null; },

    zStatusText(r) {
      const p = n => Math.round(Math.max(0, Math.min(1, n)) * 100);
      return 'Zuschnitt: links ' + p(r.x0) + ' Prozent, oben ' + p(r.y0) + ' Prozent, rechts ' + p(r.x1) + ' Prozent, unten ' + p(r.y1) + ' Prozent.';
    },

    // Tastaturweg fuer denselben Zuschnitt: Pfeiltasten verschieben die
    // fokussierte Ecke in kleinen, mit Shift in groesseren Schritten. Das
    // ergaenzt Pointer-Bedienung, damit der Scanner nicht nur per Touch/Maus
    // nutzbar ist.
    zGriffTaste(ecke, e) {
      const tasten = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      const richtung = tasten[e.key];
      if (!richtung) return;
      e.preventDefault();
      const schritt = e.shiftKey ? 0.05 : 0.01;
      this.setState(st => {
        if (!st.scan || !st.scan.zRect) return {};
        const r = { ...st.scan.zRect };
        const dx = richtung[0] * schritt;
        const dy = richtung[1] * schritt;
        if (ecke[0] === 'l') r.x0 = Math.min(Math.max(0, r.x0 + dx), r.x1 - ZUSCHNITT_MIN);
        else r.x1 = Math.max(Math.min(1, r.x1 + dx), r.x0 + ZUSCHNITT_MIN);
        if (ecke[1] === 'o') r.y0 = Math.min(Math.max(0, r.y0 + dy), r.y1 - ZUSCHNITT_MIN);
        else r.y1 = Math.max(Math.min(1, r.y1 + dy), r.y0 + ZUSCHNITT_MIN);
        return { scan: { ...st.scan, zRect: r } };
      });
    },

    // Ein Griff wurde gefasst und bewegt. Gerechnet wird in Anteilen der
    // Bildkante, damit die Angabe von der Anzeigegroesse unabhaengig bleibt.
    zZiehen(e) {
      if (!this.zGriff) return;
      const kasten = e.currentTarget.getBoundingClientRect();
      if (!kasten.width || !kasten.height) return;
      const x = Math.min(1, Math.max(0, (e.clientX - kasten.left) / kasten.width));
      const y = Math.min(1, Math.max(0, (e.clientY - kasten.top) / kasten.height));
      this.setState(st => {
        if (!st.scan || !st.scan.zRect) return {};
        const r = { ...st.scan.zRect };
        if (this.zGriff[0] === 'l') r.x0 = Math.min(x, r.x1 - ZUSCHNITT_MIN);
        else r.x1 = Math.max(x, r.x0 + ZUSCHNITT_MIN);
        if (this.zGriff[1] === 'o') r.y0 = Math.min(y, r.y1 - ZUSCHNITT_MIN);
        else r.y1 = Math.max(y, r.y0 + ZUSCHNITT_MIN);
        return { scan: { ...st.scan, zRect: r } };
      });
    },

    scanZuschnittSichern() {
      const sc = this.state.scan;
      const r = sc && sc.zRect;
      const id = sc && sc.zId;
      if (!id || !r) return;
      this.setState(st => ({ scan: { ...st.scan, schritt: 'seiten', zId: null, zRect: null } }));
      if (r.x0 <= 0.001 && r.y0 <= 0.001 && r.x1 >= 0.999 && r.y1 >= 0.999) return;
      // Der Rahmen gilt fuer das angezeigte Bild. Dieses wird deshalb zur neuen
      // Aufnahme der Seite - sonst muesste der Anteil durch Drehung und
      // frueheren Zuschnitt zurueckgerechnet werden, was bei jedem Schritt
      // ungenauer wird.
      const sei = sc.seiten.find(x => x.id === id);
      if (!sei) return;
      fetch(sei.url).then(a => a.blob()).then(blob => {
        this.scanErsetzen(id, alt => ({ ...alt, datei: blob, dreh: 0, zuschnitt: r }));
      }).catch(e => this.note('Zuschnitt fehlgeschlagen: ' + e.message));
    },

    scanAbbrechen() {
      this.scanKameraSchliessen();
      const sc = this.state.scan;
      if (sc) sc.seiten.forEach(x => { if (x.url) URL.revokeObjectURL(x.url); });
      this.setState({ scan: null, scanTitle: '' });
    },

    scanHochladen() {
      const sc = this.state.scan;
      if (!sc || !sc.seiten.length) return;
      const titel = (this.state.scanTitle || '').trim();
      let datei;
      try {
        datei = global.DWScan.datei(sc.seiten, (titel || 'Scan') + '.pdf');
      } catch (e) {
        this.note('PDF nicht erzeugt: ' + e.message);
        return;
      }
      sc.seiten.forEach(x => { if (x.url) URL.revokeObjectURL(x.url); });
      this.uploadDatei(datei, titel ? { title: titel } : {});
    },

    // --- Hochladen --------------------------------------------------------
    //
    // Der Server nimmt die Datei entgegen, verarbeitet sie asynchron und
    // liefert dafuer eine Aufgaben-Kennung zurueck.
    uploadDatei(file, meta) {
      const A = this.api();
      const uid = 'u' + Date.now() + Math.random().toString(36).slice(2, 6);
      this.setState(s => ({ sheet: null, scan: null, uploads: [...s.uploads, { id: uid, name: file.name, st: 'Wird hochgeladen …' }] }));

      return A.documents.upload(file, meta || {})
        .then(taskId => {
          this.setState(s => ({ uploads: s.uploads.map(u => u.id === uid ? Object.assign({}, u, { st: 'Wird verarbeitet …', task: taskId }) : u) }));
          this.wartAufVerarbeitung(uid, taskId, 0);
        })
        .catch(e => {
          this.setState(s => ({ uploads: s.uploads.filter(u => u.id !== uid) }));
          this.note('Upload fehlgeschlagen: ' + e.message);
        });
    },

    // Verfolgt die Verarbeitung ueber /tasks/?task_id=… .
    //
    // Frueher wurde stattdessen verglichen, ob die Dokumentenliste laenger
    // geworden ist. Das war schon bei einer vollen Seite falsch (die Laenge
    // aendert sich dann nie) und konnte einen Fehlschlag nicht von "dauert noch"
    // unterscheiden. Der Server weiss beides genau.
    wartAufVerarbeitung(uid, taskId, versuch) {
      const A = this.api();
      const fertig = (meldung, dokId) => {
        this.setState(s => ({ uploads: s.uploads.filter(u => u.id !== uid) }));
        this.reloadDocs().then(() => {
          this.note(meldung, dokId ? () => this.openDoc(dokId) : null, 'Anzeigen');
        });
      };

      // Ohne Kennung (aeltere Server) bleibt nur, nach kurzer Zeit nachzuladen.
      if (!taskId) {
        this.later(() => fertig('Dokument hochgeladen'), 4000);
        return;
      }

      this.later(() => {
        A.tasks({ task_id: taskId }).then(d => {
          const roh = Array.isArray(d) ? d : (d.results || []);
          const t = roh[0];
          const st = t ? String(t.status || '').toLowerCase() : '';

          if (st === 'success') {
            const ids = t.related_document_ids || [];
            fertig('Dokument hinzugefügt', ids.length ? ids[0] : null);
            return;
          }
          if (st === 'failure') {
            this.setState(s => ({ uploads: s.uploads.filter(u => u.id !== uid) }));
            const grund = typeof t.result === 'string' ? t.result
                        : (t.result_data && (t.result_data.error || t.result_data.result)) || '';
            this.note('Verarbeitung fehlgeschlagen: ' + (String(grund).split('\n')[0].slice(0, 140) || 'Der Server hat die Datei abgelehnt.'));
            return;
          }
          if (versuch >= VERSUCHE) {
            this.setState(s => ({ uploads: s.uploads.filter(u => u.id !== uid) }));
            this.note('Das Dokument wird noch verarbeitet. Es erscheint, sobald der Server fertig ist.');
            this.reloadDocs();
            return;
          }
          this.wartAufVerarbeitung(uid, taskId, versuch + 1);
        }).catch(() => {
          // Netzwerkfehler beim Nachfragen sollen den Upload nicht als
          // gescheitert darstellen - er laeuft auf dem Server weiter.
          if (versuch >= VERSUCHE) { fertig('Upload abgeschlossen. Der Verarbeitungsstand liess sich nicht abfragen.'); return; }
          this.wartAufVerarbeitung(uid, taskId, versuch + 1);
        });
      }, versuch < 4 ? 1200 : 3000);
    }
  };

  global.DWErfassen = { start: start, methoden: methoden };
})(typeof globalThis !== 'undefined' ? globalThis : this);
