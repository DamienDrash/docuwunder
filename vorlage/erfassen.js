// Vorlage: erfassen. Maschinell erzeugt aus der DC-Fassung
// (tools/konvert.py) - Aenderungen gehoeren hierher, nicht in eine
// erneute Uebersetzung.
(function (global) {
  'use strict';
  const V = global.DWVorlage = global.DWVorlage || {};

  V.scanOn = function (v, html, stil) {
    return v.scanOn ? html`<div data-screen-label="Scannen" style=${stil('position:absolute;inset:0;background:#0B0B0D;z-index:80;display:flex;flex-direction:column')}>
  <div style=${stil('display:flex;align-items:center;justify-content:space-between;padding:62px 16px 10px;flex-shrink:0')}>
    <div onClick=${v.scanCancel} style=${stil('width:36px;height:36px;border-radius:50%;background:rgba(120,120,128,0.32);display:flex;align-items:center;justify-content:center;cursor:pointer')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg></div>
    <span style=${stil('font-size:16px;font-weight:600;color:#fff')}>${v.scanStepTitle}</span>
    <div style=${stil('width:36px')}></div>
  </div>
  ${v.scanKam ? html`<div style=${stil('flex:1;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden')}>
      <div style=${stil('width:250px;height:330px;background:#E9E7E2;border-radius:4px;transform:rotate(2.5deg);padding:26px 20px;box-shadow:0 20px 60px rgba(0,0,0,0.5)')}>
        <div style=${stil('height:4px;width:40%;background:rgba(0,0,0,0.22);border-radius:2px')}></div>
        <div style=${stil('margin-top:20px;display:flex;flex-direction:column;gap:6px')}><div style=${stil('height:4px;width:90%;background:rgba(0,0,0,0.14);border-radius:2px')}></div><div style=${stil('height:4px;width:100%;background:rgba(0,0,0,0.14);border-radius:2px')}></div><div style=${stil('height:4px;width:75%;background:rgba(0,0,0,0.14);border-radius:2px')}></div><div style=${stil('height:4px;width:95%;background:rgba(0,0,0,0.14);border-radius:2px')}></div><div style=${stil('height:4px;width:60%;background:rgba(0,0,0,0.14);border-radius:2px')}></div></div>
      </div>
      <div style=${stil('position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(2.5deg);width:274px;height:354px;pointer-events:none')}>
        <div style=${stil('position:absolute;top:0;left:0;width:30px;height:30px;border-top:3px solid #FFD60A;border-left:3px solid #FFD60A;border-radius:4px 0 0 0')}></div>
        <div style=${stil('position:absolute;top:0;right:0;width:30px;height:30px;border-top:3px solid #FFD60A;border-right:3px solid #FFD60A;border-radius:0 4px 0 0')}></div>
        <div style=${stil('position:absolute;bottom:0;left:0;width:30px;height:30px;border-bottom:3px solid #FFD60A;border-left:3px solid #FFD60A;border-radius:0 0 0 4px')}></div>
        <div style=${stil('position:absolute;bottom:0;right:0;width:30px;height:30px;border-bottom:3px solid #FFD60A;border-right:3px solid #FFD60A;border-radius:0 0 4px 0')}></div>
      </div>
      <div style=${stil('position:absolute;bottom:18px;left:50%;transform:translateX(-50%);background:rgba(30,30,32,0.85);backdrop-filter:blur(10px);border-radius:999px;padding:7px 14px;font-size:13px;font-weight:600;color:#FFD60A;white-space:nowrap')}>Dokument erkannt – ruhig halten</div>
    </div>
    <div style=${stil('display:flex;align-items:center;justify-content:space-between;padding:18px 40px 46px;flex-shrink:0')}>
      <div style=${stil('width:46px;height:46px;position:relative')}>
        ${v.scanHasPages ? html`<div onClick=${v.toSeiten} style=${stil('width:44px;height:56px;border-radius:6px;background:#E9E7E2;border:2px solid #fff;cursor:pointer;position:absolute;bottom:0')}></div>
          <div style=${stil('position:absolute;top:-6px;right:-8px;min-width:20px;height:20px;border-radius:10px;background:var(--acc);color:var(--onAcc);font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 5px;z-index:2')}>${v.scanCount}</div>` : null}
      </div>
      <div onClick=${v.shutter} style=${stil('width:70px;height:70px;border-radius:50%;border:4px solid #fff;display:flex;align-items:center;justify-content:center;cursor:pointer')}><div style=${stil('width:56px;height:56px;border-radius:50%;background:#fff')}></div></div>
      <div onClick=${v.toSeiten} style=${stil('width:60px;text-align:right')}>${v.scanHasPages ? html`<span style=${stil('font-size:16px;font-weight:600;color:#FFD60A;cursor:pointer')}>Fertig</span>` : null}</div>
    </div>` : null}
  ${v.scanSeiten ? html`<div style=${stil('flex:1;overflow-y:auto;padding:16px 20px')}>
      <div style=${stil('display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px')}>
        ${(v.scanPagesArr || []).map((pg, pgIdx) => html`<div key=${pg && pg.id != null ? pg.id : pgIdx} style=${stil('position:relative')}>
            <div style=${stil('aspect-ratio:3/4;background:#E9E7E2;border-radius:6px;padding:12px 10px')}><div style=${stil('height:3px;width:50%;background:rgba(0,0,0,0.2);border-radius:2px')}></div><div style=${stil('margin-top:10px;display:flex;flex-direction:column;gap:4px')}><div style=${stil('height:3px;width:90%;background:rgba(0,0,0,0.12);border-radius:2px')}></div><div style=${stil('height:3px;width:75%;background:rgba(0,0,0,0.12);border-radius:2px')}></div><div style=${stil('height:3px;width:85%;background:rgba(0,0,0,0.12);border-radius:2px')}></div></div></div>
            <div style=${stil('position:absolute;bottom:6px;left:6px;background:rgba(0,0,0,0.55);border-radius:6px;padding:2px 7px;font-size:11px;font-weight:600;color:#fff')}>${pg.nr}</div>
            <div onClick=${pg.del} style=${stil('position:absolute;top:-7px;right:-7px;width:22px;height:22px;border-radius:50%;background:rgba(60,60,64,0.95);display:flex;align-items:center;justify-content:center;cursor:pointer')}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg></div>
          </div>`)}
        <div onClick=${v.addPage} style=${stil('aspect-ratio:3/4;border:1.5px dashed rgba(255,255,255,0.35);border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;cursor:pointer')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg>
          <span style=${stil('font-size:11.5px;color:rgba(255,255,255,0.7)')}>Seite</span>
        </div>
      </div>
      <div style=${stil('font-size:13px;color:rgba(235,235,245,0.5);text-align:center;margin-top:16px;line-height:1.5')}>Halte eine Seite gedrückt, um sie neu anzuordnen.<br />Zuschneiden und Drehen öffnen sich beim Antippen.</div>
    </div>
    <div style=${stil('padding:0 20px 46px;flex-shrink:0')}>
      <div onClick=${v.toMeta} style=${stil('height:50px;border-radius:14px;background:var(--acc);color:var(--onAcc);display:flex;align-items:center;justify-content:center;font-size:16.5px;font-weight:600;cursor:pointer')}>Weiter</div>
    </div>` : null}
  ${v.scanMeta ? html`<div style=${stil('flex:1;overflow-y:auto;padding:16px 20px')}>
      <div style=${stil('background:#1C1C1E;border-radius:16px;padding:16px')}>
        <div style=${stil('font-size:12.5px;font-weight:600;color:rgba(235,235,245,0.6);text-transform:uppercase;letter-spacing:0.3px')}>Titel</div>
        <input value=${v.scanTitleVal} onInput=${v.setScanTitle} placeholder="Scan vom 30. Juli 2026" style=${stil('width:100%;height:46px;border-radius:12px;border:1px solid rgba(84,84,88,0.65);background:#2C2C2E;padding:0 13px;font-size:16px;color:#fff;outline:none;margin-top:7px')} style-focus="border-color:var(--acc)" />
        <div style=${stil('font-size:13px;color:rgba(235,235,245,0.45);margin-top:12px;line-height:1.5')}>Absender, Dokumentart und Schlagwörter schlägt dein Server nach der Texterkennung automatisch vor. Du prüfst sie im Posteingang.</div>
      </div>
      <div style=${stil('display:flex;align-items:center;gap:10px;background:#1C1C1E;border-radius:16px;padding:13px 16px;margin-top:10px')}>
        <span style=${stil('font-size:14.5px;color:rgba(235,235,245,0.85);flex:1')}>${v.scanPagesLabel}</span>
        <span onClick=${v.backToSeiten} style=${stil('font-size:14px;font-weight:600;color:var(--acc);cursor:pointer')}>Ändern</span>
      </div>
    </div>
    <div style=${stil('padding:0 20px 46px;flex-shrink:0')}>
      <div onClick=${v.doUpload} style=${stil('height:50px;border-radius:14px;background:var(--acc);color:var(--onAcc);display:flex;align-items:center;justify-content:center;font-size:16.5px;font-weight:600;cursor:pointer')}>Hochladen</div>
    </div>` : null}
  ${v.scanUp ? html`<div style=${stil('flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 44px')}>
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" stroke-width="2" stroke-linecap="round" style=${stil('animation:spin 1s linear infinite')}><path d="M12 3a9 9 0 109 9"></path></svg>
      <div style=${stil('font-size:17px;font-weight:600;color:#fff;margin-top:16px')}>Wird hochgeladen …</div>
      <div style=${stil('font-size:13.5px;color:rgba(235,235,245,0.55);margin-top:8px;text-align:center;line-height:1.5')}>Du kannst die App weiter verwenden. Der Upload läuft im Hintergrund weiter, die Texterkennung übernimmt dein Server.</div>
    </div>` : null}
</div>` : null;
  };

  V.toastOn = function (v, html, stil) {
    return v.toastOn ? html`<div style=${stil('position:absolute;left:50%;transform:translateX(-50%);bottom:100px;z-index:90;background:rgba(28,28,32,0.94);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-radius:14px;padding:12px 16px;display:flex;align-items:center;gap:14px;box-shadow:0 8px 24px rgba(0,0,0,0.3);animation:toastIn .3s ease;max-width:86%')}>
  <span style=${stil('font-size:14px;font-weight:500;color:#fff;line-height:1.35')}>${v.toastMsg}</span>
  ${v.undoOn ? html`<span onClick=${v.doUndo} style=${stil('font-size:14px;font-weight:700;color:#6CB8FF;cursor:pointer;flex-shrink:0')}>${v.undoLabel}</span>` : null}
</div>` : null;
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);