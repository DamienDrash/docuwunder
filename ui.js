// Laufzeitgrundlage von DocuWunder: React ohne Zwischenschicht.
//
// Ersetzt das frühere DC-Runtime (support.js), dessen Quellprojekt nirgends
// vorlag und das sich deshalb weder ändern noch auf eine neue React-Version
// heben liess - in einem AGPL-Repository zusätzlich heikel, weil Empfänger den
// Quelltext nicht bekommen konnten.
//
// Statt JSX kommt htm zum Einsatz: ein Tagged-Template-Helfer von rund 1,2 KB,
// der ohne Compiler auskommt. Damit bleibt der Grundsatz des Projekts erhalten
// - kein Build-Schritt, kein Paketmanager.
//
// Schreibweise:
//     html`<div style=${stil('color:red')} onClick=${fn}>${text}</div>`
//     ${bedingung ? html`<p>ja</p>` : null}
//     ${liste.map((x) => html`<li key=${x.id}>${x.name}</li>`)}
(function (global) {
  'use strict';

  if (!global.React) throw new Error('ui.js: React fehlt - Reihenfolge der Scripts prüfen');
  if (!global.htm) throw new Error('ui.js: htm fehlt - Reihenfolge der Scripts prüfen');

  var html = global.htm.bind(global.React.createElement);

  // React nimmt für style nur ein Objekt, keine CSS-Zeichenkette. Die Oberfläche
  // ist aber durchgehend mit Zeichenketten geschrieben, und die sind dort auch
  // lesbarer als verschachtelte Objekte.
  //
  // stil() übersetzt einmalig und merkt sich das Ergebnis: dieselbe Zeichenkette
  // kommt bei jedem Render wieder, das Zerlegen würde sich sonst tausendfach
  // wiederholen. Der Zwischenspeicher ist unbegrenzt, weil die Menge fester
  // Stil-Zeichenketten im Programm endlich ist.
  var stilCache = new Map();

  function stil(css) {
    if (!css) return undefined;
    if (typeof css === 'object') return css;
    var da = stilCache.get(css);
    if (da) return da;

    var obj = {};
    String(css).split(';').forEach(function (regel) {
      var i = regel.indexOf(':');
      if (i < 0) return;
      var name = regel.slice(0, i).trim();
      var wert = regel.slice(i + 1).trim();
      if (!name || !wert) return;
      // Eigene Eigenschaften (--acc) übernimmt React unverändert; alle anderen
      // erwartet es in Binnenmajuskel.
      if (name.indexOf('--') === 0) obj[name] = wert;
      else obj[name.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); })] = wert;
    });
    stilCache.set(css, obj);
    return obj;
  }

  // Mehrere Stil-Bausteine zusammensetzen. Spätere gewinnen, leere Werte
  // (false, null, '') fallen weg - so lassen sich Zustände anhängen:
  //     stile(BASIS, aktiv && 'color:var(--acc)')
  function stile() {
    var aus = {};
    for (var i = 0; i < arguments.length; i++) {
      var s = arguments[i];
      if (!s) continue;
      Object.assign(aus, stil(s));
    }
    return aus;
  }

  // Fängt Fehler einer Teiloberfläche ab, damit ein Fehler in einem Bildschirm
  // nicht die ganze App weissbrennt. Ohne das führt ein einziges undefined
  // dazu, dass React den kompletten Baum abräumt.
  var Fehlerfang = (function () {
    function Fehlerfang(props) {
      global.React.Component.call(this, props);
      this.state = { fehler: null };
    }
    Fehlerfang.prototype = Object.create(global.React.Component.prototype);
    Fehlerfang.prototype.constructor = Fehlerfang;
    Fehlerfang.getDerivedStateFromError = function (fehler) { return { fehler: fehler }; };
    Fehlerfang.prototype.componentDidCatch = function (fehler, info) {
      console.error('[DocuWunder] Oberfläche abgestürzt:', fehler, info && info.componentStack);
    };
    Fehlerfang.prototype.render = function () {
      if (!this.state.fehler) return this.props.children;
      return html`
        <div style=${stil('position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 32px;background:var(--bg);color:var(--lab)')}>
          <div style=${stil('font-size:19px;font-weight:700')}>Da ist etwas schiefgegangen</div>
          <div style=${stil('font-size:14.5px;color:var(--lab2);margin-top:8px;line-height:1.5;max-width:320px')}>
            Die Oberfläche konnte nicht aufgebaut werden. Deine Dokumente sind davon nicht betroffen.
          </div>
          <div style=${stil('font-family:ui-monospace,Menlo,monospace;font-size:12px;color:var(--lab3);margin-top:14px;max-width:340px;word-break:break-word')}>
            ${String(this.state.fehler && this.state.fehler.message || this.state.fehler)}
          </div>
          <div onClick=${function () { global.location.reload(); }}
               style=${stil('margin-top:22px;height:46px;padding:0 22px;border-radius:12px;background:var(--acc);color:var(--onAcc);display:flex;align-items:center;font-size:16px;font-weight:600;cursor:pointer')}>
            Neu laden
          </div>
        </div>`;
    };
    return Fehlerfang;
  })();

  // Hängt eine Komponente in ein Element. Ersetzt boot() des alten Runtimes.
  function starten(Komponente, ziel, props) {
    var el = typeof ziel === 'string' ? document.querySelector(ziel) : ziel;
    if (!el) throw new Error('ui.js: Zielelement nicht gefunden: ' + ziel);
    var baum = html`<${Fehlerfang}><${Komponente} ...${props || {}} /><//>`;
    // createRoot gibt es erst ab React 18; der Rückfall hält ältere Fassungen
    // lauffähig, falls die vendor-Kopie einmal zurückgedreht wird.
    if (global.ReactDOM.createRoot) global.ReactDOM.createRoot(el).render(baum);
    else global.ReactDOM.render(baum, el);
  }

  global.DWUi = { html: html, stil: stil, stile: stile, starten: starten, Fehlerfang: Fehlerfang };
// globalThis statt self: so laesst sich die Datei auch in Node laden, um
// stil() ohne Browser zu pruefen (tests/logik.test.js).
})(typeof globalThis !== 'undefined' ? globalThis : this);
