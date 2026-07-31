// Zugriffsschicht auf die Paperless-ngx REST-API.
//
// Die App wird von derselben Origin ausgeliefert wie Paperless selbst
// (/paperless-app/ neben /paperless/), deshalb ist die Basis-URL relativ
// ableitbar und es gibt keine CORS-Problematik.
//
// Authentifizierung laeuft ueber einen API-Token (POST /api/token/), der im
// localStorage liegt. Token-Auth in DRF erzwingt keinen CSRF-Schutz, deshalb
// sind Schreibzugriffe ohne CSRF-Token moeglich.
//
// Wird als klassisches Script eingebunden und stellt window.PaperlessAPI bereit;
// das DC-Runtime wertet den Komponenten-Code per new Function() aus, dort sind
// Globals sichtbar, ES-Module dagegen nicht.
window.PaperlessAPI = (function () {
  'use strict';

  var TOKEN_KEY = 'paperless.token';
  var BASE_KEY = 'paperless.base';

  // Der Zugangsschluessel liegt im localStorage. Das ist keine Kryptografie,
  // sondern eine Ablage: jedes Skript auf dieser Origin kann ihn lesen.
  //
  // Ihn zu verschluesseln brächte hier nichts - der Schluessel dafuer laege
  // daneben. Echten Schutz gaebe nur ein Geheimnis, das der Nutzer beisteuert
  // (PIN) oder das Geraet verwahrt (WebAuthn-PRF). Solange das nicht da ist,
  // wird der Schaden wenigstens zeitlich begrenzt:
  //
  //   - Der Schluessel laeuft nach GUELTIG_TAGE ohne Nutzung ab.
  //   - Jede erfolgreiche Anfrage verlaengert ihn (gleitendes Fenster).
  //   - Beim Abmelden wird er geloescht.
  //
  // Was das bedeutet, steht auch in den Einstellungen - Nutzer sollen nicht
  // raten muessen, wie sicher ihr Zugang ist.
  var GUELTIG_TAGE = 30;
  var TAG_MS = 24 * 3600 * 1000;

  function schluesselLesen() {
    var roh = localStorage.getItem(TOKEN_KEY);
    if (!roh) return '';
    // Aeltere Fassungen legten den Schluessel blank ab, ohne Ablauf.
    if (roh.charAt(0) !== '{') {
      schluesselSchreiben(roh);
      return roh;
    }
    try {
      var o = JSON.parse(roh);
      if (!o || !o.t) return '';
      if (o.bis && Date.now() > o.bis) {
        localStorage.removeItem(TOKEN_KEY);
        return '';
      }
      return o.t;
    } catch (e) {
      localStorage.removeItem(TOKEN_KEY);
      return '';
    }
  }

  function schluesselSchreiben(t) {
    if (!t) { localStorage.removeItem(TOKEN_KEY); return; }
    try {
      localStorage.setItem(TOKEN_KEY, JSON.stringify({
        t: t, bis: Date.now() + GUELTIG_TAGE * TAG_MS
      }));
    } catch (e) { /* Privatmodus: dann eben nur fuer diese Sitzung */ }
  }

  // Gleitendes Fenster: wer die App nutzt, soll nicht mitten im Arbeiten
  // hinausfliegen. Hoechstens einmal taeglich schreiben, nicht bei jeder
  // Anfrage.
  var zuletztVerlaengert = 0;
  function verlaengern() {
    if (!token) return;
    var jetzt = Date.now();
    if (jetzt - zuletztVerlaengert < TAG_MS) return;
    zuletztVerlaengert = jetzt;
    schluesselSchreiben(token);
  }

  function defaultBase() {
    try {
      // /paperless-app/index.html -> /paperless/api
      return new URL('../paperless/api', location.href).toString().replace(/\/+$/, '');
    } catch (e) {
      return '/paperless/api';
    }
  }

  var base = localStorage.getItem(BASE_KEY) || defaultBase();
  var token = schluesselLesen();

  // Wird gesetzt, wenn ein Aufruf 401 liefert - die App kann sich daran
  // haengen und zurueck ins Onboarding schicken.
  var onUnauthorized = null;

  function ApiError(status, message, body) {
    var e = new Error(message);
    e.name = 'ApiError';
    e.status = status;
    e.body = body;
    return e;
  }

  // Uebersetzt eine Fehlerantwort in einen Satz, der einem Menschen etwas sagt.
  function humanize(status, body) {
    if (status === 0) return 'Keine Verbindung zum Server. Pruefe dein Netzwerk.';
    if (status === 401) return 'Anmeldung abgelaufen. Bitte melde dich erneut an.';
    if (status === 403) return 'Dafuer fehlt dir die Berechtigung.';
    if (status === 404) return 'Nicht gefunden.';
    if (status === 413) return 'Die Datei ist zu gross fuer den Server.';
    if (status >= 500) return 'Der Server hat einen Fehler gemeldet (' + status + ').';
    if (body && typeof body === 'object') {
      // DRF-Validierungsfehler: {"feld": ["Meldung"], "non_field_errors": [...]}
      var parts = [];
      Object.keys(body).forEach(function (k) {
        var v = body[k];
        parts.push(Array.isArray(v) ? v.join(' ') : String(v));
      });
      if (parts.length) return parts.join(' ');
    }
    return 'Anfrage fehlgeschlagen (' + status + ').';
  }

  function authHeaders(extra) {
    var h = extra || {};
    h['Accept'] = 'application/json';
    if (token) h['Authorization'] = 'Token ' + token;
    return h;
  }

  function qs(params) {
    if (!params) return '';
    var out = [];
    Object.keys(params).forEach(function (k) {
      var v = params[k];
      if (v === undefined || v === null || v === '') return;
      if (Array.isArray(v)) {
        if (!v.length) return;
        v = v.join(',');
      }
      out.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
    });
    return out.length ? '?' + out.join('&') : '';
  }

  // Standard-Zeitlimit einer Anfrage. Ohne eines haengt die Oberflaeche bei
  // einem stummen Server unbegrenzt im Ladezustand.
  var TIMEOUT_MS = 30000;
  // Hochladen und Herunterladen ganzer Dokumente darf deutlich laenger dauern.
  var UPLOAD_TIMEOUT_MS = 180000;

  // Verbindet ein eigenes Zeitlimit mit einem optionalen Abbruchsignal des
  // Aufrufers (die Suche bricht damit ueberholte Anfragen ab). Liefert das
  // Signal fuer fetch und eine Aufraeumfunktion.
  function abbruch(signal, ms) {
    if (typeof AbortController === 'undefined') return { signal: signal, fertig: function () {} };
    var ctrl = new AbortController();
    var abgelaufen = false;
    var t = setTimeout(function () { abgelaufen = true; ctrl.abort(); }, ms || TIMEOUT_MS);
    var weiter = function () { ctrl.abort(); };
    if (signal) {
      if (signal.aborted) ctrl.abort();
      else signal.addEventListener('abort', weiter);
    }
    return {
      signal: ctrl.signal,
      abgelaufen: function () { return abgelaufen; },
      fertig: function () {
        clearTimeout(t);
        if (signal) signal.removeEventListener('abort', weiter);
      }
    };
  }

  // Wurde die Anfrage vom Aufrufer abgebrochen (nicht: Zeitlimit), soll die
  // Oberflaeche nichts melden - sie hat das Ergebnis selbst verworfen.
  function abortFehler(a, signal) {
    if (a.abgelaufen && a.abgelaufen()) {
      return ApiError(0, 'Der Server hat zu lange nicht geantwortet.', null);
    }
    if (signal && signal.aborted) {
      var e = ApiError(0, 'Abgebrochen', null);
      e.aborted = true;
      return e;
    }
    return ApiError(0, humanize(0, null), null);
  }

  function request(method, path, opts) {
    opts = opts || {};
    var url = base + path + qs(opts.params);
    var a = abbruch(opts.signal, opts.timeout);
    var init = { method: method, headers: authHeaders({}), signal: a.signal };

    if (opts.json !== undefined) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(opts.json);
    } else if (opts.form) {
      // FormData setzt Content-Type inkl. boundary selbst.
      init.body = opts.form;
    }

    return fetch(url, init).then(function (res) {
      a.fertig();
      if (res.status === 401 && onUnauthorized) onUnauthorized();
      else if (res.ok) verlaengern();
      if (res.status === 204) return null;

      var ct = res.headers.get('content-type') || '';
      var parse = ct.indexOf('application/json') >= 0 ? res.json() : res.text();

      return parse.catch(function () { return null; }).then(function (body) {
        if (!res.ok) throw ApiError(res.status, humanize(res.status, body), body);
        return body;
      });
    }, function () {
      a.fertig();
      throw abortFehler(a, opts.signal);
    });
  }

  // Holt alle Seiten einer Liste. Nur fuer ueberschaubare Mengen gedacht
  // (Tags, Korrespondenten, Dokumenttypen, Ablageorte).
  function listAll(path, params) {
    var acc = [];
    function page(p) {
      var pr = Object.assign({ page: p, page_size: 250 }, params || {});
      return request('GET', path, { params: pr }).then(function (d) {
        acc = acc.concat(d.results || []);
        if (d.next && (d.results || []).length) return page(p + 1);
        return acc;
      });
    }
    return page(1);
  }

  // Bilddaten (Thumbnail, Vorschau, Original) brauchen den Auth-Header, den ein
  // <img src> nicht mitschickt. Deshalb als Blob laden und Object-URL liefern.
  // Der Aufrufer muss die URL per revoke() wieder freigeben.
  //
  // Liefert neben der URL auch den vom Server vorgeschlagenen Dateinamen und
  // den Medientyp - das Herunterladen braucht beides.
  function fileFor(path, opts) {
    opts = opts || {};
    var a = abbruch(opts.signal, opts.timeout);
    return fetch(base + path, { headers: authHeaders({}), signal: a.signal }).then(function (res) {
      a.fertig();
      if (res.status === 401 && onUnauthorized) onUnauthorized();
      if (!res.ok) throw ApiError(res.status, humanize(res.status, null), null);
      var cd = res.headers.get('content-disposition') || '';
      // filename="..." bzw. filename*=UTF-8''...
      var m = /filename\*=UTF-8''([^;]+)/i.exec(cd) || /filename="?([^";]+)"?/i.exec(cd);
      var name = m ? decodeURIComponent(m[1]).trim() : '';
      return res.blob().then(function (b) {
        return { url: URL.createObjectURL(b), name: name, typ: b.type, groesse: b.size };
      });
    }, function () {
      a.fertig();
      throw abortFehler(a, opts.signal);
    });
  }

  function blobUrl(path, opts) {
    return fileFor(path, opts).then(function (f) { return f.url; });
  }

  // Wie fileFor, aber die Anfrage ist ein POST mit Nutzdaten - das braucht der
  // Sammel-Download, der die Dokumentkennungen im Rumpf erwartet.
  function postFile(path, json, opts) {
    opts = opts || {};
    var a = abbruch(opts.signal, opts.timeout || UPLOAD_TIMEOUT_MS);
    return fetch(base + path, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(json),
      signal: a.signal
    }).then(function (res) {
      a.fertig();
      if (res.status === 401 && onUnauthorized) onUnauthorized();
      if (!res.ok) {
        return res.text().catch(function () { return null; }).then(function (b) {
          throw ApiError(res.status, humanize(res.status, b), b);
        });
      }
      var cd = res.headers.get('content-disposition') || '';
      var m = /filename\*=UTF-8''([^;]+)/i.exec(cd) || /filename="?([^";]+)"?/i.exec(cd);
      var name = m ? decodeURIComponent(m[1]).trim() : '';
      return res.blob().then(function (b) {
        return { url: URL.createObjectURL(b), name: name, typ: b.type, groesse: b.size };
      });
    }, function () {
      a.fertig();
      throw abortFehler(a, opts.signal);
    });
  }

  function revoke(url) {
    if (url) { try { URL.revokeObjectURL(url); } catch (e) { /* egal */ } }
  }

  var MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli',
                'August', 'September', 'Oktober', 'November', 'Dezember'];

  // ISO-Datum -> '21. Juli 2026'. Die Oberflaeche zeigt und sortiert Datums-
  // angaben in diesem Format.
  function dateDE(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.getDate() + '. ' + MONATE[d.getMonth()] + ' ' + d.getFullYear();
  }

  // Gegenrichtung zu dateDE: '21. Juli 2026' -> '2026-07-21'. Die Oberflaeche
  // laesst das Datum als Text bearbeiten; die API will ISO. Wird der Text nicht
  // erkannt, liefert die Funktion null und das Feld bleibt ungeaendert.
  function isoVonDE(text) {
    if (!text) return null;
    var t = String(text).trim();
    // Bereits ISO?
    var iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
    if (iso) return iso[1] + '-' + iso[2] + '-' + iso[3];
    var de = /^(\d{1,2})\.\s*([A-Za-zäöüÄÖÜß]+)\.?\s*(\d{4})$/.exec(t);
    if (de) {
      var i = MONATE.findIndex(function (m) {
        return m.toLowerCase().indexOf(de[2].toLowerCase().replace(/\.$/, '')) === 0;
      });
      if (i < 0) return null;
      return de[3] + '-' + String(i + 1).padStart(2, '0') + '-' + String(+de[1]).padStart(2, '0');
    }
    // 21.07.2026 bzw. 21.7.2026
    var num = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(t);
    if (num) {
      var mo = +num[2];
      if (mo < 1 || mo > 12) return null;
      return num[3] + '-' + String(mo).padStart(2, '0') + '-' + String(+num[1]).padStart(2, '0');
    }
    return null;
  }

  // Zeitpunkt relativ, wie in der Oberflaeche fuer Posteingang-Eintraege ueblich.
  function relDE(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    var now = new Date();
    var hhmm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    var sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return 'Heute, ' + hhmm;
    var y = new Date(now); y.setDate(now.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return 'Gestern, ' + hhmm;
    return dateDE(iso);
  }

  return {
    // --- Konfiguration ----------------------------------------------------
    getBase: function () { return base; },
    setBase: function (b) {
      base = String(b || '').replace(/\/+$/, '') || defaultBase();
      localStorage.setItem(BASE_KEY, base);
    },
    resetBase: function () { base = defaultBase(); localStorage.removeItem(BASE_KEY); },
    defaultBase: defaultBase,

    hasToken: function () { return !!token; },
    setToken: function (t) {
      token = t || '';
      zuletztVerlaengert = token ? Date.now() : 0;
      schluesselSchreiben(token);
    },
    // Wann der Zugang ablaeuft, damit die Einstellungen es benennen koennen.
    gueltigBis: function () {
      try {
        var o = JSON.parse(localStorage.getItem(TOKEN_KEY) || '{}');
        return o.bis || null;
      } catch (e) { return null; }
    },
    gueltigTage: GUELTIG_TAGE,
    logout: function () { this.setToken(''); },
    set onUnauthorized(fn) { onUnauthorized = fn; },

    // --- Authentifizierung ------------------------------------------------

    // Prueft, ob unter der Basis-URL wirklich eine Paperless-API antwortet.
    // 401 zaehlt als Erfolg: der Endpunkt existiert, wir sind nur nicht
    // angemeldet - genau das ist vor dem Login der erwartete Zustand.
    ping: function (baseOverride) {
      var b = (baseOverride !== undefined ? String(baseOverride).replace(/\/+$/, '') : base);
      return fetch(b + '/ui_settings/', { headers: { 'Accept': 'application/json' } })
        .then(function (r) {
          if (r.status === 200 || r.status === 401 || r.status === 403) return true;
          throw ApiError(r.status, 'Unter dieser Adresse antwortet keine Paperless-API.', null);
        }, function () {
          throw ApiError(0, 'Der Server hat nicht geantwortet. Pruefe die Adresse und ob du im richtigen Netzwerk bist.', null);
        });
    },

    login: function (username, password) {
      return fetch(base + '/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ username: username, password: password })
      }).then(function (res) {
        return res.json().catch(function () { return null; }).then(function (body) {
          if (!res.ok) {
            // Der Token-Endpunkt meldet falsche Zugangsdaten als 400 mit
            // non_field_errors - das ist fuer den Nutzer ein Anmeldefehler.
            if (res.status === 400) {
              throw ApiError(400, 'Benutzername oder Passwort stimmt nicht.', body);
            }
            throw ApiError(res.status, humanize(res.status, body), body);
          }
          return body.token;
        });
      }, function () {
        throw ApiError(0, humanize(0, null), null);
      });
    },

    uiSettings: function () { return request('GET', '/ui_settings/'); },

    // --- Dokumente --------------------------------------------------------
    documents: {
      list: function (params, opts) {
        return request('GET', '/documents/', Object.assign({ params: params }, opts || {}));
      },
      // Volltextsuche ueber den Suchindex. Der Server haengt jedem Treffer
      // __search_hit__ mit Bewertung und hervorgehobenem Ausschnitt an.
      //
      // query= erwartet die Whoosh-Syntax; Eingaben wie "rechnung:" oder eine
      // offene Klammer quittiert der Server mit 400. Dann wird auf die
      // schlichte Teilstringsuche ueber Titel und Inhalt zurueckgefallen,
      // damit die Suche nie einfach nichts tut.
      search: function (q, params, opts) {
        var mit = function (p) { return Object.assign({}, params || {}, p); };
        return request('GET', '/documents/', Object.assign({ params: mit({ query: q }) }, opts || {}))
          .catch(function (e) {
            if (e.status !== 400) throw e;
            return request('GET', '/documents/', Object.assign({ params: mit({ title_content: q }) }, opts || {}))
              .then(function (d) { return Object.assign({}, d, { einfach: true }); });
          });
      },
      get: function (id) { return request('GET', '/documents/' + id + '/'); },
      update: function (id, patch) { return request('PATCH', '/documents/' + id + '/', { json: patch }); },
      // Loeschen verschiebt in den Papierkorb (Paperless loescht weich).
      remove: function (id) { return request('DELETE', '/documents/' + id + '/'); },
      bulk: function (ids, method, parameters) {
        return request('POST', '/documents/bulk_edit/', {
          json: { documents: ids, method: method, parameters: parameters || {} }
        });
      },
      // Mehrere Dokumente als ZIP. Der Server packt das selbst; content
      // 'archive' | 'originals' | 'both'.
      bulkDownload: function (ids, content) {
        return postFile('/documents/bulk_download/', {
          documents: ids, content: content || 'archive', compression: 'deflated', follow_formatting: true
        });
      },
      suggestions: function (id) { return request('GET', '/documents/' + id + '/suggestions/'); },
      // Notizen sind in Paperless eine Liste je Dokument. Alle drei Aufrufe
      // liefern die Liste nach der Aenderung zurueck.
      notes: {
        list: function (id) { return request('GET', '/documents/' + id + '/notes/'); },
        add: function (id, text) { return request('POST', '/documents/' + id + '/notes/', { json: { note: text } }); },
        remove: function (id, noteId) { return request('DELETE', '/documents/' + id + '/notes/', { params: { id: noteId } }); }
      },
      metadata: function (id) { return request('GET', '/documents/' + id + '/metadata/'); },
      thumbUrl: function (id, opts) { return blobUrl('/documents/' + id + '/thumb/', opts); },
      previewUrl: function (id, opts) { return blobUrl('/documents/' + id + '/preview/', opts); },
      // Zum Herunterladen: Original oder archivierte PDF-Fassung, jeweils mit
      // dem Dateinamen, den der Server vorgibt.
      file: function (id, original) {
        return fileFor('/documents/' + id + '/download/' + (original ? '?original=true' : ''),
                       { timeout: UPLOAD_TIMEOUT_MS });
      },
      // Der Server nimmt die Datei entgegen und verarbeitet sie asynchron.
      // Die Antwort ist die Kennung der Verarbeitungsaufgabe (UUID als
      // JSON-String) - damit laesst sich der Fortschritt ueber /tasks/
      // verfolgen, statt blind auf neue Dokumente zu warten.
      upload: function (file, meta) {
        var fd = new FormData();
        fd.append('document', file, file.name);
        if (meta && meta.title) fd.append('title', meta.title);
        if (meta && meta.correspondent) fd.append('correspondent', meta.correspondent);
        if (meta && meta.document_type) fd.append('document_type', meta.document_type);
        if (meta && meta.created) fd.append('created', meta.created);
        (meta && meta.tags ? meta.tags : []).forEach(function (t) { fd.append('tags', t); });
        return request('POST', '/documents/post_document/', {
          form: fd, timeout: UPLOAD_TIMEOUT_MS
        }).then(function (r) {
          // Je nach Version antwortet der Server mit dem nackten String oder
          // mit einem Objekt.
          if (typeof r === 'string') return r.replace(/^"|"$/g, '');
          return (r && (r.task_id || r.id)) || null;
        });
      }
    },

    // --- Papierkorb -------------------------------------------------------
    trash: {
      list: function (params) { return request('GET', '/trash/', { params: params }); },
      restore: function (ids) { return request('POST', '/trash/', { json: { action: 'restore', documents: ids } }); },
      purge: function (ids) { return request('POST', '/trash/', { json: { action: 'empty', documents: ids } }); }
    },

    // --- Stammdaten -------------------------------------------------------
    tags: {
      all: function () { return listAll('/tags/'); },
      create: function (name, extra) { return request('POST', '/tags/', { json: Object.assign({ name: name }, extra || {}) }); },
      update: function (id, patch) { return request('PATCH', '/tags/' + id + '/', { json: patch }); },
      remove: function (id) { return request('DELETE', '/tags/' + id + '/'); }
    },
    correspondents: {
      all: function () { return listAll('/correspondents/'); },
      create: function (name) { return request('POST', '/correspondents/', { json: { name: name } }); },
      update: function (id, patch) { return request('PATCH', '/correspondents/' + id + '/', { json: patch }); },
      remove: function (id) { return request('DELETE', '/correspondents/' + id + '/'); }
    },
    documentTypes: {
      all: function () { return listAll('/document_types/'); },
      create: function (name) { return request('POST', '/document_types/', { json: { name: name } }); },
      update: function (id, patch) { return request('PATCH', '/document_types/' + id + '/', { json: patch }); },
      remove: function (id) { return request('DELETE', '/document_types/' + id + '/'); }
    },
    storagePaths: {
      all: function () { return listAll('/storage_paths/'); },
      // Paperless verlangt beim Anlegen zwingend ein path-Template; ein Name
      // allein wird mit HTTP 400 abgewiesen.
      //
      // Der Pfad wird aus dem Namen abgeleitet, damit Ordnername und Ablage auf
      // der Platte uebereinstimmen: aus "Privat/Versicherungen" wird
      // "Privat/Versicherungen/{{ title }}". Ein Template, das den Namen
      // ignoriert (etwa nach Jahr und Korrespondent), wuerde die Ordneransicht
      // von der tatsaechlichen Ablage entkoppeln.
      pathAusName: function (name) {
        var teile = String(name || '').split('/')
          .map(function (t) { return t.trim().replace(/[\\:*?"<>|]/g, '').trim(); })
          .filter(Boolean);
        return (teile.join('/') || 'Ablage') + '/{{ title }}';
      },
      create: function (name, path) {
        return request('POST', '/storage_paths/', {
          json: { name: name, path: path || this.pathAusName(name) }
        });
      },
      update: function (id, patch) { return request('PATCH', '/storage_paths/' + id + '/', { json: patch }); },
      remove: function (id) { return request('DELETE', '/storage_paths/' + id + '/'); }
    },

    // --- Sonstiges --------------------------------------------------------
    shareLinks: {
      all: function () { return listAll('/share_links/'); },
      create: function (docId, expiration, fileVersion) {
        return request('POST', '/share_links/', {
          json: { document: docId, expiration: expiration, file_version: fileVersion || 'archive' }
        });
      },
      remove: function (id) { return request('DELETE', '/share_links/' + id + '/'); }
    },
    savedViews: {
      all: function () { return listAll('/saved_views/'); },
      // Eine gespeicherte Suche ist in Paperless eine gespeicherte Ansicht mit
      // genau einer Regel. rule_type 19 ist die Volltextsuche - dieselbe, die
      // hinter dem query-Parameter steht.
      createQuery: function (name, q) {
        return request('POST', '/saved_views/', {
          json: {
            name: name, show_on_dashboard: false, show_in_sidebar: true,
            sort_field: 'created', sort_reverse: true,
            filter_rules: [{ rule_type: 19, value: q }]
          }
        });
      },
      remove: function (id) { return request('DELETE', '/saved_views/' + id + '/'); }
    },
    customFields: { all: function () { return listAll('/custom_fields/'); } },
    // Automatisierungen heissen in Paperless "Workflows". Die App zeigt sie
    // vorerst nur an; Bearbeiten findet in der Paperless-Oberflaeche statt.
    workflows: {
      all: function () { return listAll('/workflows/'); },
      setEnabled: function (id, on) { return request('PATCH', '/workflows/' + id + '/', { json: { enabled: !!on } }); }
    },
    mailRules: {
      all: function () { return listAll('/mail_rules/'); },
      setEnabled: function (id, on) { return request('PATCH', '/mail_rules/' + id + '/', { json: { enabled: !!on } }); }
    },
    users: {
      all: function () { return listAll('/users/'); },
      create: function (daten) { return request('POST', '/users/', { json: daten }); },
      update: function (id, patch) { return request('PATCH', '/users/' + id + '/', { json: patch }); },
      remove: function (id) { return request('DELETE', '/users/' + id + '/'); },
      // Nur die Gruppenzugehoerigkeit. Die Rechte selbst haengen an der Gruppe;
      // sie hier zu setzen waere ein zweiter Ort fuer dieselbe Entscheidung.
      setGroups: function (id, groupIds) {
        return request('PATCH', '/users/' + id + '/', { json: { groups: groupIds } });
      }
    },
    groups: {
      all: function () { return listAll('/groups/'); },
      create: function (name) { return request('POST', '/groups/', { json: { name: name, permissions: [] } }); },
      remove: function (id) { return request('DELETE', '/groups/' + id + '/'); }
    },
    // Verarbeitungsaufgaben des Servers. Mit { task_id: '…' } laesst sich eine
    // einzelne Aufgabe verfolgen (z. B. nach einem Upload).
    tasks: function (params) { return request('GET', '/tasks/', { params: params }); },
    statistics: function () { return request('GET', '/statistics/'); },
    remoteVersion: function () { return request('GET', '/remote_version/'); },

    util: { dateDE: dateDE, relDE: relDE, isoVonDE: isoVonDE, humanize: humanize, revoke: revoke, fileFor: fileFor }
  };
})();
