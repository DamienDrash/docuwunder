/* Service Worker von DocuWunder.
 *
 * Aufgabe: die App soll starten, wenn kein Netz da ist. Mehr nicht.
 *
 * Was hier NICHT passiert, ist genauso wichtig: Dokumente, Vorschaubilder und
 * ueberhaupt alles unter /paperless/ fasst dieser Worker nicht an. Zwei Gruende.
 * Erstens gehoeren fremde Rechnungen und Vertraege nicht in einen Browsercache,
 * den kein Abmelden leert. Zweitens waere eine zwischengespeicherte Liste eine
 * Behauptung ueber den Bestand, die der Server nicht gedeckt hat - die App
 * filtert und sucht bewusst serverseitig (siehe CLAUDE.md, Datenfluss). Ohne
 * Netz zeigt sie deshalb ihre Oberflaeche und einen ehrlichen Fehler, keine
 * alten Daten.
 *
 * Gespeichert wird also nur die Huelle: das HTML, die Komponente, das Runtime,
 * React und die Schrift. Alles davon liegt ohnehin lokal (vendor/), damit die
 * App ohne Internet auskommt.
 *
 * Zwei Strategien, weil die Dateien sich unterschiedlich verhalten:
 *
 *   vendor/, icons/   Zuerst aus dem Cache, Auffrischung nebenher. Diese
 *                     Dateien haengen an einer festen Version und aendern sich
 *                     praktisch nie; ein Netzzugriff bei jedem Start waere
 *                     verschenkt. Aendern sie sich doch, greift die neue Fassung
 *                     beim naechsten Start.
 *   alles Uebrige     Zuerst aus dem Netz, mit kurzer Frist und Rueckfall auf
 *                     den Cache. index.html, app.js und die Bildschirme gehoeren
 *                     zusammen - sie duerfen nicht in verschiedenen Staenden
 *                     nebeneinander laufen, deshalb bekommt das Netz hier den
 *                     Vortritt, solange es antwortet.
 */

// Die Version ist eine Pruefsumme ueber den Inhalt der Huelle und wird von
// tools/huelle.py gesetzt - nicht von Hand. Aendert sich eine Datei, aendert
// sich die Version, und der alte Cache wird verworfen statt weitergefuehrt.
// Von Hand hochzaehlen hiess: einmal vergessen, und behobene Fehler erreichen
// niemanden.
const VERSION = '12acb9781f46';
const CACHE = 'docuwunder-huelle-' + VERSION;

// Wie lange auf das Netz gewartet wird, bevor der Cache einspringt. Kurz
// genug, dass ein totes WLAN den Start nicht aufhaelt, lang genug, dass eine
// langsame Mobilverbindung noch die aktuelle Fassung liefert.
const FRIST_MS = 3000;

// Die Huelle. Ohne diese Dateien baut sich die Oberflaeche nicht auf.
//
// Babel steht hier nicht und liegt auch nicht mehr im Projekt: drei Megabyte,
// gebraucht nur von der Design-Vorschau unter design/. Die App selbst fasst es
// nie an, die Vorschau holt es sich bei Bedarf aus dem Netz.
const HUELLE = [
  './',
  './index.html',
  './start.js',
  './basis.css',
  './logik.js',
  './api.js',
  './sperre.js',
  './scan.js',
  './mitglieder.js',
  './erfassen.js',
  './suche.js',
  './vorschau.js',
  './betrieb.js',
  './ordnung.js',
  './stile.js',
  './ui.js',
  './app.js',
  './vorlage.js',
  './vorlage/tabs.js',
  './vorlage/dokument.js',
  './vorlage/ordnung.js',
  './vorlage/verwaltung.js',
  './vorlage/sheets.js',
  './vorlage/erfassen.js',
  './vorlage/onboarding.js',
  './vorlage/sperre.js',
  './manifest.webmanifest',
  './vendor/react.production.min.js',
  './vendor/react-dom.production.min.js',
  './vendor/htm.js',
  './vendor/inter.css',
  './vendor/inter-latin.woff2',
  './vendor/inter-latin-ext.woff2',
  // Manrope traegt nur die Wortmarke; ohne sie faellt die Ueberschrift im
  // Onboarding auf Inter zurueck, was offline sichtbar anders aussaehe.
  './vendor/manrope.css',
  './vendor/manrope-latin.woff2',
  './vendor/manrope-latin-ext.woff2',
  './icons/icon-192.png',
  './icons/apple-touch-icon-180.png',
  // Favicons: der Tab-Titel soll auch offline sein Symbol behalten.
  './favicon.svg',
  './favicon.ico',
  './favicon-16x16.png',
  './favicon-32x32.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Einzeln statt cache.addAll: dort laesst ein einziger Fehlschlag die
    // gesamte Installation scheitern, und dann hat die App gar keinen Cache.
    await Promise.all(HUELLE.map(async (pfad) => {
      try {
        // reload umgeht den HTTP-Cache des Browsers - sonst installiert sich
        // unter Umstaenden genau der Stand, der gerade abgeloest werden soll.
        const res = await fetch(new Request(pfad, { cache: 'reload' }));
        if (res.ok) await cache.put(pfad, res);
        else console.warn('[sw] Huelle unvollstaendig:', pfad, res.status);
      } catch (err) {
        console.warn('[sw] Huelle unvollstaendig:', pfad, err);
      }
    }));
    // Die App holt nach dem Start nichts mehr aus der Huelle nach - alles
    // Weitere sind API-Aufrufe, die dieser Worker nicht anfasst. Ein Wechsel
    // mitten in einer offenen Sitzung kann deshalb keine gemischten Staende
    // erzeugen, und das Warten auf das letzte geschlossene Fenster erspart
    // sich die App.
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const namen = await caches.keys();
    await Promise.all(namen.map((n) => {
      // Auch den Cache unter dem alten Produktnamen aufraeumen.
      if ((n.startsWith('docuwunder-huelle-') || n.startsWith('ablage-huelle-')) && n !== CACHE) return caches.delete(n);
    }));
    await self.clients.claim();
  })());
});

