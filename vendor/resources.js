// Biegt die vom DC-Runtime fest verdrahteten CDN-URLs auf lokale Kopien um.
//
// support.js laedt React, ReactDOM und Babel sonst zur Laufzeit von unpkg.com
// (siehe support.js: REACT_URL / REACT_DOM_URL / BABEL_URL). Fuer eine PWA, die
// offline und im LAN/VPN ohne Internet funktionieren soll, ist das ein Blocker.
//
// cdnScriptFor() in support.js prueft window.__resources und nimmt den dort
// hinterlegten Pfad, falls vorhanden - das ist der vorgesehene Escape-Hatch.
// Deshalb bleibt support.js unveraendert (die Datei ist generiert und ihr
// Quellprojekt dc-runtime liegt nicht vor).
//
// Muss VOR support.js geladen werden.
//
// Die lokalen Kopien in vendor/ sind byte-identisch mit den CDN-Artefakten:
// ihre sha384-Hashes stimmen mit den in support.js hinterlegten SRI-Werten
// ueberein. Beim Aktualisieren einer Version denselben Abgleich wiederholen.
window.__resources = {
  'https://unpkg.com/react@18.3.1/umd/react.production.min.js': './vendor/react.production.min.js',
  'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js': './vendor/react-dom.production.min.js',
  // Babel wird nur fuer externe .jsx-Module gebraucht (x-import from="*.jsx").
  // Der Produktivpfad kommt ohne aus; die Zuordnung steht hier fuer die
  // Design-Vorschau iphone.html, die ios-frame.jsx laedt.
  'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js': './vendor/babel.min.js'
};
