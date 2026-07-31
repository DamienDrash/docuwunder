// Vorlage: dokument. Maschinell erzeugt aus der DC-Fassung
// (tools/konvert.py) - Aenderungen gehoeren hierher, nicht in eine
// erneute Uebersetzung.
(function (global) {
  'use strict';
  const V = global.DWVorlage = global.DWVorlage || {};

  V.docPaneEmpty = function (v, html, stil) {
    return v.docPaneEmpty ? html`<div data-screen-label="Kein Dokument gewählt" style=${stil(`${v.paneR}background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;z-index:10`)}>
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--lab3)" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3.5h6.5L18 8v12.5H7z"></path><path d="M13.5 3.5V8H18"></path><path d="M10 13h5M10 16.5h5"></path></svg>
  <div style=${stil('font-size:15px;color:var(--lab2)')}>Kein Dokument ausgewählt</div>
</div>` : null;
  };

  V.showDoc = function (v, html, stil) {
    return v.showDoc ? html`<div data-screen-label="Dokument-Detail" style=${stil(`${v.paneR}background:var(--bg);${v.paneAnim}z-index:40`)}>
  <div style=${stil('position:absolute;inset:0;overflow-y:auto;padding:110px 0 120px')}>
    <div style=${stil('display:flex;background:var(--fill);border-radius:10px;margin:0 16px;padding:2px')}>
      <div onClick=${v.setSegV} style=${stil(v.sgV)}>Vorschau</div>
      <div onClick=${v.setSegT} style=${stil(v.sgT)}>Text</div>
      <div onClick=${v.setSegI} style=${stil(v.sgI)}>Info</div>
    </div>
    ${v.dSegV ? html`${v.dFundOn ? html`<div style=${stil('margin:12px 16px 0;background:var(--accT);border-radius:10px;padding:9px 12px;display:flex;align-items:center;gap:8px')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><path d="M16.8 16.8L21 21"></path></svg>
          <span style=${stil('font-size:13px;font-weight:600;color:var(--acc)')}>${v.dFundLabel}</span>
        </div>` : null}
      ${v.dPrevOn ? html`<div onClick=${v.dOpenFile} style=${stil('margin:14px 26px 0;background:var(--pg);border:0.5px solid var(--sep);border-radius:6px;box-shadow:0 10px 26px rgba(0,0,0,0.10);overflow:hidden;cursor:pointer')}>
          <img src=${v.dPrevUrl} alt=${`Vorschau von ${v.dTitel}`} style=${stil('display:block;width:100%;height:auto')} />
        </div>
        <div style=${stil('text-align:center;font-size:12.5px;color:var(--lab3);padding:10px 0 0')}>${v.dSeitenLabel} · Tippen zum Öffnen</div>` : null}
      ${v.dPrevOff ? html`<div style=${stil('margin:14px 26px 0;background:var(--pg);border:0.5px solid var(--sep);border-radius:6px;box-shadow:0 10px 26px rgba(0,0,0,0.10);padding:26px 22px;min-height:420px')}>
        <div style=${stil('font-size:11.5px;font-weight:700;letter-spacing:0.2px')}>${v.dAbsHead}</div>
        <div style=${stil('height:3.5px;width:32%;background:var(--pgl);border-radius:2px;margin-top:7px')}></div>
        <div style=${stil('margin-top:24px;display:flex;flex-direction:column;gap:4.5px')}><div style=${stil('height:3.5px;width:36%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:3.5px;width:28%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:3.5px;width:32%;background:var(--pgl);border-radius:2px')}></div></div>
        <div style=${stil('font-size:13px;font-weight:700;margin-top:26px;line-height:1.35')}>${v.dBetreff}</div>
        <div style=${stil('margin-top:12px;display:flex;flex-direction:column;gap:5px')}><div style=${stil('height:3.5px;width:96%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:3.5px;width:100%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:3.5px;width:88%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:3.5px;width:94%;background:var(--pgl);border-radius:2px')}></div></div>
        ${v.dFundOn ? html`<div style=${stil('margin-top:12px;font-size:10.5px;line-height:1.6;color:var(--lab2)')}>${v.dOcrPre}<mark style=${stil('background:var(--mark);padding:1px 3px;border-radius:3px;color:var(--lab)')}>${v.dOcrHit}</mark>${v.dOcrPost}</div>` : null}
        <div style=${stil('margin-top:12px;display:flex;flex-direction:column;gap:5px')}><div style=${stil('height:3.5px;width:92%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:3.5px;width:97%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:3.5px;width:60%;background:var(--pgl);border-radius:2px')}></div></div>
        <div style=${stil('margin-top:28px;height:3.5px;width:30%;background:var(--pgl);border-radius:2px')}></div>
      </div>
      <div style=${stil('text-align:center;font-size:12.5px;color:var(--lab3);padding:10px 0 0')}>
        ${v.dPrevBusy ? html`Vorschau wird geladen …` : null}
        ${v.dPrevErrOn ? html`${v.dPrevErr}` : null}
      </div>
      <div style=${stil('text-align:center;font-size:12.5px;color:var(--lab3);padding:4px 0 0')}>${v.dSeitenLabel}</div>` : null}` : null}
    ${v.dSegT ? html`<div style=${stil('margin:14px 16px 0;background:var(--card);border-radius:16px;padding:16px')}>
        <div style=${stil('font-size:12px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px')}>Erkannter Text</div>
        ${v.dOcrHasHit ? html`<div style=${stil('font-size:14.5px;line-height:1.65;margin-top:10px')}>${v.dOcrPre}<mark style=${stil('background:var(--mark);padding:1px 3px;border-radius:3px;color:var(--lab)')}>${v.dOcrHit}</mark>${v.dOcrPost}</div>` : null}
        ${v.dOcrPlainOn ? html`<div style=${stil('font-size:14.5px;line-height:1.65;margin-top:10px')}>${v.dOcr}</div>` : null}
        <div style=${stil('font-size:12px;color:var(--lab3);margin-top:14px;line-height:1.5')}>Automatisch per Texterkennung erstellt. Das Original bleibt unverändert.</div>
      </div>` : null}
    ${v.dSegI ? html`<div style=${stil('background:var(--card);border-radius:16px;margin:14px 16px 0;overflow:hidden')}>
        <div onClick=${v.openEdit} style=${stil('display:flex;justify-content:space-between;align-items:center;padding:11px 16px;cursor:pointer;position:relative')}><span style=${stil('font-size:15px;color:var(--lab2)')}>Absender</span><span style=${stil('font-size:15px;font-weight:500')}>${v.dAbs}</span><div style=${stil('position:absolute;left:16px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div></div>
        <div onClick=${v.openEdit} style=${stil('display:flex;justify-content:space-between;align-items:center;padding:11px 16px;cursor:pointer;position:relative')}><span style=${stil('font-size:15px;color:var(--lab2)')}>Dokumentart</span><span style=${stil('font-size:15px;font-weight:500')}>${v.dArt}</span><div style=${stil('position:absolute;left:16px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div></div>
        <div style=${stil('display:flex;justify-content:space-between;align-items:center;padding:11px 16px;position:relative')}><span style=${stil('font-size:15px;color:var(--lab2)')}>Ausgestellt am</span><span style=${stil('font-size:15px;font-weight:500')}>${v.dDatum}</span><div style=${stil('position:absolute;left:16px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div></div>
        <div style=${stil('display:flex;justify-content:space-between;align-items:center;padding:11px 16px;position:relative')}><span style=${stil('font-size:15px;color:var(--lab2)')}>Hinzugefügt</span><span style=${stil('font-size:15px;font-weight:500')}>${v.dHinzu}</span><div style=${stil('position:absolute;left:16px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div></div>
        <div style=${stil('display:flex;justify-content:space-between;align-items:center;padding:11px 16px;position:relative')}><span style=${stil('font-size:15px;color:var(--lab2)')}>Ablageort</span><span style=${stil('font-size:15px;font-weight:500')}>${v.dOrt}</span><div style=${stil('position:absolute;left:16px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div></div>
        <div style=${stil('display:flex;justify-content:space-between;align-items:center;padding:11px 16px')}><span style=${stil('font-size:15px;color:var(--lab2)')}>Archivnummer</span><span style=${stil('font-size:15px;font-weight:500')}>${v.dAsn}</span></div>
      </div>
      <div style=${stil('background:var(--card);border-radius:16px;margin:12px 16px 0;padding:12px 16px')}>
        <div style=${stil('font-size:13px;color:var(--lab2)')}>Schlagwörter</div>
        <div style=${stil('display:flex;gap:6px;flex-wrap:wrap;margin-top:8px')}>
          ${(v.dTags || []).map((t, tIdx) => html`<span key=${t && t.id != null ? t.id : tIdx} style=${stil('font-size:12.5px;font-weight:500;background:var(--fill);padding:5px 11px;border-radius:8px')}>${t.n}</span>`)}
          <span onClick=${v.openEdit} style=${stil('font-size:12.5px;font-weight:600;color:var(--acc);background:var(--accT);padding:5px 11px;border-radius:8px;cursor:pointer')}>Ändern</span>
        </div>
      </div>
      <div style=${stil('background:var(--card);border-radius:16px;margin:12px 16px 0;overflow:hidden')}>
        <div onClick=${v.dmDownload} style=${stil('display:flex;align-items:center;gap:10px;padding:12px 16px;cursor:pointer;position:relative')}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5v11"></path><path d="M8.2 10.7l3.8 3.8 3.8-3.8"></path><path d="M5 20.5h14"></path></svg><span style=${stil('font-size:15.5px;color:var(--acc)')}>Original herunterladen</span><div style=${stil('position:absolute;left:43px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div></div>
        <div onClick=${v.dmPrint} style=${stil('display:flex;align-items:center;gap:10px;padding:12px 16px;cursor:pointer')}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 8V3.5h10V8"></path><rect x="4" y="8" width="16" height="8" rx="1.5"></rect><path d="M7 13.5h10v7H7z"></path></svg><span style=${stil('font-size:15.5px;color:var(--acc)')}>Drucken</span></div>
      </div>` : null}
  </div>
  <div style=${stil('position:absolute;top:0;left:0;right:0;z-index:6;display:flex;align-items:center;gap:10px;padding:60px 16px 8px;background:linear-gradient(var(--bg) 55%,transparent)')}>
    <div onClick=${v.popPush} style=${stil('width:36px;height:36px;border-radius:50%;background:var(--glass);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:0.5px solid var(--gbor);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0')}><svg width="10" height="17" viewBox="0 0 10 17" fill="none" stroke="var(--acc)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 1.5L1.5 8.5l7 7"></path></svg></div>
    <div style=${stil('flex:1;text-align:center;font-size:15.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0')}>${v.dTitel}</div>
    <div onClick=${v.openShare} style=${stil('width:36px;height:36px;border-radius:50%;background:var(--glass);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:0.5px solid var(--gbor);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0')}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 14.5V3.5"></path><path d="M8.2 7L12 3.3 15.8 7"></path><path d="M6.5 11H5v9.5h14V11h-1.5"></path></svg></div>
    <div onClick=${v.openDocMenu} style=${stil('width:36px;height:36px;border-radius:50%;background:var(--glass);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:0.5px solid var(--gbor);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0')}><svg width="16" height="16" viewBox="0 0 24 24" fill="var(--acc)" stroke="none"><circle cx="5" cy="12" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="19" cy="12" r="2"></circle></svg></div>
  </div>
  <div style=${stil(`position:absolute;${v.barPosDoc}bottom:24px;height:60px;border-radius:999px;background:var(--glass);backdrop-filter:blur(18px) saturate(180%);-webkit-backdrop-filter:blur(18px) saturate(180%);border:0.5px solid var(--gbor);box-shadow:0 8px 28px rgba(0,0,0,0.14);display:flex;z-index:30`)}>
    <div onClick=${v.dToggleFav} style=${stil('flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;color:var(--acc)')}>
      ${v.dFav ? html`<svg width="20" height="20" viewBox="0 0 24 24" fill="#F7B500" stroke="none"><path d="M12 3.6l2.5 5.2 5.7.7-4.2 3.9 1.1 5.6-5.1-2.8-5.1 2.8 1.1-5.6-4.2-3.9 5.7-.7z"></path></svg>` : null}
      ${v.dNoFav ? html`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.6l2.5 5.2 5.7.7-4.2 3.9 1.1 5.6-5.1-2.8-5.1 2.8 1.1-5.6-4.2-3.9 5.7-.7z"></path></svg>` : null}
      <span style=${stil('font-size:10px;font-weight:600')}>Favorit</span>
    </div>
    <div onClick=${v.openEdit} style=${stil('flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;color:var(--acc)')}>
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1.2-4.2L16.7 4.3a2.05 2.05 0 012.9 2.9L8.2 18.7z"></path></svg>
      <span style=${stil('font-size:10px;font-weight:600')}>Bearbeiten</span>
    </div>
    <div onClick=${v.openShare} style=${stil('flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;color:var(--acc)')}>
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 14.5V3.5"></path><path d="M8.2 7L12 3.3 15.8 7"></path><path d="M6.5 11H5v9.5h14V11h-1.5"></path></svg>
      <span style=${stil('font-size:10px;font-weight:600')}>Teilen</span>
    </div>
    <div onClick=${v.dmTrash} style=${stil('flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;color:var(--red)')}>
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 6.5h15"></path><path d="M8.5 6.2V4.5h7v1.7"></path><path d="M6.5 6.5l1 14h9l1-14"></path></svg>
      <span style=${stil('font-size:10px;font-weight:600')}>Löschen</span>
    </div>
  </div>
</div>` : null;
  };

  V.showRev = function (v, html, stil) {
    return v.showRev ? html`<div data-screen-label="Posteingang prüfen" style=${stil(`${v.paneL}background:var(--bg);${v.paneAnim}z-index:40`)}>
  <div style=${stil('position:absolute;inset:0;overflow-y:auto;padding:110px 0 130px')}>
    <div style=${stil('margin:0 26px;background:var(--pg);border:0.5px solid var(--sep);border-radius:6px;box-shadow:0 8px 22px rgba(0,0,0,0.09);padding:20px 18px;height:180px;overflow:hidden')}>
      <div style=${stil('font-size:11px;font-weight:700')}>${v.revTitel}</div>
      <div style=${stil('margin-top:14px;display:flex;flex-direction:column;gap:5px')}><div style=${stil('height:3.5px;width:90%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:3.5px;width:100%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:3.5px;width:84%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:3.5px;width:94%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:3.5px;width:70%;background:var(--pgl);border-radius:2px')}></div></div>
    </div>
    <div style=${stil('text-align:center;font-size:12.5px;color:var(--lab3);padding:8px 0 0')}>${v.revQuelle}</div>
    ${v.revDup ? html`<div style=${stil('margin:12px 16px 0;background:rgba(255,149,0,0.13);border-radius:14px;padding:12px 14px;display:flex;gap:10px')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--org)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style=${stil('flex-shrink:0;margin-top:1px')}><path d="M12 4.5L2.8 19.5h18.4z"></path><path d="M12 10.2v3.6"></path><path d="M12 16.8v0.1"></path></svg>
        <div><div style=${stil('font-size:14.5px;font-weight:600')}>Mögliches Duplikat</div><div style=${stil('font-size:13px;color:var(--lab2);margin-top:2px;line-height:1.4')}>Ähnelt „${v.revDupRef}“. Prüfe das Original, bevor du dieses Dokument übernimmst.</div></div>
      </div>` : null}
    <div style=${stil('display:flex;align-items:center;justify-content:space-between;padding:20px 20px 8px')}>
      <span style=${stil('font-size:13px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px')}>Erkannte Angaben</span>
      <span onClick=${v.acceptAll} style=${stil('font-size:13.5px;font-weight:600;color:var(--acc);cursor:pointer')}>Alle übernehmen</span>
    </div>
    <div style=${stil('background:var(--card);border-radius:16px;margin:0 16px;overflow:hidden')}>
      ${(v.revFields || []).map((f, fIdx) => html`<div key=${f && f.id != null ? f.id : fIdx} style=${stil('display:flex;align-items:center;gap:12px;padding:10px 16px;position:relative')}>
          <div onClick=${f.toggle} style=${stil('cursor:pointer;flex-shrink:0')}>
            ${f.ok ? html`<div style=${stil('width:24px;height:24px;border-radius:50%;background:var(--acc);display:flex;align-items:center;justify-content:center')}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--onAcc)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></div>` : null}
            ${f.notOk ? html`<div style=${stil('width:24px;height:24px;border-radius:50%;border:1.5px solid var(--lab3)')}></div>` : null}
          </div>
          <div onClick=${f.edit} style=${stil('flex:1;min-width:0;cursor:pointer')}>
            <div style=${stil('font-size:12px;color:var(--lab2)')}>${f.k} · ${f.conf}</div>
            ${f.hasVal ? html`<div style=${stil('font-size:15.5px;font-weight:500;margin-top:1px')}>${f.vShow}</div>` : null}
            ${f.empty ? html`<div style=${stil('font-size:15.5px;font-weight:500;margin-top:1px;color:var(--lab3);font-style:italic')}>Nicht erkannt – tippen zum Ergänzen</div>` : null}
          </div>
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="var(--lab3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l6 6-6 6"></path></svg>
          <div style=${stil('position:absolute;left:52px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div>
        </div>`)}
    </div>
    <div style=${stil('font-size:12.5px;color:var(--lab3);text-align:center;padding:12px 40px;line-height:1.5')}>Nur markierte Angaben werden übernommen. Alles lässt sich später ändern.</div>
  </div>
  <div style=${stil('position:absolute;top:0;left:0;right:0;z-index:6;display:flex;align-items:center;gap:10px;padding:60px 16px 8px;background:linear-gradient(var(--bg) 55%,transparent)')}>
    <div onClick=${v.popPush} style=${stil('width:36px;height:36px;border-radius:50%;background:var(--glass);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:0.5px solid var(--gbor);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0')}><svg width="10" height="17" viewBox="0 0 10 17" fill="none" stroke="var(--acc)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 1.5L1.5 8.5l7 7"></path></svg></div>
    <div style=${stil('flex:1;text-align:center;font-size:15.5px;font-weight:600')}>${v.revPos}</div>
    <div onClick=${v.revDelete} style=${stil('width:36px;height:36px;border-radius:50%;background:var(--glass);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:0.5px solid var(--gbor);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0')}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 6.5h15"></path><path d="M8.5 6.2V4.5h7v1.7"></path><path d="M6.5 6.5l1 14h9l1-14"></path></svg></div>
  </div>
  <div style=${stil('position:absolute;left:16px;right:16px;bottom:24px;z-index:30;display:flex;flex-direction:column;gap:8px')}>
    <div onClick=${v.revConfirm} style=${stil('height:50px;border-radius:14px;background:var(--acc);color:var(--onAcc);display:flex;align-items:center;justify-content:center;font-size:16.5px;font-weight:600;cursor:pointer;box-shadow:0 6px 18px rgba(13,27,42,0.18)')}>Übernehmen & weiter</div>
    <div onClick=${v.revSkip} style=${stil('height:44px;border-radius:14px;background:var(--glass);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:0.5px solid var(--gbor);color:var(--acc);display:flex;align-items:center;justify-content:center;font-size:15.5px;font-weight:600;cursor:pointer')}>Überspringen</div>
  </div>
</div>` : null;
  };

  V.showSearch = function (v, html, stil) {
    return v.showSearch ? html`<div data-screen-label="Suche" style=${stil(`${v.paneL}background:var(--bg);${v.paneAnim}z-index:40`)}>
  <div style=${stil('position:absolute;top:0;left:0;right:0;z-index:6;display:flex;align-items:center;gap:10px;padding:60px 16px 10px;background:var(--bg)')}>
    <div style=${stil('flex:1;display:flex;gap:8px;align-items:center;background:var(--fill);border-radius:12px;padding:0 12px;height:40px')}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--lab2)" stroke-width="2" stroke-linecap="round" style=${stil('flex-shrink:0')}><circle cx="11" cy="11" r="7"></circle><path d="M16.8 16.8L21 21"></path></svg>
      <input value=${v.qVal} onInput=${v.setQ} placeholder="Titel, Absender oder Inhalt" style=${stil('flex:1;min-width:0;border:none;background:transparent;outline:none;font-size:16px;color:var(--lab)')} />
      ${v.hasQ ? html`<div onClick=${v.qClear} style=${stil('width:18px;height:18px;border-radius:50%;background:var(--fill2);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0')}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--lab2)" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg></div>` : null}
    </div>
    <div onClick=${v.cancelSearch} style=${stil('font-size:16px;color:var(--acc);cursor:pointer;flex-shrink:0')}>Abbrechen</div>
  </div>
  <div style=${stil('position:absolute;inset:0;overflow-y:auto;padding:118px 0 40px')}>
    ${v.noQ ? html`<div style=${stil('display:flex;gap:8px;flex-wrap:wrap;padding:4px 16px 0')}>
        ${(v.qChips || []).map((c, cIdx) => html`<div key=${c && c.id != null ? c.id : cIdx} onClick=${c.tap} style=${stil('height:32px;padding:0 13px;border-radius:999px;background:var(--fill);display:flex;align-items:center;font-size:13.5px;font-weight:600;cursor:pointer')}>${c.label}</div>`)}
      </div>
      <div style=${stil('display:flex;align-items:center;justify-content:space-between;padding:20px 20px 8px')}>
        <span style=${stil('font-size:13px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px')}>Zuletzt gesucht</span>
        <span onClick=${v.clearRecents} style=${stil('font-size:13.5px;font-weight:600;color:var(--acc);cursor:pointer')}>Löschen</span>
      </div>
      <div style=${stil('background:var(--card);border-radius:16px;margin:0 16px;overflow:hidden')}>
        ${(v.recentsRows || []).map((r, rIdx) => html`<div key=${r && r.id != null ? r.id : rIdx} onClick=${r.tap} style=${stil('display:flex;align-items:center;gap:11px;padding:12px 16px;cursor:pointer;position:relative')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--lab3)" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8.2"></circle><path d="M12 7.5V12l3 2"></path></svg>
            <span style=${stil('font-size:15.5px;flex:1')}>${r.q}</span>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="var(--lab3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l6 6-6 6"></path></svg>
            <div style=${stil('position:absolute;left:42px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div>
          </div>`)}
      </div>
      <div style=${stil('font-size:13px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px;padding:20px 20px 8px')}>Gespeicherte Suchen</div>
      <div style=${stil('background:var(--card);border-radius:16px;margin:0 16px;overflow:hidden')}>
        ${(v.savedRows || []).map((r, rIdx) => html`<div key=${r && r.id != null ? r.id : rIdx} onClick=${r.tap} style=${stil('display:flex;align-items:center;gap:11px;padding:12px 16px;cursor:pointer;position:relative')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><path d="M16.8 16.8L21 21"></path></svg>
            <span style=${stil('font-size:15.5px;flex:1')}>${r.name}</span>
            <span style=${stil('font-size:13px;color:var(--lab2)')}>${r.n}</span>
            <div style=${stil('position:absolute;left:42px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div>
          </div>`)}
      </div>
      <div style=${stil('font-size:12.5px;color:var(--lab3);text-align:center;padding:16px 40px;line-height:1.5')}>Die Suche findet auch Text im Inhalt deiner Dokumente.</div>` : null}
    ${v.hasQ ? html`<div style=${stil('font-size:12.5px;color:var(--lab3);padding:2px 20px 8px')}>${v.resCountLabel}</div>
      <div style=${stil('background:var(--card);border-radius:16px;margin:0 16px;overflow:hidden')}>
        ${(v.resRows || []).map((r, rIdx) => html`<div key=${r && r.id != null ? r.id : rIdx} onClick=${r.open} style=${stil('padding:11px 16px;cursor:pointer;position:relative')}>
            <div style=${stil('font-size:15.5px;font-weight:600')}>${r.titel}</div>
            <div style=${stil('font-size:12.5px;color:var(--lab2);margin-top:1px')}>${r.sub}</div>
            ${r.hasSnip ? html`<div style=${stil('font-size:13px;color:var(--lab2);margin-top:5px;line-height:1.45')}>${r.snipPre}<mark style=${stil('background:var(--mark);padding:1px 3px;border-radius:3px;color:var(--lab)')}>${r.snipHit}</mark>${r.snipPost}</div>` : null}
            <div style=${stil('position:absolute;left:16px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div>
          </div>`)}
      </div>
      ${v.searchErrOn ? html`<div style=${stil('padding:56px 40px;text-align:center')}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--lab3)" stroke-width="1.5" stroke-linecap="round" style=${stil('margin:0 auto;display:block')}><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5v5M12 16h0.1"></path></svg>
          <div style=${stil('font-size:17px;font-weight:600;margin-top:12px')}>Suche nicht möglich</div>
          <div style=${stil('font-size:14px;color:var(--lab2);margin-top:6px;line-height:1.5')}>${v.searchErr}</div>
        </div>` : null}
      ${v.noResults ? html`<div style=${stil('padding:60px 40px;text-align:center')}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--lab3)" stroke-width="1.5" stroke-linecap="round" style=${stil('margin:0 auto;display:block')}><circle cx="11" cy="11" r="7"></circle><path d="M16.8 16.8L21 21"></path></svg>
          <div style=${stil('font-size:17px;font-weight:600;margin-top:12px')}>Keine Treffer</div>
          <div style=${stil('font-size:14px;color:var(--lab2);margin-top:6px;line-height:1.5')}>Für „${v.qVal}“ wurde nichts gefunden. Prüfe die Schreibweise oder suche nach einem Wort aus dem Dokument.</div>
        </div>` : null}
      ${v.canSave ? html`<div onClick=${v.saveSearch} style=${stil('margin:12px 16px 0;height:44px;border-radius:14px;background:var(--fill);display:flex;align-items:center;justify-content:center;gap:7px;font-size:15px;font-weight:600;color:var(--acc);cursor:pointer')}>Suche speichern</div>` : null}` : null}
  </div>
</div>` : null;
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);