// Der Geltungsbereich des Workers, also .../paperless-app/.
const BEREICH = new URL('./', self.registration.scope).href;

function istHuellenDatei(url) {
  const rest = url.href.slice(BEREICH.length);
  return rest.startsWith('vendor/') || rest.startsWith('icons/');
}

function speicherbar(res) {
  // opaque (type 'opaque') hat weder Status noch Inhalt, den man pruefen
  // koennte; Teilantworten (206) sind als Ganzes wertlos.
  return res && res.ok && res.status === 200 && res.type === 'basic';
}

// Zuerst aus dem Cache, Auffrischung im Hintergrund.
async function cacheZuerst(e, req) {
  const cache = await caches.open(CACHE);
  // ignoreVary: der Server haengt bei aktivierter Kompression ein
  // 'Vary: Accept-Encoding' an die Antwort. Unterscheidet sich der Kopf der
  // Anfrage spaeter auch nur darin, faende der Cache seinen eigenen Eintrag
  // nicht wieder.
  const da = await cache.match(req, { ignoreVary: true });
  const netz = fetch(req).then((res) => {
    if (speicherbar(res)) cache.put(req, res.clone());
    return res;
  });
  if (da) {
    // Ohne waitUntil darf der Browser den Worker beenden, sobald die Antwort
    // draussen ist - die Auffrischung waere dann nie fertig geworden.
    e.waitUntil(netz.catch(() => {}));
    return da;
  }
  return netz;
}

// Zuerst aus dem Netz, nach FRIST_MS aus dem Cache.
async function netzZuerst(e, req) {
  const cache = await caches.open(CACHE);
  const netz = fetch(req).then((res) => {
    if (speicherbar(res)) cache.put(req, res.clone());
    return res;
  });
  e.waitUntil(netz.catch(() => {}));

  const da = await cache.match(req, { ignoreVary: true });
  if (!da) return netz;

  // Antwortet das Netz nicht rechtzeitig oder gar nicht, kommt der Cache zum
  // Zug. Die begonnene Anfrage laeuft weiter und fuellt ihn fuer das naechste Mal.
  let wecker;
  const frist = new Promise((f) => { wecker = setTimeout(() => f(null), FRIST_MS); });
  const res = await Promise.race([netz.catch(() => null), frist]);
  clearTimeout(wecker);
  return res || da;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Teilanfragen (Range) beantwortet der Cache nicht richtig; die entstehen
  // beim Abspielen und beim Blaettern in grossen Dateien.
  if (req.headers.has('range')) return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Alles ausserhalb von .../paperless-app/ - vor allem /paperless/ selbst -
  // bleibt unangetastet. Der Worker sieht diese Anfragen zwar, weil sie aus
  // einer von ihm gesteuerten Seite kommen, geht aber nicht daran.
  if (!url.href.startsWith(BEREICH)) return;

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        return await netzZuerst(e, req);
      } catch (err) {
        // Kein Netz und die angefragte Adresse nicht im Cache: die App hat nur
        // einen Einstiegspunkt, der tut es auch.
        const ersatz = await caches.match('./index.html', { cacheName: CACHE, ignoreVary: true });
        if (ersatz) return ersatz;
        throw err;
      }
    })());
    return;
  }

  e.respondWith(istHuellenDatei(url) ? cacheZuerst(e, req) : netzZuerst(e, req));
});
