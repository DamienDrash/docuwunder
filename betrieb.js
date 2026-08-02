// Betrieb: was der Server fuer sich tut, auch wenn niemand ein Dokument anfasst.
//
// Vier Dinge stehen hier, und sie haben mehr gemeinsam, als die Bildschirme
// vermuten lassen: Automatisierungen (in Paperless: Workflows), der
// E-Mail-Import (Regeln und Konten), die Verarbeitungsaufgaben der
// Warteschlange und der Systemstatus. Alle vier sind Serverobjekte *neben*
// dem Archiv, nicht darin. Keines liest eine Dokumentliste, einen Filter oder
// den Cache, und keines schreibt hinein - wer hier einen Schalter umlegt,
// aendert nichts an dem, was auf den Dokumentbildschirmen steht. Deshalb
// braucht diese Datei von app.js nur api(), lookups(), setState und note().
//
// Warum als Aufsatz auf die Klasse und nicht als eigener Dienst mit eigenem
// Zustand? Aus demselben Grund wie bei mitglieder.js, erfassen.js, suche.js
// und vorschau.js: der Zustand gehoert React. Ein zweiter Halter daneben
// muesste jede Aenderung selbst weitermelden. Stattdessen bleibt der Zustand
// in setState, und diese Datei liefert die Startwerte (start) und die
// Methoden (methoden), die app.js an den Prototyp haengt. Aufrufer merken
// davon nichts, this ist dasselbe.
//
// Der rote Faden bei den Schaltern: ein Schalter ist erst umgelegt, wenn der
// Server es weiss. Angezeigt wird die Aenderung sofort - sonst haengt der
// Finger in der Luft -, aber ein Fehlschlag nimmt sie zurueck. Ein Schalter,
// der lokal auf "an" steht und serverseitig auf "aus", waere schlimmer als
// gar keiner: er verspricht etwas, das nicht geschieht.
//
// Was hier ausdruecklich NICHT steht: das Bearbeiten der Regeln selbst. An
// einem Workflow haengen in Paperless 27 Filter- und 14 Aktionsfelder, an
// einer E-Mail-Regel ein eigenes Konto samt Ordnerlogik. Beides bleibt der
// Paperless-Oberflaeche vorbehalten; hier stehen Name, Zustand und Ausloeser -
// das, was man im Alltag aendert.
(function (global) {
  'use strict';

  const DWLogik = global.DWLogik;

  // Die Zahlen stammen aus der API (OPTIONS auf /workflows/). Sie waren
  // frueher durchgehend um eine Position verschoben, wodurch jeder Workflow
  // den falschen Ausloeser anzeigte. tests/api_check.py prueft die Zuordnung
  // gegen den Server, damit das nicht wieder abdriftet.
  const TRIGGER = {
    1: 'Aufnahme begonnen',      // Consumption Started
    2: 'Dokument hinzugefügt',   // Document Added
    3: 'Dokument aktualisiert',  // Document Updated
    4: 'Geplanter Zeitpunkt'     // Scheduled
  };
  const AKTION = {
    1: 'Angaben zuweisen',       // Assignment
    2: 'Angaben entfernen',      // Removal
    3: 'E-Mail senden',          // Email
    4: 'Webhook auslösen',       // Webhook
    5: 'Passwort entfernen',     // Password removal
    6: 'In den Papierkorb'       // Move to trash
  };

  // Der Zustand dieses Sachgebiets, an einer Stelle statt verstreut im
  // Konstruktor.
  //
  //   autos        die Automatisierungen in der Form der Oberflaeche
  //   mailRules    die E-Mail-Regeln, ebenso
  //   mailKonten   die Konten dahinter - gebraucht nur vom Abruf, der je
  //                Konto laeuft und nicht je Regel
  //   tasksRaw     die letzten Serveraufgaben
  //   tasksFehler  warum die Aufgabenliste leer blieb, falls sie leer blieb
  //   sysStatus    die Zeilen des Systemstatus, aus echten Serverwerten
  function start() {
    return { autos: [], mailRules: [], mailKonten: [], tasksRaw: [], tasksFehler: '', sysStatus: null };
  }

  // Was das Abmelden zuruecksetzt: alles. Jede dieser vier Listen gehoert dem
  // Konto, mit dem sie geholt wurde - der Systemstatus nennt sogar den
  // angemeldeten Benutzernamen. Nach dem Abmelden darf davon nichts mehr
  // stehen bleiben.
  function beimAbmelden() {
    return start();
  }

  var methoden = {

    // Die Erstbefuellung dieses Sachgebiets, aus den Rohantworten von
    // loadAll(). Eine Stelle statt vier Zeilen mitten im grossen setState:
    // was ein Workflow, eine Regel oder eine Statuszeile ist, entscheidet
    // sich hier und nicht dort.
    betriebAus({ flows, regeln, konten, stats, ver, ui }) {
      return {
        autos: (flows || []).map(w => this.mapWorkflow(w)),
        mailRules: (regeln || []).map(r => ({ id: r.id, name: r.name, desc: DWLogik.regelText(r), on: r.enabled !== false })),
        // Die Konten braucht nur der Abruf: die Regeln sagen, was geholt
        // wird, angestossen wird aber ein Konto.
        mailKonten: (konten || []).map(k => ({ id: k.id, name: k.name })),
        sysStatus: this.statusZeilen(stats, ver, ui)
      };
    },

    // Paperless nennt Automatisierungen "Workflows". Sie werden hier nur
    // angezeigt und aktiviert/pausiert; das Bearbeiten der Regeln selbst
    // bleibt der Paperless-Oberflaeche vorbehalten, weil die Datenstruktur
    // dort deutlich reicher ist als dieser Bildschirm abbilden kann.
    mapWorkflow(w) {
      return {
        id: w.id,
        name: w.name,
        on: w.enabled !== false,
        ausl: (w.triggers || []).map(t => TRIGGER[t.type] || 'Auslöser').join(', ') || 'Kein Auslöser',
        bed: (w.triggers || []).map(t => this.triggerText(t)).filter(Boolean),
        akt: (w.actions || []).map(a => AKTION[a.type] || 'Aktion'),
        // Der urspruengliche Datensatz. Beim Aendern des Ausloesers ersetzt
        // Paperless das ganze Feld - die uebrigen Angaben des vorhandenen
        // Ausloesers (Quellen, Filter) muessen deshalb mitgeschickt werden.
        raw: w
      };
    },

    // Die Bedingungen eines Ausloesers als lesbarer Satz. Die ids darin sind
    // fuer sich nichtssagend, deshalb der Umweg ueber die
    // Nachschlagetabellen der Stammdaten.
    triggerText(t) {
      const teile = [];
      if (t.filter_filename) teile.push('Dateiname wie „' + t.filter_filename + '“');
      if (t.filter_path) teile.push('Pfad wie „' + t.filter_path + '“');
      if (t.filter_has_tags && t.filter_has_tags.length) {
        const lk = this.lookups();
        teile.push('Schlagwort ' + t.filter_has_tags.map(id => (lk.tag[id] || {}).name || id).join(', '));
      }
      if (t.filter_has_correspondent) {
        const lk = this.lookups();
        teile.push('Absender ' + ((lk.corr[t.filter_has_correspondent] || {}).name || t.filter_has_correspondent));
      }
      return teile.join(' · ');
    },

    // --- Automatisierungen -------------------------------------------------
    // Bearbeitbar sind Name, Zustand und Ausloeser - das, was man im Alltag
    // aendert. Bedingungen und Aktionen bleiben in Paperless: dort haengen 27
    // Filter- und 14 Aktionsfelder dran, die dieser Bildschirm nicht sinnvoll
    // abbilden kann, ohne selbst zur Verwaltungsoberflaeche zu werden.
    autoNameSichern(id, name) {
      const A = this.api(), sauber = String(name || '').trim();
      if (!sauber) { this.note('Der Name darf nicht leer sein.'); return; }
      this.setState(s => ({ autos: s.autos.map(a => a.id === id ? Object.assign({}, a, { name: sauber }) : a) }));
      A.workflows.update(id, { name: sauber })
        .then(() => this.note('Gesichert'))
        .catch(e => { this.loadAll(); this.note('Nicht gesichert: ' + e.message); });
    },

    // Der Untertitel zum Schalter. Er kommt aus dem Zustand, damit er dem
    // Umschalten sofort folgt und nicht bis zum naechsten Laden hinterherhinkt.
    autoLage(on) { return on ? 'Läuft automatisch' : 'Pausiert'; },

    autoAusloeser(id, typ) {
      const A = this.api();
      const auto = (this.state.autos || []).find(a => a.id === id);
      if (!auto || !auto.raw) return;
      // Paperless ersetzt das ganze Ausloeser-Feld; die uebrigen Angaben des
      // vorhandenen Ausloesers bleiben deshalb erhalten.
      const alt = (auto.raw.triggers || [])[0] || { sources: [1] };
      const neu = Object.assign({}, alt, { type: typ });
      delete neu.id;
      A.workflows.update(id, { triggers: [neu] })
        .then(() => this.loadAll())
        .then(() => { this.setState({ sheet: null }); this.note('Auslöser geändert'); })
        .catch(e => this.note('Nicht geändert: ' + e.message));
    },

    autoEntfernen(id) {
      const A = this.api();
      const auto = (this.state.autos || []).find(a => a.id === id);
      A.workflows.remove(id)
        .then(() => this.loadAll())
        // Nur den Detailbildschirm schliessen: die Liste dahinter bleibt stehen,
        // sonst landet man nach dem Loeschen unvermittelt am Anfang.
        .then(() => { this.setState(st => ({ stack: st.stack.slice(0, -1), sheet: null })); this.note('„' + (auto ? auto.name : 'Automatisierung') + '“ gelöscht'); })
        .catch(e => this.note('Nicht gelöscht: ' + e.message));
    },

    autoAnlegen() {
      const A = this.api();
      A.workflows.create({
        name: 'Neue Automatisierung',
        order: (this.state.autos || []).length + 1,
        enabled: false,
        // Ein Ausloeser ist Pflicht; "Dokument hinzugefuegt" ist der haeufigste.
        triggers: [{ type: 2, sources: [1] }],
        actions: [{ type: 1 }],
      }).then(() => this.loadAll())
        .then(() => this.note('Angelegt — Bedingungen und Aktionen legst du in Paperless fest'))
        .catch(e => this.note('Nicht angelegt: ' + e.message));
    },

    // Der Schalter muss beim Server ankommen, sonst steht er nach dem
    // naechsten Laden wieder auf dem alten Wert.
    autoSchalten(id, on) {
      const A = this.api();
      this.setState(s => ({ autos: s.autos.map(x => x.id === id ? Object.assign({}, x, { on }) : x) }));
      A.workflows.setEnabled(id, on).catch(e => {
        this.setState(s => ({ autos: s.autos.map(x => x.id === id ? Object.assign({}, x, { on: !on }) : x) }));
        this.note('Nicht geändert: ' + e.message);
      });
    },

    // --- E-Mail-Import -----------------------------------------------------
    regelSchalten(id, on) {
      const A = this.api();
      this.setState(s => ({ mailRules: s.mailRules.map(x => x.id === id ? Object.assign({}, x, { on }) : x) }));
      A.mailRules.setEnabled(id, on).catch(e => {
        this.setState(s => ({ mailRules: s.mailRules.map(x => x.id === id ? Object.assign({}, x, { on: !on }) : x) }));
        this.note('Nicht geändert: ' + e.message);
      });
    },

    // Den Abruf sofort anstossen, statt auf den Zeitplan zu warten.
    //
    // Angestossen wird je Konto, nicht je Regel: Paperless holt die Post eines
    // Kontos und laesst danach alle Regeln darauf los.
    mailAbrufen() {
      const A = this.api();
      const konten = this.state.mailKonten || [];
      if (!konten.length) {
        this.note('Kein E-Mail-Konto eingerichtet – das legst du in Paperless an.');
        return Promise.resolve();
      }
      return Promise.all(konten.map(k => A.mailKonten.abrufen(k.id)))
        .then(() => {
          this.note(konten.length === 1
            ? 'Abruf gestartet – der Verlauf steht unter Verarbeitung.'
            : konten.length + ' Konten werden abgerufen – Verlauf unter Verarbeitung.');
          this.ladeAufgaben();
        })
        .catch(e => this.note('Abruf nicht gestartet: ' + e.message));
    },

    // --- Verarbeitungsaufgaben ---------------------------------------------
    ladeAufgaben() {
      const A = this.api();
      if (!A || !A.hasToken()) return Promise.resolve();
      this.setState({ tasksFehler: '' });
      return A.tasks({ page_size: 25 }).then(d => {
        const roh = Array.isArray(d) ? d : (d.results || []);
        this.setState({ tasksRaw: roh.map(t => this.mapTask(t)) });
      }).catch(e => {
        // Nebenliste: der Bildschirm bleibt bedienbar, aber der Fehler darf
        // nicht spurlos verschwinden.
        console.warn('[Verarbeitung] Aufgaben konnten nicht geladen werden:', e && e.message);
        this.setState({ tasksFehler: (e && e.message) || 'Aufgaben konnten nicht geladen werden.' });
      });
    },

    mapTask(t) {
      const A = this.api();
      const st = String(t.status || '').toLowerCase();
      const datei = (t.input_data && t.input_data.filename) || t.task_file_name || '';
      const zeit = A.util.relDE(t.date_done || t.date_started || t.date_created);
      const fehler = typeof t.result === 'string' ? t.result
                   : (t.result_data && (t.result_data.error || t.result_data.result)) || '';
      return {
        id: t.id,
        name: datei || t.task_type_display || t.task_type || 'Aufgabe',
        st: st === 'success' ? ('Fertig' + (zeit ? ' · ' + zeit : ''))
          : st === 'failure' ? (String(fehler).split('\n')[0].slice(0, 120) || 'Fehlgeschlagen')
          : st === 'started' ? 'Wird verarbeitet …'
          : (t.status_display || 'Wartet …'),
        run: st === 'started' || st === 'pending' || st === 'retry',
        ok: st === 'success',
        err: st === 'failure',
        hasRetry: false
      };
    },

    // --- Systemstatus ------------------------------------------------------
    // Die Zeilen kommen aus echten Serverwerten. Was der Server nicht liefert,
    // steht auch nicht da - eine erfundene Zeile waere schlimmer als eine
    // fehlende.
    statusZeilen(stats, ver, ui) {
      const A = this.api();
      const zeilen = [
        { k: 'Verbindung', v: 'Verbunden', grn: true },
        { k: 'Server', v: (A.getBase() || '').replace(/^https?:\/\//, '').replace(/\/api$/, '') }
      ];
      if (ver && ver.version) zeilen.push({ k: 'Version', v: 'Paperless-ngx ' + ver.version });
      if (stats) {
        zeilen.push({ k: 'Dokumente', v: String(stats.documents_total != null ? stats.documents_total : '—') });
        if (stats.documents_inbox != null) zeilen.push({ k: 'Im Posteingang', v: String(stats.documents_inbox) });
        if (stats.character_count) zeilen.push({ k: 'Erkannte Zeichen', v: stats.character_count.toLocaleString('de-DE') });
      }
      if (ui && ui.user && ui.user.username) zeilen.push({ k: 'Angemeldet als', v: ui.user.username });
      return zeilen;
    }
  };

  global.DWBetrieb = { start: start, beimAbmelden: beimAbmelden, methoden: methoden };
})(typeof globalThis !== 'undefined' ? globalThis : this);
