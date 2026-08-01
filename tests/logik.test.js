/* Unit-Tests der reinen Logik (logik.js).
 *
 * Laeuft ohne Browser und ohne Server:
 *     node --test tests/logik.test.js
 *
 * Die Faelle sind nicht ausgedacht. Die mit "Regression" markierten Tests
 * bilden Fehler ab, die vorher erst auf einem Screenshot aufgefallen sind -
 * genau die Klasse Fehler, gegen die diese Datei existiert.
 */
const test = require('node:test');
const assert = require('node:assert');
const L = require('../logik.js');

// --- Initialen --------------------------------------------------------------

test('initialen: Vor- und Nachname', () => {
  assert.strictEqual(L.initialen('Anna', 'Beispiel', 'anna'), 'AB');
});

test('initialen: Regression - fehlender Nachname ergab "DUNDEFINED"', () => {
  // ''[0] ist undefined und haengte sich an den Vornamensbuchstaben.
  const aus = L.initialen('damien', '', 'damien');
  assert.strictEqual(aus, 'D');
  assert.ok(!/UNDEFINED/i.test(aus), 'darf kein undefined enthalten');
});

test('initialen: ganz ohne Namen faellt auf den Benutzernamen zurueck', () => {
  assert.strictEqual(L.initialen('', '', 'damien'), 'DA');
});

test('initialen: gar nichts ergibt ein Fragezeichen, nie leer', () => {
  assert.strictEqual(L.initialen('', '', ''), '?');
  assert.strictEqual(L.initialen(null, undefined, null), '?');
});

// --- Datum ------------------------------------------------------------------

test('dateDE: ISO wird zum deutschen Langdatum', () => {
  assert.strictEqual(L.dateDE('2026-05-28'), '28. Mai 2026');
});

test('dateDE: ungueltige Eingabe ergibt Leerstring, nie "Invalid Date"', () => {
  ['', null, undefined, 'kein Datum'].forEach((w) => {
    assert.strictEqual(L.dateDE(w), '', String(w));
  });
});

test('kurzDatum: laufendes Jahr faellt weg, fremdes bleibt', () => {
  assert.strictEqual(L.kurzDatum('30. Juni 2026', 2026), '30. Juni');
  assert.strictEqual(L.kurzDatum('30. Juni 2025', 2026), '30. Juni 2025');
});

// --- Fundstellen ------------------------------------------------------------

test('parts: findet den Treffer unabhaengig von Gross- und Kleinschreibung', () => {
  const p = L.parts('Die Rechnung der Musterbank eG', 'musterbank');
  assert.strictEqual(p.hit, 'Musterbank');
  assert.ok(p.pre.endsWith('der '));
});

test('parts: ohne Treffer null, nicht etwa ein leeres Objekt', () => {
  assert.strictEqual(L.parts('Rechnung', 'zzz'), null);
  assert.strictEqual(L.parts('Rechnung', ''), null);
});

test('ausschnitt: zerlegt die <b>-Markierung des Suchindex', () => {
  const a = L.ausschnitt('Der <b>Betrag</b> ist faellig');
  assert.strictEqual(a.hit, 'Betrag');
  assert.strictEqual(a.pre, 'Der');
  assert.strictEqual(a.post, 'ist faellig');
});

test('ausschnitt: ohne Markierung nur gekuerzter Text, kein Absturz', () => {
  const a = L.ausschnitt('Nur Text ohne Markierung');
  assert.strictEqual(a.hit, '');
  assert.ok(a.pre.length > 0);
});

test('ausschnitt: fremdes HTML wird entfernt, nicht durchgereicht', () => {
  const a = L.ausschnitt('<script>alert(1)</script><b>Treffer</b>');
  assert.strictEqual(a.hit, 'Treffer');
  assert.ok(!/[<>]/.test(a.pre), 'kein Markup im Ergebnis');
});

// --- mapDoc -----------------------------------------------------------------

const LK = {
  tag: { 1: { name: 'Steuern' }, 2: { name: 'Favorit' } },
  corr: { 7: { name: 'Finanzamt Musterstadt' } },
  typ: { 3: { name: 'Bescheid' } },
  ablageort: { 5: { name: 'Privat/Steuern' } },
};

