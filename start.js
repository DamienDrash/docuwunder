// Start der Anwendung.
//
// Stand frueher als Inline-Skript in index.html. Herausgeloest, weil eine
// strikte Content-Security-Policy ohne 'unsafe-inline' daran sofort
// scheitert - und 'unsafe-inline' zu erlauben hiesse, auf den zweiten
// Schutzwall zu verzichten, den man nach einem XSS-Fund am wenigsten
// entbehren will (siehe docs/AUDIT.md, H-1).
//
// Inhaltlich unveraendert uebernommen.

// Die Farben der beiden Schemata, wie sie oben im Kopf stehen. Sie faerben im
// installierten Zustand die Leisten des Systems um die App herum.
const LEISTE_HELL = '#F7FAFA';
const LEISTE_DUNKEL = '#0D1B2A';
let leisteJetzt = null;

// Die Oberflaeche meldet hierher, in welchem Schema sie tatsaechlich steht.
//
// Das ist nicht dasselbe wie die Systemeinstellung: in den App-Einstellungen
// laesst sich Hell oder Dunkel ausdruecklich waehlen. Ohne diese Rueckmeldung
// bliebe die Leiste des Systems bei der Farbe des Systemschemas stehen - im
// Browser faellt das kaum auf, in der installierten App steht dann ein heller
// Streifen ueber einer dunklen Oberflaeche.
//
// Umgeschrieben werden beide Angaben aus dem Kopf: welche davon greift,
// entscheidet die Medienabfrage, und die kennt nur das System. Dieselbe Farbe
// in beiden heisst deshalb: die Wahl in der App gilt.
function leiste(dunkel) {
  const farbe = dunkel ? LEISTE_DUNKEL : LEISTE_HELL;
  if (leisteJetzt === farbe) return;
  leisteJetzt = farbe;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', farbe));
  // Sichtbar ist der Hintergrund nur an den Raendern, die die Oberflaeche
  // freilaesst; er muss aber zur gewaehlten Farbe passen, nicht zum System.
  document.documentElement.style.background = farbe;
  document.body.style.background = farbe;
}

DWUi.starten(DWApp.Wurzel, '#app', { farbschema: 'System', onDark: leiste });

// Der Service Worker haelt die Huelle der App vor, damit sie ohne Netz
// startet (siehe sw.js). Er ist Zubehoer: schlaegt die Anmeldung fehl - kein
// sicherer Kontext, abgeschaltet, Privatfenster -, laeuft die App wie bisher.
//
// Der zweite Teil ist wichtiger, als er aussieht: eine installierte App wird
// nie neu geladen. iOS haelt die Seite tagelang am Leben, und ein neuer
// Service Worker tauscht den *bereits laufenden* Code nicht aus - er belegt
// nur den Cache fuer den naechsten Kaltstart. Ohne das Folgende laeuft eine
// installierte App also beliebig lange auf einem alten Stand, waehrend der
// Server laengst einen neuen ausliefert. Genau das ist passiert: behobene
// Fehler kamen nicht an, weil die App gar nicht mitbekam, dass es sie gibt.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then((reg) => {
        // Nachsehen, sobald die App in den Vordergrund kommt. Ein Wechsel
        // zwischen Apps ist der Moment, in dem ein Neuladen am wenigsten
        // stoert - und bei einer installierten App der einzige regelmaessige.
        const nachsehen = () => {
          if (document.visibilityState === 'visible') reg.update().catch(() => {});
        };
        document.addEventListener('visibilitychange', nachsehen);
        window.addEventListener('focus', nachsehen);
      })
      .catch((e) => console.warn('Service Worker nicht angemeldet:', e));

    // Uebernimmt ein neuer Worker, laeuft im Fenster noch der alte Code.
    // Einmal neu laden holt ihn nach.
    //
    // Die Sperre gegen Schleifen ist noetig: der allererste Worker uebernimmt
    // eine bis dahin ungesteuerte Seite ebenfalls ueber dieses Ereignis. Ohne
    // sie wuerde die App bei der ersten Installation einmal neu laden, und bei
    // einem Fehler im Worker immer wieder.
    let laedtNeu = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (laedtNeu || !navigator.serviceWorker.controller) return;
      if (!sessionStorage.getItem('docuwunder.erstgesteuert')) {
        sessionStorage.setItem('docuwunder.erstgesteuert', '1');
        return;
      }
      laedtNeu = true;
      location.reload();
    });
    if (navigator.serviceWorker.controller) {
      sessionStorage.setItem('docuwunder.erstgesteuert', '1');
    }
  });
}
