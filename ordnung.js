// Ordnung: die Namen, nach denen ein Archiv sortiert ist - und die Ordner daraus.
//
// Vier Arten von Stammdaten stehen hier, und Paperless nennt sie anders als
// diese App: Absender (dort Korrespondenten), Dokumentarten (Dokumenttypen),
// Schlagwoerter (Tags) und Ablageorte (Storage Paths). Sie haben gemeinsam,
// dass sie *neben* den Dokumenten stehen und von ihnen nur benannt werden: ein
// Absender zu loeschen entfernt kein Dokument, es verliert nur seinen Absender.
// Deshalb liegen sie zusammen, und deshalb liegt der Ordnerbaum dabei - er ist
// nichts anderes als eine Lesart derselben Ablageorte.
//
// Ordner gibt es in Paperless naemlich nicht. Die Hierarchie entsteht aus den
// Namen der Ablageorte, die per '/' geschachtelt sind:
//   "Privat", "Privat/Versicherungen", "Privat/Steuern"
// ergibt den Ordner "Privat" mit zwei Unterordnern. Ein Zwischenordner muss
// dabei nicht selbst als Ablageort existieren - er ist dann ein reiner
// Durchgang ohne eigene Dokumente. Wer hier einen Ordner anlegt, legt in
// Wahrheit einen Ablageort mit vollem Pfad als Namen an; das path-Template
// kommt in api.js aus demselben Namen, damit Ordnername und Ablage auf der
// Platte uebereinstimmen.
//
// Anders als betrieb.js oder mitglieder.js kommt dieses Sachgebiet nicht ganz
// ohne Dokumente aus: ein geoeffneter Ordner zeigt, was darin liegt. Die Grenze
// verlaeuft trotzdem sauber - geholt wird dafuer eine *eigene* Serverabfrage in
// eine *eigene* Liste (ordnerDocs, ordnerTabDocs). Die Listen des
// Dokumente-Tabs, deren Filter, der Cache und die Suche werden hier weder
// gelesen noch geschrieben. Der Grund ist derselbe wie ueberall im Datenfluss:
// gefiltert wird auf dem Server. Aus den geladenen Seiten des Dokumente-Tabs
// den Inhalt eines Ordners zusammenzusuchen waere eine Aussage ueber den
// Gesamtbestand, die die App nicht treffen kann.
//
// Warum als Aufsatz auf die Klasse und nicht als eigener Dienst mit eigenem
// Zustand? Aus demselben Grund wie bei mitglieder.js, erfassen.js, suche.js,
// vorschau.js und betrieb.js: der Zustand gehoert React. Ein zweiter Halter
// daneben muesste jede Aenderung selbst weitermelden. Stattdessen bleibt der
// Zustand in setState, und diese Datei liefert die Startwerte (start) und die
// Methoden (methoden), die app.js an den Prototyp haengt. Aufrufer merken davon
// nichts, this ist dasselbe.
//
// Was hier ausdruecklich NICHT steht: das Ableiten des Baumes selbst. Welche
// Kinder ein Pfad hat und wie viele Dokumente im ganzen Unterbaum liegen,
// rechnet DWLogik.ordnerKinder, wo es ohne Browser geprueft ist.
(function (global) {
  'use strict';

  const DWLogik = global.DWLogik;

  // Paperless kennt keine Favoriten. Die App bildet sie auf dieses Schlagwort
  // ab; es wird in der Schlagwortliste ausgeblendet und bei Bedarf angelegt.
  // Es steht hier, weil es ein Stammdatum ist und kein Zustand der Oberflaeche -
  // app.js liest es als DWOrdnung.FAV_TAG, damit es diesen Namen nur einmal
  // gibt.
  const FAV_TAG = 'Favorit';

  // Wie viele Dokumente ein geoeffneter Ordner zeigt. Bewusst eine eigene Zahl
  // und nicht die Seitengroesse des Dokumente-Tabs: der Ordner blaettert nicht
  // nach, er zeigt eine Seite.
  const ORDNER_SEITE = 60;

  // Der Zustand dieses Sachgebiets, an einer Stelle statt verstreut im
  // Konstruktor.
  //
  //   orgDraft        Entwurf des Blattes "Neu erstellen"/"Bearbeiten"
  //                   (kind, alter Name, neuer Name, Anzahl, Fehler, Warnung)
  //   pickNew         das Feld "Neu erstellen ..." im Auswahlblatt
  //   pickBusy        laeuft das Anlegen daraus gerade?
  //   ordnerDocs      Dokumente des Ordners, der unter "Mehr" offen ist
  //   ordnerLaden     laeuft dessen Abfrage?
  //   ordnerTabPfad   Pfad der Ordneransicht im Reiter Dokumente
  //   ordnerTabDocs   deren Dokumente
  //   ordnerTabLaden  laeuft deren Abfrage?
  //
  // Zwei Stellen zeigen Ordner, und sie haben getrennte Zustaende: ein Wechsel
  // unter "Mehr" darf den Reiter Dokumente nicht mitziehen und umgekehrt.
  function start() {
    return {
      orgDraft: null, pickNew: '', pickBusy: false,
      ordnerDocs: [], ordnerLaden: false,
      ordnerTabPfad: '', ordnerTabDocs: [], ordnerTabLaden: false
    };
  }

  // Was beim Schliessen eines Blattes zurueckgesetzt wird: der Entwurf. Der
  // Ordnerstand steht bewusst nicht dabei - er gehoert dem Bildschirm
  // dahinter, nicht dem Blatt darueber.
  function beimSchliessen() {
    return { orgDraft: null };
  }

  // Was das Abmelden zuruecksetzt: alles. Welche Ordner es gibt und was darin
  // liegt, gehoert dem Konto, mit dem es geholt wurde.
  function beimAbmelden() {
    return start();
  }

  var methoden = {

    // --- Ordner -------------------------------------------------------------
    ordnerKinder(pfad) { return DWLogik.ordnerKinder(this.state.orteRaw, pfad); },

    // ids der Ablageorte, die genau diesem Ordner entsprechen (nicht den
    // Unterordnern).
    ordnerIds(pfad) {
      return (this.state.orteRaw || []).filter(o => o.name === pfad).map(o => o.id);
    },

    // Dokumente eines Ordners kommen vom Server, nicht aus der geladenen Seite -
    // sonst waere die Anzeige eine Aussage ueber den Gesamtbestand, die die App
    // nicht treffen kann.
    //
    // Beide Ordnerstellen benutzen dasselbe Laden; ziel entscheidet nur, in
    // welches Paar von Zustandswerten es faellt.
    ladeOrdner(pfad, ziel) {
      const A = this.api();
      const wo = ziel || 'ordner';
      const docs = wo + 'Docs', laden = wo + 'Laden';
      const ids = this.ordnerIds(pfad);
      if (!A || !A.hasToken() || !ids.length) {
        this.setState({ [docs]: [], [laden]: false });
        return Promise.resolve();
      }
      this.setState({ [laden]: true });
      return A.documents.list({ storage_path__id__in: ids, ordering: '-created', page_size: ORDNER_SEITE })
        .then(r => this.setState({
          [docs]: (r.results || []).map(d => this.mapDoc(d, this.lookups(), this.state.shares)),
          [laden]: false
        }))
        .catch(() => this.setState({ [docs]: [], [laden]: false }));
    },

    // Ordneransicht im Reiter Dokumente: ein Schritt tiefer oder zurueck.
    // Anders als der Bildschirm unter "Mehr" legt sie nichts auf den Stapel -
    // die Ansicht bleibt der Reiter, es wechselt nur der Ort darin.
    ordnerTabGehe(pfad) {
      this.setState({ ordnerTabPfad: pfad || '', ordnerTabDocs: [] });
      return this.ladeOrdner(pfad || '', 'ordnerTab');
    },

    oeffneOrdner(pfad) {
      this.setState(s => ({ stack: [...s.stack, { t: 'org', kind: 'ort', pfad: pfad || '' }], ordnerDocs: [], ordnerLaden: !!pfad }));
      this.ladeOrdner(pfad || '');
    },

    // Legt einen Unterordner im aktuellen Ordner an. Der Ablageort bekommt den
    // vollen Pfad als Namen, damit die Hierarchie erhalten bleibt.
    neuerOrdner(elternPfad, name) {
      const A = this.api();
      const sauber = String(name || '').replace(/\//g, ' ').trim();
      if (!sauber) return Promise.resolve();
      const voll = elternPfad ? elternPfad + '/' + sauber : sauber;
      if ((this.state.orteRaw || []).some(o => o.name === voll)) {
        this.note('„' + sauber + '“ gibt es hier schon');
        return Promise.resolve();
      }
      return A.storagePaths.create(voll)
        .then(neu => {
          this.setState(s => ({
            orteRaw: [...s.orteRaw, neu],
            orteM: [...s.orteM, neu.name].sort((a, b) => a.localeCompare(b, 'de')),
            sheet: null, orgDraft: null
          }));
          this.note('Ordner „' + sauber + '“ erstellt');
        })
        .catch(e => this.note('Ordner nicht erstellt: ' + e.message));
    },

    // --- Stammdaten ---------------------------------------------------------
    // Die Zeilen einer Stammdatenliste. Die Zahl daneben meint alle zugehoerigen
    // Dokumente, nicht die der gerade geladenen Seite - Paperless liefert sie
    // als document_count direkt am Eintrag mit.
    orgData(kind) {
      const s = this.state;
      const aus = (roh) => [...(roh || [])]
        .sort((a, b) => a.name.localeCompare(b.name, 'de'))
        .map(x => ({ name: x.name, count: x.document_count || 0 }));
      if (kind === 'abs') return { title: 'Absender', hint: 'In Paperless: Korrespondent', rows: aus(s.absRaw) };
      if (kind === 'art') return { title: 'Dokumentarten', hint: 'In Paperless: Dokumenttyp', rows: aus(s.artenRaw) };
      if (kind === 'tag') return { title: 'Schlagwörter', hint: 'In Paperless: Tags', rows: aus((s.tagsRaw || []).filter(t => t.name !== FAV_TAG)) };
      // 'ort' wird nicht flach dargestellt, sondern als Ordnerbaum - siehe
      // ordnerKinder() und die Ordnerzweige in renderVals.
      if (kind === 'ort') return { title: 'Ordner', hint: '', rows: [] };
      if (kind === 'feld') return { title: 'Eigene Felder', hint: 'In Paperless: benutzerdefinierte Felder', rows: s.felderM.map(f => ({ name: f.name, count: f.n, typ: f.typ })) };
      return { title: 'Gespeicherte Suchen', hint: 'In Paperless: gespeicherte Ansichten', rows: s.suchenM.map(f => ({ name: f.name, text: f.q ? 'Sucht nach „' + f.q + '“' : 'Gespeicherte Ansicht' })) };
    },

    // Liefert die id zu einem Namen; legt den Eintrag bei Bedarf an. Das ist der
    // Weg, auf dem beim Bearbeiten eines Dokuments ein noch unbekannter
    // Absender entsteht, ohne dass jemand ihn vorher anlegen muesste.
    //
    // ACHTUNG, unveraenderte Altlast: die Tabellen unten sind mit den langen
    // Namen beschriftet ('absender', 'dokumentart', 'ablageort'), die Aufrufer
    // reichen aber die kurzen Formen der Oberflaeche herein ('abs', 'art',
    // 'ort'). Nur 'tag' passt auf beiden Seiten. Dieser Umzug hat daran nichts
    // geaendert - er soll nichts am Verhalten aendern -, aber es steht hier,
    // damit es nicht laenger unsichtbar ist.
    idFuer(art, name) {
      const A = this.api();
      if (!name) return Promise.resolve(null);
      const topf = { absender: 'absRaw', dokumentart: 'artenRaw', tag: 'tagsRaw', ablageort: 'orteRaw' }[art];
      const dienst = { absender: A.correspondents, dokumentart: A.documentTypes, tag: A.tags, ablageort: A.storagePaths }[art];
      const da = (this.state[topf] || []).find(x => x.name === name);
      if (da) return Promise.resolve(da.id);
      return dienst.create(name).then(neu => {
        this.setState(st => ({ [topf]: [...st[topf], neu] }));
        return neu.id;
      });
    },

    favTagId() { return this.idFuer('tag', FAV_TAG); },

    // Neuen Eintrag aus dem Auswahl-Sheet anlegen (Absender, Dokumentart,
    // Schlagwort). Zurueck fuehrt choosePick(): der neue Eintrag soll gleich
    // gesetzt sein, sonst muesste man ihn nach dem Anlegen noch einmal
    // antippen.
    pickCreateGo() {
      const s = this.state, v = s.pickNew.trim();
      if (!v) return;
      const art = { 'Absender': 'abs', 'Dokumentart': 'art', 'Schlagwörter': 'tag', 'Ablageort': 'ort' }[s.pickField];
      if (!art) { this.setState({ pickNew: '' }); this.choosePick(v); return; }
      this.setState({ pickBusy: true });
      this.idFuer(art, v).then(() => {
        const topf = { absender: 'absM', dokumentart: 'artenM', tag: 'tagsM', ablageort: 'orteM' }[art];
        this.setState(st => ({
          pickBusy: false, pickNew: '',
          [topf]: st[topf].includes(v) ? st[topf] : [...st[topf], v].sort((x, y) => x.localeCompare(y, 'de'))
        }));
        this.choosePick(v);
      }).catch(e => { this.setState({ pickBusy: false }); this.note('Nicht angelegt: ' + e.message); });
    },

    // Organisationseintrag anlegen oder umbenennen.
    orgSaveGo() {
      const A = this.api(), d = this.state.orgDraft;
      if (!d) return;
      const name = d.name.trim();
      // Ordner: der Ablageort bekommt den vollen Pfad als Namen, damit die
      // Hierarchie erhalten bleibt (siehe ordnerKinder).
      if (d.kind === 'ort' && !d.alt) {
        if (!name) { this.setState(s => ({ orgDraft: Object.assign({}, s.orgDraft, { err: 'Bitte gib einen Namen ein.' }) })); return; }
        this.neuerOrdner(d.pfad || '', name).then(() => this.ladeOrdner(d.pfad || ''));
        return;
      }
      if (!name) { this.setState(s => ({ orgDraft: Object.assign({}, s.orgDraft, { err: 'Bitte gib einen Namen ein.' }) })); return; }

      const dienst = { absender: A.correspondents, dokumentart: A.documentTypes, tag: A.tags, ablageort: A.storagePaths }[d.kind];
      const topfRaw = { absender: 'absRaw', dokumentart: 'artenRaw', tag: 'tagsRaw', ablageort: 'orteRaw' }[d.kind];
      if (!dienst) {
        // Eigene Felder und gespeicherte Suchen werden hier (noch) nicht verwaltet.
        this.setState({ sheet: null, orgDraft: null });
        this.note('Diese Art von Eintrag lässt sich hier nicht ändern.');
        return;
      }

      this.setState(s => ({ orgDraft: Object.assign({}, s.orgDraft, { busy: true, err: '' }) }));
      const vorhandener = d.alt ? (this.state[topfRaw] || []).find(x => x.name === d.alt) : null;
      const aktion = vorhandener ? dienst.update(vorhandener.id, { name }) : dienst.create(name);

      aktion
        .then(() => this.loadAll())
        .then(() => { this.setState({ sheet: null, orgDraft: null }); this.note(d.alt ? 'Änderungen gesichert' : '„' + name + '“ erstellt'); })
        .catch(e => this.setState(s => ({ orgDraft: Object.assign({}, s.orgDraft, { busy: false, err: e.message }) })));
    },

    // Organisationseintrag loeschen. Bei zugeordneten Dokumenten wird vorher
    // gewarnt; die Dokumente selbst bleiben erhalten.
    orgDeleteGo(force) {
      const A = this.api(), d = this.state.orgDraft;
      if (!d || !d.alt) { this.setState({ sheet: null, orgDraft: null }); return; }
      if (d.count > 0 && !force) { this.setState(s => ({ orgDraft: Object.assign({}, s.orgDraft, { warn: true }) })); return; }

      const dienst = { absender: A.correspondents, dokumentart: A.documentTypes, tag: A.tags, ablageort: A.storagePaths }[d.kind];
      const topfRaw = { absender: 'absRaw', dokumentart: 'artenRaw', tag: 'tagsRaw', ablageort: 'orteRaw' }[d.kind];
      const eintrag = (this.state[topfRaw] || []).find(x => x.name === d.alt);
      if (!dienst || !eintrag) { this.setState({ sheet: null, orgDraft: null }); return; }

      this.setState(s => ({ orgDraft: Object.assign({}, s.orgDraft, { busy: true }) }));
      dienst.remove(eintrag.id)
        .then(() => this.loadAll())
        .then(() => { this.setState({ sheet: null, orgDraft: null }); this.note('„' + d.alt + '“ gelöscht'); })
        .catch(e => this.setState(s => ({ orgDraft: Object.assign({}, s.orgDraft, { busy: false, warn: false, err: e.message }) })));
    }
  };

  global.DWOrdnung = {
    FAV_TAG: FAV_TAG,
    start: start,
    beimSchliessen: beimSchliessen,
    beimAbmelden: beimAbmelden,
    methoden: methoden
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