test('mapDoc: uebersetzt Kennungen in Namen', () => {
  const d = L.mapDoc({
    id: 12, title: 'Bescheid 2025', correspondent: 7, document_type: 3,
    storage_path: 5, tags: [1], created_date: '2026-05-28', added: '2026-07-31T10:00:00Z',
    page_count: 5, content: 'Text', archive_serial_number: 244,
  }, LK, {}, 'Favorit');
  assert.strictEqual(d.absender, 'Finanzamt Musterstadt');
  assert.strictEqual(d.dokumentart, 'Bescheid');
  assert.strictEqual(d.ablageort, 'Privat/Steuern');
  assert.deepStrictEqual(d.tags, ['Steuern']);
  assert.strictEqual(d.datum, '28. Mai 2026');
  assert.strictEqual(d.archivnummer, 'ASN-244');
  assert.strictEqual(d.seitenzahl, 5);
});

test('mapDoc: unbekannte Kennung ergibt Leerstring statt undefined', () => {
  const d = L.mapDoc({ id: 1, title: 'X', correspondent: 999, tags: [] }, LK, {}, 'Favorit');
  assert.strictEqual(d.absender, '');
});

test('mapDoc: Favorit ist ein Schlagwort und taucht nicht in der Liste auf', () => {
  const d = L.mapDoc({ id: 1, title: 'X', tags: [1, 2] }, LK, {}, 'Favorit');
  assert.strictEqual(d.favorit, true);
  assert.deepStrictEqual(d.tags, ['Steuern'], 'Favorit gehoert nicht in die Schlagwoerter');
});

test('mapDoc: geteilt ergibt sich aus vorhandenen Freigaben', () => {
  assert.strictEqual(L.mapDoc({ id: 9, tags: [] }, LK, { 9: {} }, 'Favorit').geteilt, true);
  assert.strictEqual(L.mapDoc({ id: 9, tags: [] }, LK, {}, 'Favorit').geteilt, false);
});

test('mapDoc: leeres Dokument stuerzt nicht ab', () => {
  const d = L.mapDoc({ id: 1 }, {}, {}, 'Favorit');
  assert.strictEqual(d.titel, '(ohne Titel)');
  assert.deepStrictEqual(d.tags, []);
  assert.strictEqual(d.seitenzahl, 1);
  assert.strictEqual(d.datum, '');
});

test('mapDoc: geteilt gilt auch ohne lokale Freigabeliste', () => {
  // Der Server meldet es selbst - frueher stand diese Regel nur in app.js,
  // waehrend die Tests eine zweite, aeltere Kopie in logik.js prueften.
  const d = L.mapDoc({ id: 5, tags: [], is_shared_by_requester: true }, LK, {}, 'Favorit');
  assert.strictEqual(d.geteilt, true, 'is_shared_by_requester allein genuegt');
});

test('mapDoc: Notizen - angezeigt wird die neueste, die Liste bleibt erhalten', () => {
  const d = L.mapDoc({ id: 5, tags: [], notes: [{ note: 'neu' }, { note: 'alt' }] }, LK, {}, 'Favorit');
  assert.strictEqual(d.notiz, 'neu');
  assert.strictEqual(d.notizen.length, 2);
});

test('mapDoc: ohne Notizen leeres Feld statt undefined', () => {
  const d = L.mapDoc({ id: 5, tags: [] }, LK, {}, 'Favorit');
  assert.strictEqual(d.notiz, '');
  assert.deepStrictEqual(d.notizen, []);
});

test('mapDoc: Sortierschluessel kommen aus ISO, nicht aus der Anzeige', () => {
  const d = L.mapDoc({ id: 5, tags: [], created_date: '2026-05-28', added: '2026-07-31T10:00:00Z' },
                     LK, {}, 'Favorit');
  assert.strictEqual(d.tsDatum, Date.parse('2026-05-28'));
  assert.ok(d.tsHinzu > d.tsDatum, 'hinzugefuegt liegt nach dem Ausstellungsdatum');
});

test('istNeu: sieben Tage sind die Grenze', () => {
  const jetzt = Date.parse('2026-07-31T12:00:00Z');
  assert.strictEqual(L.istNeu({ tsHinzu: Date.parse('2026-07-29T12:00:00Z') }, jetzt), true);
  assert.strictEqual(L.istNeu({ tsHinzu: Date.parse('2026-07-01T12:00:00Z') }, jetzt), false);
  assert.strictEqual(L.istNeu({}, jetzt), false);
});

// --- Ordner -----------------------------------------------------------------

const ORTE = [
  { name: 'Privat', document_count: 0 },
  { name: 'Privat/Steuern', document_count: 3 },
  { name: 'Privat/Versicherungen', document_count: 1 },
  { name: 'Archiv/2025', document_count: 2 },
];

