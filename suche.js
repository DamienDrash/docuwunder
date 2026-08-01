// Suche: was ueber den Volltextindex geht, und der Verlauf dazu.
//
// Ein Sachgebiet fuer sich, und deshalb eine Datei fuer sich. Es haengt an
// zwei Dingen: an GET /api/documents/?query= und an den gespeicherten
// Ansichten (/api/saved_views/). Es liest keine Filter des Dokumente-Tabs,
// keinen Ordner und keinen Posteingang - die Treffer sind eine eigene Liste
// neben den anderen, gerade weil die Suche den ganzen Bestand meint und nicht
// den gerade eingestellten Ausschnitt.
//
// Umgekehrt ruft aus dem uebrigen app.js nur zweierlei hier herein: loadAll()
// braucht sichtQuery(), um die gespeicherten Ansichten zu benennen, und
// logoutGo() muss die Treffer loswerden. Die Bildschirme greifen ueber
// valsSuche zu, also ueber v, wie alle anderen auch.
//
// Warum als Aufsatz auf die Klasse und nicht als eigener Dienst mit eigenem
// Zustand? Aus demselben Grund wie bei mitglieder.js und erfassen.js: der
// Zustand gehoert React. Ein zweiter Halter daneben muesste jede Aenderung
// selbst weitermelden. Stattdessen bleibt der Zustand in setState, und diese
// Datei liefert die Startwerte (start) und die Methoden (methoden), die app.js
// an den Prototyp haengt. Aufrufer merken davon nichts, this ist dasselbe.
//
// Gesucht wird auf dem Server. Nur er kennt alle Dokumente und den
// Volltextindex ueber den erkannten Text; lokal liesse sich hoechstens
// durchsuchen, was gerade geladen ist - und das waere fuer den Suchenden nicht
// zu unterscheiden von "gibt es nicht".
//
// Was hier ausdruecklich NICHT steht: die reinen Ableitungen. Das Zerlegen des
// Ausschnitts (ausschnitt) und das Lesen einer gespeicherten Ansicht
// (sichtQuery) rechnet DWLogik, wo beides ohne Browser geprueft ist.
(function (global) {
  'use strict';

  // Wartezeit, bevor eine Eingabe zum Server geht. Ohne sie ginge je
  // Tastendruck eine Anfrage los.
  const SUCH_MS = 300;
  // Der Suchverlauf im Browser, damit er einen Neustart ueberlebt.
  const SUCH_KEY = 'paperless.suchverlauf';
  // Wie viele Eintraege der Verlauf haelt. Steht hier einmal, weil Lesen und
  // Fortschreiben sonst auseinanderlaufen koennten.
  const VERLAUF_N = 6;

  // Der Verlauf aus dem Browser. Alles, was nicht danach aussieht, faellt
  // weg - hier landet Fremdes leicht, und ein kaputter Eintrag duerfte den
  // Start nicht aufhalten.
  function verlaufLesen() {
    try {
      const r = JSON.parse(localStorage.getItem(SUCH_KEY) || '[]');
      return Array.isArray(r) ? r.filter(x => typeof x === 'string').slice(0, VERLAUF_N) : [];
    } catch (e) { return []; }
  }

  function verlaufSchreiben(liste) {
    try { localStorage.setItem(SUCH_KEY, JSON.stringify(liste)); }
    catch (e) { /* Speicher voll oder gesperrt: dann eben nur fuer diese Sitzung */ }
  }

  // Der Zustand dieses Sachgebiets, an einer Stelle statt verstreut im
  // Konstruktor.
  //
  //   q         die Eingabe im Suchfeld
  //   lastQ     wonach zuletzt gesucht wurde - die Detailansicht hebt die
  //             Fundstelle danach hervor, auch nachdem das Feld leer ist
  //   recents   der Verlauf aus dem Browser
  //   qRes      die Treffer der Serversuche
  //   qBusy     laeuft eine Anfrage?
  //   qErr      Fehlermeldung des Servers
  //   qEinfach  der Volltextindex hat die Eingabe nicht verstanden, gesucht
  //             wurde ersatzweise ueber title_content
  function start() {
    return { q: '', lastQ: '', recents: verlaufLesen(), qRes: [], qBusy: false, qErr: '', qEinfach: false };
  }

  // Was das Abmelden zuruecksetzt. Die Treffer sind Serverdaten und duerfen
  // das Konto nicht ueberleben; der Verlauf ist eine eigene Eingabe und liegt
  // im Browser, den raeumt "Lokale Daten loeschen" (verlaufVergessen).
  function beimAbmelden() {
    return { q: '', qRes: [], qBusy: false, qErr: '', qEinfach: false };
  }

  var methoden = {

    // Eingabe im Suchfeld. Der Weg zum Server ist verzoegert, das Leeren
    // nicht: wer loescht, will die Treffer sofort weg haben.
    sucheSetzen(q) {
      this.setState({ q });
      if (this._suchT) clearTimeout(this._suchT);
      if (q.trim().length < 2) {
        if (this._suchAb) { this._suchAb.abort(); this._suchAb = null; }
        this._suchLauf = (this._suchLauf || 0) + 1;
        this.setState({ qRes: [], qBusy: false, qErr: '', qEinfach: false });
        return;
      }
      this.setState({ qBusy: true, qErr: '' });
      this._suchT = setTimeout(() => this.sucheGo(q.trim()), SUCH_MS);
      // In dieselbe Liste wie alle anderen Fristen, damit componentWillUnmount
      // auch diese abraeumt.
      this._t.push(this._suchT);
    },

    sucheGo(q) {
      const A = this.api();
      if (!A || !A.hasToken()) { this.setState({ qBusy: false }); return; }
      if (this._suchAb) this._suchAb.abort();
      const ab = (this._suchAb = (typeof AbortController !== 'undefined' ? new AbortController() : null));
      // Beim schnellen Tippen koennte eine aeltere Antwort nach einer neueren
      // eintreffen. Nur die jeweils letzte Anfrage zaehlt.
      const lauf = (this._suchLauf = (this._suchLauf || 0) + 1);
      const lk = this.lookups();

      A.documents.search(q, { page_size: 40 }, { signal: ab ? ab.signal : undefined })
        .then(d => {
          if (lauf !== this._suchLauf) return;
          const treffer = (d.results || []).map(r =>
            Object.assign(this.mapDoc(r, lk, this.state.shares), { hit: r.__search_hit__ || null }));
          this.setState(s => ({
            qRes: treffer, cache: this.mitCache(s, treffer),
            qBusy: false, qErr: '', qEinfach: !!d.einfach
          }));
        })
        .catch(e => {
          if (lauf !== this._suchLauf || (e && e.aborted)) return;
          this.setState({ qBusy: false, qRes: [], qEinfach: false, qErr: (e && e.message) || 'Die Suche ist fehlgeschlagen.' });
        });
    },

    // Eine laufende Suche fallen lassen: beim Abmelden und beim Abbau der
    // Oberflaeche. Ohne das schriebe eine Antwort, die unterwegs ist, ihre
    // Treffer noch in einen Zustand, den es so nicht mehr gibt.
    sucheAbbrechen() {
      if (this._suchT) { clearTimeout(this._suchT); this._suchT = null; }
      if (this._suchAb) { this._suchAb.abort(); this._suchAb = null; }
      // Auch ohne AbortController - dann laeuft die Anfrage weiter, aber ihre
      // Antwort zaehlt nicht mehr.
      this._suchLauf = (this._suchLauf || 0) + 1;
    },

    // Der Server liefert den Ausschnitt mit <b>…</b> um die Fundstelle. Die
    // Oberflaeche setzt die Markierung selbst, deshalb wird der Ausschnitt in
    // Vor-, Treffer- und Nachtext zerlegt - nur die erste Fundstelle, mehr
    // zeigt die Zeile ohnehin nicht.
    ausschnitt(hl) { return global.DWLogik.ausschnitt(hl, (t) => this.nurText(t)); },

    // Auszeichnungen entfernen und Entities aufloesen: der Ausschnitt wird als
    // Text eingesetzt, nicht als HTML.
    nurText(t) {
      const el = document.createElement('div');
      el.innerHTML = String(t || '');
      return (el.textContent || '').replace(/\s+/g, ' ').trim();
    },

    // Volltextregel einer gespeicherten Ansicht, sofern sie nur aus einer
    // besteht. rule_type 19 ist die Volltextsuche.
    sichtQuery(v) { return global.DWLogik.sichtQuery(v); },

    // Aktuelle Suche als gespeicherte Ansicht in Paperless ablegen - dort ist
    // sie danach auch in der Weboberflaeche zu sehen.
    sucheSpeichern(q) {
      const A = this.api();
      if (!q) return;
      if (this.state.suchenM.some(x => x.q === q)) { this.note('Diese Suche ist schon gespeichert.'); return; }
      A.savedViews.createQuery(q, q)
        .then(v => {
          this.setState(s => ({ suchenM: [...s.suchenM, { id: v.id, name: v.name, q: this.sichtQuery(v) }] }));
          this.note('Suche gespeichert');
        })
        .catch(e => this.note('Nicht gespeichert: ' + e.message));
    },

    // In den Verlauf kommt eine Eingabe erst, wenn sie zu etwas gefuehrt hat -
    // also beim Oeffnen eines Treffers, nicht bei jedem Tastendruck.
    merkeSuche(q) {
      this.setState(s => {
        const r = [q, ...s.recents.filter(x => x !== q)].slice(0, VERLAUF_N);
        verlaufSchreiben(r);
        return { recents: r };
      });
    },

    // Den Verlauf loeschen, im Browser wie auf dem Schirm. Zwei Stellen rufen
    // das: der Suchbildschirm und "Lokale Daten loeschen" - die Ablage kennt
    // ausser dieser Datei niemand.
    verlaufVergessen() {
      try { localStorage.removeItem(SUCH_KEY); } catch (e) { /* gesperrt */ }
      this.setState({ recents: [] });
    },

    // Die Trefferzeilen. Sie entstehen hier und nicht in valsSuche, weil zu
    // jeder Zeile die Frage gehoert, woher ihre Hervorhebung kommt.
    results() {
      const s = this.state, q = s.q.trim();
      if (q.length < 2) return [];
      return s.qRes.map(d => {
        // Ohne Volltextindex (Rueckfall auf die einfache Suche) gibt es keine
        // Hervorhebung vom Server - dann wird sie lokal aus dem Text gebildet.
        const a = this.ausschnitt(d.hit && d.hit.highlights) || this.parts(d.inhalt, q);
        return {
          id: d.id, titel: d.titel,
          sub: [d.absender, d.dokumentart, this.kurzDatum(d.datum)].filter(Boolean).join(' · ') || 'Keine Angaben',
          hasSnip: !!(a && a.hit),
          snipPre: a ? a.pre : '', snipHit: a ? a.hit : '', snipPost: a ? a.post : '',
          open: () => { this.merkeSuche(q); this.setState({ lastQ: q }); this.openDoc(d.id, !!(a && a.hit)); }
        };
      });
    }
  };

  global.DWSuche = { start: start, beimAbmelden: beimAbmelden, methoden: methoden };
})(typeof globalThis !== 'undefined' ? globalThis : this);
