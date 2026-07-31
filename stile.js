// Wiederkehrende Bausteine der Oberfläche.
//
// Vorher standen dieselben Zeichenketten bis zu 24-mal wörtlich in den
// Bildschirmen. Eine Änderung an der Kartenform hätte 24 Stellen gebraucht -
// und eine davon wäre vergessen worden.
//
// Aufgenommen ist nur, was mindestens fünfmal wortgleich vorkam und einen
// Namen verdient. Einzelfälle bleiben dort stehen, wo sie gebraucht werden:
// eine Konstante für einen einzigen Ort verschiebt die Suche nur.
//
// Verwendung in den Bildschirmen:
//     <div style=${stil(S.karte)}>
//     <div style=${stile(S.zeile, aktiv && 'background:var(--accT)')}>
(function (global) {
  'use strict';

  global.DWStile = {
    // --- Flächen ------------------------------------------------------------
    // Die weiße Karte, auf der Listen und Abschnitte liegen.
    karte: 'background:var(--card);border-radius:16px;margin:0 16px;overflow:hidden',

    // Trennlinie innerhalb einer Karte. Sie beginnt eingerückt, damit sie unter
    // dem Text ansetzt und nicht unter dem Symbol davor.
    // pointer-events:none ist wichtig: die Linie liegt absolut ueber der Zeile
    // und wuerde sonst Klicks abfangen, die dem Eintrag darunter gelten.
    trenner: 'position:absolute;left:16px;right:0;bottom:0;height:0.5px;background:var(--sep);pointer-events:none',

    // --- Kopfbereich --------------------------------------------------------
    // Die Leiste über einem aufgeschobenen Bildschirm. Der Verlauf lässt den
    // Inhalt darunter ausblenden, statt hart abzuschneiden.
    kopf: 'position:absolute;top:0;left:0;right:0;z-index:6;display:flex;align-items:center;'
        + 'gap:10px;padding:60px 16px 8px;background:linear-gradient(var(--bg) 55%,transparent)',

    // Runder Knopf im Kopfbereich (zurück, hinzufügen, Menü).
    kopfKnopf: 'width:36px;height:36px;border-radius:50%;background:var(--glass);'
             + 'backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);'
             + 'border:0.5px solid var(--gbor);display:flex;align-items:center;'
             + 'justify-content:center;cursor:pointer;flex-shrink:0',

    // Titel zwischen den beiden Knöpfen.
    kopfTitel: 'flex:1;text-align:center;font-size:15.5px;font-weight:600',

    // Der scrollende Bereich unter dem Kopf. Der obere Abstand hält den Inhalt
    // unter der Leiste, der untere über der Tableiste.
    blatt: 'position:absolute;inset:0;overflow-y:auto;padding:112px 0 40px',

    // --- Schrift ------------------------------------------------------------
    abschnitt: 'font-size:13px;font-weight:600;color:var(--lab2);text-transform:uppercase;'
             + 'letter-spacing:0.3px;padding:18px 20px 8px',
    sheetTitel: 'font-size:18px;font-weight:700;padding:10px 20px 2px',
    zeileTitel: 'font-size:15.5px;font-weight:600',
    zeileText: 'font-size:15px;font-weight:500',
    neben: 'font-size:13px;color:var(--lab2)',
    nebenGross: 'font-size:15px;color:var(--lab2)',

    // --- Bedienelemente -----------------------------------------------------
    // Der große Knopf am Fuß eines Sheets. Die Schriftfarbe kommt aus --onAcc,
    // weil der Akzent im dunklen Schema Mint ist und weiße Schrift darauf einen
    // Kontrast von 1.46 hätte - siehe Markenregeln.
    knopf: 'height:50px;border-radius:12px;background:var(--acc);color:var(--onAcc);'
         + 'display:flex;align-items:center;justify-content:center;font-size:16.5px;'
         + 'font-weight:600;cursor:pointer',

    // Eingabefeld in einem Sheet.
    feld: 'width:100%;height:46px;border-radius:12px;border:1px solid var(--sep);'
        + 'background:var(--fill);padding:0 14px;font-size:16px;color:var(--lab);outline:none',

    // Anklickbare Zeile in einer Karte.
    zeile: 'display:flex;align-items:center;gap:11px;padding:12px 16px;cursor:pointer;position:relative',

    // Zentriert, für leere Zustände.
    mitte: 'margin:0 auto;display:block',
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