test('ordnerKinder: Wurzel zeigt die obersten Ebenen', () => {
  const k = L.ordnerKinder(ORTE, '');
  assert.deepStrictEqual(k.map((x) => x.name), ['Archiv', 'Privat']);
});

test('ordnerKinder: zaehlt den ganzen Unterbaum', () => {
  const privat = L.ordnerKinder(ORTE, '').find((x) => x.name === 'Privat');
  assert.strictEqual(privat.anzahl, 4, '0 + 3 + 1 aus dem Unterbaum');
});

test('ordnerKinder: Zwischenordner ohne eigenen Ablageort ist ein Durchgang', () => {
  const archiv = L.ordnerKinder(ORTE, '').find((x) => x.name === 'Archiv');
  assert.strictEqual(archiv.direkt, false, 'es gibt keinen Ablageort namens "Archiv"');
  const privat = L.ordnerKinder(ORTE, '').find((x) => x.name === 'Privat');
  assert.strictEqual(privat.direkt, true);
});

test('ordnerKinder: eine Ebene tiefer', () => {
  const k = L.ordnerKinder(ORTE, 'Privat');
  assert.deepStrictEqual(k.map((x) => x.name), ['Steuern', 'Versicherungen']);
  assert.strictEqual(k[0].voll, 'Privat/Steuern');
});

test('ordnerKinder: unbekannter Pfad ergibt eine leere Liste', () => {
  assert.deepStrictEqual(L.ordnerKinder(ORTE, 'GibtEsNicht'), []);
  assert.deepStrictEqual(L.ordnerKinder([], ''), []);
});

test('pathAusName: Template folgt dem Namen', () => {
  assert.strictEqual(L.pathAusName('Privat/Steuern'), 'Privat/Steuern/{{ title }}');
});

test('pathAusName: unzulaessige Zeichen fliegen raus, leer faellt zurueck', () => {
  assert.strictEqual(L.pathAusName('Pri:vat*/Steu?ern'), 'Privat/Steuern/{{ title }}');
  assert.strictEqual(L.pathAusName(''), 'Ablage/{{ title }}');
});

// --- Gespeicherte Ansichten -------------------------------------------------

test('sichtQuery: Regression - fehlender Wert ergab "undefined Treffer"', () => {
  // Eine gespeicherte Suche hat ohne Ausfuehrung keine Trefferzahl. Frueher
  // wurde ein nicht vorhandenes Feld gelesen und als Zahl angezeigt.
  assert.strictEqual(L.sichtQuery({ filter_rules: [{ rule_type: 19, value: 'steuer' }] }), 'steuer');
  assert.strictEqual(L.sichtQuery({ filter_rules: [] }), '');
  assert.strictEqual(L.sichtQuery({}), '');
  assert.strictEqual(L.sichtQuery(null), '');
});

test('sichtQuery: mehrere Regeln lassen sich nicht als Suchbegriff darstellen', () => {
  assert.strictEqual(L.sichtQuery({
    filter_rules: [{ rule_type: 19, value: 'a' }, { rule_type: 3, value: '7' }],
  }), '');
});

// --- Posteingang ------------------------------------------------------------

test('felderAus: vorhandene Werte gelten als uebernommen', () => {
  const f = L.felderAus({ absender: 'Musterbank eG', dokumentart: 'Kontoauszug', datum: '30. Juni 2026', tags: ['Bank'] }, null);
  assert.strictEqual(f.length, 4);
  assert.ok(f.every((x) => x.ok), 'alle vier sind belegt');
});

test('felderAus: ohne Wert und ohne Vorschlag heisst es "nicht erkannt"', () => {
  const f = L.felderAus({ absender: '', dokumentart: '', datum: '', tags: [] }, null);
  assert.strictEqual(f[0].conf, 'nicht erkannt');
  assert.ok(f.every((x) => !x.ok));
});

test('felderAus: Vorschlag des Servers wird als solcher gekennzeichnet', () => {
  const f = L.felderAus({ absender: '', dokumentart: '', datum: '', tags: [] },
                        { correspondents: [7], document_types: [], dates: [], tags: [] });
  assert.strictEqual(f[0].conf, 'Vorschlag');
  assert.strictEqual(f[1].conf, 'nicht erkannt');
});

// --- Mitglieder -------------------------------------------------------------

