// Zwei-Faktor-Authentifizierung (TOTP) fuer das eigene Konto - einrichten,
// die Wiederherstellungscodes einmalig zeigen, wieder deaktivieren. Ein
// klar begrenzter Selbstbedienungs-Flow, vergleichbar mit sperre.js: kein
// Einstieg in den Nachbau der Paperless-Kontoverwaltung.
//
// Warum dieses Modul nicht wie die uebrigen Sachgebiete einfach api.js
// benutzt: DocuWunder spricht sonst ueberall per DRF-Token
// (`Authorization: Token ...`, siehe api.js). Gegen die MFA-Endpunkte von
// allauth quittiert der Server das mit 401 - gemessen am 08.08.2026, siehe
// docs/ROADMAP.md 3.16 "Nachtrag 08.08.2026". Diese Endpunkte verlangen eine
// echte Django-Session mit CSRF, wie sie ein Browser fuehrt. Deshalb baut
// dieses Modul sich eine EIGENE, kurzlebige Session per allauth-Headless-API
// (`/api/auth/headless/browser/v1/...`) auf, waehrend der Bildschirm offen
// ist, und wirft sie beim Verlassen wieder weg (DELETE .../auth/session) -
// der DRF-Token, mit dem die App sonst arbeitet, bleibt davon unberuehrt.
//
// Fuer die Anmeldung selbst ist bewusst NICHT die klassische HTML-Seite
// /paperless/accounts/login/ genutzt (das waere Scraping), sondern derselbe
// Headless-JSON-Weg wie fuer alles andere hier: POST .../auth/login, bei
// bereits aktivem zweiten Faktor gefolgt von POST .../auth/2fa/authenticate.
// Das ist der "sauberere Weg", den Nachtrag 08.08.2026 ausdruecklich erlaubt
// und selbst gegen den Paketcode verlangt - siehe dort und in
// allauth/headless/mfa/views.py (AuthenticateView), allauth/headless/
// account/views.py (LoginView) und allauth/account/internal/flows/login.py
// (resume_login: die eigentliche Django-Anmeldung erfolgt dort erst NACH
// einer noch ausstehenden MFA-Stufe).
//
// Sicherheitsregeln (siehe docs/ROADMAP.md 3.16): das TOTP-Geheimnis, der
// otpauth-Text und die Wiederherstellungscodes werden nie protokolliert, nie
// in eine Fehlermeldung uebernommen und nie ausserhalb dieses fluechtigen
// Zustands abgelegt - insbesondere nicht in localStorage. Sie liegen nur in
// state.zweiSetup / state.zweiCodes, und beimSchliessen()/beimAbmelden()
// raeumen genau das wieder ab. Nachtrag 2 (08.08.2026) stellt klar: dass
// allauth waehrend der Einrichtung ein Kandidaten-Geheimnis in der eigenen
// Django-Session ablegt (SECRET_SESSION_KEY), ist normaler Serverbetrieb,
// kein Leck dieser App - betroffen von der Regel hier ist der Browser
// (localStorage, Konsole, Fehlermeldungen, Tests), nicht die Server-Session.
(function (global) {
  'use strict';

  // --- Sitzungsaufbau ------------------------------------------------------

  // Der Auth-Zweig liegt NEBEN der API-Basis, nicht darunter (gemessen,
  // docs/ROADMAP.md 3.16 Nachtrag 08.08.2026, Punkt 2): aus
  // ".../paperless/api" wird ".../paperless/api/auth/headless/browser/v1".
  function headlessBase() {
    var A = global.PaperlessAPI;
    var basis = (A && A.getBase && A.getBase()) || '';
    return basis.replace(/\/api\/?$/, '') + '/api/auth/headless/browser/v1';
  }

  function csrfCookie() {
    if (typeof document === 'undefined') return '';
    var m = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  }

  // Jeder Aufruf gegen die Headless-API im 'browser'-Client setzt das
  // CSRF-Cookie neu (allauth/headless/internal/decorators.py, browser_view
  // ruft get_token() vor jeder Antwort) - ein GET reicht deshalb, um vor dem
  // ersten POST ein gueltiges Cookie zu haben.
  function ruf(pfad, methode, daten) {
    var init = {
      method: methode || 'GET',
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json' },
    };
    if (methode && methode !== 'GET') init.headers['X-CSRFToken'] = csrfCookie();
    if (daten !== undefined) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(daten);
    }
    return fetch(headlessBase() + pfad, init).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        return { status: res.status, body: body || {} };
      });
    }, function () {
      return { status: 0, body: {} };
    });
  }

  function istAngemeldet(antwort) {
    return !!(antwort.status === 200 && antwort.body.meta && antwort.body.meta.is_authenticated);
  }

  function ausstehendeMfaStufe(antwort) {
    var flows = (antwort.body.data && antwort.body.data.flows) || [];
    return flows.some(function (f) { return f.id === 'mfa_authenticate' && f.is_pending; });
  }

  // allauth antwortet auf Englisch (kein deutsches Sprachpaket in dieser
  // Paperless-Instanz, und daran wird hier nichts geaendert - siehe
  // CLAUDE.md, "Keine Aenderung an der Paperless-Konfiguration"). Bekannte
  // Fehlercodes bekommen deshalb einen eigenen deutschen Satz; nur ein
  // unbekannter Code faellt auf den Text des Aufrufers zurueck.
  var FEHLER_TEXT = {
    username_password_mismatch: 'Benutzername oder Passwort stimmt nicht.',
    too_many_login_attempts: 'Zu viele Versuche. Bitte kurz warten und erneut versuchen.',
    incorrect_code: 'Der Code ist falsch oder abgelaufen.',
    unverified_email: 'Die E-Mail-Adresse dieses Kontos ist nicht bestätigt.',
    cannot_delete_authenticator: 'Dieser zweite Faktor lässt sich hier nicht entfernen.',
  };

  function fehlerAus(antwort, ersatz) {
    if (antwort.status === 0) return 'Keine Verbindung zum Server.';
    var errs = antwort.body && antwort.body.errors;
    if (errs && errs.length) {
      var code = errs[0].code;
      return FEHLER_TEXT[code] || ersatz;
    }
    return ersatz;
  }

  // --- Zustand ---------------------------------------------------------

  //   zweiSchritt   'passwort' | 'code2fa' | 'einrichten' | 'codes' | 'aktiv'
  //                 | 'deaktivieren' | 'deaktiviert' - wo im Ablauf die
  //                 Sitzung gerade steht.
  //   zweiLaedt     eine Anfrage ist unterwegs, Knoepfe sind gesperrt.
  //   zweiFehler    Text fuer den aktuellen Schritt, nie das Geheimnis selbst.
  //   zweiPasswort  nur fluechtig, fuer den einen Anmelde-Aufruf - siehe
  //                 zweiAnmelden(), das Feld wird direkt danach geleert.
  //   zweiCode      Eingabefeld: je nach Schritt der bestehende 2FA-Code oder
  //                 der Aktivierungscode des neuen Authenticators.
  //   zweiSetup     { secret, totp_url } waehrend der Einrichtung - danach
  //                 sofort entfernt, nie an anderer Stelle gespeichert.
  //   zweiCodes     die Wiederherstellungscodes, nur einmal gesetzt und nur
  //                 bis zur Bestaetigung "Ich habe sie gesichert".
  //   zweiBestaetigt  Checkbox fuer eben diese Bestaetigung.
  //   zweiAktivSeit Zeitpunkt der Aktivierung, fuer die Anzeige im Schritt
  //                 'aktiv' - unkritisch, kein Geheimnis.
  function start() {
    return {
      zweiSchritt: 'passwort', zweiLaedt: false, zweiFehler: '',
      zweiPasswort: '', zweiCode: '',
      zweiSetup: null, zweiCodes: null, zweiBestaetigt: false,
      zweiAktivSeit: null,
    };
  }

  // Wird beim Schliessen des Sheets UND beim Abmelden aufgerufen (app.js).
  // Wirft die serverseitige Sitzung weg (Nachtrag 08.08.2026: "Cookie fuer
  // die Dauer des Einrichtungsvorgangs halten, danach verwerfen") und setzt
  // den Zustand zurueck - damit sind Geheimnis, Codes und Passwort aus dem
  // Speicher.
  function beimSchliessen() {
    ruf('/auth/session', 'DELETE');
    return start();
  }

  var methoden = {

    zweiOeffnen() {
      this.setState(Object.assign({ sheet: 'zwei' }, start()));
    },

    // Schritt 1: eigene, kurzlebige Anmeldung. Das Passwort verlaesst
    // dieses Feld nur fuer diesen einen Aufruf und wird sofort danach aus
    // dem Zustand entfernt, egal wie der Aufruf ausgeht.
    zweiAnmelden() {
      const s = this.state;
      const passwort = s.zweiPasswort;
      const username = s.me ? s.me.username : '';
      if (!passwort) return;
      this.setState({ zweiLaedt: true, zweiFehler: '', zweiPasswort: '' });
      ruf('/config').then(() => ruf('/auth/login', 'POST', { username: username, password: passwort }))
        .then((antwort) => {
          if (istAngemeldet(antwort)) { this.zweiStatusLaden(); return; }
          if (ausstehendeMfaStufe(antwort)) {
            this.setState({ zweiLaedt: false, zweiSchritt: 'code2fa', zweiCode: '' });
            return;
          }
          this.setState({ zweiLaedt: false, zweiFehler: fehlerAus(antwort, 'Passwort falsch oder Anmeldung fehlgeschlagen.') });
        });
    },

    // Schritt 1b, nur wenn ein zweiter Faktor bereits aktiv ist (etwa beim
    // spaeteren Deaktivieren): der bestehende Code schliesst dieselbe
    // Anmeldung ab, die zweiAnmelden() begonnen hat.
    zweiCodeBestaetigen() {
      const code = this.state.zweiCode;
      if (!code) return;
      this.setState({ zweiLaedt: true, zweiFehler: '' });
      ruf('/auth/2fa/authenticate', 'POST', { code: code }).then((antwort) => {
        if (istAngemeldet(antwort)) { this.zweiStatusLaden(); return; }
        this.setState({ zweiLaedt: false, zweiCode: '', zweiFehler: fehlerAus(antwort, 'Der Code ist falsch oder abgelaufen.') });
      });
    },

    // Nach erfolgreicher Anmeldung: Status lesen. 404 heisst "noch nicht
    // eingerichtet" und ist hier die Normalantwort, keine Fehlermeldung
    // (gemessen, docs/ROADMAP.md 3.16 Nachtrag 08.08.2026) - genau in ihr
    // stecken das Geheimnis und die otpauth-Adresse fuer den QR-Code. Jeder
    // GET in diesem Zustand erzeugt serverseitig ein NEUES Kandidaten-
    // geheimnis (regenerate=True) - deshalb wird dieser Aufruf nur genau
    // einmal beim Betreten des Schritts gemacht, nicht bei jeder Anzeige.
    zweiStatusLaden() {
      this.setState({ zweiLaedt: true, zweiFehler: '' });
      ruf('/account/authenticators/totp').then((antwort) => {
        if (antwort.status === 404 && antwort.body.meta) {
          this.setState({
            zweiLaedt: false, zweiSchritt: 'einrichten', zweiCode: '',
            zweiSetup: { secret: antwort.body.meta.secret, totpUrl: antwort.body.meta.totp_url },
          });
          return;
        }
        if (antwort.status === 200 && antwort.body.data) {
          this.setState({ zweiLaedt: false, zweiSchritt: 'aktiv', zweiAktivSeit: antwort.body.data.created_at || null });
          return;
        }
        this.setState({ zweiLaedt: false, zweiSchritt: 'passwort', zweiFehler: fehlerAus(antwort, 'Status konnte nicht gelesen werden. Bitte erneut anmelden.') });
      });
    },

    // Schritt 2: den Authenticator mit dem 6-stelligen Code bestaetigen.
    // Bei einem falschen Code bleibt zweiSetup unveraendert stehen - ein
    // erneutes Laden wuerde das angezeigte Geheimnis vor der Bestaetigung
    // ungueltig machen (siehe zweiStatusLaden).
    zweiAktivieren() {
      const code = this.state.zweiCode;
      if (!code) return;
      this.setState({ zweiLaedt: true, zweiFehler: '' });
      ruf('/account/authenticators/totp', 'POST', { code: code }).then((antwort) => {
        if (antwort.status === 200 && antwort.body.data) {
          this.zweiWiederherstellCodesHolen();
          return;
        }
        this.setState({ zweiLaedt: false, zweiCode: '', zweiFehler: fehlerAus(antwort, 'Der Code ist falsch oder abgelaufen.') });
      });
    },

    // Erzeugt einen frischen Satz Wiederherstellungscodes und zeigt ihn -
    // ein POST liefert sie immer sichtbar zurueck (anders als ein GET nach
    // dem ersten Anzeigen, das der Server dann verweigert). Wird nur genau
    // einmal aufgerufen, direkt nach der Aktivierung.
    zweiWiederherstellCodesHolen() {
      ruf('/account/authenticators/recovery-codes', 'POST').then((antwort) => {
        const codes = antwort.status === 200 && antwort.body.data ? antwort.body.data.unused_codes : null;
        // Das Setup-Geheimnis wird nicht mehr gebraucht, sobald aktiviert
        // ist - hier aus dem Zustand nehmen, nicht erst beim Schliessen.
        this.setState({
          zweiLaedt: false, zweiSetup: null, zweiCode: '',
          zweiSchritt: codes ? 'codes' : 'aktiv', zweiCodes: codes || null,
          zweiAktivSeit: Date.now() / 1000,
          // Die Aktivierung selbst ist bereits durch - ein Fehlschlag hier
          // heisst nur, dass die Codes gerade nicht zu holen waren, nicht
          // dass TOTP inaktiv waere. Muss trotzdem sichtbar sein, sonst
          // wirkt der Bildschirm "aktiv" ohne dass die Codes je gezeigt wurden.
          zweiFehler: codes ? '' : 'Zwei-Faktor-Authentifizierung ist aktiv, aber die Wiederherstellungscodes konnten gerade nicht geladen werden.',
        });
      });
    },

    zweiCodesUebernommen() {
      if (!this.state.zweiBestaetigt) return;
      this.setState((s) => ({ zweiCodes: null, zweiBestaetigt: false, zweiSchritt: 'aktiv', zweiAktivSeit: s.zweiAktivSeit || Date.now() / 1000 }));
    },

    zweiDeaktivierenFragen() { this.setState({ zweiSchritt: 'deaktivieren' }); },
    zweiDeaktivierenAbbrechen() { this.setState({ zweiSchritt: 'aktiv' }); },

    zweiDeaktivieren() {
      this.setState({ zweiLaedt: true, zweiFehler: '' });
      ruf('/account/authenticators/totp', 'DELETE').then((antwort) => {
        if (antwort.status === 200 || antwort.status === 204) {
          this.setState({ zweiLaedt: false, zweiSchritt: 'deaktiviert' });
          return;
        }
        this.setState({ zweiLaedt: false, zweiSchritt: 'aktiv', zweiFehler: fehlerAus(antwort, 'Deaktivieren fehlgeschlagen.') });
      });
    },

    setZweiPasswort(e) { this.setState({ zweiPasswort: e.target.value }); },
    setZweiCode(e) { this.setState({ zweiCode: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) }); },
    setZweiBestaetigt(e) { this.setState({ zweiBestaetigt: !!e.target.checked }); },

    // Data-URL eines QR-Codes aus der otpauth-Adresse - gezeichnet im
    // Browser, verlaesst diesen also nie (vendor/qrcode-generator.js,
    // kazuhikoarase/qrcode-generator, siehe docs/ROADMAP.md 3.16 fuer die
    // Begruendung der Wahl). Als <img src> statt als eingefuegtes SVG-Markup,
    // damit an dieser Stelle kein HTML aus Fremddaten in den DOM-Baum kommt.
    zweiQrUrl(totpUrl) {
      if (!global.qrcode || !totpUrl) return '';
      try {
        const qr = global.qrcode(0, 'M');
        qr.addData(totpUrl);
        qr.make();
        return qr.createDataURL(6, 8);
      } catch (e) {
        return '';
      }
    },
  };

  global.DWZweifaktor = { start: start, beimAbmelden: beimSchliessen, beimSchliessen: beimSchliessen, methoden: methoden };
})(typeof globalThis !== 'undefined' ? globalThis : this);
