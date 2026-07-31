// Reine Logik von DocuWunder: Uebersetzung, Formatierung, Ableitungen.
//
// Alles hier haengt nur von seinen Argumenten ab - kein Zustand, kein DOM, kein
// Netz. Genau deshalb steht es in einer eigenen Datei: so laesst es sich ohne
// Browser und ohne laufenden Server pruefen (tests/logik.test.js).
//
// Der Anlass war handfest. Zwei Fehler sind erst auf Screenshots aufgefallen,
// obwohl beide in einer Zeile Logik sassen:
//   - Initialen ergaben "DUNDEFINED", weil ''[0] undefined liefert
//   - gespeicherte Suchen zeigten "undefined Treffer"
// Dafuer braucht es keinen Browser, es braucht einen Test.
//
// Laedt im Browser als klassisches Script (window.DWLogik) und in Node per
// require - ohne Build-Schritt, wie der Rest des Projekts.
(function (global, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else global.DWLogik = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli',
                'August', 'September', 'Oktober', 'November', 'Dezember'];

  // --- Formatierung ---------------------------------------------------------

  // ISO-Datum -> '21. Juli 2026'. Die Oberflaeche zeigt und sortiert in diesem
  // Format; ohne gueltiges Datum lieber nichts als "Invalid Date".
  function dateDE(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.getDate() + '. ' + MONATE[d.getMonth()] + ' ' + d.getFullYear();
  }

  // Das laufende Jahr weglassen - in einer Liste ist es Rauschen.
  function kurzDatum(text, jahr) {
    var j = jahr || new Date().getFullYear();
    return String(text || '').replace(' ' + j, '');
  }

  // Initialen einer Person. Vor- und Nachname, sonst die ersten zwei Zeichen des
  // Benutzernamens.
  //
  // charAt statt [0]: bei fehlendem Nachnamen liefert ''[0] undefined, das sich
  // an den Vornamensbuchstaben haengt - daher kam "DUNDEFINED".
  function initialen(vor, nach, benutzername) {
    var a = String(vor || '').trim(), b = String(nach || '').trim();
    var aus = (a || b) ? (a.charAt(0) + b.charAt(0)) : String(benutzername || '?').slice(0, 2);
    return aus.toUpperCase() || '?';
  }

  function feldTyp(t) {
    return ({ string: 'Text', url: 'Link', date: 'Datum', boolean: 'Ja/Nein', integer: 'Zahl',
              float: 'Kommazahl', monetary: 'Währung', documentlink: 'Verknüpfung',
              select: 'Auswahl' })[t] || 'Text';
  }

  // --- Fundstellen ----------------------------------------------------------

  // Ausschnitt um einen Treffer im Text, fuer die lokale Hervorhebung.
  function parts(text, q) {
    var t = String(text || ''), s = String(q || '');
    if (!s) return null;
    var i = t.toLowerCase().indexOf(s.toLowerCase());
    if (i < 0) return null;
    var a = Math.max(0, i - 32);
    return {
      pre: (a > 0 ? '… ' : '') + t.slice(a, i),
      hit: t.slice(i, i + s.length),
      post: t.slice(i + s.length, i + s.length + 56) + ' …'
    };
  }

  // Der Suchindex liefert den Ausschnitt mit <b>…</b> um die Fundstelle. Die
  // Oberflaeche setzt die Markierung selbst, deshalb wird hier zerlegt statt
  // fremdes HTML einzusetzen.
  //
  // entfernenHtml wird hereingereicht, weil das im Browser ueber ein Element
  // laeuft und in Node ueber einen einfachen Ersatz - die Zerlegung selbst ist
  // in beiden Faellen dieselbe.
  function ausschnitt(hl, entfernenHtml) {
    if (!hl) return null;
    var text = entfernenHtml || function (t) {
      return String(t || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    };
    var m = /^([\s\S]*?)<b>([\s\S]*?)<\/b>([\s\S]*)$/.exec(hl);
    if (!m) return { pre: text(hl).slice(0, 110), hit: '', post: '' };
    var pre = text(m[1]), hit = text(m[2]), post = text(m[3]);
    return {
      pre: pre.length > 40 ? '… ' + pre.slice(-40) : pre,
      hit: hit,
      post: post.length > 70 ? post.slice(0, 70) + ' …' : post
    };
  }

  // --- Dokumente ------------------------------------------------------------

  // "Neu" heisst: in den letzten sieben Tagen aufgenommen.
  function istNeu(doc, jetzt) {
    if (!doc || !doc.tsHinzu) return false;
    return ((jetzt || Date.now()) - doc.tsHinzu) < 7 * 24 * 3600 * 1000;
  }

  // Uebersetzt ein API-Dokument in die Form der Oberflaeche.
  //
  // Zwei Felder haben in Paperless keine Entsprechung:
  //   fav     - Paperless kennt keine Favoriten; abgebildet auf ein Schlagwort,
  //             das in der Schlagwortliste ausgeblendet wird
  //   geteilt - ergibt sich aus vorhandenen Freigabelinks
  function mapDoc(d, lk, shares, favTag) {
    lk = lk || {}; shares = shares || {};
    var tag = lk.tag || {}, corr = lk.corr || {}, typ = lk.typ || {}, ort = lk.ort || {};
    var namen = (d.tags || []).map(function (id) { return (tag[id] || {}).name; })
                              .filter(Boolean);
    return {
      id: d.id,
      titel: d.title || '(ohne Titel)',
      abs: d.correspondent ? ((corr[d.correspondent] || {}).name || '') : '',
      art: d.document_type ? ((typ[d.document_type] || {}).name || '') : '',
      ort: d.storage_path ? ((ort[d.storage_path] || {}).name || '') : '',
      datum: dateDE(d.created_date || d.created),
      hinzu: dateDE(d.added),
      tags: namen.filter(function (n) { return n !== favTag; }),
      fav: namen.indexOf(favTag) >= 0,
      geteilt: !!shares[d.id],
      asn: d.archive_serial_number ? ('ASN-' + d.archive_serial_number) : '',
      seiten: d.page_count || 1,
      ocr: d.content || '',
      // Sortierschluessel direkt aus ISO, unabhaengig vom Anzeigeformat.
      tsDatum: Date.parse(d.created_date || d.created || '') || 0,
      tsHinzu: Date.parse(d.added || '') || 0,
      raw: d
    };
  }

  // Feldliste des Posteingang-Pruefschirms aus vorhandenen Werten und - sofern
  // geladen - den Vorschlaegen des Servers.
  function felderAus(doc, vor) {
    var f = function (k, v, hatVorschlag) {
      return {
        k: k,
        v: v || '',
        conf: v ? 'aus dem Dokument übernommen' : (hatVorschlag ? 'Vorschlag' : 'nicht erkannt'),
        ok: !!v
      };
    };
    var vTag = (doc.tags && doc.tags.length) ? doc.tags[0] : '';
    return [
      f('Absender', doc.abs, vor && (vor.correspondents || []).length),
      f('Dokumentart', doc.art, vor && (vor.document_types || []).length),
      f('Datum', doc.datum, vor && (vor.dates || []).length),
      f('Schlagwörter', vTag, vor && (vor.tags || []).length)
    ];
  }

  // --- Ordner ---------------------------------------------------------------

  // Paperless kennt keine Ordner. Die Hierarchie wird aus den Namen der
  // Ablageorte abgeleitet, die per '/' geschachtelt sind:
  //   "Privat", "Privat/Versicherungen", "Privat/Steuern"
  // ergibt den Ordner "Privat" mit zwei Unterordnern.
  //
  // Ein Zwischenordner muss dabei nicht als eigener Ablageort existieren:
  // "Privat" taucht auch dann auf, wenn es nur "Privat/Steuern" gibt. Er ist
  // dann ein reiner Durchgang ohne eigene Dokumente (direkt === false).
  function ordnerKinder(orte, pfad) {
    var praefix = pfad ? pfad + '/' : '';
    var liste = orte || [];
    var kinder = new Map();
    liste.forEach(function (o) {
      var name = o.name || '';
      if (praefix && name.indexOf(praefix) !== 0) return;
      var rest = praefix ? name.slice(praefix.length) : name;
      var kind = rest.split('/')[0];
      if (!kind) return;
      var voll = praefix + kind;
      if (!kinder.has(voll)) kinder.set(voll, { name: kind, voll: voll, anzahl: 0, direkt: false });
    });
    kinder.forEach(function (k) {
      // Zaehlt den ganzen Unterbaum, damit ein Ordner nicht leer wirkt, nur
      // weil seine Dokumente eine Ebene tiefer liegen.
      k.anzahl = liste
        .filter(function (o) { return o.name === k.voll || (o.name || '').indexOf(k.voll + '/') === 0; })
        .reduce(function (n, o) { return n + (o.document_count || 0); }, 0);
      k.direkt = liste.some(function (o) { return o.name === k.voll; });
    });
    return Array.from(kinder.values())
      .sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });
  }

  // Pfad-Template eines Ablageorts aus seinem Namen. Paperless verlangt das
  // Feld zwingend; ein Template, das den Namen ignoriert, wuerde die
  // Ordneransicht von der tatsaechlichen Ablage entkoppeln.
  function pathAusName(name) {
    var teile = String(name || '').split('/')
      .map(function (t) { return t.trim().replace(/[\\:*?"<>|]/g, '').trim(); })
      .filter(Boolean);
    return (teile.join('/') || 'Ablage') + '/{{ title }}';
  }

  // --- Sonstiges ------------------------------------------------------------

  function regelText(r) {
    var teile = [];
    if (r.folder) teile.push('Ordner „' + r.folder + '“');
    if (r.filter_subject) teile.push('Betreff enthält „' + r.filter_subject + '“');
    if (r.filter_from) teile.push('Von „' + r.filter_from + '“');
    return teile.join(' · ') || 'Ohne Einschränkung';
  }

  // Gespeicherte Ansicht: nur eine einzelne Volltextregel laesst sich als
  // Suchbegriff wieder herstellen (rule_type 19 = title_content).
  function sichtQuery(v) {
    var r = (v && v.filter_rules) || [];
    return (r.length === 1 && r[0].rule_type === 19) ? r[0].value : '';
  }

  // Passwortalphabet ohne mehrdeutige Zeichen (0/O, 1/l/I) - es wird
  // vorgelesen oder abgetippt. Die Vierergruppen gehoeren zum Passwort.
  var ALPHABET = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function passwortAus(werte, laenge) {
    var n = laenge || 16, out = '';
    for (var i = 0; i < n; i++) out += ALPHABET[werte[i] % ALPHABET.length];
    return out.replace(/(.{4})(?=.)/g, '$1-');
  }

  // Benutzername aus der E-Mail ableiten, Kollisionen durchnummerieren.
  function benutzernameAus(mail, name, belegt) {
    var basis = String(mail || '').split('@')[0] ||
                String(name || '').toLowerCase().replace(/\s+/g, '.');
    var sauber = basis.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 24) || 'mitglied';
    var vorhanden = (belegt || []).map(function (b) { return String(b).toLowerCase(); });
    if (vorhanden.indexOf(sauber) < 0) return sauber;
    for (var i = 2; i < 99; i++) {
      if (vorhanden.indexOf(sauber + i) < 0) return sauber + i;
    }
    return sauber + Date.now();
  }

  return {
    dateDE: dateDE,
    kurzDatum: kurzDatum,
    initialen: initialen,
    feldTyp: feldTyp,
    parts: parts,
    ausschnitt: ausschnitt,
    istNeu: istNeu,
    mapDoc: mapDoc,
    felderAus: felderAus,
    ordnerKinder: ordnerKinder,
    pathAusName: pathAusName,
    regelText: regelText,
    sichtQuery: sichtQuery,
    passwortAus: passwortAus,
    benutzernameAus: benutzernameAus,
    ALPHABET: ALPHABET
  };
});
