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
  ort: { 5: { name: 'Privat/Steuern' } },
};

test('mapDoc: uebersetzt Kennungen in Namen', () => {
  const d = L.mapDoc({
    id: 12, title: 'Bescheid 2025', correspondent: 7, document_type: 3,
    storage_path: 5, tags: [1], created_date: '2026-05-28', added: '2026-07-31T10:00:00Z',
    page_count: 5, content: 'Text', archive_serial_number: 244,
  }, LK, {}, 'Favorit');
  assert.strictEqual(d.abs, 'Finanzamt Musterstadt');
  assert.strictEqual(d.art, 'Bescheid');
  assert.strictEqual(d.ort, 'Privat/Steuern');
  assert.deepStrictEqual(d.tags, ['Steuern']);
  assert.strictEqual(d.datum, '28. Mai 2026');
  assert.strictEqual(d.asn, 'ASN-244');
  assert.strictEqual(d.seiten, 5);
});

test('mapDoc: unbekannte Kennung ergibt Leerstring statt undefined', () => {
  const d = L.mapDoc({ id: 1, title: 'X', correspondent: 999, tags: [] }, LK, {}, 'Favorit');
  assert.strictEqual(d.abs, '');
});

test('mapDoc: Favorit ist ein Schlagwort und taucht nicht in der Liste auf', () => {
  const d = L.mapDoc({ id: 1, title: 'X', tags: [1, 2] }, LK, {}, 'Favorit');
  assert.strictEqual(d.fav, true);
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
  assert.strictEqual(d.seiten, 1);
  assert.strictEqual(d.datum, '');
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
  const f = L.felderAus({ abs: 'Musterbank eG', art: 'Kontoauszug', datum: '30. Juni 2026', tags: ['Bank'] }, null);
  assert.strictEqual(f.length, 4);
  assert.ok(f.every((x) => x.ok), 'alle vier sind belegt');
});

test('felderAus: ohne Wert und ohne Vorschlag heisst es "nicht erkannt"', () => {
  const f = L.felderAus({ abs: '', art: '', datum: '', tags: [] }, null);
  assert.strictEqual(f[0].conf, 'nicht erkannt');
  assert.ok(f.every((x) => !x.ok));
});

test('felderAus: Vorschlag des Servers wird als solcher gekennzeichnet', () => {
  const f = L.felderAus({ abs: '', art: '', datum: '', tags: [] },
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

// --- Sonstiges --------------------------------------------------------------

test('feldTyp: bekannte Typen uebersetzt, unbekannte auf Text', () => {
  assert.strictEqual(L.feldTyp('monetary'), 'Währung');
  assert.strictEqual(L.feldTyp('gibtesnicht'), 'Text');
});

test('regelText: ohne Einschraenkung sagt es das auch', () => {
  assert.strictEqual(L.regelText({}), 'Ohne Einschränkung');
  assert.ok(L.regelText({ folder: 'INBOX', filter_subject: 'Rechnung' }).includes('·'));
});