test('passwortAus: Laenge, Gruppen und erlaubte Zeichen', () => {
  const werte = new Uint32Array(16).map((_, i) => i * 7 + 3);
  const pw = L.passwortAus(werte, 16);
  assert.strictEqual(pw.replace(/-/g, '').length, 16);
  assert.strictEqual(pw.split('-').length, 4, 'Vierergruppen');
  assert.ok([...pw.replace(/-/g, '')].every((c) => L.ALPHABET.includes(c)),
            'keine mehrdeutigen Zeichen wie 0/O oder 1/l');
});

test('benutzernameAus: leitet aus der E-Mail ab', () => {
  assert.strictEqual(L.benutzernameAus('anna.beispiel@example.org', 'Anna Beispiel', []), 'anna.beispiel');
});

test('benutzernameAus: Kollisionen werden durchnummeriert', () => {
  assert.strictEqual(L.benutzernameAus('bea@example.org', 'Bea', ['bea']), 'bea2');
  assert.strictEqual(L.benutzernameAus('bea@example.org', 'Bea', ['bea', 'bea2']), 'bea3');
});

test('benutzernameAus: Sonderzeichen fliegen raus, leer faellt zurueck', () => {
  assert.strictEqual(L.benutzernameAus('Ännchen Müller!@x.de', '', []), 'nnchenmller');
  assert.strictEqual(L.benutzernameAus('', '', []), 'mitglied');
});

test('zugangText: nennt Adresse, Benutzername und Passwort', () => {
  const t = L.zugangText(
    { name: 'Bea Beispiel', benutzername: 'bea', passwort: '6syX-TyZx-abcd-EFGH' },
    'https://example.org/paperless-app/');
  assert.ok(t.includes('https://example.org/paperless-app/'), 'ohne Adresse kommt niemand hin');
  assert.ok(t.includes('bea'));
  assert.ok(t.includes('Bea Beispiel'));
});

test('zugangText: die Bindestriche des Passworts bleiben stehen', () => {
  // Sie gehoeren zum Passwort. Verschwinden sie beim Weitergeben, passt es
  // nicht mehr - und nachschlagen laesst es sich nirgends, der Server haelt
  // nur den Hash.
  const pw = '6syX-TyZx-abcd-EFGH';
  const t = L.zugangText({ name: 'Bea', benutzername: 'bea', passwort: pw }, 'https://x/');
  assert.ok(t.includes('Passwort: ' + pw));
});

test('zugangText: ohne Daten leer statt "undefined"', () => {
  assert.strictEqual(L.zugangText(null, 'https://x/'), '');
});

// --- Sonstiges --------------------------------------------------------------

test('feldTyp: bekannte Typen uebersetzt, unbekannte auf Text', () => {
  assert.strictEqual(L.feldTyp('monetary'), 'Währung');
  assert.strictEqual(L.feldTyp('gibtesnicht'), 'Text');
});

test('regelText: ohne Einschraenkung sagt es das auch', () => {
  assert.strictEqual(L.regelText({}), 'Ohne Einschränkung');
  assert.ok(L.regelText({ folder: 'INBOX', filter_subject: 'Rechnung' }).includes('·'));
});

// --- PDF aus Seiten (scan.js) -----------------------------------------------
//
// Ein selbstgeschriebenes Byteformat glaubt man erst, wenn fremde Software es
// liest. Die Struktur wird hier geprueft, das tatsaechliche Oeffnen durch
// poppler und pypdf im Zusammenspiel - siehe docs/ROADMAP.md 3.4.

require('../scan.js');
const S = globalThis.DWScan;

// Ein winziges, gueltiges JPEG (1x1 weiss) reicht: geprueft wird der Rahmen
// um die Bilddaten, nicht das Bild.
const JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a' +
  'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAA' +
  'AAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==', 'base64');
const seite = (b, h) => ({ jpeg: new Uint8Array(JPEG), breite: b, hoehe: h });
const alsText = (u8) => Buffer.from(u8).toString('latin1');

test('pdf: ohne Seiten gibt es kein Dokument', () => {
  assert.throws(() => S.pdf([]), /Keine Seiten/);
});

test('pdf: Kopf, Ende und Seitenzahl stimmen', () => {
  const t = alsText(S.pdf([seite(1600, 2200), seite(800, 600)]));
  assert.ok(t.startsWith('%PDF-1.4'), 'PDF-Kopf fehlt');
  assert.ok(t.trimEnd().endsWith('%%EOF'), 'Dateiende fehlt');
  assert.strictEqual((t.match(/\/Type \/Page\b/g) || []).length, 2);
  assert.ok(t.includes('/Count 2'));
  assert.ok(t.includes('/Filter /DCTDecode'), 'JPEG nicht als DCTDecode eingebettet');
});

