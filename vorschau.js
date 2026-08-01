// Vorschau: alles, was zu einem Dokument als Blob vom Server kommt.
//
// Drei Dinge, die dieselbe Frage teilen und deshalb dieselbe Datei bewohnen:
// die Vorschaubilder der Listen, die Vorschau des geoeffneten Dokuments und
// die Datei selbst (Herunterladen, Drucken). Alle drei brauchen den
// Auth-Header, den ein <img src> oder ein <a href> nicht mitschickt - api.js
// holt sie deshalb als Blob und gibt eine Object-URL zurueck.
//
// Und genau daran haengt die gemeinsame Frage: eine Object-URL gibt der
// Browser nie von selbst frei. Wer sie nicht widerruft, haelt jedes je
// geoeffnete Dokument im Speicher, bis der Reiter geschlossen wird. Deshalb
// steht das Widerrufen hier an jeder Stelle mit dabei - eine Obergrenze fuer
// die Liste (BILDER_MAX), ein Wechsel fuer die Detailvorschau, eine Frist fuer
// die heruntergeladene Datei.
//
// Aus dem uebrigen app.js fuehrt wenig herein: componentDidUpdate treibt beides
// an (bilderNachladen, vorschauFolgen), enrich() und der Posteingang fragen
// bildFuer(), das Abmelden und "Lokale Daten loeschen" rufen
// alleBilderFreigeben(). Die Bildschirme greifen ueber valsDokument zu, also
// ueber v, wie alle anderen auch.
//
// Warum als Aufsatz auf die Klasse und nicht als eigener Dienst? Aus demselben
// Grund wie bei mitglieder.js, erfassen.js und suche.js: der Zustand gehoert
// React. Diese Datei liefert die Startwerte (start), den Speicher neben dem
// Zustand (speicher) und die Methoden (methoden), die app.js an den Prototyp
// haengt. Aufrufer merken davon nichts, this ist dasselbe.
//
// Was hier ausdruecklich NICHT steht: die reine Ableitung. Welche Bilder
// weichen muessen, damit die Obergrenze haelt, rechnet DWLogik
// (bilderUeberzaehlig), wo es ohne Browser geprueft ist.
(function (global) {
  'use strict';

  // Wie viele Vorschaubilder hoechstens gleichzeitig im Speicher liegen. Eines
  // wiegt als Blob 10 bis 30 Kilobyte; 120 sind also wenige Megabyte und decken
  // das, was man an einem Stueck durchscrollt.
  const BILDER_MAX = 120;
  // Wie viele auf einmal geholt werden. Mehr macht die Liste nicht schneller,
  // belegt aber die Verbindungen, die gleichzeitig auch die Daten brauchen.
  const BILDER_GLEICHZEITIG = 6;
  // Wie lange die Object-URL einer Datei nach dem Klick noch stehen bleibt.
  // Der Browser braucht sie ueber den Klick hinaus - beim Herunterladen kurz,
  // beim Drucken so lange, bis die PDF-Ansicht im neuen Fenster steht.
  const DATEI_FRIST_MS = 60000;
  const DRUCK_FRIST_MS = 120000;

  // Der Zustand dieses Sachgebiets, an einer Stelle statt verstreut im
  // Konstruktor.
  //
  //   prev       Vorschau des geoeffneten Dokuments: {id, url, busy, err}
  //   bildStand  zaehlt hoch, sobald ein Vorschaubild fertig ist. Nur dafuer
  //              da, ein Neuzeichnen auszuloesen - die Bilder selbst stehen
  //              nicht im Zustand (siehe speicher).
  function start() {
    return { prev: null, bildStand: 0 };
  }

  // Was neben dem Zustand liegt. Ein einzelnes fertiges Vorschaubild ist kein
  // Anlass, den ganzen Baum neu zu zeichnen - deshalb eine Map an der Instanz
  // und ein Zaehler im Zustand, statt 120 Eintraege in setState.
  //
  // Die Reihenfolge der Map bildet die Nutzung ab: neu Eingesetztes kommt
  // hinten dazu, und was vorne steht, faellt heraus, wenn die Obergrenze
  // erreicht ist.
  function speicher() {
    return { bilder: new Map(), bilderLaufend: new Set() };
  }

  var methoden = {

    // --- Vorschaubilder in den Listen ---------------------------------------
    //
    // Paperless legt zu jedem Dokument ein Vorschaubild ab. Die Listen zeigten
    // stattdessen ein gezeichnetes Blatt mit grauen Strichen - fuer jedes
    // Dokument dasselbe. Zwischen zwanzig Rechnungen unterscheidet das nichts.
    //
    // Das gezeichnete Blatt bleibt als Platzhalter darunter liegen. Es ist
    // sofort da, das Bild legt sich darueber, sobald es geladen ist - so
    // springt beim Scrollen nichts.

    bildFuer(id) { return this.bilder.get(id) || ''; },

    bildMerken(id, url) {
      // Neu einsortieren, damit die Reihenfolge der Map die Nutzung abbildet.
      if (this.bilder.has(id)) {
        const alt = this.bilder.get(id);
        if (alt && alt !== url) URL.revokeObjectURL(alt);
        this.bilder.delete(id);
      }
      this.bilder.set(id, url);
      global.DWLogik.bilderUeberzaehlig([...this.bilder.keys()], BILDER_MAX).forEach(alt => {
        const weg = this.bilder.get(alt);
        if (weg) URL.revokeObjectURL(weg);
        this.bilder.delete(alt);
      });
    },

    // Alles, was gerade in einer Liste stehen koennte. Die Reihenfolge zaehlt:
    // was oben steht, wird zuerst geholt.
    bildKandidaten() {
      const s = this.state, ids = [];
      const dazu = (liste) => (liste || []).forEach(d => { if (d && d.id != null) ids.push(d.id); });
      dazu(this.inboxEff());
      dazu(s.docs);
      dazu(s.recent);
      dazu(s.favs);
      dazu(s.qRes);
      dazu(s.ordnerDocs);
      dazu(s.ordnerTabDocs);
      (s.opened || []).forEach(id => ids.push(id));
      return ids.slice(0, BILDER_MAX);
    },

    bilderNachladen() {
      const A = this.api();
      if (!A) return;
      let frei = BILDER_GLEICHZEITIG - this.bilderLaufend.size;
      for (const id of this.bildKandidaten()) {
        if (frei <= 0) break;
        if (this.bilder.has(id) || this.bilderLaufend.has(id)) continue;
        this.bilderLaufend.add(id);
        frei--;
        A.documents.thumbUrl(id).then(url => {
          this.bilderLaufend.delete(id);
          this.bildMerken(id, url);
          this.setState(st => ({ bildStand: (st.bildStand || 0) + 1 }));
        }).catch(() => {
          // Kein Vorschaubild ist kein Fehler, der jemanden interessiert - die
          // Zeile behaelt dann ihr gezeichnetes Blatt. Der leere Eintrag
          // verhindert, dass es endlos erneut versucht wird.
          this.bilderLaufend.delete(id);
          this.bildMerken(id, '');
          this.setState(st => ({ bildStand: (st.bildStand || 0) + 1 }));
        });
      }
    },

    bilderVergessen() {
      this.bilder.forEach(url => { if (url) URL.revokeObjectURL(url); });
      this.bilder.clear();
      this.bilderLaufend.clear();
    },

    // Jede Object-URL freigeben, die dieses Sachgebiet haelt. Zwei Stellen
    // rufen das: das Abmelden und "Lokale Daten loeschen" - beide duerfen
    // nichts aus dem alten Stand im Speicher stehen lassen. Dass es dafuer
    // zwei Ablagen gibt, muss dort niemand wissen. Den Zustand raeumen die
    // Aufrufer selbst (prev: null), sie setzen ohnehin gerade vieles zurueck.
    alleBilderFreigeben() {
      this.vorschauFrei();
      this.bilderVergessen();
    },

    // --- Vorschau des geoeffneten Dokuments ---------------------------------
    // Sie haengt am geoeffneten Dokument, nicht an einer einzelnen Aktion: sie
    // wird auch beim Zurueckblaettern und im Split-View beim Wechsel der
    // Auswahl gebraucht. Deshalb laeuft sie ueber componentDidUpdate.
    vorschauFolgen() {
      const top = this.top();
      const id = (top && top.t === 'doc') ? top.id : null;
      const p = this.state.prev;
      if (id && (!p || p.id !== id)) this.ladeVorschau(id);
      else if (!id && p) { this.vorschauFrei(); this.setState({ prev: null }); }
    },

    ladeVorschau(id) {
      const A = this.api();
      if (!A || !id) return;
      this.vorschauFrei();
      this.setState({ prev: { id, url: '', busy: true, err: '' } });
      A.documents.thumbUrl(id).then(url => {
        const p = this.state.prev;
        // Wer schnell weiterblaettert, hat schon ein anderes Dokument offen -
        // dann ist diese Antwort nur noch eine URL, die freigehoert.
        if (p && p.id === id) this.setState({ prev: { id, url, busy: false, err: '' } });
        else A.util.revoke(url);
      }).catch(e => {
        const p = this.state.prev;
        if (p && p.id === id) this.setState({ prev: { id, url: '', busy: false, err: (e && e.message) || 'Vorschau nicht verfügbar.' } });
      });
    },

    vorschauFrei() {
      const p = this.state.prev, A = this.api();
      if (p && p.url && A) A.util.revoke(p.url);
    },

    // --- Die Datei selbst ---------------------------------------------------
    // Original bzw. archivierte Fassung herunterladen.
    dateiLaden(id, original) {
      const A = this.api();
      this.setState({ sheet: null });
      this.note('Datei wird geladen …');
      A.documents.file(id, original).then(f => {
        const a = document.createElement('a');
        a.href = f.url;
        a.download = f.name || ('dokument-' + id + '.pdf');
        document.body.appendChild(a);
        a.click();
        a.remove();
        // Der Browser braucht die URL noch einen Moment nach dem Klick.
        this.later(() => A.util.revoke(f.url), DATEI_FRIST_MS);
        this.note('Datei gespeichert');
      }).catch(e => this.note('Download fehlgeschlagen: ' + e.message));
    },

    // Drucken laeuft ueber die PDF-Ansicht des Browsers.
    drucken(id) {
      const A = this.api();
      this.setState({ sheet: null });
      this.note('Druckansicht wird vorbereitet …');
      A.documents.previewUrl(id).then(url => {
        const w = window.open(url, '_blank');
        if (!w) { A.util.revoke(url); this.note('Der Browser hat das Fenster blockiert. Erlaube Pop-ups für diese Seite.'); return; }
        this.later(() => A.util.revoke(url), DRUCK_FRIST_MS);
      }).catch(e => this.note('Drucken nicht möglich: ' + e.message));
    }
  };

  global.DWVorschau = { start: start, speicher: speicher, methoden: methoden };
})(typeof globalThis !== 'undefined' ? globalThis : this);
