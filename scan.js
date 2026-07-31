// Mehrere Fotos zu einem PDF zusammensetzen.
//
// Warum ueberhaupt selbst? Ein Vertrag hat fuenf Seiten. Fuenf einzelne Fotos
// hochzuladen ergibt fuenf Dokumente im Posteingang, die niemand mehr
// zusammenbringt. Paperless kann sie nicht zusammenfuegen, also muss es hier
// passieren - vor dem Hochladen.
//
// Und warum ohne Bibliothek? Die verbreiteten PDF-Pakete wiegen 300 KB bis
// 1 MB und koennen Formulare, Schriften, Vektoren, Verschluesselung. Gebraucht
// wird davon genau eines: ein JPEG pro Seite. Das sind die 120 Zeilen unten.
//
// Der Trick ist, dass ein JPEG unveraendert in ein PDF wandern kann. PDF kennt
// den Filter DCTDecode - das *ist* JPEG. Es wird also nichts umgerechnet und
// nichts neu komprimiert: die Bytes der Kamera landen unveraendert in der
// Datei. Deshalb ist der Code so kurz und das Ergebnis so klein.
//
// Ohne Browser ladbar, damit die PDF-Erzeugung ohne Kamera geprueft werden
// kann. Was Canvas braucht, steht in Funktionen, die im Test nicht laufen.
(function (global) {
  'use strict';

  // A4 in PDF-Punkten (1/72 Zoll). Seiten werden hineinskaliert, statt die
  // Pixelmasse der Kamera zu uebernehmen: sonst haette eine 12-Megapixel-Seite
  // ein MediaBox von 4000x3000 Punkt, also anderthalb Meter Papier.
  var A4_B = 595.28, A4_H = 841.89;

  function bytes(s) {
    var b = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 0xff;
    return b;
  }

  // Zahlen in der PDF-Syntax: kein Exponent, hoechstens zwei Nachkommastellen.
  // '1e-7' waere gueltiges JavaScript und ungueltiges PDF.
  function zahl(n) {
    return (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, '');
  }

  // Seiten: [{ jpeg: Uint8Array, breite: Number, hoehe: Number }]
  //
  // Gibt die fertige Datei als Uint8Array zurueck. Das Verpacken in einen Blob
  // macht der Aufrufer - so bleibt diese Funktion ohne Browser pruefbar.
  function pdf(seiten) {
    if (!seiten || !seiten.length) throw new Error('Keine Seiten.');

    var teile = [], laenge = 0, versatz = {};
    function schreib(u8) { teile.push(u8); laenge += u8.length; }
    function txt(s) { schreib(bytes(s)); }

    // Objektnummern: 1 Katalog, 2 Seitenbaum, danach drei je Seite
    // (Seite, Inhalt, Bild).
    var seitenNr = seiten.map(function (_, i) { return 3 + i * 3; });

    txt('%PDF-1.4\n');
    // Ein Kommentar aus hohen Bytes. Er sagt Programmen, die die Datei
    // weiterreichen, dass sie binaer ist und nicht als Text behandelt werden
    // darf - sonst macht ein Zeilenende-Umbau das PDF unbrauchbar.
    schreib(new Uint8Array([0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A]));

    function objAnfang(nr) { versatz[nr] = laenge; txt(nr + ' 0 obj\n'); }
    function objEnde() { txt('\nendobj\n'); }

    objAnfang(1);
    txt('<< /Type /Catalog /Pages 2 0 R >>');
    objEnde();

    objAnfang(2);
    txt('<< /Type /Pages /Count ' + seiten.length + ' /Kids [' +
        seitenNr.map(function (n) { return n + ' 0 R'; }).join(' ') + '] >>');
    objEnde();

    seiten.forEach(function (s, i) {
      var nr = seitenNr[i], inhaltNr = nr + 1, bildNr = nr + 2;
      // Jede Seite fuellt A4 so weit aus, wie ihr Seitenverhaeltnis es
      // zulaesst. Das gilt bewusst auch fuer kleine Aufnahmen: ein Stapel, in
      // dem Seite 3 halb so gross ist wie Seite 1, sieht nach einem Fehler
      // aus. Die Aufloesung des Bildes aendert das nicht - nur die Groesse,
      // in der es auf dem Blatt liegt.
      var f = Math.min(A4_B / s.breite, A4_H / s.hoehe);
      var pb = s.breite * f, ph = s.hoehe * f;

      objAnfang(nr);
      txt('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + zahl(pb) + ' ' + zahl(ph) + '] ' +
          '/Resources << /XObject << /Im0 ' + bildNr + ' 0 R >> >> ' +
          '/Contents ' + inhaltNr + ' 0 R >>');
      objEnde();

      // cm setzt die Bildmatrix: Breite, 0, 0, Hoehe, x, y. Ein Bild ist in
      // PDF immer eine Einheitsflaeche, die ueber diese Matrix ihre Groesse
      // bekommt.
      var strom = 'q ' + zahl(pb) + ' 0 0 ' + zahl(ph) + ' 0 0 cm /Im0 Do Q';
      objAnfang(inhaltNr);
      txt('<< /Length ' + strom.length + ' >>\nstream\n' + strom + '\nendstream');
      objEnde();

      objAnfang(bildNr);
      txt('<< /Type /XObject /Subtype /Image /Width ' + s.breite + ' /Height ' + s.hoehe +
          ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' +
          s.jpeg.length + ' >>\nstream\n');
      schreib(s.jpeg);
      txt('\nendstream');
      objEnde();
    });

    // Querverweistabelle. Jeder Eintrag ist auf das Byte genau 20 Zeichen
    // lang - daran haelt sich der Leser beim Springen.
    var anzahl = 2 + seiten.length * 3;
    var xref = laenge;
    txt('xref\n0 ' + (anzahl + 1) + '\n');
    txt('0000000000 65535 f \n');
    for (var n = 1; n <= anzahl; n++) {
      var v = String(versatz[n] || 0);
      while (v.length < 10) v = '0' + v;
      txt(v + ' 00000 n \n');
    }
    txt('trailer\n<< /Size ' + (anzahl + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');

    var alles = new Uint8Array(laenge), pos = 0;
    teile.forEach(function (t) { alles.set(t, pos); pos += t.length; });
    return alles;
  }

  // --- Ab hier braucht es einen Browser ------------------------------------

  // Laengste Kante eines Seitenfotos. 2200 Pixel sind fuer die Texterkennung
  // reichlich (rund 260 dpi auf A4) und halten eine zehnseitige Aufnahme unter
  // zwei Megabyte. Die Kamera liefert oft das Vierfache, ohne dass ein Buchstabe
  // mehr lesbar waere.
  var MAX_KANTE = 2200;
  var GUETE = 0.82;

  // Ein aufgenommenes Foto zu einer Seite machen: drehen, zuschneiden,
  // verkleinern, als JPEG zurueck.
  //
  // zuschnitt ist in Anteilen der Bildkante angegeben (0 bis 1), nicht in
  // Pixeln - so ueberlebt er das Verkleinern und das Drehen.
  function seiteAus(quelle, opt) {
    opt = opt || {};
    var dreh = ((opt.dreh || 0) % 360 + 360) % 360;
    var z = opt.zuschnitt;

    return Promise.resolve(
      quelle instanceof global.ImageBitmap ? quelle
        : global.createImageBitmap(quelle, { imageOrientation: 'from-image' })
    ).then(function (bild) {
      var sx = 0, sy = 0, sb = bild.width, sh = bild.height;
      if (z) {
        sx = Math.round(z.x0 * bild.width);
        sy = Math.round(z.y0 * bild.height);
        sb = Math.max(1, Math.round((z.x1 - z.x0) * bild.width));
        sh = Math.max(1, Math.round((z.y1 - z.y0) * bild.height));
      }

      // Nach dem Drehen um 90 oder 270 Grad tauschen Breite und Hoehe.
      var quer = dreh === 90 || dreh === 270;
      var zb = quer ? sh : sb, zh = quer ? sb : sh;
      var f = Math.min(1, MAX_KANTE / Math.max(zb, zh));
      zb = Math.max(1, Math.round(zb * f));
      zh = Math.max(1, Math.round(zh * f));

      var c = global.document.createElement('canvas');
      c.width = zb; c.height = zh;
      var g = c.getContext('2d');
      // Weiss unterlegen: ein JPEG kennt keine Transparenz, und ohne
      // Hintergrund waeren durchscheinende Stellen sonst schwarz.
      g.fillStyle = '#fff';
      g.fillRect(0, 0, zb, zh);
      g.translate(zb / 2, zh / 2);
      g.rotate(dreh * Math.PI / 180);
      g.drawImage(bild, sx, sy, sb, sh,
        -(quer ? zh : zb) / 2, -(quer ? zb : zh) / 2,
        quer ? zh : zb, quer ? zb : zh);

      return new Promise(function (fertig, fehler) {
        c.toBlob(function (blob) {
          if (!blob) { fehler(new Error('Das Bild liess sich nicht umwandeln.')); return; }
          blob.arrayBuffer().then(function (buf) {
            fertig({ jpeg: new Uint8Array(buf), breite: zb, hoehe: zh, blob: blob });
          }, fehler);
        }, 'image/jpeg', GUETE);
      });
    });
  }

  function datei(seiten, name) {
    return new global.File([pdf(seiten)], name || 'Scan.pdf', { type: 'application/pdf' });
  }

  global.DWScan = {
    pdf: pdf,
    seiteAus: seiteAus,
    datei: datei,
    MAX_KANTE: MAX_KANTE,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