test('pdf: die Querverweise zeigen wirklich auf die Objekte', () => {
  // Genau hier geht ein selbstgebautes PDF kaputt: die Tabelle nennt
  // Byte-Positionen, und ein Bild dazwischen verschiebt jede folgende.
  const roh = S.pdf([seite(1600, 2200), seite(800, 600)]);
  const t = alsText(roh);
  const tabelle = t.slice(t.lastIndexOf('\nxref\n') + 6);
  const zeilen = tabelle.split('\n').slice(1).filter(z => / \d{5} [nf] $/.test(z));
  assert.strictEqual(zeilen.length, 9, '2 feste + 3 je Seite + freier Eintrag');
  zeilen.slice(1).forEach((z, i) => {
    const pos = parseInt(z.slice(0, 10), 10);
    assert.strictEqual(t.slice(pos, pos + 8).trim().split(' ')[0], String(i + 1),
      `Objekt ${i + 1} liegt nicht bei Byte ${pos}`);
  });
});

test('pdf: startxref trifft die Tabelle', () => {
  const t = alsText(S.pdf([seite(1000, 1000)]));
  const pos = parseInt(t.slice(t.lastIndexOf('startxref\n') + 10), 10);
  assert.strictEqual(t.slice(pos, pos + 4), 'xref');
});

test('pdf: Seiten passen in A4, hochkant wie quer', () => {
  const kasten = (b, h) => {
    const m = alsText(S.pdf([seite(b, h)])).match(/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/);
    return [parseFloat(m[1]), parseFloat(m[2])];
  };
  const hoch = kasten(1600, 2200);
  assert.ok(hoch[0] <= 595.28 + 0.01 && hoch[1] <= 841.89 + 0.01, 'ragt ueber A4 hinaus');
  assert.ok(Math.abs(hoch[0] / hoch[1] - 1600 / 2200) < 0.001, 'Seitenverhaeltnis verzerrt');
  const quer = kasten(2200, 1600);
  assert.ok(quer[0] > quer[1], 'quer aufgenommene Seite ist nicht quer');
});

test('pdf: die Bildbytes landen unveraendert in der Datei', () => {
  // Das ist der Grund, warum diese 120 Zeilen eine Bibliothek ersetzen: es
  // wird nichts neu komprimiert.
  const roh = S.pdf([seite(100, 100)]);
  const t = alsText(roh);
  assert.ok(t.includes(JPEG.toString('latin1')), 'JPEG wurde veraendert');
  assert.ok(t.includes('/Length ' + JPEG.length), 'Laengenangabe passt nicht');
});

// --- Vorschaubilder im Speicher ---------------------------------------------
//
// Object-URLs gibt der Browser nie von selbst frei. Ohne Obergrenze waechst
// der Verbrauch mit jedem gescrollten Dokument.

test('bilderUeberzaehlig: unter der Grenze faellt nichts weg', () => {
  assert.deepStrictEqual(L.bilderUeberzaehlig([1, 2, 3], 5), []);
  assert.deepStrictEqual(L.bilderUeberzaehlig([1, 2, 3], 3), []);
});

test('bilderUeberzaehlig: es faellt weg, was am laengsten nicht gebraucht wurde', () => {
  // Vorn steht das aelteste - die Liste ist nach Nutzung sortiert.
  assert.deepStrictEqual(L.bilderUeberzaehlig([1, 2, 3, 4, 5], 3), [1, 2]);
});

test('bilderUeberzaehlig: leere Liste und fehlende Angabe stuerzen nicht ab', () => {
  assert.deepStrictEqual(L.bilderUeberzaehlig([], 10), []);
  assert.deepStrictEqual(L.bilderUeberzaehlig(null, 10), []);
});

test('bilderUeberzaehlig: die Grenze wird wirklich eingehalten', () => {
  // Der Fall, der in der App zaehlt: 5000 Dokumente durchgescrollt.
  const ids = Array.from({ length: 5000 }, (x, i) => i);
  const weg = L.bilderUeberzaehlig(ids, 120);
  assert.strictEqual(ids.length - weg.length, 120);
  assert.strictEqual(weg[0], 0, 'das aelteste muss zuerst weichen');
});
