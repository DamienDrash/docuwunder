// Vorlage: erfassen.
//
// Der Scan-Bildschirm. Drei Schritte: Seiten sammeln, Titel vergeben,
// hochladen - dazwischen bei Bedarf das Zuschneiden einer einzelnen Seite.
//
// Die Aufnahme selbst macht das System (siehe scanAufnehmen in app.js). Eine
// eigene Kameravorschau gab es hier frueher als Zeichnung, mitsamt der Meldung
// "Dokument erkannt - ruhig halten". Erkannt wurde nie etwas: es gab keine
// Kamera, nur gemaltes Papier. Was das System liefert, kann es ohnehin besser -
// Autofokus, Belichtung, Blitz, und auf dem Rechner den Dateidialog.
(function (global) {
  'use strict';
  const V = global.DWVorlage = global.DWVorlage || {};
  const S = global.DWStile;

  const KNOPF = 'height:50px;border-radius:14px;background:var(--acc);color:var(--onAcc);'
              + 'display:flex;align-items:center;justify-content:center;font-size:16.5px;'
              + 'font-weight:600;cursor:pointer';
  // Rundes Werkzeugsymbol auf einer Seitenkachel.
  const WERKZEUG = 'width:30px;height:30px;border-radius:50%;background:rgba(60,60,64,0.92);'
                 + 'display:flex;align-items:center;justify-content:center;cursor:pointer';

  V.scanOn = function (v, html, stil) {
    if (!v.scanOn) return null;
    return html`<div data-screen-label="Scannen" style=${stil('position:absolute;inset:0;background:#0B0B0D;z-index:80;display:flex;flex-direction:column')}>
  <div style=${stil('display:flex;align-items:center;justify-content:space-between;padding:62px 16px 10px;flex-shrink:0')}>
  <button type="button" aria-label="Abbrechen" onClick=${v.scanCancel} style=${stil(S.buttonReset + 'width:36px;height:36px;border-radius:50%;background:rgba(120,120,128,0.32);display:flex;align-items:center;justify-content:center;cursor:pointer')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg></button>
  <span style=${stil('font-size:16px;font-weight:600;color:#fff')}>${v.scanStepTitle}</span>
  <div style=${stil('width:36px')}></div>
  </div>

  ${v.scanKameraOn ? html`<div data-kamera-vorschau="1" style=${stil('flex:1;position:relative;overflow:hidden;background:#000')}>
      <video autoPlay playsInline muted ref=${(el) => { if (el) { if (el.srcObject !== v.scanKameraStream) { try { el.srcObject = v.scanKameraStream; } catch (e) { /* kein echter MediaStream (z.B. Testumgebung) - Vorschau bleibt leer, Ausloeser bleibt bedienbar */ } } v.onScanKameraBereit(el); } }} style=${stil('width:100%;height:100%;object-fit:cover;display:block')}></video>
      <div style=${stil('position:absolute;left:0;right:0;bottom:38px;display:flex;align-items:center;justify-content:center;gap:28px')}>
        <button type="button" aria-label="Aus Dateien wählen" title="Aus Dateien wählen" onClick=${v.scanKameraZuDatei} style=${stil(S.buttonReset + 'width:46px;height:46px;border-radius:50%;background:rgba(120,120,128,0.32);display:flex;align-items:center;justify-content:center;cursor:pointer')}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="M21 15l-5-5L5 21"></path></svg></button>
        <button type="button" aria-label="Foto aufnehmen" onClick=${v.scanKameraSchiessen} style=${stil(S.buttonReset + 'width:72px;height:72px;border-radius:50%;background:#fff;border:4px solid rgba(255,255,255,0.35);cursor:pointer')}></button>
        <div style=${stil('width:46px;height:46px')}></div>
      </div>
    </div>` : null}

  ${v.scanSeiten && !v.scanKameraOn ? html`<div style=${stil('flex:1;overflow-y:auto;padding:16px 20px;width:100%;max-width:840px;margin:0 auto')}>
      ${v.scanHasPages ? html`<div role="group" aria-label="Bildmodus" style=${stil('display:flex;gap:8px;margin-bottom:14px')}>
        ${[['original', 'Original'], ['grau', 'Graustufe']].map((m) => html`<button key=${m[0]} type="button" aria-pressed=${v.scanModus === m[0]} onClick=${() => v.scanModusSetzen(m[0])} style=${stil(S.buttonReset + 'flex:1;height:38px;border-radius:10px;font-size:13.5px;font-weight:600;cursor:pointer;' + (v.scanModus === m[0] ? 'background:var(--acc);color:var(--onAcc)' : 'background:rgba(120,120,128,0.24);color:#fff'))}>${m[1]}</button>`)}
      </div>` : null}
      ${v.scanHasPages ? html`<div style=${stil('display:flex;flex-direction:column;gap:10px;margin-bottom:14px')}>
        <label style=${stil('display:flex;align-items:center;gap:10px;font-size:12.5px;color:rgba(235,235,245,0.7)')}>
          <span style=${stil('width:64px;flex-shrink:0')}>Kontrast</span>
          <input type="range" min="0.5" max="2" step="0.05" value=${v.scanKontrast} onChange=${(e) => v.scanKontrastSetzen(parseFloat(e.target.value))} aria-label="Kontrast" style=${stil('flex:1')} />
          <span style=${stil('width:34px;text-align:right;flex-shrink:0;font-variant-numeric:tabular-nums')}>${Math.round(v.scanKontrast * 100)}%</span>
        </label>
        <label style=${stil('display:flex;align-items:center;gap:10px;font-size:12.5px;color:rgba(235,235,245,0.7)')}>
          <span style=${stil('width:64px;flex-shrink:0')}>Helligkeit</span>
          <input type="range" min="-80" max="80" step="4" value=${v.scanHelligkeit} onChange=${(e) => v.scanHelligkeitSetzen(parseInt(e.target.value, 10))} aria-label="Helligkeit" style=${stil('flex:1')} />
          <span style=${stil('width:34px;text-align:right;flex-shrink:0;font-variant-numeric:tabular-nums')}>${v.scanHelligkeit > 0 ? '+' : ''}${v.scanHelligkeit}</span>
        </label>
      </div>` : null}
      ${v.scanLeer ? html`<div style=${stil('text-align:center;padding:50px 20px 30px;font-size:14.5px;color:rgba(235,235,245,0.55);line-height:1.6')}>Noch keine Seite aufgenommen.</div>` : null}
      ${''/* auto-fill statt drei fester Spalten: auf dem Telefon ergibt das
           dieselben drei, auf einem breiten Fenster mehr - statt drei
           Kacheln von einem halben Meter. */}
      <div style=${stil('display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:12px;align-items:start')}>
        ${(v.scanPagesArr || []).map((pg) => html`<div key=${pg.id} data-seite=${pg.nr} style=${stil('position:relative')}>
            <img src=${pg.url} alt=${'Seite ' + pg.nr} style=${stil('width:100%;aspect-ratio:3/4;object-fit:cover;background:#E9E7E2;border-radius:6px;display:block' + (pg.busy ? ';opacity:0.4' : ''))} />
            <div style=${stil('position:absolute;bottom:6px;left:6px;background:rgba(0,0,0,0.55);border-radius:6px;padding:2px 7px;font-size:11px;font-weight:600;color:#fff;pointer-events:none')}>${pg.nr}</div>
            <div style=${stil('position:absolute;bottom:5px;right:5px;display:flex;gap:5px')}>
              <button type="button" aria-label="Zuschneiden" title="Zuschneiden" onClick=${pg.crop} style=${stil(S.buttonReset + WERKZEUG)}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 2v15.5H22"></path><path d="M2 6.5h15.5V22"></path></svg></button>
              <button type="button" aria-label="Drehen" title="Drehen" onClick=${pg.dreh} style=${stil(S.buttonReset + WERKZEUG)}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 10-2.3 5.7"></path><path d="M20 4v7h-7"></path></svg></button>
            </div>
            <div style=${stil('position:absolute;top:5px;left:5px;display:flex;gap:5px')}>
              ${pg.hoch ? html`<button type="button" aria-label="Nach vorn" title="Nach vorn" onClick=${pg.hoch} style=${stil(S.buttonReset + WERKZEUG)}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"></path></svg></button>` : null}
              ${pg.runter ? html`<button type="button" aria-label="Nach hinten" title="Nach hinten" onClick=${pg.runter} style=${stil(S.buttonReset + WERKZEUG)}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"></path></svg></button>` : null}
            </div>
            <button type="button" aria-label="Entfernen" title="Entfernen" onClick=${pg.del} style=${stil(S.buttonReset + 'position:absolute;top:-7px;right:-7px;width:22px;height:22px;border-radius:50%;background:rgba(60,60,64,0.95);display:flex;align-items:center;justify-content:center;cursor:pointer')}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg></button>
          </div>`)}
        <button type="button" aria-label="Seite hinzufügen" onClick=${v.addPage} data-neue-seite="1" style=${stil(S.buttonReset + 'aspect-ratio:3/4;border:1.5px dashed rgba(255,255,255,0.35);border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;cursor:pointer')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg>
          <span style=${stil('font-size:11.5px;color:rgba(255,255,255,0.7)')}>Seite</span>
        </button>
      </div>
      ${v.scanBusy ? html`<div style=${stil('text-align:center;font-size:13px;color:rgba(235,235,245,0.6);margin-top:16px')}>Aufnahme wird verarbeitet …</div>` : null}
      ${v.scanHasPages ? html`<div style=${stil('font-size:13px;color:rgba(235,235,245,0.5);text-align:center;margin-top:16px;line-height:1.5')}>Die Pfeile ordnen die Seiten, die Symbole unten schneiden zu und drehen.</div>` : null}
    </div>
    <div style=${stil('padding:0 20px 46px;flex-shrink:0;width:100%;max-width:840px;margin:0 auto')}>
      <button type="button" onClick=${v.scanHasPages ? v.toMeta : v.addPage} style=${stil(S.buttonReset + KNOPF + (v.scanHasPages ? '' : ';opacity:0.55'))}>${v.scanHasPages ? 'Weiter' : 'Seite aufnehmen'}</button>
    </div>` : null}

  ${v.scanZuschnitt ? html`<div style=${stil('flex:1;display:flex;align-items:center;justify-content:center;padding:12px 20px;overflow:hidden')}>
      <div onPointerMove=${v.zZiehen} onPointerUp=${v.zLoslassen} onPointerCancel=${v.zLoslassen} style=${stil('position:relative;max-width:100%;max-height:100%;touch-action:none')}>
        <img src=${v.zUrl} alt="Seite zuschneiden" style=${stil('display:block;max-width:100%;max-height:62vh;user-select:none;-webkit-user-drag:none')} />
        <div aria-live="polite" data-zuschnitt-status="1" style=${stil('position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0')}>${v.zStatus}</div>
        ${''/* Die Aussparung entsteht durch einen sehr grossen Schlagschatten
             nach aussen: alles ausserhalb des Rahmens wird abgedunkelt, ohne
             dass vier einzelne Flaechen berechnet werden muessen. */}
        <div style=${stil(`position:absolute;left:${v.zRect.x0 * 100}%;top:${v.zRect.y0 * 100}%;width:${(v.zRect.x1 - v.zRect.x0) * 100}%;height:${(v.zRect.y1 - v.zRect.y0) * 100}%;border:2px solid #FFD60A;box-shadow:0 0 0 9999px rgba(0,0,0,0.55);pointer-events:none`)}></div>
        ${[['lo', v.zRect.x0, v.zRect.y0, 'Ecke links oben'], ['ro', v.zRect.x1, v.zRect.y0, 'Ecke rechts oben'], ['lu', v.zRect.x0, v.zRect.y1, 'Ecke links unten'], ['ru', v.zRect.x1, v.zRect.y1, 'Ecke rechts unten']].map((g) => html`<button key=${g[0]} type="button" aria-label=${'Zuschnitt ' + g[3] + ' verschieben. Pfeiltasten bewegen die Ecke, Umschalt plus Pfeiltaste bewegt groesser.'} title=${'Zuschnitt ' + g[3]} data-griff=${g[0]} onPointerDown=${v.zGriffFassen(g[0])} onKeyDown=${v.zGriffTaste(g[0])} style=${stil(S.buttonReset + `position:absolute;left:${g[1] * 100}%;top:${g[2] * 100}%;width:32px;height:32px;margin:-16px 0 0 -16px;border-radius:50%;background:#FFD60A;opacity:0.92;cursor:grab;touch-action:none;outline:2px solid transparent;outline-offset:3px`)}></button>`)}
      </div>
    </div>
    <div style=${stil('display:flex;gap:10px;padding:0 20px 46px;flex-shrink:0;width:100%;max-width:840px;margin:0 auto')}>
      <button type="button" onClick=${v.zAbbrechen} style=${stil(S.buttonReset + 'flex:1 1 0;min-width:0;height:50px;border-radius:14px;background:rgba(120,120,128,0.28);color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600;cursor:pointer')}>Abbrechen</button>
      <button type="button" onClick=${v.zZuruecksetzen} style=${stil(S.buttonReset + 'flex:0 0 auto;padding:0 18px;height:50px;border-radius:14px;background:rgba(120,120,128,0.28);color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600;cursor:pointer')}>Ganz</button>
      <button type="button" onClick=${v.zSichern} style=${stil(S.buttonReset + 'flex:1.3 1 0;min-width:0;white-space:nowrap;' + KNOPF)}>Übernehmen</button>
    </div>` : null}

  ${v.scanMeta ? html`<div style=${stil('flex:1;overflow-y:auto;padding:16px 20px;width:100%;max-width:840px;margin:0 auto')}>
      <div style=${stil('background:#1C1C1E;border-radius:16px;padding:16px')}>
        <div style=${stil('font-size:12.5px;font-weight:600;color:rgba(235,235,245,0.6);text-transform:uppercase;letter-spacing:0.3px')}>Titel</div>
        <input value=${v.scanTitleVal} onInput=${v.setScanTitle} placeholder=${v.scanTitlePlatz} style=${stil('width:100%;height:46px;border-radius:12px;border:1px solid rgba(84,84,88,0.65);background:#2C2C2E;padding:0 13px;font-size:16px;color:#fff;outline:none;margin-top:7px')} />
        <div style=${stil('font-size:13px;color:rgba(235,235,245,0.45);margin-top:12px;line-height:1.5')}>Absender, Dokumentart und Schlagwörter schlägt dein Server nach der Texterkennung automatisch vor. Du prüfst sie im Posteingang.</div>
      </div>
      <div style=${stil('display:flex;align-items:center;gap:10px;background:#1C1C1E;border-radius:16px;padding:13px 16px;margin-top:10px')}>
        <span style=${stil('font-size:14.5px;color:rgba(235,235,245,0.85);flex:1')}>${v.scanPagesLabel}</span>
        <button type="button" onClick=${v.backToSeiten} style=${stil(S.buttonReset + 'font-size:14px;font-weight:600;color:var(--acc);cursor:pointer')}>Ändern</button>
      </div>
    </div>
    <div style=${stil('padding:0 20px 46px;flex-shrink:0;width:100%;max-width:840px;margin:0 auto')}>
      <button type="button" onClick=${v.doUpload} style=${stil(S.buttonReset + KNOPF)}>Hochladen</button>
    </div>` : null}

  ${v.scanUp ? html`<div style=${stil('flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 44px')}>
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" stroke-width="2" stroke-linecap="round" style=${stil('animation:spin 1s linear infinite')}><path d="M12 3a9 9 0 109 9"></path></svg>
      <div style=${stil('font-size:17px;font-weight:600;color:#fff;margin-top:16px')}>Wird hochgeladen …</div>
      <div style=${stil('font-size:13.5px;color:rgba(235,235,245,0.55);margin-top:8px;text-align:center;line-height:1.5')}>Du kannst die App weiter verwenden. Der Upload läuft im Hintergrund weiter, die Texterkennung übernimmt dein Server.</div>
    </div>` : null}
</div>`;
  };

  V.toastOn = function (v, html, stil) {
    return v.toastOn ? html`<div style=${stil('position:absolute;left:50%;transform:translateX(-50%);bottom:100px;z-index:90;background:rgba(28,28,32,0.94);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-radius:14px;padding:12px 16px;display:flex;align-items:center;gap:14px;box-shadow:0 8px 24px rgba(0,0,0,0.3);animation:toastIn .3s ease;max-width:86%')}>
  <span style=${stil('font-size:14px;font-weight:500;color:#fff;line-height:1.35')}>${v.toastMsg}</span>
  ${v.undoOn ? html`<button type="button" aria-label=${v.undoLabel} onClick=${v.doUndo} style=${stil(S.buttonReset + 'font-size:14px;font-weight:700;color:#6CB8FF;cursor:pointer;flex-shrink:0;padding:2px 0')}>${v.undoLabel}</button>` : null}
</div>` : null;
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
