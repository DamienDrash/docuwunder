// Die Weboberflaeche in die Huelle uebernehmen.
//
// Bewusst ein Kopierschritt und kein Symlink: Capacitor buendelt die Dateien
// in das native Paket, und ein Symlink waere in den Store-Artefakten nicht
// nachvollziehbar. Kopiert wird nur, was auch ausgeliefert wird - Tests,
// Werkzeuge und Dokumentation gehoeren nicht in eine App.
import { cp, rm, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const wurzel = path.resolve(import.meta.dirname, '..');
const ziel = path.resolve(import.meta.dirname, 'web');
const AUS = new Set(['.git', '.github', 'native', 'tests', 'tools', 'docs', 'assets',
                     'node_modules', 'CLAUDE.md', 'README.md', 'LICENSE', '.gitignore']);

await rm(ziel, { recursive: true, force: true });
await mkdir(ziel, { recursive: true });
let n = 0;
for (const eintrag of await readdir(wurzel, { withFileTypes: true })) {
  if (AUS.has(eintrag.name)) continue;
  await cp(path.join(wurzel, eintrag.name), path.join(ziel, eintrag.name), { recursive: true });
  n++;
}
if (!existsSync(path.join(ziel, 'index.html'))) {
  console.error('index.html fehlt - die Huelle haette keinen Einstiegspunkt.');
  process.exit(1);
}
console.log(`${n} Eintraege uebernommen nach native/web/`);
