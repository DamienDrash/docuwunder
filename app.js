// Die Oberflaeche von DocuWunder.
//
// Hervorgegangen aus mobile.dc.html, das Vorlage und Logik in einer Datei mit
// 3.617 Zeilen zusammenhielt und auf einem Runtime lief, dessen Quellprojekt
// nirgends vorlag (support.js). Beides ist damit erledigt: hier laeuft React
// direkt, die Bildschirme stehen einzeln in vorlage/.
//
// Diese Datei traegt nur noch die Logik. Was auf dem Schirm steht, gehoert in
// vorlage/ - dort ist es nach Bereichen sortiert und auffindbar.
(function (global) {
  'use strict';

  const React = global.React;
  const { html, stil } = global.DWUi;
  const DWLogik = global.DWLogik;
  const DWVorlage = global.DWVorlage;
  // Mitglieder und Gruppen stehen in mitglieder.js - ein Sachgebiet, das an
  // /api/users/ haengt und die Dokumente nicht anfasst. Zustand und Methoden
  // kommen von dort zurueck in diese Klasse (siehe unten am Klassenende).
  const DWMitglieder = global.DWMitglieder;
  // Ebenso das Erfassen (Scannen und Hochladen) in erfassen.js: der Weg ins
  // Archiv hinein, der vom Bestand nur reloadDocs() braucht.
  const DWErfassen = global.DWErfassen;
  // Und die Suche in suche.js: Volltextindex, Verlauf und gespeicherte
  // Ansichten - eine Liste neben den anderen, mit eigener Serverabfrage.
  const DWSuche = global.DWSuche;
  // Und die Vorschau in vorschau.js: Vorschaubilder der Listen, Vorschau des
  // geoeffneten Dokuments, Herunterladen und Drucken - alles, was als Blob
  // kommt und eine Object-URL hinterlaesst, die wieder freigehoert.
  const DWVorschau = global.DWVorschau;
  // Und der Betrieb in betrieb.js: Automatisierungen, E-Mail-Import,
  // Verarbeitungsaufgaben und Systemstatus - Serverobjekte neben dem Archiv,
  // die keine Dokumentliste lesen und in keine schreiben.
  const DWBetrieb = global.DWBetrieb;
  // Und die Ordnung in ordnung.js: die Stammdaten (Absender, Dokumentarten,
  // Schlagwoerter, Ablageorte) und der Ordnerbaum, den die App aus den Namen
  // der Ablageorte ableitet.
  const DWOrdnung = global.DWOrdnung;

// Der Rahmen, in dem die ganze Oberflaeche sitzt.
//
// Auf einem Telefon gehoeren die aeussersten Streifen des Bildschirms dem
// Geraet: unten der Streifen fuer die Home-Geste, quer gehalten die Seite mit
// der Kameraaussparung. Was dort liegt, ist verdeckt oder loest beim Antippen
// die Geste des Systems aus statt der eigenen - fuer die Tableiste, die
// 24px ueber der Unterkante schwebt, waere das der Fall.
//
// Die Masse dafuer meldet das System als env(safe-area-inset-*), gemeinsam mit
// viewport-fit=cover in index.html. Sie stehen hier als Polsterung des
// aeussersten Kastens, nicht an den einzelnen Leisten: die Bildschirme sind
// alle absolut in diesem Kasten positioniert und ruecken deshalb geschlossen
// mit. Der Hintergrund fuellt die Polsterung mit aus, es entsteht kein Rand.
//
// Oben wird bewusst nicht gepolstert. Die Bildschirme setzen ihre
// Ueberschriften ohnehin 64px unter die Oberkante - das ist der Platz, den die
// Statusleiste im Entwurf einnimmt. Ein zusaetzlicher Abstand waere doppelt.
//
// Am Schreibtisch und in der Design-Vorschau iphone.html sind alle Werte 0;
// dort aendert sich dadurch nichts.
const SICHER = {
  position: 'absolute',
  inset: 0,
  paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  paddingLeft: 'env(safe-area-inset-left, 0px)',
  paddingRight: 'env(safe-area-inset-right, 0px)',
};

// Ab dieser Viewport-Breite wird zweispaltig dargestellt: Liste links,
// Dokument-Detail rechts daneben statt als aufgeschobener Vollbild-Screen.
const WIDE_MIN = 900;
// Breite der Listenspalte im Split-View.
const PANE_W = 380;
// Paperless kennt keine Favoriten. Die App bildet sie auf ein Schlagwort ab;
// wie es heisst, entscheidet ordnung.js - dort stehen die Stammdaten.
const FAV_TAG = DWOrdnung.FAV_TAG;
// Standardansicht der Dokumentliste. Sie ueberlebt jetzt den Neustart - vorher
// stand beim Start immer wieder 'liste', die Einstellung war also folgenlos.
const DEFVIEW_KEY = 'docuwunder.defaultAnsicht';
const DEFVIEW_START = (() => {
  try { return localStorage.getItem(DEFVIEW_KEY) === 'raster' ? 'raster' : 'liste'; }
  catch (e) { return 'liste'; }
})();
function defViewSichern(wert) {
  try { localStorage.setItem(DEFVIEW_KEY, wert); } catch (e) { /* Privatmodus: dann eben nur fuer diese Sitzung */ }
}
// Wie viele Dokumente eine Serverseite umfasst. Bewusst klein: gefiltert und
// sortiert wird auf dem Server, weitere Seiten holt die Liste beim Blaettern
// nach. Ein grosser Wert wuerde nur den ersten Aufbau verzoegern.
const DOC_PAGE = 60;
// Wie viele Dokumente hoechstens gleichzeitig in einer Liste stehen.
//
// Nicht willkuerlich, sondern gemessen (docs/AUDIT.md, K-3): die Liste braucht
// rund 29 DOM-Knoten je Dokument und rechnet streng linear. 1.200 Dokumente
// sind knapp 35.000 Knoten und noch bedienbar; 20.000 waeren 580.000 Knoten
// und zehn Sekunden Rendern.
//
// Das ist eine Bremse, keine Loesung - die Loesung ist Fensterung der Liste
// (Meilenstein C). Bis dahin ist eine ehrliche Grenze besser als eine App,
// die stehenbleibt.
const DOC_MAX = 1200;
// Eintraege der Startseiten-Listen.
const HOME_N = 8;
// Sortierung der Oberflaeche -> ordering-Parameter der API.
const SORT_API = { neu: '-created', alt: 'created', titel: 'title', absender: 'correspondent__name' };

// Der Quelltext. Steht hier, weil ihn zwei Stellen brauchen: die Hilfe und
// der Datenschutzhinweis.
const PROJEKT_URL = 'https://github.com/DamienDrash/docuwunder';

// Wie weit sich der Inhalt hoechstens ziehen laesst und ab wann Loslassen neu
// laedt. Die Schwelle liegt deutlich unter dem Maximum: wer zieht, soll den
// Punkt erreichen, ohne zu zerren.
const ZIEH_MAX = 96;
const ZIEH_SCHWELLE = 62;

// Ab wie viel waagerechtem Weg im Posteingang weitergeblaettert wird.
const REV_SCHWELLE = 64;
// Ein Dokument steht je nach Bildschirm in mehreren Listen zugleich. Eine
// Aenderung muss in allen ankommen, sonst zeigen zwei Bildschirme
// gleichzeitig verschiedene Staende desselben Dokuments.
const DOC_LISTEN = ['docs', 'recent', 'favs', 'geteiltL', 'inbox', 'qRes'];

class Oberflaeche extends React.Component {
  constructor(p) {
    super(p);
    this.state = {
      // Viewport-Breite; steuert ueber isWide() den Split-View.
      vw: (typeof window !== 'undefined' ? window.innerWidth : 1440),
      // Das Serverfeld startet mit der eigenen Origin vorbelegt, weil App und
      // Paperless hier gemeinsam ausgeliefert werden - im Regelfall muss dort
      // nichts geaendert werden.
      screenSet: null, onbStep: 0,
      onbServer: window.PaperlessAPI ? window.PaperlessAPI.getBase().replace(/\/api$/, '') : '',
      onbUser: '', onbPass: '', onbToken: '', onbErr: '', onbChecking: false, onbFremdOk: null, onbAdv: false, onbTok: false, shAblauf: '7 Tage', shRecht: 'Kann ansehen',
      mode: 'system', ...this.startZiel(), sheet: null, pickTarget: null, pickField: null, pendingDel: null,
      view: DEFVIEW_START, sort: 'neu', selMode: false, sel: [],
      fArt: null, fFav: false, fAbs: [], fTags: [], fZeit: 'alle',
      // Eingabe, Verlauf und Treffer der Serversuche. Was dazugehoert, steht
      // in suche.js.
      ...DWSuche.start(),
      opened: [], docTab: 'vorschau', fund: false, revIdx: 0,
      // Scannen und Hochladen: der laufende Scan und was gerade zum Server
      // unterwegs ist. Was dazugehoert, steht in erfassen.js.
      ...DWErfassen.start(),
      zieh: null, revZieh: null,
      toast: null, undoFn: null, undoLabel: 'Widerrufen', swipe: null,
      editDraft: null,
      // Stammdaten und Ordner: der Entwurf des Bearbeiten-Blattes, das Feld
      // "Neu erstellen ..." und die beiden Ordnerstellen. Was dazugehoert,
      // steht in ordnung.js.
      ...DWOrdnung.start(),
      // --- Daten aus der API -------------------------------------------
      // Alles hier wird beim Start aus Paperless geladen (siehe loadAll).
      // Die Oberflaeche arbeitet weiterhin mit der bisherigen internen
      // Dokumentform; mapDoc() uebersetzt die API-Antwort dorthin.
      //
      // docs ist die serverseitig gefilterte und sortierte Liste des
      // Dokumente-Tabs - immer nur die bisher geladenen Seiten. recent, favs
      // und geteiltL haengen nicht an diesen Filtern und werden getrennt
      // geholt, damit die Startseite nicht mitfiltert.
      docs: [], recent: [], favs: [], geteiltL: [], inbox: [], trash: [],
      docsPage: 1, docsMore: false, docsBusy: false,
      // Jedes je geladene Dokument, id -> interne Form. Detailansicht,
      // "Zuletzt geoeffnet" und Suchtreffer greifen darauf zu, auch wenn das
      // Dokument in keiner der aktuellen Listen mehr steht.
      cache: {},
      // Vorschau des geoeffneten Dokuments (Blob-URL) und der Zaehler, der ein
      // fertiges Vorschaubild anzeigt. Was dazugehoert, steht in vorschau.js.
      ...DWVorschau.start(),
      // Namenslisten fuer Auswahlmenues.
      tagsM: [], absM: [], artenM: [], orteM: [],
      // Rohdaten und Nachschlagetabellen (Name <-> id), von mapDoc gebraucht.
      tagsRaw: [], absRaw: [], artenRaw: [], orteRaw: [],
      users: [],
      // Eigene Felder und gespeicherte Ansichten.
      felderM: [], suchenM: [],
      // Automatisierungen, E-Mail-Import, Verarbeitungsaufgaben und
      // Systemstatus. Was dazugehoert, steht in betrieb.js.
      ...DWBetrieb.start(),
      // Team fuer die Zuweisung und deren Laufzustand.
      gruppen: [], zuweisenBusy: false,
      // Mitgliederverwaltung: Entwurf, einmalig gezeigte Zugangsdaten,
      // Gruppen- und Personenauswahl. Was dazugehoert, steht in mitglieder.js.
      ...DWMitglieder.start(),
      // Wie viele Dokumente der aktuelle Filter serverseitig umfasst - nicht,
      // wie viele geladen sind.
      docsTotal: 0,
      // Freigaben je Dokument-id, aus /api/share_links/.
      shares: {},
      // Ladezustand der Erstbefuellung und Fehler daraus.
      loading: true, loadErr: null,
      // Angemeldeter Benutzer (aus /api/ui_settings/).
      me: null,
      // Sperre: ist sie eingerichtet, muss beim Start entsperrt werden.
      sperreAn: !!(window.DWSperre && window.DWSperre.eingerichtet()),
      sperreOffen: false, sperreMoeglich: false, sperreFehler: '', sperreBusy: false,
      // Serveradresse, die im Onboarding geprueft wurde.
      serverUrl: window.PaperlessAPI ? window.PaperlessAPI.getBase() : '',
    };
    this._t = [];
    // Die geladenen Vorschaubilder liegen neben dem Zustand, nicht darin -
    // warum, steht in vorschau.js.
    Object.assign(this, DWVorschau.speicher());
  }
  componentWillUnmount() {
    this._t.forEach(clearTimeout);
    if (this._rs) window.removeEventListener('resize', this._rs);
    if (this._esc) window.removeEventListener('keydown', this._esc);
    // Die Gestenzuhoerer haengen am Dokument, nicht an einem Element, das
    // React mit abraeumt - sie muessen von Hand wieder weg.
    [['touchstart', this._ziehAn], ['touchmove', this._ziehZug],
     ['touchend', this._ziehAus], ['touchcancel', this._ziehAus],
     ['touchstart', this._revAn], ['touchmove', this._revZug],
     ['touchend', this._revAus], ['touchcancel', this._revAus]]
      .forEach(([art, fn]) => { if (fn) document.removeEventListener(art, fn); });
    this.sucheAbbrechen();
    this.vorschauFrei();
  }
  // Womit die App startet. Normalerweise die Uebersicht - die Kurzbefehle des
  // Manifests (langes Antippen des Symbols) haengen aber ein ?tab= an und
  // wollen woanders hin. Wird im Konstruktor gebraucht, also ohne this.state.
  startZiel() {
    const leer = { tab: 'home', stack: [] };
    if (typeof location === 'undefined') return leer;
    let ziel;
    try { ziel = new URLSearchParams(location.search).get('tab'); } catch (e) { return leer; }
    // Die Suche ist kein Tab, sondern ein aufgeschobener Bildschirm ueber der
    // Uebersicht - deshalb hier ein Stapel statt eines Tabnamens.
    if (ziel === 'suche') return { tab: 'home', stack: [{ t: 'search' }] };
    return ['home', 'docs', 'inbox', 'more'].includes(ziel) ? { tab: ziel, stack: [] } : leer;
  }

  componentDidMount() {
    this.reportDark();
    this.adresseAufraeumen();
    // Ziehen zum Aktualisieren auf Beruehrungsgeraeten. Am Dokument statt am
    // Behaelter, weil React die Behaelter neu erzeugt - die Geste soll das
    // nicht merken.
    this._ziehAn = (e) => this.ziehTouchStart(e);
    this._ziehZug = (e) => this.ziehTouchZug(e);
    this._ziehAus = () => this.ziehEnde();
    document.addEventListener('touchstart', this._ziehAn, { passive: true });
    document.addEventListener('touchmove', this._ziehZug, { passive: false });
    document.addEventListener('touchend', this._ziehAus, { passive: true });
    document.addEventListener('touchcancel', this._ziehAus, { passive: true });
    // Blaettern im Posteingang - aus demselben Grund nicht passiv: sonst
    // scrollt der Browser waagerecht mit, statt uns die Bewegung zu geben.
    this._revAn = (e) => {
      const z = e.target && e.target.closest ? e.target.closest('[data-rev]') : null;
      if (z && e.touches && e.touches.length === 1) this.revZiehStart(e.touches[0].clientX, e.touches[0].clientY);
    };
    this._revZug = (e) => {
      if (!e.touches || e.touches.length !== 1) return;
      this.revZiehZug(e.touches[0].clientX, e.touches[0].clientY, () => { if (e.cancelable) e.preventDefault(); });
    };
    this._revAus = () => this.revZiehEnde();
    document.addEventListener('touchstart', this._revAn, { passive: true });
    document.addEventListener('touchmove', this._revZug, { passive: false });
    document.addEventListener('touchend', this._revAus, { passive: true });
    document.addEventListener('touchcancel', this._revAus, { passive: true });
    this._rs = () => { const w = window.innerWidth; if (w !== this.state.vw) this.setState({ vw: w }); };
    window.addEventListener('resize', this._rs);

    // Escape schliesst die oberste Ebene. Am Telefon gibt es keine Tastatur,
    // im Split-View am Desktop erwartet man es aber - ohne das bleibt ein
    // Sheet offen und sein Hintergrund faengt jeden weiteren Klick ab.
    this._esc = (e) => {
      if (e.key !== 'Escape') return;
      const s = this.state;
      if (s.sheet) { this.setState({ sheet: null, editDraft: null, pendingDel: null, ...DWOrdnung.beimSchliessen(), ...DWMitglieder.beimSchliessen() }); return; }
      if (s.scan) { this.setState({ scan: null }); return; }
      if (s.selMode) { this.setState({ selMode: false, sel: [] }); return; }
      if (s.stack.length) this.pop();
    };
    window.addEventListener('keydown', this._esc);

    const A = this.api();
    if (!A) { this.setState({ loading: false, loadErr: 'api.js wurde nicht geladen.' }); return; }

    // Kann dieses Geraet die Sperre ueberhaupt? Erst danach darf sie
    // angeboten werden - eine Sperre, die nicht traegt, waere ein leeres
    // Versprechen.
    if (window.DWSperre) {
      window.DWSperre.moeglich().then(m => this.setState({ sperreMoeglich: m }));
      // Ist sie eingerichtet, liegt der Schluessel nur verschluesselt vor.
      // Ohne Entsperren gibt es nichts zu laden.
      if (window.DWSperre.eingerichtet() && !A.hasToken()) {
        this.setState({ sperreOffen: true, loading: false });
        return;
      }
    }
    // Laeuft der Token ab oder wird er serverseitig entzogen, landet der
    // naechste Aufruf bei 401 - dann zurueck ins Onboarding statt leerer Listen.
    A.onUnauthorized = () => {
      A.logout();
      this.setState({ screenSet: 'onb', onbStep: 2, onbErr: 'Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.', stack: [], loading: false });
    };
    this.loadAll();
  }
  componentDidUpdate() {
    this.reportDark();
    // Beides treibt vorschau.js an: die Bilder der Listen holen sich nach, was
    // sichtbar geworden ist, und die Detailvorschau folgt dem Dokument, das
    // gerade oben auf dem Stapel liegt.
    this.bilderNachladen();
    this.vorschauFolgen();
  }
  // Das ?tab= eines Kurzbefehls hat seinen Zweck erfuellt, sobald der
  // Startzustand steht. Bliebe es stehen, landete jedes spaetere Neuladen
  // wieder dort - und ein Lesezeichen auf die App zeigte auf den Posteingang
  // statt auf die App.
  adresseAufraeumen() {
    try {
      const u = new URL(location.href);
      if (!u.searchParams.has('tab')) return;
      u.searchParams.delete('tab');
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch (e) { /* geht es nicht, bleibt der Parameter eben stehen */ }
  }
  // Rueckkanal an index.html: leiste() faerbt damit beide theme-color-Angaben
  // auf das Schema, das in der App tatsaechlich gilt. Ohne das stuende eine
  // helle Systemleiste ueber einer dunklen Oberflaeche.
  reportDark() { const cb = this.props.onDark || this.props.ondark; if (typeof cb !== 'function') return; const d = this.isDark(); if (this._lastDark === d) return; this._lastDark = d; cb(d); }
  later(fn, ms) { this._t.push(setTimeout(fn, ms)); }
  top() { const s = this.state.stack; return s.length ? s[s.length - 1] : null; }
  // --- Split-View ---------------------------------------------------------
  isWide() { return (this.state.vw || 0) >= WIDE_MIN; }
  // Im Split-View belegt ein offenes Dokument die rechte Spalte und verdeckt
  // die linke nicht. Fuer die Sichtbarkeit der linken Spalte (Tabs, Tableiste)
  // darf es deshalb nicht als aufgeschobener Screen zaehlen.
  navStack() {
    const st = this.state.stack;
    return (this.isWide() && st.length && st[st.length - 1].t === 'doc') ? st.slice(0, -1) : st;
  }

  // --- Datenanbindung -----------------------------------------------------
  api() { return window.PaperlessAPI; }

  // Nachschlagetabellen id -> Objekt, aus den geladenen Stammdaten.
  lkFrom(tags, corr, typ, ort) {
    const byId = (arr) => { const m = {}; (arr || []).forEach(x => { m[x.id] = x; }); return m; };
    return { tag: byId(tags), corr: byId(corr), typ: byId(typ), ablageort: byId(ort) };
  }
  lookups() {
    const s = this.state;
    return this.lkFrom(s.tagsRaw, s.absRaw, s.artenRaw, s.orteRaw);
  }

  // Schlagwoerter, die Paperless als Posteingang fuehrt. Ohne solches
  // Schlagwort gibt es serverseitig keinen Posteingang - dann bleibt der
  // Bildschirm leer, statt willkuerlich Dokumente einzusortieren.
  inboxTagIds() { return (this.state.tagsRaw || []).filter(t => t.is_inbox_tag).map(t => t.id); }

  idVonName(topf, name) {
    const e = (this.state[topf] || []).find(x => x.name === name);
    return e ? e.id : null;
  }
  idsVonNamen(topf, namen) {
    return (namen || []).map(n => this.idVonName(topf, n)).filter(id => id != null);
  }

  // Neuer Dokument-Cache aus dem bisherigen Stand plus den uebergebenen
  // Dokumenten. Immer innerhalb eines setState(prev => …) benutzen, damit
  // parallele Ladevorgaenge sich nicht gegenseitig ueberschreiben.
  mitCache(prev, listen) {
    const c = Object.assign({}, prev.cache);
    listen.forEach(d => { if (d && d.id != null) c[d.id] = d; });
    return c;
  }
  docById(id) {
    const s = this.state;
    return s.cache[id] || s.trash.find(d => d.id === id) || null;
  }

  // Uebersetzt ein API-Dokument in die interne Form der Oberflaeche. Dadurch
  // bleiben Template und Darstellungslogik unveraendert.
  //
  // Zwei Felder haben in Paperless keine direkte Entsprechung:
  //   fav     - Paperless kennt keine Favoriten; abgebildet auf das Schlagwort
  //             FAV_TAG, das in der Schlagwortliste ausgeblendet wird.
  //   geteilt - ergibt sich aus vorhandenen Freigabelinks (/api/share_links/).
  // Eine Fassung fuer alle: die Uebersetzung steht in logik.js und wird dort
  // ohne Browser geprueft. Vorher lag hier eine zweite Kopie - die Tests
  // pruefte die eine, laufen tat die andere.
  mapDoc(d, lk, shares) { return DWLogik.mapDoc(d, lk, shares, FAV_TAG); }


  // Posteingang-Eintrag: dieselbe Grundform, plus die Felder fuer den
  // Pruef-Screen. Die Vorschlaege kommen erst beim Oeffnen dazu (ladeVorschlag).
  mapInbox(d, lk, shares) {
    const A = this.api(), doc = this.mapDoc(d, lk, shares);
    return Object.assign(doc, {
      quelle: d.original_file_name || 'Import',
      hinzugefuegt: A.util.relDE(d.added),
      dup: (d.duplicate_documents || []).length > 0,
      dupRef: (d.duplicate_documents || []).length ? 'Aehnelt einem bereits vorhandenen Dokument' : '',
      felder: this.felderAus(doc, null)
    });
  }

  // Baut die Feldliste des Pruef-Screens aus vorhandenen Werten und - sofern
  // schon geladen - den Vorschlaegen des Servers.
  felderAus(doc, vor) { return DWLogik.felderAus(doc, vor); }


  // Erstbefuellung: Stammdaten, dann Dokumente.
  loadAll() {
    const A = this.api();
    if (!A || !A.hasToken()) { this.setState({ loading: false }); return Promise.resolve(); }
    this.setState({ loading: true, loadErr: null });
    // Nebensaechliche Listen duerfen fehlschlagen, ohne den Start zu verhindern
    // (z. B. wenn dem Konto Rechte fuer Workflows oder Benutzer fehlen).
    const weich = (pr) => pr.catch(() => []);
    return Promise.all([
      A.tags.all(), A.correspondents.all(), A.documentTypes.all(), A.storagePaths.all(),
      A.uiSettings().catch(() => null), weich(A.shareLinks.all()), weich(A.users.all()),
      weich(A.workflows.all()), weich(A.customFields.all()), weich(A.savedViews.all()), weich(A.groups.all()),
      weich(A.mailRules.all()), weich(A.mailKonten.all()), A.statistics().catch(() => null), A.remoteVersion().catch(() => null)
    ]).then(([tags, corr, typ, ort, ui, links, users, flows, felder, sichten, gruppen, regeln, mailKonten, stats, ver]) => {
      // Automatisierungen, E-Mail-Import und Systemstatus formt betrieb.js aus
      // denselben Rohantworten - was davon wie aussieht, entscheidet sich dort.
      this.setState(Object.assign({
        felderM: felder.map(f => ({ name: f.name, typ: this.feldTyp(f.data_type), n: f.document_count || 0 })),
        suchenM: sichten.map(v => ({ id: v.id, name: v.name, q: this.sichtQuery(v) })),
        gruppen: gruppen.map(g => ({ id: g.id, name: g.name }))
      }, this.betriebAus({ flows, regeln, konten: mailKonten, stats, ver, ui })));
      const shares = {};
      links.forEach(l => {
        shares[l.document] = {
          id: l.id,
          link: this.shareHref(l.slug),
          ablauf: l.expiration ? ('bis ' + A.util.dateDE(l.expiration)) : 'Ohne Ablauf',
          recht: 'Kann ansehen'
        };
      });
      const namen = (a) => a.map(x => x.name).sort((x, y) => x.localeCompare(y, 'de'));
      // Die Dokumentabfragen brauchen die Nachschlagetabellen und die
      // Posteingang-Schlagwoerter. Deshalb erst den Zustand setzen und dessen
      // Rueckruf abwarten, statt die Tabellen durch alle Aufrufe zu reichen.
      return new Promise(fertig => this.setState({
        tagsRaw: tags, absRaw: corr, artenRaw: typ, orteRaw: ort, shares,
        tagsM: namen(tags.filter(t => t.name !== FAV_TAG)),
        absM: namen(corr), artenM: namen(typ), orteM: namen(ort),
        me: ui && ui.user ? ui.user : null,
        users: users.map(u => ({
          // id wird zum Zuweisen gebraucht (owner) - ohne sie liesse sich der
          // Besitz nicht uebertragen.
          id: u.id,
          // Der Anmeldename wird zur Kollisionspruefung beim Anlegen gebraucht:
          // ohne ihn schlug benutzernameAus() jeden Namen als frei vor, und der
          // Server lehnte danach mit 400 ab.
          username: u.username,
          // Gruppenzugehoerigkeit wird im Bildschirm "Benutzer & Gruppen" angezeigt
          // und dort auch geaendert.
          groups: u.groups || [],
          // Initialen: bei fehlendem Nachnamen liefert ''[0] undefined, das sich
          // sonst an den Vornamen anhaengt ("DUNDEFINED"). Deshalb charAt.
          ini: this.initialen(u.first_name, u.last_name, u.username),
          name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username,
          rolle: u.is_superuser ? 'Administrator' : 'Kann bearbeiten'
        }))
      }, fertig));
    }).then(() => this.reloadDocs()).catch(e => {
      this.setState({ loading: false, loadErr: (e && e.message) || 'Daten konnten nicht geladen werden.' });
    });
  }

  feldTyp(t) { return DWLogik.feldTyp(t); }

  // Automatisierungen, E-Mail-Regeln, Aufgaben und Systemstatus stehen in
  // betrieb.js. Von hier aus fuehrt nur betriebAus() hinein (loadAll formt
  // damit die Rohantworten) und beimAbmelden() hinaus.

  // Oeffentliche Adresse eines Freigabelinks. Die API liefert nur den slug.
  shareHref(slug) {
    try { return new URL('../paperless/share/' + slug, location.href).toString().replace(/^https?:\/\//, ''); }
    catch (e) { return 'share/' + slug; }
  }

  // Uebersetzt Filter und Sortierung der Oberflaeche in Query-Parameter.
  //
  // Gefiltert und sortiert wird auf dem Server. Lokal zu filtern waere eine
  // Aussage ueber den gesamten Bestand, die die App gar nicht treffen kann:
  // sie kennt immer nur die geladenen Seiten.
  //
  // Liefert null, wenn ein Filter mit den vorhandenen Stammdaten unmoeglich
  // ist - etwa Favoriten, solange das Schlagwort noch niemand vergeben hat.
  // Das ist etwas anderes als "kein Filter" und darf nicht alles anzeigen.
  docParams(seite) {
    const s = this.state;
    const p = { page: seite || 1, page_size: DOC_PAGE, ordering: SORT_API[s.sort] || '-created' };

    const inbox = this.inboxTagIds();
    if (inbox.length) p.tags__id__none = inbox;

    // tags__id__in verknuepft mit ODER, tags__id__all mit UND. Die
    // Schlagwort-Chips waehlen wie bisher mit ODER; "Favorit" ist eine
    // zusaetzliche Bedingung und gehoert deshalb zu __all.
    if (s.fTags.length) {
      const ids = this.idsVonNamen('tagsRaw', s.fTags);
      if (!ids.length) return null;
      p.tags__id__in = ids;
    }
    if (s.fFav) {
      const fav = this.idVonName('tagsRaw', FAV_TAG);
      if (fav == null) return null;
      p.tags__id__all = [fav];
    }
    if (s.fAbs.length) {
      const ids = this.idsVonNamen('absRaw', s.fAbs);
      if (!ids.length) return null;
      p.correspondent__id__in = ids;
    }
    if (s.fArt) {
      const id = this.idVonName('artenRaw', s.fArt);
      if (id == null) return null;
      p.document_type__id__in = [id];
    }
    if (s.fZeit !== 'alle') p.created__year = s.fZeit;
    return p;
  }

  // Dokumentenliste des Dokumente-Tabs. anhaengen=true holt die naechste
  // Seite und haengt sie an, sonst beginnt die Liste von vorn.
  ladeDocs(anhaengen) {
    const A = this.api();
    if (!A || !A.hasToken()) return Promise.resolve();
    const seite = anhaengen ? this.state.docsPage + 1 : 1;
    const p = this.docParams(seite);
    if (!p) {
      this.setState({ docs: [], docsTotal: 0, docsMore: false, docsBusy: false, loading: false, loadErr: null });
      return Promise.resolve();
    }
    // Beim schnellen Umschalten von Filtern koennte eine aeltere Antwort nach
    // einer neueren eintreffen. Nur die jeweils letzte Anfrage zaehlt.
    const lauf = (this._docLauf = (this._docLauf || 0) + 1);
    this.setState({ docsBusy: true, loadErr: null });
    const lk = this.lookups();

    return A.documents.list(p).then(d => {
      if (lauf !== this._docLauf) return;
      const neu = (d.results || []).map(x => this.mapDoc(x, lk, this.state.shares));
      this.setState(s => ({
        docs: anhaengen ? s.docs.concat(neu) : neu,
        cache: this.mitCache(s, neu),
        docsPage: seite,
        docsTotal: d.count || 0,
        docsMore: !!d.next,
        docsBusy: false, loading: false, loadErr: null
      }));
    }).catch(e => {
      if (lauf !== this._docLauf || (e && e.aborted)) return;
      this.setState({ docsBusy: false, loading: false, loadErr: (e && e.message) || 'Dokumente konnten nicht geladen werden.' });
    });
  }

  mehrDocs() {
    if (this.state.docsBusy || !this.state.docsMore) return;
    this.ladeDocs(true);
  }

  // Filter oder Sortierung geaendert: Liste vom Server neu holen.
  setzeFilter(patch) { this.setState(patch, () => this.ladeDocs(false)); }

  // Listen neben dem Dokumente-Tab: Startseite, Favoriten, Geteilt,
  // Posteingang und Papierkorb. Sie folgen den Filtern des Dokumente-Tabs
  // absichtlich nicht und werden deshalb getrennt geholt.
  // Initialen einer Person. Vor- und Nachname, sonst die ersten zwei Zeichen
  // des Benutzernamens - eine Regel fuer die ganze App.
  initialen(vor, nach, benutzername) { return DWLogik.initialen(vor, nach, benutzername); }


  // --- Sperre --------------------------------------------------------------
  entsperrenGo() {
    const A = this.api();
    this.setState({ sperreBusy: true, sperreFehler: '' });
    window.DWSperre.entsperren().then(token => {
      // Fluechtig: der Schluessel bleibt nur im Speicher, abgelegt ist er
      // ausschliesslich verschluesselt.
      A.setToken(token, true);
      this.setState({ sperreOffen: false, sperreBusy: false, loading: true });
      this.loadAll();
    }).catch(e => {
      this.setState({
        sperreBusy: false,
        sperreFehler: e && e.name === 'NotAllowedError'
          ? 'Nicht bestätigt. Versuche es erneut.'
          : (e && e.message) || 'Entsperren fehlgeschlagen.',
      });
    });
  }

  sperreEinrichten() {
    const A = this.api();
    if (!A.hasToken()) { this.note('Erst anmelden.'); return; }
    this.setState({ sperreBusy: true });
    const name = this.state.me ? this.state.me.username : 'DocuWunder';
    window.DWSperre.einrichten(A.rohToken(), name).then(() => {
      // Ab jetzt liegt der Schluessel nur noch verschluesselt.
      A.setToken(A.rohToken(), true);
      this.setState({ sperreAn: true, sperreBusy: false });
      this.note('Entsperren beim Öffnen ist aktiv');
    }).catch(e => {
      this.setState({ sperreBusy: false });
      this.note(e && e.name === 'PrfFehlt'
        ? 'Dieses Gerät unterstützt die nötige Verschlüsselung nicht.'
        : 'Nicht eingerichtet: ' + ((e && e.message) || 'abgebrochen'));
    });
  }

  sperreAufheben() {
    const A = this.api();
    window.DWSperre.aufheben();
    // Zurueck in die normale Ablage, sonst waere der Zugang nach dem
    // naechsten Start verloren.
    A.setToken(A.rohToken(), false);
    this.setState({ sperreAn: false });
    this.note('Entsperren beim Öffnen ist aus');
  }

  // --- Zuweisen -----------------------------------------------------------
  // Ein Dokument einer Person aus dem Team uebergeben, sodass es in deren
  // Posteingang auftaucht.
  //
  // Umgesetzt ueber das Rechtemodell von Paperless:
  //   - Besitz geht an die Person (owner). Danach filtert ihr Posteingang
  //     serverseitig ueber owner__id - das kann Paperless nativ.
  //   - Der Zuweisende behaelt ausdruecklich Lese- und Schreibrecht, verliert
  //     also nichts durch die Uebergabe.
  //   - Das Posteingang-Schlagwort kommt dazu, damit es dort landet und nicht
  //     nur irgendwo in der Bibliothek.
  //
  // Gruppen koennen in Paperless nicht Besitzer sein. Bei einer Gruppe bleibt
  // der Besitz deshalb beim Zuweisenden und die Gruppe bekommt Lese- und
  // Schreibrecht.
  zuweisen(docId, ziel) {
    const A = this.api();
    const ich = this.state.me ? this.state.me.id : null;
    const doc = this.docById(docId);
    if (!doc || !ziel) return Promise.resolve();

    this.setState({ zuweisenBusy: true });
    return this.posteingangTagId().then(inboxId => {
      const patch = {};
      if (ziel.typ === 'user') {
        patch.owner = ziel.id;
        patch.set_permissions = {
          view: { users: ich ? [ich] : [], groups: [] },
          change: { users: ich ? [ich] : [], groups: [] }
        };
      } else {
        patch.set_permissions = {
          view: { users: ich ? [ich] : [], groups: [ziel.id] },
          change: { users: ich ? [ich] : [], groups: [ziel.id] }
        };
      }
      const tags = (doc.raw.tags || []).slice();
      if (inboxId != null && tags.indexOf(inboxId) < 0) tags.push(inboxId);
      patch.tags = tags;
      return A.documents.update(docId, patch);
    }).then(() => {
      this.setState({ zuweisenBusy: false, sheet: null, stack: [] });
      this.note('„' + doc.titel + '“ an ' + ziel.name + ' übergeben');
      return this.loadAll();
    }).catch(e => {
      this.setState({ zuweisenBusy: false });
      this.note('Zuweisen fehlgeschlagen: ' + e.message);
    });
  }

  // Liefert die id des Posteingang-Schlagworts und legt es an, falls keines
  // existiert. Ohne ein solches Schlagwort haette Paperless keinen Posteingang.
  posteingangTagId() {
    const A = this.api();
    const da = (this.state.tagsRaw || []).find(t => t.is_inbox_tag);
    if (da) return Promise.resolve(da.id);
    return A.tags.create('Posteingang', { is_inbox_tag: true, color: '#ff9500' })
      .then(t => {
        this.setState(s => ({ tagsRaw: [...s.tagsRaw, t] }));
        return t.id;
      })
      .catch(() => null);
  }

  // Die Ordner stehen in ordnung.js. Sie sind keine eigene Serverart: die
  // Hierarchie wird aus den Namen der Ablageorte abgeleitet, und was dabei zu
  // beachten ist, steht dort.

  ladeNeben() {
    const A = this.api();
    if (!A || !A.hasToken()) return Promise.resolve();
    const lk = this.lookups(), shares = this.state.shares;
    const inbox = this.inboxTagIds();
    const ohneInbox = inbox.length ? { tags__id__none: inbox } : {};
    const favId = this.idVonName('tagsRaw', FAV_TAG);
    const geteiltIds = Object.keys(shares).map(Number).filter(n => !isNaN(n));
    const leer = { results: [], count: 0 };
    // Nebenlisten duerfen fehlschlagen, ohne die Startseite zu blockieren.
    const weich = (pr) => pr.catch(() => leer);

    return Promise.all([
      weich(A.documents.list(Object.assign({ ordering: '-added', page_size: HOME_N }, ohneInbox))),
      favId != null
        ? weich(A.documents.list(Object.assign({ tags__id__all: [favId], ordering: '-created', page_size: DOC_PAGE }, ohneInbox)))
        : Promise.resolve(leer),
      geteiltIds.length
        ? weich(A.documents.list({ id__in: geteiltIds, ordering: '-created', page_size: DOC_PAGE }))
        : Promise.resolve(leer),
      // Der eigene Posteingang: was mir gehoert ODER noch niemandem.
      //
      // Der Eigentuemer entscheidet, wessen Posteingang es ist - nach der
      // Uebergabe an eine Person soll nur sie es sehen. Herrenlose Dokumente
      // gehoeren aber allen: was ueber den consume-Ordner oder per E-Mail
      // hereinkommt, hat keinen Eigentuemer. Nur auf owner__id zu filtern
      // hiess deshalb, dass genau diese Dokumente nie irgendwo auftauchten -
      // der Posteingang blieb leer, obwohl der Server ein Dokument darin
      // hatte. Paperless zieht dieselbe Grenze (siehe documents/filters.py:
      // objects_owned und objects_unowned).
      //
      // Zwei Abfragen, weil Filter serverseitig mit UND verknuepft werden.
      inbox.length
        ? Promise.all([
            weich(A.documents.list(Object.assign(
              { tags__id__in: inbox, ordering: '-added', page_size: DOC_PAGE },
              this.state.me ? { owner__id: this.state.me.id } : {}))),
            weich(A.documents.list({ tags__id__in: inbox, owner__isnull: true, ordering: '-added', page_size: DOC_PAGE })),
          ]).then(([meine, herrenlos]) => {
            const zusammen = (meine.results || []).concat(herrenlos.results || []);
            const gesehen = new Set();
            return { results: zusammen
              .filter(d => (gesehen.has(d.id) ? false : gesehen.add(d.id)))
              .sort((a, b) => String(b.added || '').localeCompare(String(a.added || '')))
              .slice(0, DOC_PAGE) };
          })
        : Promise.resolve(leer),
      weich(A.trash.list({ page_size: DOC_PAGE }))
    ]).then(([neu, fav, geteilt, post, papier]) => {
      const m = (r) => (r.results || []).map(d => this.mapDoc(d, lk, shares));
      const recent = m(neu), favs = m(fav), geteiltL = m(geteilt);
      const ib = (post.results || []).map(d => this.mapInbox(d, lk, shares));
      const trash = (papier.results || []).map(d => Object.assign(this.mapDoc(d, lk, shares), {
        gel: d.deleted_at ? ('Gelöscht am ' + A.util.dateDE(d.deleted_at)) : 'Gelöscht',
        rest: 'Wird nach Ablauf der Frist endgültig gelöscht'
      }));
      this.setState(s => ({
        recent, favs, geteiltL, inbox: ib, trash,
        // Papierkorb bewusst nicht in den Cache: dort gilt eine andere Form
        // (gel/rest) und die Dokumente sind nicht mehr regulaer erreichbar.
        cache: this.mitCache(s, recent.concat(favs, geteiltL, ib)),
        revIdx: Math.min(s.revIdx, Math.max(0, ib.length - 1))
      }));
    }).catch(() => {
      // Die Nebenlisten duerfen den Aufrufer nicht mitreissen: der wartet in
      // der Regel darauf, um danach eine Erfolgsmeldung zu zeigen.
    });
  }

  // Alles neu laden, was Dokumente zeigt. Wird nach jedem Schreibvorgang
  // aufgerufen, damit App und Server nicht auseinanderlaufen.
  reloadDocs() {
    return Promise.all([this.ladeDocs(false), this.ladeNeben()]).then(() => undefined);
  }

  // Die Verarbeitungsaufgaben stehen in betrieb.js - sie sagen etwas ueber die
  // Warteschlange des Servers, nicht ueber den Bestand.

  // Vorschlaege des Servers fuer einen Posteingang-Eintrag nachladen.
  ladeVorschlag(id) {
    const A = this.api();
    if (this._vorGeladen && this._vorGeladen[id]) return;
    this._vorGeladen = this._vorGeladen || {};
    this._vorGeladen[id] = true;
    A.documents.suggestions(id).then(vor => {
      this.setState(s => ({
        inbox: s.inbox.map(x => x.id === id ? Object.assign({}, x, { felder: this.felderAus(x, vor), vor }) : x)
      }));
    }).catch(e => {
      // Ohne Vorschlaege bleibt der Pruefschirm bedienbar - die Felder sind
      // dann nur leer statt vorbelegt. Die Sperre wird zurueckgenommen, damit
      // ein erneutes Oeffnen es nochmal versucht.
      if (this._vorGeladen) delete this._vorGeladen[id];
      console.warn('[Posteingang] Vorschläge nicht geladen:', e && e.message);
    });
  }
  pushV(o) { this.setState(s => ({ stack: [...s.stack, o] })); }
  pop() { this.setState(s => ({ stack: s.stack.slice(0, -1), sheet: null })); }
  // Kurzmeldung mit optionaler Aktion. Die Beschriftung gehoert dazu: die
  // Aktion ist nicht immer ein Widerruf - nach einem Upload fuehrt sie zum
  // neuen Dokument.
  note(msg, undoFn, label) {
    this.setState({ toast: msg, undoFn: undoFn || null, undoLabel: label || 'Widerrufen' });
    this.later(() => { if (this.state.toast === msg) this.setState({ toast: null, undoFn: null }); }, 4200);
  }
  // Zustand aller Dokumentlisten fuer "Rueckgaengig" bzw. fuer den Fall,
  // dass der Server eine optimistisch gezeigte Aenderung ablehnt.
  snap() {
    const s = this.state, o = { trash: s.trash, cache: s.cache };
    DOC_LISTEN.forEach(k => { o[k] = s[k]; });
    return o;
  }
  // fund=true, wenn das Dokument aus einem Suchtreffer heraus geoeffnet wird:
  // dann zeigt die Detailansicht die Fundstelle hervorgehoben an.
  openDoc(id, fund) { this.setState(s => ({ stack: [...s.stack, { t: 'doc', id }], docTab: 'vorschau', fund: !!fund, opened: [id, ...s.opened.filter(x => x !== id)].slice(0, 4), selMode: false, sel: [] })); }
  isDark() { const s = this.state; return s.mode === 'system' ? (this.props.farbschema ?? 'Hell') === 'Dunkel' : s.mode === 'dunkel'; }
  inboxEff() { return (this.props.posteingangLeer ?? false) ? [] : this.state.inbox; }
  // Ohne Token gibt es nichts zu zeigen - dann startet das Onboarding.
  screenEff() {
    if (this.state.screenSet) return this.state.screenSet;
    const A = this.api();
    return (A && A.hasToken()) ? 'app' : 'onb';
  }
  // Filter und Sortierung stecken in der Serverabfrage (docParams), deshalb
  // ist die geladene Liste bereits die anzuzeigende.
  visDocs() { return this.state.docs; }
  filterAktiv() {
    const s = this.state;
    return !!(s.fArt || s.fFav || s.fAbs.length || s.fTags.length || s.fZeit !== 'alle');
  }
  // Jahre fuer den Zeitfilter: die der geladenen Dokumente, mindestens aber
  // das laufende und das vorige Jahr.
  jahre() {
    const s = this.state, j = new Set();
    s.docs.concat(s.recent).forEach(d => { if (d.tsDatum) j.add(new Date(d.tsDatum).getFullYear()); });
    const jetzt = new Date().getFullYear();
    j.add(jetzt); j.add(jetzt - 1);
    return Array.from(j).sort((a, b) => b - a).slice(0, 6);
  }
  enrich(d) {
    const s = this.state, sel = s.sel.includes(d.id);
    const sw = s.swipe && s.swipe.id === d.id ? s.swipe : null, dx = sw ? sw.dx : 0;
    return { ...d, bild: this.bildFuer(d.id), sub: [d.absender, d.dokumentart].filter(Boolean).join(' · ') || 'Keine Angaben', dShort: this.kurzDatum(d.datum), neu: this.istNeu(d), tags2: d.tags.slice(0, 2).map(n => ({ n })), selMode: s.selMode, selected: sel, unselected: !sel, open: () => this.openDoc(d.id),
      rowStyle: 'display:flex;align-items:center;gap:11px;padding:10px 16px;cursor:pointer;position:relative;background:var(--card);touch-action:pan-y;transform:translateX(' + dx + 'px);transition:' + (sw && sw.drag ? 'none' : 'transform .28s cubic-bezier(.3,.7,.4,1)'),
      pd: (e) => { if (this.state.selMode) return; this.setState({ swipe: { id: d.id, x0: e.clientX, base: dx, dx, drag: true, mv: false } }); },
      pm: (e) => { const w = this.state.swipe; if (w && w.drag && w.id === d.id) { const nx = Math.max(-136, Math.min(0, w.base + e.clientX - w.x0)); this.setState({ swipe: { ...w, dx: nx, mv: w.mv || Math.abs(e.clientX - w.x0) > 6 } }); } },
      pu: () => { const w = this.state.swipe; if (w && w.id === d.id && w.drag) this.setState({ swipe: { ...w, dx: w.dx < -60 ? -136 : 0, drag: false } }); },
      swFav: () => { this.updDoc(d.id, { favorit: !d.favorit }); this.setState({ swipe: null }); },
      swFavLabel: d.favorit ? 'Entfernen' : 'Favorit',
      swDel: () => { this.setState({ swipe: null }); this.deleteDoc(d.id); },
      tap: () => { const w = this.state.swipe; if (w && w.id === d.id && (w.mv || w.dx !== 0)) { this.setState({ swipe: null }); return; } if (w) this.setState({ swipe: null }); if (this.state.selMode) { this.toggleSel(d.id); } else { this.openDoc(d.id); } } };
  }
  toggleSel(id) { this.setState(s => ({ sel: s.sel.includes(id) ? s.sel.filter(x => x !== id) : [...s.sel, id] })); }
  // In der Liste steht wenig Platz: das laufende Jahr bleibt weg.
  kurzDatum(d) { return DWLogik.kurzDatum(d); }
  // "Neu" heisst: in den letzten sieben Tagen aufgenommen.
  istNeu(d) { return DWLogik.istNeu(d); }

  parts(text, q) { return DWLogik.parts(text, q); }

  // --- Suche --------------------------------------------------------------
  // Sie steht in suche.js: Eingabe, Verzoegerung, Serverabfrage, Verlauf und
  // die gespeicherten Ansichten. Von hier aus fuehrt nur sichtQuery() hinein
  // (loadAll benennt damit die gespeicherten Ansichten) und sucheAbbrechen()
  // hinaus (Abmelden und Abbau der Oberflaeche).

  // --- Ordnung ------------------------------------------------------------
  // Die Stammdaten stehen in ordnung.js: was eine Liste zeigt (orgData), wie
  // ein Name zur id wird und bei Bedarf entsteht (idFuer), und was Anlegen,
  // Umbenennen und Loeschen tun.

  tg(on) { return { bg: 'width:51px;height:31px;border-radius:999px;position:relative;cursor:pointer;flex-shrink:0;transition:background .2s;background:' + (on ? 'var(--grn)' : 'var(--fill2)'), knob: 'position:absolute;top:2px;width:27px;height:27px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);transition:left .2s;left:' + (on ? '22px' : '2px') }; }
  seg(on) { return 'flex:1;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13.5px;font-weight:600;cursor:pointer;' + (on ? 'background:var(--card);box-shadow:0 1px 4px rgba(0,0,0,0.12);color:var(--lab)' : 'color:var(--lab2)'); }
  dTs(d) { const m = { Januar: 1, Februar: 2, 'März': 3, April: 4, Mai: 5, Juni: 6, Juli: 7, August: 8, September: 9, Oktober: 10, November: 11, Dezember: 12 }; const p = /(\d+)\.\s*([A-Za-zäöüÄÖÜß]+)\s*(\d{4})/.exec(d || ''); return p ? (+p[3]) * 10000 + (m[p[2]] || 0) * 100 + (+p[1]) : 0; }
  // --- Schreibpfade -------------------------------------------------------
  // Aenderungen werden optimistisch angezeigt und dann zum Server geschickt.
  // Schlaegt der Server fehl, wird der vorherige Stand wiederhergestellt und
  // die Meldung angezeigt - kein stilles Auseinanderlaufen von App und Server.

  // idFuer() und favTagId() loesen einen Namen zur id auf und legen den
  // Eintrag bei Bedarf an. Beide stehen in ordnung.js, weil dabei ein
  // Stammdatum entsteht.

  // Uebersetzt eine Aenderung der Oberflaechenform in das API-Format.
  // Namen werden dabei zu ids aufgeloest, fehlende Eintraege angelegt.
  toApiPatch(patch, doc) {
    const A = this.api();
    const auf = [];
    const out = {};
    if ('titel' in patch) out.title = patch.titel;
    if ('abs' in patch) auf.push(this.idFuer('abs', patch.absender).then(id => { out.correspondent = id; }));
    if ('art' in patch) auf.push(this.idFuer('art', patch.dokumentart).then(id => { out.document_type = id; }));
    if ('ort' in patch) auf.push(this.idFuer('ort', patch.ablageort).then(id => { out.storage_path = id; }));
    // Das Datum wird als Text bearbeitet ('21. Juli 2026'). Laesst es sich
    // nicht lesen, bleibt das Feld unangetastet - lieber nichts aendern als
    // ein falsches Datum schreiben.
    if ('datum' in patch) {
      const iso = patch.datumIso || A.util.isoVonDE(patch.datum);
      if (iso) out.created = iso;
    }

    // Schlagwoerter und Favorit teilen sich das tags-Feld der API, deshalb
    // wird die Liste immer vollstaendig aus beidem zusammengesetzt.
    const setztTags = ('tags' in patch), setztFav = ('fav' in patch);
    if (setztTags || setztFav) {
      const namen = setztTags ? patch.tags : doc.tags;
      const fav = setztFav ? patch.favorit : doc.favorit;
      auf.push(
        Promise.all(namen.map(n => this.idFuer('tag', n)))
          .then(ids => fav ? this.favTagId().then(f => ids.concat([f])) : ids)
          .then(ids => { out.tags = ids.filter(x => x != null); })
      );
    }
    return Promise.all(auf).then(() => out);
  }

  inAllenListen(s, id, fn) {
    const out = {};
    DOC_LISTEN.forEach(k => { out[k] = (s[k] || []).map(d => d.id === id ? fn(d) : d); });
    out.cache = Object.assign({}, s.cache);
    if (out.cache[id]) out.cache[id] = fn(out.cache[id]);
    return out;
  }
  ausAllenListen(s, id) {
    const out = {};
    DOC_LISTEN.forEach(k => { out[k] = (s[k] || []).filter(d => d.id !== id); });
    out.cache = Object.assign({}, s.cache);
    delete out.cache[id];
    return out;
  }

  updDoc(id, patch) {
    const A = this.api();
    const vorher = this.docById(id);
    if (!vorher) return Promise.resolve();
    this.setState(s => this.inAllenListen(s, id, d => Object.assign({}, d, patch)));

    return this.toApiPatch(patch, vorher)
      .then(api => A.documents.update(id, api))
      .then(neu => {
        // Serverstand uebernehmen, damit abgeleitete Felder stimmen.
        const lk = this.lookups();
        this.setState(s => {
          const frisch = this.mapDoc(neu, lk, s.shares);
          // Posteingang-Eintraege tragen zusaetzliche Pruef-Felder, die die
          // Dokumentform nicht kennt - die bleiben erhalten.
          return this.inAllenListen(s, id, d => Object.assign({}, d, frisch));
        });
        // Favorit und Schlagwoerter aendern, wer wo hineingehoert.
        this.ladeNeben();
      })
      .catch(e => {
        this.setState(s => this.inAllenListen(s, id, () => vorher));
        this.note('Nicht gespeichert: ' + e.message);
      });
  }

  // Notiz sichern.
  //
  // Paperless kennt eine Liste von Notizen je Dokument, die Oberflaeche nur
  // ein Feld. Bearbeitet wird deshalb ausschliesslich die neueste Notiz: sie
  // wird ersetzt, aeltere bleiben unangetastet. Eine leere Eingabe entfernt
  // nur diese eine.
  notizSichern(id, text) {
    const A = this.api(), doc = this.docById(id);
    if (!doc) return Promise.resolve();
    const alt = doc.notizen || [];
    const bisher = alt.length ? (alt[0].note || '') : '';
    if (text === bisher) return Promise.resolve();

    // Loeschen und Anlegen liefern jeweils die Liste danach zurueck.
    const entfernen = alt.length
      ? A.documents.notes.remove(id, alt[0].id)
      : Promise.resolve(alt.slice());
    return entfernen
      .then(rest => (text ? A.documents.notes.add(id, text) : rest))
      .then(liste => {
        const neu = Array.isArray(liste) ? liste : [];
        this.setState(s => this.inAllenListen(s, id, d => Object.assign({}, d, {
          notiz: neu.length ? (neu[0].note || '') : '', notizen: neu
        })));
      })
      .catch(e => { this.note('Notiz nicht gespeichert: ' + e.message); });
  }

  deleteDoc(id) {
    const A = this.api();
    const d = this.docById(id);
    if (!d) return;
    const undo = this.snap();
    this.setState(s => Object.assign(this.ausAllenListen(s, id), {
      trash: [...s.trash, Object.assign({}, d, { gel: 'Gerade gelöscht', rest: 'Liegt im Papierkorb' })],
      stack: [], sheet: null
    }));
    A.documents.remove(id)
      .then(() => this.note('In den Papierkorb gelegt', () => this.restoreDoc(id)))
      .catch(e => { this.setState(undo); this.note('Nicht gelöscht: ' + e.message); });
  }

  // Rueckgaengig nach dem Loeschen: Paperless holt das Dokument aus dem
  // Papierkorb zurueck.
  restoreDoc(id) {
    const A = this.api();
    A.trash.restore([id])
      .then(() => this.reloadDocs())
      .then(() => this.note('Wiederhergestellt'))
      .catch(e => this.note('Wiederherstellen fehlgeschlagen: ' + e.message));
  }

  // Endgueltig loeschen aus dem Papierkorb.
  purgeDoc(id) {
    const A = this.api();
    this.setState(s => ({ trash: s.trash.filter(x => x.id !== id), stack: [], sheet: null }));
    A.trash.purge([id])
      .then(() => this.note('Endgültig gelöscht'))
      .catch(e => { this.reloadDocs(); this.note('Nicht gelöscht: ' + e.message); });
  }

  // Scannen und Hochladen stehen in erfassen.js - vom Dateidialog des
  // Systems bis zum Verfolgen der Serveraufgabe. Zurueck in den Bestand
  // fuehrt von dort nur reloadDocs().

  bulkApplyTag(t) {
    const A = this.api();
    const ids = this.state.sel.slice();
    const n = ids.length;
    const undo = this.snap();
    this.setState(s => ({
      docs: s.docs.map(d => ids.includes(d.id) && !d.tags.includes(t) ? Object.assign({}, d, { tags: [...d.tags, t] }) : d),
      sheet: null, selMode: false, sel: []
    }));
    this.idFuer('tag', t)
      .then(id => A.documents.bulk(ids, 'modify_tags', { add_tags: [id], remove_tags: [] }))
      .then(() => this.reloadDocs())
      .then(() => this.note('„' + t + '“ zu ' + (n === 1 ? '1 Dokument' : n + ' Dokumenten') + ' hinzugefügt'))
      .catch(e => { this.setState(undo); this.note('Nicht gespeichert: ' + e.message); });
  }

  // Mehrere Dokumente auf einmal in den Papierkorb legen.
  bulkTrash() {
    const A = this.api(), ids = this.state.sel.slice(), n = ids.length;
    if (!n) return;
    const undo = this.snap();
    this.setState(s => {
      let o = { sel: [], selMode: false };
      ids.forEach(id => { o = Object.assign(o, this.ausAllenListen(Object.assign({}, s, o), id)); });
      return o;
    });
    A.documents.bulk(ids, 'delete', {})
      .then(() => this.reloadDocs())
      .then(() => this.note(n === 1 ? '1 Dokument in den Papierkorb gelegt' : n + ' Dokumente in den Papierkorb gelegt',
                            () => this.bulkRestore(ids)))
      .catch(e => { this.setState(undo); this.note('Nicht gelöscht: ' + e.message); });
  }
  bulkRestore(ids) {
    this.api().trash.restore(ids)
      .then(() => this.reloadDocs())
      .then(() => this.note('Wiederhergestellt'))
      .catch(e => this.note('Wiederherstellen fehlgeschlagen: ' + e.message));
  }

  // Auswahl als ZIP herunterladen. Gepackt wird auf dem Server.
  bulkExport() {
    const A = this.api(), ids = this.state.sel.slice(), n = ids.length;
    if (!n) return;
    this.setState({ selMode: false, sel: [] });
    this.note(n === 1 ? 'Dokument wird vorbereitet …' : n + ' Dokumente werden vorbereitet …');
    A.documents.bulkDownload(ids, 'archive').then(f => {
      const a = document.createElement('a');
      a.href = f.url;
      a.download = f.name || 'dokumente.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      this.later(() => A.util.revoke(f.url), 60000);
      this.note(n === 1 ? 'Dokument exportiert' : n + ' Dokumente exportiert');
    }).catch(e => this.note('Export fehlgeschlagen: ' + e.message));
  }

  // --- Blaettern im Posteingang -------------------------------------------
  //
  // Waagerecht wischen wechselt das Dokument, das gerade geprueft wird. Es
  // ersetzt kein Bedienelement - "Uebernehmen & weiter" und "Ueberspringen"
  // bleiben -, sondern nimmt den haeufigsten Fall ab: kurz ansehen,
  // weiterblaettern, zurueckblaettern.
  //
  // Die Achse wird beim ersten Zug entschieden und dann festgehalten. Ohne
  // das waere jeder senkrechte Wisch auch ein bisschen waagerecht, und die
  // Liste der erkannten Angaben liesse sich nicht mehr scrollen.

  revZiehStart(x, y) {
    if (this.revAnzahl() < 2) return;
    this._revZ = { x0: x, y0: y, achse: null };
  }

  revZiehZug(x, y, verhindern) {
    const z = this._revZ;
    if (!z) return;
    const dx = x - z.x0, dy = y - z.y0;
    if (!z.achse) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      z.achse = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (z.achse === 'y') { this._revZ = null; return; }
    }
    if (verhindern) verhindern();
    // Am Anfang und am Ende gibt es keinen Nachbarn - dort federt es nur.
    const i = this.revPosition();
    const n = this.revAnzahl();
    const gebremst = (dx > 0 && i === 0) || (dx < 0 && i === n - 1) ? dx * 0.28 : dx;
    this.setState({ revZieh: { dx: Math.max(-260, Math.min(260, gebremst)), drag: true } });
  }

  revZiehEnde() {
    const z = this.state.revZieh;
    this._revZ = null;
    if (!z) return;
    const i = this.revPosition(), n = this.revAnzahl();
    const weiter = z.dx <= -REV_SCHWELLE && i < n - 1;
    const zurueck = z.dx >= REV_SCHWELLE && i > 0;
    if (weiter || zurueck) {
      // Erst hinausschieben, dann tauschen: sonst springt der Inhalt um,
      // waehrend die alte Karte noch zu sehen ist.
      this.setState({ revZieh: { dx: weiter ? -320 : 320, drag: false } });
      this.later(() => this.setState(st => ({
        revIdx: Math.max(0, Math.min(n - 1, st.revIdx + (weiter ? 1 : -1))),
        revZieh: null,
      })), 180);
      return;
    }
    this.setState({ revZieh: { dx: 0, drag: false } });
    this.later(() => this.setState({ revZieh: null }), 260);
  }

  revAnzahl() { return this.inboxEff().length; }
  revPosition() { return Math.min(this.state.revIdx, Math.max(0, this.revAnzahl() - 1)); }

  // --- Ziehen zum Aktualisieren -------------------------------------------
  //
  // Am oberen Rand nach unten ziehen laedt neu. Das kennt man von jeder
  // Listen-App, und es ersetzt die Frage "ist das noch aktuell?" durch eine
  // Geste.
  //
  // Selbst gebaut, weil es dafuer nichts Eingebautes gibt: der Browser kennt
  // nur sein eigenes Ueberziehen, und das ist in index.html abgeschaltet - in
  // einer installierten App ist ein federnder Bildschirm falsch.
  //
  // Gezogen wird nur, wenn die Liste schon ganz oben steht. Sonst waere die
  // Geste dieselbe wie Scrollen, und man wuerde mitten in der Liste
  // versehentlich neu laden.

  ziehStart(e) {
    // Nur die Maus. Auf Beruehrungsgeraeten uebernimmt der Browser die
    // Bewegung und bricht die Zeigerereignisse ab - dort greifen die
    // Beruehrungszuhoerer weiter unten.
    if (e.pointerType && e.pointerType !== 'mouse') return;
    const el = e.currentTarget;
    if (!el || el.scrollTop > 0) return;
    if (this.state.zieh && this.state.zieh.laeuft) return;
    this._zieh = { y0: e.clientY, el: el };
  }

  ziehZug(e) {
    const z = this._zieh;
    if (!z) return;
    // Wer waehrend des Ziehens doch scrollt, hat es nicht gemeint.
    if (z.el.scrollTop > 0) { this._zieh = null; if (this.state.zieh) this.setState({ zieh: null }); return; }
    const roh = e.clientY - z.y0;
    if (roh <= 0) { if (this.state.zieh) this.setState({ zieh: null }); return; }
    // Gedaempft: der Finger legt mehr Weg zurueck als der Inhalt. Das macht
    // den Widerstand spuerbar und verhindert, dass ein Wischen sofort ausloest.
    const dy = Math.min(ZIEH_MAX, roh * 0.45);
    // Mit der Maus gezogen markiert der Browser sonst den Text, ueber den der
    // Zeiger laeuft. Auf einem Telefon faellt das nicht an, am Rechner schon.
    if (!this.state.zieh) {
      const aus = window.getSelection && window.getSelection();
      if (aus && aus.removeAllRanges) aus.removeAllRanges();
    }
    this.setState({ zieh: { dy: dy, reif: dy >= ZIEH_SCHWELLE, laeuft: false } });
  }

  // Beruehrungsgeraete brauchen eigene Zuhoerer.
  //
  // React haengt touchmove passiv ein, und ein passiver Zuhoerer darf die
  // Bewegung nicht abfangen. Der Browser nimmt sie dann fuer sich, scrollt
  // selbst und bricht die Zeigerereignisse mit pointercancel ab - gemessen:
  // ein pointermove, dann Schluss, waehrend touchmove weiterlief. Deshalb
  // hier von Hand und ausdruecklich nicht passiv.
  ziehTouchStart(e) {
    if (!e.touches || e.touches.length !== 1) { this._zieh = null; return; }
    const ziel = e.target && e.target.closest ? e.target.closest('[data-zieh]') : null;
    if (!ziel || ziel.scrollTop > 0) { this._zieh = null; return; }
    if (this.state.zieh && this.state.zieh.laeuft) return;
    this._zieh = { y0: e.touches[0].clientY, el: ziel };
  }

  ziehTouchZug(e) {
    const z = this._zieh;
    if (!z || !e.touches || e.touches.length !== 1) return;
    if (z.el.scrollTop > 0) { this._zieh = null; if (this.state.zieh) this.setState({ zieh: null }); return; }
    const roh = e.touches[0].clientY - z.y0;
    if (roh <= 0) { if (this.state.zieh) this.setState({ zieh: null }); return; }
    // Der entscheidende Punkt: ohne das nimmt der Browser die Bewegung.
    if (e.cancelable) e.preventDefault();
    const dy = Math.min(ZIEH_MAX, roh * 0.45);
    this.setState({ zieh: { dy: dy, reif: dy >= ZIEH_SCHWELLE, laeuft: false } });
  }

  ziehEnde() {
    const z = this.state.zieh;
    this._zieh = null;
    if (!z || z.laeuft) return;
    if (!z.reif) { this.setState({ zieh: null }); return; }
    this.setState({ zieh: { dy: ZIEH_SCHWELLE, reif: true, laeuft: true } });
    this.aktualisieren()
      .catch(() => this.note('Aktualisieren fehlgeschlagen'))
      .then(() => this.setState({ zieh: null }));
  }

  // Was "aktualisieren" heisst, haengt davon ab, worauf man gerade sieht.
  aktualisieren() {
    const s = this.state;
    if (s.tab === 'docs' && s.view === 'ordner') {
      return Promise.all([this.loadAll(), this.ordnerTabGehe(s.ordnerTabPfad || '')]);
    }
    return Promise.all([this.loadAll(), this.reloadDocs()]);
  }

  // Text in die Zwischenablage. Steht hier und nicht in vorschau.js: es geht
  // um Freigabe-Links und Zugangsdaten, nicht um eine Datei.
  kopiere(text, meldung) {
    const nein = () => this.note('Kopieren nicht möglich – bitte den Link von Hand markieren.');
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => this.note(meldung || 'Kopiert'), nein);
      return;
    }
    nein();
  }

  // Hilfe heisst hier: der Quelltext. Es gibt keine gehostete Hilfeseite, und
  // eine zu behaupten waere schlimmer, als keine zu haben.
  hilfeOeffnen() {
    // Ueber einen Verweis, nicht ueber window.open. In einer installierten App
    // auf iOS tut window.open nichts und meldet auch keinen Fehler - ein Klick
    // auf einen Verweis mit target=_blank oeffnet dort dagegen Safari.
    try {
      const a = document.createElement('a');
      a.href = PROJEKT_URL;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      // Bleibt die Adresse wenigstens lesbar, statt dass gar nichts geschieht.
      this.note(PROJEKT_URL);
    }
  }

  // Posteingang-Eintrag verwerfen: das Dokument wandert in den Papierkorb.
  revDelete(id) {
    const A = this.api();
    if (!id) return;
    const undo = this.snap();
    this.setState(s => {
      const o = this.ausAllenListen(s, id);
      o.revIdx = 0;
      o.stack = o.inbox.length ? s.stack : [];
      return o;
    });
    A.documents.remove(id)
      .then(() => this.reloadDocs())
      .then(() => this.note('In den Papierkorb gelegt', () => this.restoreDoc(id)))
      .catch(e => { this.setState(undo); this.note('Nicht gelöscht: ' + e.message); });
  }

  // Posteingang bestaetigen: gewaehlte Felder uebernehmen und die
  // Posteingang-Schlagwoerter entfernen, damit das Dokument die Bibliothek
  // erreicht.
  confirmRev() {
    const A = this.api(), it = this.revItem();
    if (!it) return;
    const f = (k) => { const x = it.felder.find(y => y.k === k); return x && x.ok && x.v ? x.v : ''; };
    const patch = { absender: f('Absender'), dokumentart: f('Dokumentart') };
    const tagName = f('Schlagwörter');
    const behalten = tagName ? [tagName] : [];

    this.setState(s => ({ inbox: s.inbox.filter(x => x.id !== it.id), revIdx: 0 }));

    const lk = this.lookups();
    const posteingangIds = Object.keys(lk.tag).map(Number).filter(id => lk.tag[id].is_inbox_tag);

    Promise.all(behalten.map(n => this.idFuer('tag', n)))
      .then(tagIds => this.toApiPatch(patch, it).then(api => {
        // Vorhandene Schlagwoerter ohne die Posteingang-Marker, plus gewaehltes.
        const alt = (it.raw.tags || []).filter(id => posteingangIds.indexOf(id) < 0);
        api.tags = Array.from(new Set(alt.concat(tagIds)));
        return A.documents.update(it.id, api);
      }))
      .then(() => this.reloadDocs())
      .then(() => this.note('In die Bibliothek übernommen'))
      .catch(e => { this.reloadDocs(); this.note('Nicht übernommen: ' + e.message); });
  }
  revItem() { const ib = this.inboxEff(); return ib[Math.min(this.state.revIdx, ib.length - 1)]; }
  patchRev(fn) { const it = this.revItem(); if (!it) return; this.setState(s => ({ inbox: s.inbox.map(x => x.id === it.id ? fn(x) : x) })); }
  choosePick(v) { const s = this.state; if (s.pickTarget === 'rev') { const k = s.pickField; this.patchRev(it => ({ ...it, felder: it.felder.map(f => f.k === k ? { ...f, v, ok: true, conf: 'von dir gewählt' } : f) })); this.setState({ sheet: null }); } else { const map = { 'Absender': 'abs', 'Dokumentart': 'art', 'Ablageort': 'ort', 'Datum': 'datum' }; const key = map[s.pickField] || 'abs'; this.setState(st => ({ editDraft: { ...st.editDraft, [key]: v }, sheet: 'edit' })); } }
  // Das Anlegen aus dem Auswahl-Sheet (pickCreateGo) und das Anlegen,
  // Umbenennen und Loeschen eines Stammdatums (orgSaveGo, orgDeleteGo) stehen
  // in ordnung.js. Zurueck fuehrt von dort nur choosePick().

  // Schritt 1: prueft, ob unter der angegebenen Adresse eine Paperless-API
  // antwortet. Die Adresse ist mit der eigenen Origin vorbelegt, weil App und
  // Server hier gemeinsam ausgeliefert werden.
  obConnectGo() {
    const A = this.api(), v = this.state.onbServer.trim();
    if (!v) { this.setState({ onbErr: 'Gib die Adresse deines Servers ein – zum Beispiel https://paperless.beispiel.de.' }); return; }
    // Eingaben ohne Schema bequem ergaenzen; alles Weitere macht die Pruefung.
    const roh = /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : 'https://' + v;
    // Fremde Herkunft ist erlaubt, aber nur bewusst: beim ersten Versuch
    // fragt die App nach, statt sie stillschweigend zu uebernehmen.
    const fremdOk = this.state.onbFremdOk === roh;
    const r = A.basisPruefen(roh, { fremdErlauben: fremdOk });
    if (!r.ok && r.fremd) {
      this.setState({ onbFremdOk: roh, onbErr:
        'Diese Adresse gehört nicht zu dieser App. Dein Zugangsschlüssel ginge dorthin. '
        + 'Tippe erneut auf Verbinden, wenn das dein Server ist.' });
      return;
    }
    if (!r.ok) { this.setState({ onbErr: r.grund }); return; }
    this.setState({ onbErr: '', onbChecking: true });
    A.ping(r.url).then(() => {
      const gesetzt = A.setBase(r.url, { fremdErlauben: true });
      if (!gesetzt.ok) { this.setState({ onbChecking: false, onbErr: gesetzt.grund }); return; }
      this.setState({ onbChecking: false, onbStep: 2, serverUrl: gesetzt.url });
    }).catch(e => {
      this.setState({ onbChecking: false, onbErr: e.message });
    });
  }

  // Schritt 2: holt per Benutzername und Passwort einen API-Token.
  obLoginGo(sso) {
    const A = this.api(), s = this.state;
    if (s.onbTok) {
      // Alternative: fertigen Token einsetzen, statt ihn erst zu holen.
      const t = s.onbToken.trim();
      if (!t) { this.setState({ onbErr: 'Bitte füge deinen Zugangsschlüssel ein.' }); return; }
      this.setState({ onbErr: '', onbChecking: true });
      A.setToken(t);
      A.uiSettings().then(() => this.setState({ onbChecking: false, screenSet: 'onb', onbStep: 3 }))
        .catch(e => { A.logout(); this.setState({ onbChecking: false, onbErr: e.status === 401 ? 'Dieser Zugangsschlüssel wird nicht akzeptiert.' : e.message }); });
      return;
    }
    if (!s.onbUser.trim() || !s.onbPass.trim()) { this.setState({ onbErr: 'Bitte gib Benutzername und Passwort ein.' }); return; }
    this.setState({ onbErr: '', onbChecking: true });
    A.login(s.onbUser.trim(), s.onbPass).then(t => {
      A.setToken(t);
      // Passwort nicht laenger im Zustand halten als noetig.
      // screenSet ausdruecklich halten: sonst wechselt screenEff() sofort in
      // die App, sobald der Token da ist, und ueberspringt den letzten Schritt.
      this.setState({ onbChecking: false, screenSet: 'onb', onbStep: 3, onbPass: '' });
    }).catch(e => {
      this.setState({ onbChecking: false, onbErr: e.message });
    });
  }

  obDone() {
    this.setState({ screenSet: 'app', onbStep: 0, onbErr: '', tab: 'home', stack: [], loading: true });
    this.loadAll().then(() => this.note('Mit deinem Server verbunden'));
  }

  // Abmelden: Token verwerfen und zurueck ins Onboarding.
  logoutGo() {
    const A = this.api();
    A.logout();
    this.sucheAbbrechen();
    this.alleBilderFreigeben();
    // Nach dem Abmelden darf nichts mehr aus dem alten Konto sichtbar sein -
    // auch nicht im Cache, in stehen gebliebenen Suchtreffern oder in den
    // Vorschaubildern, die als Object-URL im Speicher liegen.
    this.setState({
      screenSet: 'onb', onbStep: 1, onbErr: '', onbUser: '', onbPass: '', onbToken: '',
      stack: [], sheet: null, tab: 'home',
      docs: [], recent: [], favs: [], geteiltL: [], inbox: [], trash: [], cache: {}, prev: null,
      docsPage: 1, docsTotal: 0, docsMore: false, docsBusy: false,
      ...DWSuche.beimAbmelden(), opened: [],
      tagsM: [], absM: [], artenM: [], orteM: [],
      tagsRaw: [], absRaw: [], artenRaw: [], orteRaw: [], shares: {}, me: null,
      felderM: [], suchenM: [], users: [],
      ...DWOrdnung.beimAbmelden(),
      ...DWBetrieb.beimAbmelden(),
      loading: false, loadErr: null
    });
  }

  // Zwischenwerte, die mehrere Abschnitte brauchen: einmal berechnet und als
  // Kontext weitergereicht. Die Abschnitte darunter lesen daraus, statt erneut
  // zu rechnen - sonst haette ein Render mehrere Wahrheiten.
  renderKontext() {
    const s = this.state, dark = this.isDark(), top = this.top() || {}, inbox = this.inboxEff();
    const wide = this.isWide(), nav = this.navStack();
    const chip = (on) => 'height:32px;padding:0 13px;border-radius:999px;display:flex;align-items:center;flex-shrink:0;cursor:pointer;font-size:13.5px;font-weight:600;' + (on ? 'background:var(--acc);color:var(--onAcc)' : 'background:var(--fill);color:var(--lab)');
    const iconSq = (bg) => 'width:30px;height:30px;border-radius:7px;background:' + bg + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff';
    const sv = (p) => ({ __html: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>' });
    // Ein geoeffnetes Dokument muss nicht mehr in der gefilterten Liste
    // stehen (Suchtreffer, Favoritenliste, nach Filterwechsel) - deshalb aus
    // dem Cache.
    const dDoc = top.t === 'doc' ? this.docById(top.id) : null;
    const rev = top.t === 'rev' ? inbox[Math.min(s.revIdx, inbox.length - 1)] : null;
    const org = top.t === 'org' ? this.orgData(top.kind) : null;
    const res = this.results();
    const share = dDoc ? s.shares[dDoc.id] : null;
    const fundParts = dDoc && s.lastQ ? this.parts(dDoc.inhalt, s.lastQ) : null;
    const ed = s.editDraft, orgD = s.orgDraft;
    const revF = rev ? rev.felder : [];
    const selN = s.sel.length;
    const userS = s.userSel != null ? (s.users || []).find(u => u.id === s.userSel) : null;
    const listeKind = top.t === 'liste' ? top.kind : null;
    // Favoriten und Geteilt kommen als eigene Serverabfragen (ladeNeben) und
    // nicht aus der gefilterten Liste des Dokumente-Tabs.
    const listeDocs = listeKind === 'zuletzt' ? s.opened.map(id => this.docById(id)).filter(Boolean) : listeKind === 'fav' ? s.favs : listeKind === 'geteilt' ? s.geteiltL : [];
    const auto = top.t === 'autoD' ? s.autos.find(a => a.id === top.id) : null;
    // Datumsvorschlaege: die zuletzt verwendeten Werte aus den geladenen
    // Dokumenten, statt einer festen Liste.
    const datumOpts = Array.from(new Set(s.docs.concat(s.recent).map(d => d.datum).filter(Boolean))).slice(0, 12);
    const pickOpts = s.pickField === 'Absender' ? s.absM : s.pickField === 'Dokumentart' ? s.artenM : s.pickField === 'Schlagwörter' ? s.tagsM : s.pickField === 'Ablageort' ? s.orteM : datumOpts;
    return { s, dark, top, inbox, wide, nav, chip, iconSq, sv, dDoc, rev, org, res, share, fundParts, ed, orgD, revF, selN, userS, listeKind, listeDocs, auto, datumOpts, pickOpts };
  }

  // --- Rahmen ------------------------------------------------------
  // Farbschema, Split-View-Rahmen und der Wechsel zwischen App und Onboarding.
  valsRahmen(k) {
    const { s, dark, top, wide, dDoc } = k;
    return {
      themeVars: dark ? { ...SICHER, background: 'var(--bg)', color: 'var(--lab)', '--bg': '#0D1B2A', '--card': '#152436', '--fill': 'rgba(120,120,128,0.24)', '--fill2': 'rgba(120,120,128,0.36)', '--lab': '#FFFFFF', '--lab2': 'rgba(226,239,237,0.62)', '--lab3': 'rgba(235,235,245,0.30)', '--sep': 'rgba(142,229,218,0.16)', '--acc': '#8EE5DA', '--onAcc': '#0D1B2A', '--mint': '#8EE5DA', '--accT': 'rgba(142,229,218,0.16)', '--grn': '#8EE5DA', '--org': '#F0B454', '--red': '#FF6B60', '--glass': 'rgba(21,36,54,0.86)', '--gbor': 'rgba(255,255,255,0.10)', '--mark': 'rgba(142,229,218,0.32)', '--pg': '#1B2B3E', '--pgl': 'rgba(235,235,245,0.16)' } : { ...SICHER, color: 'var(--lab)' },
      showApp: this.screenEff() === 'app' && !s.sperreOffen,
      // Bei aktiver Sperre gibt es keinen abgelegten Schluessel, weshalb
      // screenEff() das Onboarding waehlen wuerde. Es hat dort aber nichts zu
      // suchen - es wuerde unter dem Entsperrbildschirm kurz aufblitzen.
      showOnb: this.screenEff() === 'onb' && !s.sperreOffen,
      // Split-View: Positionsrahmen fuer linke Spalte, rechte Spalte und die
      // schwebenden Leisten. Schmal bleibt alles Vollbild wie bisher.
      paneL: wide ? 'position:absolute;top:0;bottom:0;left:0;width:' + PANE_W + 'px;border-right:0.5px solid var(--sep);' : 'position:absolute;inset:0;',
      paneR: wide ? 'position:absolute;top:0;bottom:0;left:' + PANE_W + 'px;right:0;' : 'position:absolute;inset:0;',
      // Im Split-View gleitet das Detail nicht von rechts herein - es wechselt
      // nur den Inhalt einer stehenden Spalte.
      paneAnim: wide ? 'animation:fadeIn .18s ease;' : 'animation:pushIn .32s cubic-bezier(.32,.72,.36,1);',
      barPos: wide ? 'left:16px;width:' + (PANE_W - 32) + 'px;' : 'left:16px;right:16px;',
      // Die Aktionsleiste des Detail liegt in der rechten Spalte und wird dort
      // mittig begrenzt, statt ueber die volle Breite zu laufen.
      barPosDoc: wide ? 'left:50%;width:min(560px,calc(100% - 32px));transform:translateX(-50%);' : 'left:16px;right:16px;',
      sheetPos: wide ? 'left:50%;width:min(520px,92vw);transform:translateX(-50%);' : 'left:0;right:0;',
      // Rechte Spalte ohne Auswahl: Platzhalter statt leerer Flaeche.
      docPaneEmpty: wide && this.screenEff() === 'app' && !(top.t === 'doc' && !!dDoc),
      popPush: () => this.pop(),
    };
  }

  // --- Navigation --------------------------------------------------
  // Tableiste, Auswahlleiste und die Einstiege, die von ueberall erreichbar sind.
  valsNavigation(k) {
    const { s, nav } = k;
    return {
      tabHome: s.tab === 'home' && !nav.length, tabDocs: s.tab === 'docs' && !nav.length, tabInbox: s.tab === 'inbox' && !nav.length, tabMore: s.tab === 'more' && !nav.length,
      goHome: () => this.setState({ tab: 'home', stack: [], selMode: false, sel: [] }), goDocs: () => this.setState({ tab: 'docs', stack: [], selMode: false, sel: [] }), goInbox: () => this.setState({ tab: 'inbox', stack: [], selMode: false, sel: [] }), goMore: () => this.setState({ tab: 'more', stack: [], selMode: false, sel: [] }),
      // Welcher Reiter gerade gilt - fuer aria-current, damit ein
      // Screenreader nicht nur die vier Namen liest, sondern auch, wo man ist.
      cHomeAktiv: s.tab === 'home', cDocsAktiv: s.tab === 'docs',
      cInboxAktiv: s.tab === 'inbox', cMoreAktiv: s.tab === 'more',
      cHome: s.tab === 'home' ? 'var(--acc)' : 'var(--lab2)', cDocs: s.tab === 'docs' ? 'var(--acc)' : 'var(--lab2)', cInbox: s.tab === 'inbox' ? 'var(--acc)' : 'var(--lab2)', cMore: s.tab === 'more' ? 'var(--acc)' : 'var(--lab2)',
      tabbarOn: !nav.length && !s.selMode && !s.scan, selbarOn: s.selMode && s.tab === 'docs' && !nav.length,
      openSettings: () => this.pushV({ t: 'set' }), openSearch: () => this.setState(st => ({ stack: [...st.stack, { t: 'search' }], q: '', qRes: [], qErr: '', qBusy: false, qEinfach: false })), openAdd: () => this.setState({ sheet: 'add' }),
      startScan: () => this.scanOeffnen(),
      // Mehrere erlaubt: jede Datei wird ein eigenes Dokument - anders als
      // beim Scannen, wo mehrere Aufnahmen zu einem PDF werden. Welche Typen
      // der Server annimmt, weiss erfassen.js.
      pickFile: () => this.dokumentWaehlen(),
    };
  }

  // --- Start -------------------------------------------------------
  // Startseite: laufende Uploads und die drei kurzen Dokumentreihen.
  valsStart(k) {
    const { s } = k;
    return {
      uploadsOn: s.uploads.length > 0, uploadRows: s.uploads,
      recentDocs: s.recent.slice(0, 4).map(d => this.enrich(d)),
      lastOpened: s.opened.map(id => this.docById(id)).filter(Boolean).slice(0, 3).map(d => this.enrich(d)),
      favDocs: s.favs.map(d => this.enrich(d)),
    };
  }

  // --- Dokumentliste -----------------------------------------------
  // Dokumente-Tab: Liste, Zaehler, Ansicht, Sortierung, Filter, Mehrfachauswahl.
  valsDokumentliste(k) {
    const { s, chip } = k;
    return {
      visDocs: s.docs.map(d => this.enrich(d)),
      docsEmpty: s.docs.length === 0 && !s.docsBusy,
      // Serverseitig gefiltert: die Gesamtzahl ist die des Filters, nicht die
      // der geladenen Seiten. Beides zu nennen waere irrefuehrend, solange
      // noch nicht alles geladen ist.
      docsCountLabel: s.view === 'ordner'
        // Im Ordnermodus waere die Gesamtzahl eine Aussage ueber etwas
        // anderes als das, was hier steht.
        ? [
            this.ordnerKinder(s.ordnerTabPfad || '').length,
            (s.ordnerTabDocs || []).length,
          ].map((n, i) => n + (i === 0 ? (n === 1 ? ' Ordner' : ' Ordner') : (n === 1 ? ' Dokument' : ' Dokumente'))).join(' · ')
        : s.docsMore
        ? (s.docs.length + ' von ' + s.docsTotal + ' Dokumenten geladen')
        : (s.docsTotal === 1 ? '1 Dokument' : s.docsTotal + ' Dokumente'),
      docsMoreOn: s.docsMore && !s.docsBusy && s.docs.length < DOC_MAX, docsBusy: s.docsBusy,
      // Ist die Grenze erreicht, sagt die App das - statt einen Knopf
      // anzubieten, der die Oberflaeche anhaelt.
      docsGrenzeOn: s.docsMore && s.docs.length >= DOC_MAX,
      docsGrenzeText: 'Mehr als ' + DOC_MAX + ' Dokumente auf einmal werden zäh. '
        + 'Grenze die Auswahl mit einem Filter oder der Suche ein.',
      docsMoreLabel: 'Weitere ' + Math.min(DOC_PAGE, Math.max(0, s.docsTotal - s.docs.length)) + ' laden',
      loadMore: () => this.mehrDocs(),
      docsErrOn: !!s.loadErr, docsErr: s.loadErr || '',
      retryLoad: () => this.loadAll(),
      filterOn: this.filterAktiv(),
      docsEmptyText: this.filterAktiv()
        ? 'Keine Dokumente passen zu den gewählten Filtern.'
        : 'Noch keine Dokumente. Lade eines hoch, um zu beginnen.',
      // Ziehen zum Aktualisieren. Dieselben Handler an allen vier Reitern.
      ziehStart: (e) => this.ziehStart(e),
      ziehZug: (e) => this.ziehZug(e),
      ziehEnde: () => this.ziehEnde(),
      ziehDy: s.zieh ? s.zieh.dy : 0,
      ziehAn: !!s.zieh,
      ziehLaeuft: !!(s.zieh && s.zieh.laeuft),
      ziehText: s.zieh && s.zieh.laeuft ? 'Wird geladen …'
              : s.zieh && s.zieh.reif ? 'Loslassen zum Aktualisieren'
              : 'Zum Aktualisieren ziehen',
      viewIsList: s.view === 'liste', viewIsGrid: s.view === 'raster', viewIsOrdner: s.view === 'ordner',
      // --- Ordneransicht im Reiter Dokumente ---
      // Die Ordner entstehen aus den Ablageorten: ein Name wie
      // "Privat/Steuern" ergibt zwei Ebenen (siehe ordnerKinder).
      otPfad: s.ordnerTabPfad || '',
      // Die Pfadleiste. "Alle" ist die Wurzel und immer der erste Eintrag.
      otWeg: [{ name: 'Alle', pfad: '', letzter: !s.ordnerTabPfad, tap: () => this.ordnerTabGehe('') }].concat(
        (s.ordnerTabPfad || '').split('/').filter(Boolean).map((teil, i, alle) => ({
          name: teil,
          pfad: alle.slice(0, i + 1).join('/'),
          letzter: i === alle.length - 1,
          tap: () => this.ordnerTabGehe(alle.slice(0, i + 1).join('/')),
        }))),
      otHochAn: !!s.ordnerTabPfad,
      otHoch: () => this.ordnerTabGehe((s.ordnerTabPfad || '').split('/').slice(0, -1).join('/')),
      otOrdner: this.ordnerKinder(s.ordnerTabPfad || '').map(f => ({
        name: f.name,
        countLabel: (f.anzahl === 1 ? '1 Dokument' : f.anzahl + ' Dokumente') + (f.direkt ? '' : ' · nur Unterordner'),
        tap: () => this.ordnerTabGehe(f.voll),
      })),
      otDateien: (s.ordnerTabDocs || []).map(d => this.enrich(d)),
      otLaden: !!s.ordnerTabLaden,
      otLeer: !s.ordnerTabLaden && this.ordnerKinder(s.ordnerTabPfad || '').length === 0 && (s.ordnerTabDocs || []).length === 0,
      otLeerText: (s.ordnerTabPfad || '')
        ? 'In diesem Ordner liegt nichts. Setze bei einem Dokument diesen Ablageort, damit es hier erscheint.'
        : 'Es gibt noch keine Ablageorte. Unter „Mehr → Ordner“ legst du den ersten an – ein Name wie „Privat/Steuern“ ergibt zwei Ebenen.',
      // Der Knopf zeigt, was als Naechstes kommt - nicht, was gerade gilt.
      toggleView: () => {
        const naechste = { liste: 'raster', raster: 'ordner', ordner: 'liste' }[s.view] || 'liste';
        this.setState({ view: naechste });
        if (naechste === 'ordner') this.ordnerTabGehe(s.ordnerTabPfad || '');
      },
      sortLabel: { neu: 'Neueste', alt: 'Älteste', titel: 'Titel', absender: 'Absender' }[s.sort], openSort: () => this.setState({ sheet: 'sort' }), openFilter: () => this.setState({ sheet: 'filter' }),
      // Die Schnellfilter zeigen die tatsaechlich vorhandenen Dokumentarten,
      // die haeufigsten zuerst - eine feste Liste ginge auf einem fremden
      // Server ins Leere.
      filterChips: [ { label: 'Favoriten', on: s.fFav, tap: () => this.setzeFilter({ fFav: !s.fFav }) },
        ...[...(s.artenRaw || [])].sort((a, b) => (b.document_count || 0) - (a.document_count || 0)).slice(0, 4)
          .map(t => ({ label: t.name, on: s.fArt === t.name, tap: () => this.setzeFilter({ fArt: s.fArt === t.name ? null : t.name }) }))
      ].map(c => ({ ...c, style: chip(c.on) })),
      resetFilter: () => this.setzeFilter({ fArt: null, fFav: false, fAbs: [], fTags: [], fZeit: 'alle' }),
      toggleSelMode: () => this.setState({ selMode: !s.selMode, sel: [] }), selBtnLabel: s.selMode ? 'Fertig' : 'Auswählen',
      selLabel: s.sel.length === 0 ? 'Auswählen' : s.sel.length + ' ausgewählt', selActStyle: 'width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:' + (s.sel.length ? 'var(--acc)' : 'var(--lab3)'), selActStyleRed: 'width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:' + (s.sel.length ? 'var(--red)' : 'var(--lab3)'),
      bulkTagOpen: () => { if (s.sel.length) this.setState({ sheet: 'bulktag' }); },
      bulkExport: () => this.bulkExport(),
      bulkTrash: () => this.bulkTrash(),
    };
  }

  // --- Posteingang -------------------------------------------------
  // Posteingang: Zaehler auf der Startseite, Liste und der Pruefbildschirm.
  valsPosteingang(k) {
    const { s, top, inbox, rev, revF } = k;
    return {
      inboxHasNew: inbox.length > 0, inboxEmpty: inbox.length === 0, inboxAllDone: inbox.length === 0,
      inboxBadge: String(inbox.length), inboxCountLabel: inbox.length === 0 ? 'Keine neuen Dokumente' : inbox.length === 1 ? '1 neues Dokument' : inbox.length + ' neue Dokumente',
      dupOn: inbox.some(i => i.dup), openDup: () => { this.setState({ tab: 'inbox', revIdx: inbox.findIndex(i => i.dup) }); this.pushV({ t: 'rev' }); },
      missOn: inbox.some(i => i.felder[0].v === ''), openMissing: () => { this.setState({ tab: 'inbox', revIdx: inbox.findIndex(i => i.felder[0].v === '') }); this.pushV({ t: 'rev' }); },
      inboxList: inbox.map((it, i) => ({ ...it, bild: this.bildFuer(it.id), nSug: it.felder.filter(f => f.v).length + ' Vorschläge', review: () => { this.setState({ revIdx: i }); this.pushV({ t: 'rev' }); } })),
      showRev: top.t === 'rev' && !!rev,
      revTitel: rev ? rev.titel : '',
      // Das Vorschaubild der zu pruefenden Seite. Hier hilft es am
      // meisten: man entscheidet gerade, was das Dokument ist.
      revBild: rev ? this.bildFuer(rev.id) : '', revQuelle: rev ? rev.quelle + ' · ' + rev.hinzugefuegt : '', revDup: !!(rev && rev.dup), revDupRef: rev ? (rev.dupRef || '') : '',
      revPos: rev ? (inbox.indexOf(rev) + 1) + ' von ' + inbox.length : '',
      // Blaettern durch Wischen. Nur sinnvoll, wenn es einen Nachbarn gibt.
      revMehrere: inbox.length > 1,
      revDx: s.revZieh ? s.revZieh.dx : 0,
      revZiehAn: !!(s.revZieh && s.revZieh.drag),
      revVor: inbox.indexOf(rev) > 0,
      revZurueck: inbox.indexOf(rev) < inbox.length - 1,
      revZiehStart: (e) => { if (!e.pointerType || e.pointerType === 'mouse') this.revZiehStart(e.clientX, e.clientY); },
      revZiehZug: (e) => { if (!e.pointerType || e.pointerType === 'mouse') this.revZiehZug(e.clientX, e.clientY, null); },
      // Touch wird bereits ueber die globalen touch*-Listener in
      // componentDidMount abgewickelt (siehe _revAn/_revZug/_revAus). Ohne
      // diese Wache feuert bei Touch zusaetzlich das Pointer-Ende hier und
      // ruft revZiehEnde() ein zweites Mal auf, waehrend der erste Aufruf
      // noch sein setState/later() abarbeitet - das Ergebnis war doppeltes
      // Blaettern pro Wisch (siehe tests/browser_check.py, "Posteingang
      // blaettern").
      revZiehEnde: (e) => { if (!e || !e.pointerType || e.pointerType === 'mouse') this.revZiehEnde(); },
      revZurueckTap: () => { if (inbox.indexOf(rev) > 0) this.setState(st => ({ revIdx: st.revIdx - 1 })); },
      revVorTap: () => { if (inbox.indexOf(rev) < inbox.length - 1) this.setState(st => ({ revIdx: st.revIdx + 1 })); },
      revFields: revF.map((f, i) => ({ k: f.k, conf: f.conf, vShow: f.v, hasVal: !!f.v, empty: !f.v, ok: !!(f.ok && f.v), notOk: !(f.ok && f.v), toggle: () => this.patchRev(it => ({ ...it, felder: it.felder.map((x, j) => j === i ? { ...x, ok: !x.ok } : x) })), edit: () => this.setState({ pickTarget: 'rev', pickField: f.k, pickNew: '', sheet: 'pick' }) })),
      acceptAll: () => this.patchRev(it => ({ ...it, felder: it.felder.map(x => x.v ? { ...x, ok: true } : x) })),
      revConfirm: () => this.confirmRev(),
      revSkip: () => { if (inbox.length) this.setState({ revIdx: (inbox.indexOf(rev) + 1) % inbox.length }); },
      revDelete: () => { if (rev) this.revDelete(rev.id); },
    };
  }

  // --- Mehr --------------------------------------------------------
  // Mehr-Tab: die drei Reihen Bibliothek, Ordnung und Verwaltung.
  valsMehr(k) {
    const { s, iconSq, sv } = k;
    return {
      bibRows: [ { label: 'Zuletzt verwendet', detail: '', svg: sv('<circle cx="12" cy="12" r="8.2"></circle><path d="M12 7.5V12l3 2"></path>'), bg: '#5AC8FA', tap: () => this.pushV({ t: 'liste', kind: 'zuletzt' }) }, { label: 'Favoriten', detail: String(s.favs.length), svg: sv('<path d="M12 3.6l2.5 5.2 5.7.7-4.2 3.9 1.1 5.6-5.1-2.8-5.1 2.8 1.1-5.6-4.2-3.9 5.7-.7z"></path>'), bg: '#F7B500', tap: () => this.pushV({ t: 'liste', kind: 'fav' }) }, { label: 'Geteilt', detail: String(s.geteiltL.length), svg: sv('<path d="M10.2 13.8a4 4 0 005.6 0l3.1-3.1a4 4 0 00-5.7-5.6l-1.5 1.5"></path><path d="M13.8 10.2a4 4 0 00-5.6 0l-3.1 3.1a4 4 0 005.7 5.6l1.5-1.5"></path>'), bg: '#34C759', tap: () => this.pushV({ t: 'liste', kind: 'geteilt' }) }, { label: 'Papierkorb', detail: String(s.trash.length), svg: sv('<path d="M4.5 6.5h15"></path><path d="M8.5 6.2V4.5h7v1.7"></path><path d="M6.5 6.5l1 14h9l1-14"></path>'), bg: '#8E8E93', tap: () => this.pushV({ t: 'trash' }) } ].map((m, i, a) => ({ ...m, iconStyle: iconSq(m.bg), sep: i < a.length - 1 })),
      orgRows: [ { label: 'Absender', detail: String(s.absM.length), svg: sv('<circle cx="12" cy="8" r="3.4"></circle><path d="M5 20c1-4 4-5.6 7-5.6s6 1.6 7 5.6"></path>'), bg: '#007AFF', kind: 'abs' }, { label: 'Dokumentarten', detail: String(s.artenM.length), svg: sv('<path d="M7 3.5h6.5L18 8v12.5H7z"></path><path d="M13.5 3.5V8H18"></path>'), bg: '#5856D6', kind: 'art' }, { label: 'Schlagwörter', detail: String(s.tagsM.length), svg: sv('<path d="M3.5 12V4.5H11l9 9L12.5 21z"></path><circle cx="7.6" cy="8.6" r="1.3"></circle>'), bg: '#34C759', kind: 'tag' }, { label: 'Ordner', detail: String(s.orteM.length), svg: sv('<path d="M3.5 6.5h6l2 2.5h9V19h-17z"></path>'), bg: '#FF9500', kind: 'ort' }, { label: 'Eigene Felder', detail: String(s.felderM.length), svg: sv('<path d="M4 8h10M18 8h2M4 16h4M12 16h8"></path><circle cx="16" cy="8" r="2"></circle><circle cx="10" cy="16" r="2"></circle>'), bg: '#8E8E93', kind: 'feld' }, { label: 'Gespeicherte Suchen', detail: String(s.suchenM.length), svg: sv('<circle cx="11" cy="11" r="7"></circle><path d="M16.8 16.8L21 21"></path>'), bg: '#5AC8FA', kind: 'such' } ].map((m, i, a) => ({ ...m, iconStyle: iconSq(m.bg), sep: i < a.length - 1, tap: () => { if (m.kind === 'ort') this.oeffneOrdner(''); else this.pushV({ t: 'org', kind: m.kind }); } })),
      adminRows: [ { label: 'Automatisierungen', detail: s.autos.filter(a => a.on).length + ' aktiv', svg: sv('<path d="M13 3L5 13.5h5.5L11 21l8-10.5h-5.5z"></path>'), bg: '#FF9500', tap: () => this.pushV({ t: 'auto' }) }, { label: 'E-Mail-Import', detail: s.mailRules.length ? s.mailRules.filter(r => r.on).length + ' aktiv' : 'Keine Regeln', svg: sv('<rect x="3.5" y="5.5" width="17" height="13" rx="2"></rect><path d="M4.5 7.5l7.5 5.5 7.5-5.5"></path>'), bg: '#007AFF', tap: () => this.pushV({ t: 'mail' }) }, { label: 'Benutzer & Gruppen', detail: String(s.users.length), svg: sv('<circle cx="9" cy="8.5" r="3"></circle><path d="M3.5 19c.8-3.4 3-4.7 5.5-4.7s4.7 1.3 5.5 4.7"></path><path d="M15.5 6.2a3 3 0 010 5.6M17.5 14.6c1.7.7 2.7 2 3 4.4"></path>'), bg: '#34C759', tap: () => this.pushV({ t: 'users' }) }, { label: 'Verarbeitung', detail: s.uploads.length ? s.uploads.length + ' aktiv' : '', svg: sv('<circle cx="12" cy="12" r="3.2"></circle><path d="M12 4v2.5M12 17.5V20M4 12h2.5M17.5 12H20M6.4 6.4l1.8 1.8M15.8 15.8l1.8 1.8M17.6 6.4l-1.8 1.8M8.2 15.8l-1.8 1.8"></path>'), bg: '#8E8E93', tap: () => { this.ladeAufgaben(); this.pushV({ t: 'tasks' }); } }, { label: 'Systemstatus', detail: s.loadErr ? 'Getrennt' : 'Verbunden', svg: sv('<rect x="4" y="4" width="16" height="6.5" rx="1.8"></rect><rect x="4" y="13.5" width="16" height="6.5" rx="1.8"></rect><path d="M7.5 7.2h0.1M7.5 16.7h0.1"></path>'), bg: '#30B0C7', tap: () => { this.ladeAufgaben(); this.pushV({ t: 'status' }); } } ].map((m, i, a) => ({ ...m, iconStyle: iconSq(m.bg), sep: i < a.length - 1 })),
    };
  }

  // --- Dokument ----------------------------------------------------
  // Dokument-Detail samt Vorschau, Volltext und Dokumentmenue.
  valsDokument(k) {
    const { s, top, dDoc, fundParts } = k;
    return {
      showDoc: top.t === 'doc' && !!dDoc,
      dTitel: dDoc ? dDoc.titel : '', dAbs: dDoc ? (dDoc.absender || '—') : '', dArt: dDoc ? dDoc.dokumentart : '', dDatum: dDoc ? dDoc.datum : '', dHinzu: dDoc ? dDoc.hinzugefuegt : '', dOrt: dDoc ? dDoc.ablageort : '', dAsn: dDoc ? dDoc.archivnummer : '', dSeitenLabel: dDoc ? 'Seite 1 von ' + dDoc.seitenzahl : '', dTags: dDoc ? dDoc.tags.map(n => ({ n })) : [], dFav: !!(dDoc && dDoc.favorit), dNoFav: !(dDoc && dDoc.favorit), dAbsHead: dDoc ? (dDoc.absender || 'Unbekannter Absender') : '', dBetreff: dDoc ? dDoc.titel : '', dOcr: dDoc ? dDoc.inhalt : '',
      dToggleFav: () => { if (dDoc) { this.updDoc(dDoc.id, { favorit: !dDoc.favorit }); this.note(dDoc.favorit ? 'Aus Favoriten entfernt' : 'Zu Favoriten hinzugefügt'); } },
      // Echtes Vorschaubild vom Server. Solange es laedt oder fehlt, bleibt
      // die schematische Seitendarstellung stehen.
      dPrevOn: !!(s.prev && s.prev.url && dDoc && s.prev.id === dDoc.id),
      dPrevOff: !(s.prev && s.prev.url && dDoc && s.prev.id === dDoc.id),
      dPrevUrl: s.prev ? s.prev.url : '',
      dPrevBusy: !!(s.prev && s.prev.busy),
      dPrevErrOn: !!(s.prev && s.prev.err), dPrevErr: s.prev ? s.prev.err : '',
      dOpenFile: () => { if (dDoc) this.drucken(dDoc.id); },
      dSegV: s.docTab === 'vorschau', dSegT: s.docTab === 'text', dSegI: s.docTab === 'info',
      setSegV: () => this.setState({ docTab: 'vorschau' }), setSegT: () => this.setState({ docTab: 'text' }), setSegI: () => this.setState({ docTab: 'info' }),
      sgV: this.seg(s.docTab === 'vorschau'), sgT: this.seg(s.docTab === 'text'), sgI: this.seg(s.docTab === 'info'),
      dFundOn: s.fund && !!fundParts, dFundLabel: '1 Fundstelle für „' + s.lastQ + '“',
      dOcrHasHit: !!fundParts, dOcrPlainOn: !fundParts,
      dOcrPre: fundParts ? fundParts.pre : '', dOcrHit: fundParts ? fundParts.hit : '', dOcrPost: fundParts ? fundParts.post : '',
      openShare: () => this.setState({ sheet: 'share' }), openDocMenu: () => this.setState({ sheet: 'docmenu' }),
      openEdit: () => { if (dDoc) this.setState({ editDraft: { ...dDoc, err: '' }, sheet: 'edit' }); },
      dmFav: () => { if (dDoc) { this.updDoc(dDoc.id, { favorit: !dDoc.favorit }); this.setState({ sheet: null }); } },
      dmFavLabel: dDoc && dDoc.favorit ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen',
      dmText: () => this.setState({ docTab: 'text', sheet: null }),
      dmDownload: () => { if (dDoc) this.dateiLaden(dDoc.id, true); },
      dmPrint: () => { if (dDoc) this.drucken(dDoc.id); },
      dmTrash: () => { if (dDoc) this.deleteDoc(dDoc.id); },
    };
  }

  // --- Suche -------------------------------------------------------
  // Suche: Eingabe, Vorschlaege, Verlauf, Treffer und gespeicherte Ansichten.
  valsSuche(k) {
    const { s, top, res } = k;
    return {
      showSearch: top.t === 'search',
      qVal: s.q, setQ: (e) => this.sucheSetzen(e.target.value), qClear: () => this.sucheSetzen(''),
      cancelSearch: () => { this.sucheSetzen(''); this.pop(); },
      noQ: s.q.trim().length < 2, hasQ: s.q.trim().length >= 2,
      // Vorschlaege aus den haeufigsten Schlagwoertern des Servers.
      qChips: [...(s.tagsRaw || [])].filter(t => t.name !== FAV_TAG)
        .sort((a, b) => (b.document_count || 0) - (a.document_count || 0)).slice(0, 3)
        .map(t => ({ label: t.name, tap: () => this.sucheSetzen(t.name) })),
      recentsRows: s.recents.map(r => ({ q: r, tap: () => this.sucheSetzen(r) })),
      clearRecents: () => { this.verlaufVergessen(); this.note('Suchverlauf gelöscht'); },
      // Gespeicherte Ansichten mit genau einer Volltextregel lassen sich hier
      // wieder ausfuehren; komplexere bleiben der Paperless-Oberflaeche
      // vorbehalten und werden nur benannt.
      savedRows: s.suchenM.map(x => ({
        name: x.name,
        n: x.q ? 'Volltextsuche' : 'In Paperless öffnen',
        tap: () => { if (x.q) this.sucheSetzen(x.q); else this.note('Diese Ansicht lässt sich nur in Paperless öffnen.'); }
      })),
      resRows: res,
      resCountLabel: s.qBusy ? 'Wird gesucht …'
        : s.qErr ? s.qErr
        : (res.length === 1 ? '1 Treffer' : res.length + ' Treffer') + (s.qEinfach ? ' · einfache Suche' : ''),
      // Erst melden, wenn die Antwort da ist - sonst blitzt bei jedem
      // Tastendruck kurz "Keine Treffer" auf.
      noResults: s.q.trim().length >= 2 && !s.qBusy && !s.qErr && res.length === 0,
      searchErrOn: !!s.qErr, searchErr: s.qErr,
      canSave: s.q.trim().length >= 2 && !s.qBusy && !s.qErr && res.length > 0,
      saveSearch: () => this.sucheSpeichern(s.q.trim()),
    };
  }

  // --- Ordnung -----------------------------------------------------
  // Stammdaten, Ordnerbaum, die drei festen Listen und der Papierkorb.
  valsOrdnung(k) {
    const { s, top, org, listeKind, listeDocs } = k;
    return {
      showOrg: top.t === 'org' && !!org,
      orgTitle: (top.kind === 'ort') ? ((top.pfad || '').split('/').pop() || 'Ordner') : (org ? org.title : ''),
      orgHint: (top.kind === 'ort') ? (top.pfad || '') : (org ? org.hint : ''),
      orgList: org ? org.rows.map(r => ({ name: r.name, countLabel: top.kind === 'such' ? (r.text || '') : (r.typ ? r.typ + ' · ' : '') + (r.count === 1 ? '1 Dokument' : r.count + ' Dokumente'), tap: () => { if (top.kind === 'such') { this.setState({ q: r.name.split(' ')[0] }); this.pushV({ t: 'search' }); } else { this.setState({ orgDraft: { kind: top.kind, alt: r.name, name: r.name, count: r.count, err: '', warn: false }, sheet: 'orgedit' }); } } })) : [],
      orgAdd: () => this.setState({ orgDraft: { kind: (top.kind || 'abs'), alt: null, name: '', count: 0, err: '', warn: false, pfad: (top.pfad || '') }, sheet: 'orgedit' }),

      // --- Ordner ---------------------------------------------------------
      // Ersetzt die frueher flache Ablageorte-Liste. Der Pfad des aktuellen
      // Ordners haengt am Stack-Eintrag, damit Zurueck wieder eine Ebene hoch
      // fuehrt statt den ganzen Baum zu schliessen.
      ordnerAn: top.t === 'org' && top.kind === 'ort',
      ordnerAus: top.t === 'org' && top.kind !== 'ort',
      ordnerListe: (top.t === 'org' && top.kind === 'ort')
        ? this.ordnerKinder(top.pfad || '').map(f => ({
            name: f.name,
            countLabel: (f.anzahl === 1 ? '1 Dokument' : f.anzahl + ' Dokumente') + (f.direkt ? '' : ' · nur Unterordner'),
            tap: () => this.oeffneOrdner(f.voll)
          }))
        : [],
      ordnerDateien: (top.t === 'org' && top.kind === 'ort') ? s.ordnerDocs.map(d => this.enrich(d)) : [],
      ordnerLeer: top.t === 'org' && top.kind === 'ort' && !s.ordnerLaden
                  && this.ordnerKinder(top.pfad || '').length === 0 && s.ordnerDocs.length === 0,
      ordnerLeerText: (top.pfad || '')
        ? 'Lege einen Unterordner an oder setze bei einem Dokument diesen Ablageort.'
        : 'Lege oben rechts den ersten Ordner an. Ordner entstehen aus den Ablageorten – ein Name wie „Privat/Steuern“ ergibt zwei Ebenen.',

      showListe: top.t === 'liste',
      listeTitle: listeKind === 'zuletzt' ? 'Zuletzt verwendet' : listeKind === 'fav' ? 'Favoriten' : listeKind === 'geteilt' ? 'Geteilt' : '',
      listeRows: listeDocs.map(d => this.enrich(d)), listeEmpty: listeDocs.length === 0,
      listeEmptyText: listeKind === 'fav' ? 'Markiere Dokumente mit dem Stern, um sie hier zu sehen.' : listeKind === 'geteilt' ? 'Dokumente mit aktivem Freigabelink erscheinen hier.' : 'Dokumente, die du öffnest, erscheinen hier.',
      showTrash: top.t === 'trash', trashEmpty: s.trash.length === 0,
      trashRows: s.trash.map(d => ({
        titel: d.titel, sub: [d.absender, d.dokumentart].filter(Boolean).join(' · '), gel: d.gel, rest: d.rest,
        restore: () => this.restoreDoc(d.id),
        delF: () => this.setState({ pendingDel: d.id, sheet: 'delfinal' })
      })),
      delName: (s.trash.find(x => x.id === s.pendingDel) || {}).titel || '',
      confirmDelFinal: () => { const id = s.pendingDel; this.setState({ sheet: null, pendingDel: null }); if (id) this.purgeDoc(id); },
    };
  }

  // --- Einstellungen -----------------------------------------------
  // Einstellungen: Schema, Konto, Server, Geraetesperre, lokale Daten, Abmelden.
  valsEinstellungen(k) {
    const { s, top } = k;
    return {
      showSet: top.t === 'set',
      setModeHell: () => this.setState({ mode: 'hell' }), setModeDunkel: () => this.setState({ mode: 'dunkel' }), setModeSystem: () => this.setState({ mode: 'system' }),
      msHell: this.seg(s.mode === 'hell'), msDunkel: this.seg(s.mode === 'dunkel'), msSystem: this.seg(s.mode === 'system'),
      modeAktuell: s.mode,
      defViewLabel: s.view === 'liste' ? 'Liste' : 'Raster',
      toggleDefView: () => { const neu = s.view === 'liste' ? 'raster' : 'liste'; this.setState({ view: neu }); defViewSichern(neu); },
      serverAddr: (s.serverUrl || '').replace(/^https?:\/\//, '').replace(/\/api$/, ''),
      kontoName: s.me ? ([s.me.first_name, s.me.last_name].filter(Boolean).join(' ') || s.me.username) : '—',
      kontoInitialen: s.me ? this.initialen(s.me.first_name, s.me.last_name, s.me.username) : '–',
      kontoMail: s.me && s.me.email ? s.me.email : 'Keine E-Mail hinterlegt',
      switchServer: () => this.setState({ screenSet: 'onb', onbStep: 1, onbServer: s.serverUrl || '', onbErr: '', stack: [], sheet: null }),
      // Lokal liegen nur Suchverlauf und Dokument-Cache; alles andere holt die
      // App ohnehin vom Server.
      // Ehrlich benennen, wo der Schluessel liegt und was das heisst - statt
      // Sicherheit zu behaupten, die die Ablage nicht hergibt.
      // --- Sperre ----------------------------------------------------------
      sperreOffen: s.sperreOffen,
      sperreFehler: s.sperreFehler,
      sperreLabel: s.sperreBusy ? 'Warte auf Bestätigung …' : 'Entsperren',
      entsperren: () => this.entsperrenGo(),
      sperreAbmelden: () => { window.DWSperre.aufheben(); this.logoutGo(); },
      // Der Schalter erscheint nur, wo er auch traegt.
      sperreZeigen: s.sperreMoeglich,
      sperreBg: this.tg(s.sperreAn).bg,
      sperreKnob: this.tg(s.sperreAn).knob,
      sperreAn: s.sperreAn,
      sperreToggle: () => (s.sperreAn ? this.sperreAufheben() : this.sperreEinrichten()),
      sperreHinweis: s.sperreAn
        ? 'Dein Zugangsschlüssel liegt verschlüsselt. Ohne Face ID, Touch ID oder Windows Hello ist er unbrauchbar — auch für jemanden mit Zugriff auf das Gerät.'
        : 'Verschlüsselt den Zugangsschlüssel. Er lässt sich dann nur noch mit der Biometrie dieses Geräts entsperren.',

      schluesselHinweis: (() => {
        const A = this.api();
        if (!A || !A.hasToken()) return 'Nicht angemeldet.';
        const bis = A.gueltigBis && A.gueltigBis();
        const rest = bis ? Math.max(0, Math.ceil((bis - Date.now()) / 86400000)) : null;
        return 'Liegt in diesem Browser, nicht verschlüsselt — wer Zugriff auf das '
          + 'entsperrte Gerät hat, kann ihn auslesen. '
          + (rest != null
              ? 'Er läuft in ' + rest + (rest === 1 ? ' Tag' : ' Tagen') + ' ohne Nutzung ab und verlängert sich, solange du die App benutzt. '
              : '')
          + 'Beim Abmelden wird er gelöscht.';
      })(),

      clearLocal: () => {
        // Wo der Suchverlauf liegt, weiss suche.js - hier steht nur, dass er
        // mit weg muss.
        this.verlaufVergessen();
        this.alleBilderFreigeben();
        this.setState({ cache: {}, opened: [], prev: null });
        this.reloadDocs().then(() => this.note('Lokale Daten gelöscht'));
      },
      doHelp: () => this.hilfeOeffnen(),
      doPrivacy: () => this.setState({ sheet: 'datenschutz' }),
      shDatenschutz: s.sheet === 'datenschutz',
      dsQuelle: PROJEKT_URL,
      dsOeffnen: () => this.hilfeOeffnen(),
      logout: () => this.logoutGo(),
    };
  }

  // --- Verwaltung --------------------------------------------------
  // Automatisierungen, E-Mail-Regeln, Mitglieder, Aufgaben und Systemstatus.
  valsVerwaltung(k) {
    const { s, top, auto } = k;
    return {
      showAuto: top.t === 'auto',
      autoRows: s.autos.map(a => { const t = this.tg(a.on); return { id: a.id, name: a.name, verlauf: this.autoLage(a.on), aktiv: !!a.on, tgBg: t.bg, tgKnob: t.knob, toggle: () => this.autoSchalten(a.id, !a.on), open: () => this.pushV({ t: 'autoD', id: a.id }) }; }),
      showAutoD: top.t === 'autoD' && !!auto,
      adName: auto ? auto.name : '', adVerlauf: auto ? this.autoLage(auto.on) : '', adAusl: auto ? auto.ausl : '',
      adBed: auto ? auto.bed.map(t => ({ t })) : [], adAkt: auto ? auto.akt.map(t => ({ t })) : [],
      // Eine Ueberschrift ohne Inhalt darunter sieht nach einem Fehler aus.
      adHatBed: !!(auto && auto.bed.length), adHatAkt: !!(auto && auto.akt.length),
      adTgBg: this.tg(!!(auto && auto.on)).bg, adTgKnob: this.tg(!!(auto && auto.on)).knob,
      adAktiv: !!(auto && auto.on),
      adToggle: () => { if (auto) this.autoSchalten(auto.id, !auto.on); },
      adNameVal: auto ? auto.name : '',
      setAdName: (e) => { const v = e.target.value; this.setState(st => ({ autos: st.autos.map(a => a.id === auto.id ? Object.assign({}, a, { name: v }) : a) })); },
      adNameSichern: () => { if (auto) this.autoNameSichern(auto.id, auto.name); },
      adAuslWaehlen: () => this.setState({ sheet: 'ausloeser' }),
      adEntfernen: () => { if (auto) this.autoEntfernen(auto.id); },
      adHinweis: 'Bedingungen und Aktionen legst du in Paperless fest — dort hängen deutlich mehr Felder dran, als dieser Bildschirm sinnvoll zeigen kann.',
      shAusloeser: s.sheet === 'ausloeser',
      ausloeserRows: [[1, 'Aufnahme begonnen'], [2, 'Dokument hinzugefügt'], [3, 'Dokument aktualisiert'], [4, 'Geplanter Zeitpunkt']]
        .map(([nr, label]) => ({
          label, on: !!(auto && auto.raw && (auto.raw.triggers || [])[0] && auto.raw.triggers[0].type === nr),
          pick: () => { if (auto) this.autoAusloeser(auto.id, nr); },
        })),
      autoNeu: () => this.autoAnlegen(),
      showMail: top.t === 'mail',
      mailFetch: () => this.mailAbrufen(),
      mailFetchLabel: (s.mailKonten || []).length ? 'Jetzt abrufen' : 'Kein Konto eingerichtet',
      mailRules: s.mailRules.map(r => { const t = this.tg(r.on); return { id: r.id, name: r.name, desc: r.desc, aktiv: !!r.on, tgBg: t.bg, tgKnob: t.knob, toggle: () => this.regelSchalten(r.id, !r.on) }; }),
      showUsers: top.t === 'users',
      // Echte Benutzer und Gruppen aus Paperless. Frueher standen hier vier
      // erfundene Rollen ("Kann ansehen", "Kann verwalten", …), die es in
      // Paperless nicht gibt und die beim Umschalten nur lokalen Zustand
      // aenderten - der Server erfuhr davon nie.
      userRows: (s.users || []).map(u => {
        const meins = s.me && u.id === s.me.id;
        const gruppen = (u.groups || []).map(gid => (s.gruppen.find(g => g.id === gid) || {}).name).filter(Boolean);
        const teile = [];
        if (u.is_superuser) teile.push('Administrator');
        if (gruppen.length) teile.push(gruppen.join(', '));
        if (!teile.length) teile.push('Keine Gruppe');
        if (meins) teile.push('du');
        return {
          id: u.id, name: u.name, ini: u.ini,
          iniStyle: 'width:38px;height:38px;border-radius:50%;background:' + (u.is_superuser ? 'var(--acc)' : 'var(--fill2)') + ';color:' + (u.is_superuser ? '#fff' : 'var(--lab2)') + ';display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;flex-shrink:0',
          detail: teile.join(' · '),
          tap: () => this.setState({ userSel: u.id, sheet: 'user' })
        };
      }),
      gruppenRows: (s.gruppen || []).map(g => {
        const n = (s.users || []).filter(u => (u.groups || []).indexOf(g.id) >= 0).length;
        return { name: g.name, detail: n === 1 ? '1 Mitglied' : n + ' Mitglieder', tap: () => this.setState({ gruppeSel: g, sheet: 'gruppeweg' }) };
      }),
      gruppenLeer: (s.gruppen || []).length === 0,
      userHinweis: 'Benutzer und Gruppen werden in Paperless verwaltet – dort werden auch die Rechte vergeben. Hier lässt sich einstellen, in welchen Gruppen jemand ist.',
      showTasks: top.t === 'tasks',
      tasksFehlerOn: !!s.tasksFehler, tasksFehler: s.tasksFehler || '',
      // Laufende eigene Uploads zuerst, danach die Aufgaben des Servers.
      taskRows: [...s.uploads.map(u => ({ name: u.name, st: u.st, run: true, ok: false, err: false, hasRetry: false })), ...(s.tasksRaw || [])],
      tasksEmpty: !s.uploads.length && !(s.tasksRaw || []).length,
      showStatus: top.t === 'status',
      statusRows: s.sysStatus || [{ k: 'Verbindung', v: s.loadErr ? 'Getrennt' : 'Verbunden', grn: !s.loadErr }],
      // Die letzten Serveraufgaben als Protokoll. Paperless stellt seine
      // eigentlichen Logdateien nicht ueber die API bereit.
      logLines: (s.tasksRaw || []).slice(0, 8).map(t => ({
        t: (t.err ? 'FEHLER  ' : t.ok ? 'OK      ' : 'LÄUFT   ') + t.name + ' – ' + t.st
      })),
    };
  }

  // --- Sheets ------------------------------------------------------
  // Alle Sheets. Die Reihenfolge zaehlt hier: shUser steht in der Flaggenzeile
  // weiter unten ein zweites Mal - dort mit der Bedingung, dass auch eine Person
  // gewaehlt ist. Der spaetere Eintrag gilt.
  valsSheets(k) {
    const { s, chip, dDoc, rev, share, ed, orgD, selN, userS, pickOpts } = k;
    return {

      // Sheet: Gruppenzugehoerigkeit einer Person aendern (echtes PATCH).
      userName: userS ? userS.name : '',
      userGruppen: (s.gruppen || []).map(g => ({
        label: g.name,
        on: !!(userS && (userS.groups || []).indexOf(g.id) >= 0),
        pick: () => this.gruppeUmschalten(userS, g.id)
      })),
      userKeineGruppen: (s.gruppen || []).length === 0,
      // Adminrecht und Entfernen nur bei anderen - sich selbst auszusperren
      // waere die einzige unumkehrbare Aktion auf diesem Bildschirm.
      userAdminZeigen: !!(userS && s.me && userS.id !== s.me.id),
      userWegZeigen: !!(userS && s.me && userS.id !== s.me.id),
      userAdminBg: this.tg(!!(userS && userS.is_superuser)).bg,
      userAdminKnob: this.tg(!!(userS && userS.is_superuser)).knob,
      userAdminToggle: () => this.adminUmschalten(userS),
      userWeg: () => this.mitgliedEntfernen(userS),

      // --- Mitglied anlegen ------------------------------------------------
      mitgliedNeu: () => this.setState({ sheet: 'mitgliedneu', neuMitglied: { name: '', mail: '', gruppe: null, err: '', busy: false } }),
      shMitgliedNeu: s.sheet === 'mitgliedneu',
      nmName: s.neuMitglied ? s.neuMitglied.name : '',
      nmMail: s.neuMitglied ? s.neuMitglied.mail : '',
      setNmName: (e) => { const v = e.target.value; this.setState(st => ({ neuMitglied: Object.assign({}, st.neuMitglied, { name: v, err: '' }) })); },
      setNmMail: (e) => { const v = e.target.value; this.setState(st => ({ neuMitglied: Object.assign({}, st.neuMitglied, { mail: v, err: '' }) })); },
      nmGruppenDa: (s.gruppen || []).length > 0,
      nmOhneGruppe: (s.gruppen || []).length === 0,
      nmOhneGruppeText: 'Es gibt noch keine Gruppe. Rechte hängen in Paperless an Gruppen — ohne eine sähe das neue Konto ein leeres Archiv. Lege zuerst eine Gruppe an und gib ihr in Paperless die nötigen Rechte.',
      nmGruppen: (s.gruppen || []).map(g => ({
        label: g.name,
        style: chip(!!(s.neuMitglied && s.neuMitglied.gruppe === g.id)),
        pick: () => this.setState(st => ({ neuMitglied: Object.assign({}, st.neuMitglied, { gruppe: st.neuMitglied.gruppe === g.id ? null : g.id }) }))
      })),
      nmErrOn: !!(s.neuMitglied && s.neuMitglied.err), nmErr: s.neuMitglied ? s.neuMitglied.err : '',
      nmSaveLabel: (s.neuMitglied && s.neuMitglied.busy) ? 'Wird angelegt …' : 'Konto anlegen',
      nmSave: () => this.mitgliedAnlegen(),

      // --- Zugangsdaten einmalig zeigen ------------------------------------
      shZugang: s.sheet === 'zugang',
      zuName: s.zugang ? s.zugang.name : '',
      zuBenutzer: s.zugang ? s.zugang.benutzername : '',
      zuPasswort: s.zugang ? s.zugang.passwort : '',
      zuTeilen: () => this.zugangTeilen(),

      // --- Gruppen ----------------------------------------------------------
      gruppeNeu: () => this.setState({ sheet: 'gruppeneu', neuGruppe: '' }),
      shGruppeNeu: s.sheet === 'gruppeneu',
      ngName: s.neuGruppe || '',
      setNgName: (e) => this.setState({ neuGruppe: e.target.value }),
      ngSave: () => this.gruppeAnlegen(s.neuGruppe),
      shGruppeWeg: s.sheet === 'gruppeweg',
      gwName: s.gruppeSel ? s.gruppeSel.name : '',
      gwHinweis: s.gruppeSel
        ? ((s.users || []).filter(u => (u.groups || []).indexOf(s.gruppeSel.id) >= 0).length
            ? 'Die Mitglieder verlieren die Rechte, die aus dieser Gruppe stammen. Die Konten selbst bleiben bestehen.'
            : 'Die Gruppe hat keine Mitglieder.')
        : '',
      gwGo: () => this.gruppeEntfernen(s.gruppeSel),
      sheetOn: !!s.sheet, closeSheet: () => this.setState({ sheet: null, editDraft: null, pendingDel: null, ...DWOrdnung.beimSchliessen() }),
      // --- Zuweisen -------------------------------------------------------
      dmZuweisen: () => this.setState({ sheet: 'zuweisen' }),
      shZuweisen: s.sheet === 'zuweisen',
      zuweisenHinweis: 'Die Person wird Besitzerin des Dokuments und findet es in ihrem Posteingang. Du behältst Lese- und Schreibzugriff.',
      zuweisenZiele: (() => {
        const ich = s.me ? s.me.id : null;
        const ini = (n) => (n || '?').split(/[\s.@_-]+/).filter(Boolean).slice(0, 2).map(t => t[0].toUpperCase()).join('') || '?';
        const stil = (bg) => 'width:34px;height:34px;border-radius:50%;background:' + bg + ';color:#fff;display:flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:600;flex-shrink:0';
        const personen = (s.users || [])
          .filter(u => u.id !== ich)
          .map(u => ({
            name: u.name, dokumentart: 'Person · wird Besitzerin', ini: ini(u.name), iconStyle: stil('var(--acc)'),
            tap: () => dDoc && this.zuweisen(dDoc.id, { typ: 'user', id: u.id, name: u.name })
          }));
        const gruppen = (s.gruppen || []).map(g => ({
          name: g.name, dokumentart: 'Gruppe · bekommt Zugriff', ini: ini(g.name), iconStyle: stil('var(--org)'),
          tap: () => dDoc && this.zuweisen(dDoc.id, { typ: 'group', id: g.id, name: g.name })
        }));
        return personen.concat(gruppen);
      })(),
      zuweisenLeer: ((s.users || []).filter(u => u.id !== (s.me ? s.me.id : null)).length + (s.gruppen || []).length) === 0,

      shAdd: s.sheet === 'add', shSort: s.sheet === 'sort', shFilter: s.sheet === 'filter', shBulkTag: s.sheet === 'bulktag', shDocMenu: s.sheet === 'docmenu', shEdit: s.sheet === 'edit' && !!ed, shPick: s.sheet === 'pick', shShare: s.sheet === 'share' && !!dDoc, shDelFinal: s.sheet === 'delfinal', shOrgEdit: s.sheet === 'orgedit' && !!orgD, shUser: s.sheet === 'user' && !!userS,
      // Sortiert und gefiltert wird auf dem Server, deshalb loest jede
      // Aenderung ein Neuladen der Liste aus (setzeFilter).
      sortRows: [['neu', 'Neueste zuerst'], ['alt', 'Älteste zuerst'], ['titel', 'Titel A–Z'], ['abs', 'Absender A–Z']].map(p => ({ label: p[1], on: s.sort === p[0], pick: () => this.setzeFilter({ sort: p[0], sheet: null }) })),
      fArtRows: s.artenM.map(a => ({ label: a, tap: () => this.setzeFilter({ fArt: s.fArt === a ? null : a }), style: chip(s.fArt === a) })),
      fTagRows: s.tagsM.map(t => ({ label: t, tap: () => this.setzeFilter({ fTags: s.fTags.includes(t) ? s.fTags.filter(x => x !== t) : [...s.fTags, t] }), style: chip(s.fTags.includes(t)) })),
      fAbsRows: s.absM.map(a => ({ label: a, tap: () => this.setzeFilter({ fAbs: s.fAbs.includes(a) ? s.fAbs.filter(x => x !== a) : [...s.fAbs, a] }), style: chip(s.fAbs.includes(a)) })),
      // Jahre aus dem tatsaechlichen Bestand, absteigend.
      fZeitRows: [{ w: 'alle', l: 'Alle' }, ...this.jahre().map(j => ({ w: String(j), l: String(j) }))]
        .map(p => ({ label: p.l, tap: () => this.setzeFilter({ fZeit: p.w }), style: this.seg(s.fZeit === p.w) })),
      filterApplyLabel: s.docsBusy ? 'Wird geladen …' : (s.docsTotal === 1 ? '1 Dokument anzeigen' : s.docsTotal + ' Dokumente anzeigen'),
      selCountText: selN === 1 ? '1 Dokument' : selN + ' Dokumente',
      bulkTagRows: s.tagsM.map(t => ({ label: t, tap: () => this.bulkApplyTag(t), style: chip(false) })),
      eTitel: ed ? ed.titel : '', setETitel: (e) => this.setState(st => ({ editDraft: { ...st.editDraft, titel: e.target.value, err: '' } })),
      eDatum: ed ? ed.datum : '', setEDatum: (e) => this.setState(st => ({ editDraft: { ...st.editDraft, datum: e.target.value } })),
      eNotiz: ed ? (ed.notiz || '') : '', setENotiz: (e) => this.setState(st => ({ editDraft: { ...st.editDraft, notiz: e.target.value } })),
      eAbs: ed ? (ed.absender || 'Wählen') : '', eArt: ed ? ed.dokumentart : '', eOrt: ed ? ed.ablageort : '',
      eErrOn: !!(ed && ed.err), eErr: ed ? ed.err : '',
      ePickAbs: () => this.setState({ pickTarget: 'edit', pickField: 'Absender', pickNew: '', sheet: 'pick' }),
      ePickArt: () => this.setState({ pickTarget: 'edit', pickField: 'Dokumentart', pickNew: '', sheet: 'pick' }),
      ePickOrt: () => this.setState({ pickTarget: 'edit', pickField: 'Ablageort', pickNew: '', sheet: 'pick' }),
      eTagRows: s.tagsM.map(t => ({ label: t, tap: () => this.setState(st => ({ editDraft: { ...st.editDraft, tags: st.editDraft.tags.includes(t) ? st.editDraft.tags.filter(x => x !== t) : [...st.editDraft.tags, t] } })), style: chip(!!(ed && ed.tags.includes(t))) })),
      eCancel: () => this.setState({ sheet: null, editDraft: null }),
      // Die Notiz liegt in Paperless nicht am Dokument, sondern in einer
      // eigenen Liste - sie wird deshalb getrennt gesichert.
      eSave: () => { if (!ed) return; if (!ed.titel.trim()) { this.setState(st => ({ editDraft: { ...st.editDraft, err: 'Der Titel darf nicht leer sein.' } })); return; } const notiz = (ed.notiz || '').trim(); this.updDoc(ed.id, { titel: ed.titel.trim(), datum: ed.datum, absender: ed.absender, dokumentart: ed.dokumentart, ablageort: ed.ablageort, tags: ed.tags }).then(() => this.notizSichern(ed.id, notiz)); this.setState({ sheet: null, editDraft: null }); this.note('Änderungen gesichert'); },
      pickTitle: s.pickField || '',
      pickRows: pickOpts.map(v => { const map = { 'Absender': 'abs', 'Dokumentart': 'art', 'Ablageort': 'ort', 'Datum': 'datum' }; const cur = s.pickTarget === 'rev' ? (rev ? ((rev.felder.find(f => f.k === s.pickField) || {}).v || '') : '') : (ed ? ed[map[s.pickField]] : ''); return { label: v, on: cur === v, pick: () => this.choosePick(v) }; }),
      pickCanCreate: ['Absender', 'Dokumentart', 'Schlagwörter', 'Ablageort'].indexOf(s.pickField) >= 0,
      pickNew: s.pickNew, setPickNew: (e) => this.setState({ pickNew: e.target.value }), pickCreate: () => this.pickCreateGo(), pickNewPlaceholder: 'Neu erstellen …',
      shNoLink: !share, shHasLink: !!share, shLink: share ? share.link : '', shMeta: share ? 'Gültig: ' + share.ablauf + ' · ' + share.recht : '',
      shAblaufRows: ['7 Tage', '30 Tage', 'Ohne Ablauf'].map(l => ({ label: l, pick: () => this.setState({ shAblauf: l }), style: chip(s.shAblauf === l) })),
      shRechtRows: ['Kann ansehen', 'Kann herunterladen'].map(l => ({ label: l, pick: () => this.setState({ shRecht: l }), style: chip(s.shRecht === l) })),
      shMake: () => {
        if (!dDoc) return;
        const A = this.api();
        // Paperless erwartet ein Ablaufdatum oder null fuer unbegrenzt.
        const tage = { '7 Tage': 7, '30 Tage': 30 }[s.shAblauf];
        let exp = null;
        if (tage) { const d = new Date(); d.setDate(d.getDate() + tage); exp = d.toISOString(); }
        this.setState({ shBusy: true });
        A.shareLinks.create(dDoc.id, exp, s.shRecht === 'Kann herunterladen' ? 'original' : 'archive')
          .then(l => {
            this.setState(st => Object.assign(
              this.inAllenListen(st, dDoc.id, d => Object.assign({}, d, { geteilt: true })),
              {
                shBusy: false,
                shares: Object.assign({}, st.shares, { [dDoc.id]: {
                  id: l.id, link: this.shareHref(l.slug),
                  ablauf: l.expiration ? ('bis ' + A.util.dateDE(l.expiration)) : 'Ohne Ablauf',
                  recht: st.shRecht
                } })
              }
            ));
            this.note('Freigabelink erstellt');
            // Damit das Dokument in der Liste "Geteilt" auftaucht.
            this.ladeNeben();
          })
          .catch(e => { this.setState({ shBusy: false }); this.note(e.message); });
      },
      shCopy: () => this.kopiere(share ? 'https://' + share.link : '', 'Link kopiert'),
      shRevoke: () => {
        if (!dDoc) return;
        const A = this.api(), vorhanden = s.shares[dDoc.id];
        if (!vorhanden) { this.setState({ shareOpen: false }); return; }
        A.shareLinks.remove(vorhanden.id)
          .then(() => {
            this.setState(st => {
              const sh = Object.assign({}, st.shares); delete sh[dDoc.id];
              return Object.assign(
                this.inAllenListen(st, dDoc.id, d => Object.assign({}, d, { geteilt: false })),
                { shares: sh, sheet: null }
              );
            });
            this.note('Freigabe widerrufen');
            this.ladeNeben();
          })
          .catch(e => this.note(e.message));
      },
      orgEditTitle: orgD ? (orgD.alt ? 'Bearbeiten' : 'Neu erstellen') : '',
      orgName: orgD ? orgD.name : '', setOrgName: (e) => this.setState(st => ({ orgDraft: { ...st.orgDraft, name: e.target.value, err: '' } })),
      orgErrOn: !!(orgD && orgD.err), orgErr: orgD ? orgD.err : '',
      orgCountOn: !!(orgD && orgD.alt), orgCountLabel: orgD ? 'Wird von ' + orgD.count + (orgD.count === 1 ? ' Dokument' : ' Dokumenten') + ' verwendet' : '',
      orgWarnOn: !!(orgD && orgD.warn), orgWarnText: orgD ? '„' + orgD.alt + '“ wird von ' + orgD.count + ' Dokumenten entfernt. Die Dokumente selbst bleiben erhalten.' : '',
      orgDelOn: !!(orgD && orgD.alt && !orgD.warn), orgDelTap: () => this.orgDeleteGo(false), orgDelForce: () => this.orgDeleteGo(true),
      orgSaveTap: () => this.orgSaveGo(),
    };
  }

  // --- Erfassen ----------------------------------------------------
  // Scannen, Zuschneiden, Hochladen - und die Meldung samt Widerruf.
  valsErfassen(k) {
    const { s } = k;
    return {
      scanOn: !!s.scan,
      scanKameraOn: !!(s.scan && s.scan.schritt === 'seiten' && s.scan.kamera),
      scanKameraStream: this._scanStream || null,
      onScanKameraBereit: (video) => { this._scanVideoEl = video; },
      scanKameraSchiessen: () => this.scanKameraAufnehmen(this._scanVideoEl),
      scanKameraZuDatei: () => this.scanZuDatei(),
      scanSeiten: !!(s.scan && s.scan.schritt === 'seiten'),
      scanZuschnitt: !!(s.scan && s.scan.schritt === 'zuschnitt'),
      scanMeta: !!(s.scan && s.scan.schritt === 'meta'),
      scanUp: !!(s.scan && s.scan.schritt === 'up'),
      scanStepTitle: s.scan ? ({ seiten: 'Seiten', zuschnitt: 'Zuschneiden', meta: 'Details', up: 'Hochladen' })[s.scan.schritt] : '',
      scanCancel: () => this.scanAbbrechen(),
      scanBusy: !!(s.scan && s.scan.busy),
      scanLeer: !!(s.scan && !s.scan.seiten.length && !s.scan.busy),
      scanHasPages: !!(s.scan && s.scan.seiten.length),
      addPage: () => this.scanAufnehmen(),
      scanPagesArr: (s.scan ? s.scan.seiten : []).map((sei, i, alle) => ({
        id: sei.id, nr: String(i + 1), url: sei.url, busy: !!sei.busy,
        del: () => this.scanEntfernen(sei.id),
        dreh: () => this.scanDrehen(sei.id),
        crop: () => this.scanZuschnittOeffnen(sei.id),
        hoch: i > 0 ? () => this.scanSchieben(sei.id, -1) : null,
        runter: i < alle.length - 1 ? () => this.scanSchieben(sei.id, 1) : null,
      })),
      // --- Zuschneiden ---
      zUrl: this.zSeite() ? this.zSeite().url : '',
      zRect: s.scan && s.scan.zRect ? s.scan.zRect : { x0: 0, y0: 0, x1: 1, y1: 1 },
      zGriffFassen: (ecke) => (e) => this.zGriffFassen(ecke, e),
      zZiehen: (e) => this.zZiehen(e),
      zLoslassen: () => this.zLoslassen(),
      zAbbrechen: () => this.setState(st => ({ scan: { ...st.scan, schritt: 'seiten', zId: null, zRect: null } })),
      zZuruecksetzen: () => this.setState(st => ({ scan: { ...st.scan, zRect: { x0: 0, y0: 0, x1: 1, y1: 1 } } })),
      zSichern: () => this.scanZuschnittSichern(),
      // --- Details ---
      toMeta: () => this.setState(st => ({ scan: { ...st.scan, schritt: 'meta' } })),
      backToSeiten: () => this.setState(st => ({ scan: { ...st.scan, schritt: 'seiten' } })),
      scanTitleVal: s.scanTitle, setScanTitle: (e) => this.setState({ scanTitle: e.target.value }),
      scanTitlePlatz: 'Scan vom ' + new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }),
      scanPagesLabel: s.scan ? (s.scan.seiten.length === 1 ? '1 Seite' : s.scan.seiten.length + ' Seiten') : '',
      doUpload: () => this.scanHochladen(),
      toastOn: !!s.toast, toastMsg: s.toast, undoOn: !!s.undoFn, undoLabel: s.undoLabel || 'Widerrufen',
      doUndo: () => { if (s.undoFn) s.undoFn(); this.setState({ toast: null, undoFn: null }); }
    };
  }

  // --- Onboarding --------------------------------------------------
  // Onboarding: Server, Anmeldung, Abschluss.
  valsOnboarding(k) {
    const { s } = k;
    return {
      ob0: s.onbStep === 0, ob1: s.onbStep === 1, ob2: s.onbStep === 2, ob3: s.onbStep === 3,
      obStart: () => this.setState({ onbStep: 1, onbErr: '' }),
      obBack: () => this.setState(st => ({ onbStep: Math.max(0, st.onbStep - 1), onbErr: '' })),
      onbServerVal: s.onbServer, setOnbServer: (e) => this.setState({ onbServer: e.target.value, onbErr: '' }),
      onbShowAdv: s.onbAdv, obToggleAdv: () => this.setState({ onbAdv: !s.onbAdv }),
      onbErrOn: !!s.onbErr, onbErr: s.onbErr, onbChecking: s.onbChecking,
      obConnect: () => this.obConnectGo(), obConnectLabel: s.onbChecking ? 'Verbinde …' : 'Verbinden',
      onbServerShown: (s.onbServer || s.serverUrl || '').replace(/^https?:\/\//, '').replace(/\/api$/, ''),
      onbUserMode: !s.onbTok, onbTokMode: s.onbTok, obToggleTok: () => this.setState({ onbTok: !s.onbTok, onbErr: '' }),
      obTokLinkLabel: s.onbTok ? 'Mit Benutzername anmelden' : 'Stattdessen mit Zugangsschlüssel anmelden',
      onbUserVal: s.onbUser, setOnbUser: (e) => this.setState({ onbUser: e.target.value, onbErr: '' }),
      onbPassVal: s.onbPass, setOnbPass: (e) => this.setState({ onbPass: e.target.value, onbErr: '' }),
      onbTokenVal: s.onbToken, setOnbToken: (e) => this.setState({ onbToken: e.target.value, onbErr: '' }),
      obLoginTap: () => this.obLoginGo(false), obSSO: () => this.obLoginGo(true),
      obFertig: () => this.obDone(),
      obFertigText: 'Dein Archiv ist bereit. Du kannst jetzt Dokumente hinzufügen, suchen und ordnen.',
    };
  }

  // Der flache Wertesack, den die Bildschirme lesen, abschnittsweise
  // zusammengelegt. Inhalt und Reihenfolge entsprechen dem frueheren einen
  // Literal; tests/template_check.py folgt der Aufteilung.
  renderVals() {
    const k = this.renderKontext();
    return Object.assign({},
      this.valsRahmen(k),
      this.valsNavigation(k),
      this.valsStart(k),
      this.valsDokumentliste(k),
      this.valsPosteingang(k),
      this.valsMehr(k),
      this.valsDokument(k),
      this.valsSuche(k),
      this.valsOrdnung(k),
      this.valsEinstellungen(k),
      this.valsVerwaltung(k),
      this.valsSheets(k),
      this.valsErfassen(k),
      this.valsOnboarding(k)
    );
  }

  render() {
    // renderVals liefert alles, was die Bildschirme brauchen; sie greifen
    // ausschliesslich ueber v darauf zu (siehe tools/konvert.py).
    return DWVorlage.wurzel(this.renderVals(), html, stil);
  }
}

// Die Methoden der ausgelagerten Sachgebiete an den Prototyp haengen. Danach
// sind this.mitgliedAnlegen(), this.scanOeffnen(), this.sucheSetzen(),
// this.drucken() und this.autoSchalten() dasselbe wie zuvor - die Aufrufer in
// valsVerwaltung, valsSheets, valsNavigation, valsErfassen, valsSuche,
// valsDokument und valsMehr merken nichts davon, dass die Bodies in
// mitglieder.js, erfassen.js, suche.js, vorschau.js, betrieb.js und
// ordnung.js stehen.
Object.assign(Oberflaeche.prototype, DWMitglieder.methoden, DWErfassen.methoden, DWSuche.methoden, DWVorschau.methoden, DWBetrieb.methoden, DWOrdnung.methoden);


  // Wurzel: loest 'System' zum tatsaechlichen Schema auf, damit die
  // Oberflaeche nur noch 'Hell' oder 'Dunkel' kennt.
  class Wurzel extends React.Component {
    constructor(p) {
      super(p);
      this.state = { systemDunkel: false };
    }
    componentDidMount() {
      if (!global.matchMedia) return;
      this._mq = global.matchMedia('(prefers-color-scheme: dark)');
      this.setState({ systemDunkel: this._mq.matches });
      this._auf = (e) => this.setState({ systemDunkel: e.matches });
      this._mq.addEventListener('change', this._auf);
    }
    componentWillUnmount() {
      if (this._mq && this._auf) this._mq.removeEventListener('change', this._auf);
    }
    render() {
      const wahl = this.props.farbschema || 'System';
      const dunkel = wahl === 'System' ? this.state.systemDunkel : wahl === 'Dunkel';
      return html`<${Oberflaeche} farbschema=${dunkel ? 'Dunkel' : 'Hell'} onDark=${this.props.onDark} />`;
    }
  }

  global.DWApp = { Oberflaeche: Oberflaeche, Wurzel: Wurzel };
})(typeof globalThis !== 'undefined' ? globalThis : this);
