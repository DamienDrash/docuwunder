// Vorlage: tabs. Maschinell erzeugt aus der DC-Fassung
// (tools/konvert.py) - Aenderungen gehoeren hierher, nicht in eine
// erneute Uebersetzung.
(function (global) {
  'use strict';
  const V = global.DWVorlage = global.DWVorlage || {};
  const S = global.DWStile;

  V.selbarOn = function (v, html, stil) {
    return v.selbarOn ? html`<div style=${stil(`position:absolute;${v.barPos}bottom:24px;height:60px;border-radius:999px;background:var(--glass);backdrop-filter:blur(18px) saturate(180%);-webkit-backdrop-filter:blur(18px) saturate(180%);border:0.5px solid var(--gbor);box-shadow:0 8px 28px rgba(0,0,0,0.14);display:flex;align-items:center;padding:0 8px 0 20px;gap:4px;z-index:30`)}>
  <div style=${stil('flex:1;font-size:15px;font-weight:600')}>${v.selLabel}</div>
  <div onClick=${v.bulkTagOpen} style=${stil(v.selActStyle)}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 12V4.5H11l9 9L12.5 21z"></path><circle cx="7.6" cy="8.6" r="1.3"></circle></svg></div>
  <div onClick=${v.bulkExport} style=${stil(v.selActStyle)}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 14.5V3.5"></path><path d="M8.2 7L12 3.3 15.8 7"></path><path d="M6.5 11H5v9.5h14V11h-1.5"></path></svg></div>
  <div onClick=${v.bulkTrash} style=${stil(v.selActStyleRed)}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 6.5h15"></path><path d="M8.5 6.2V4.5h7v1.7"></path><path d="M6.5 6.5l1 14h9l1-14"></path><path d="M10.2 10.5v6M13.8 10.5v6"></path></svg></div>
  <div onClick=${v.toggleSelMode} style=${stil('height:38px;padding:0 14px;border-radius:999px;display:flex;align-items:center;font-size:14.5px;font-weight:600;color:var(--acc);cursor:pointer')}>Fertig</div>
</div>` : null;
  };

  V.tabDocs = function (v, html, stil) {
    return v.tabDocs ? html`<div data-screen-label="Dokumente" style=${stil(`${v.paneL}overflow-y:auto;padding:64px 0 128px`)}>
  <div style=${stil('display:flex;align-items:center;justify-content:space-between;padding:8px 16px 0 20px')}>
    <div style=${stil('font-size:31px;font-weight:700;letter-spacing:-0.6px')}>Dokumente</div>
    <div style=${stil('display:flex;gap:8px;align-items:center')}>
      <div onClick=${v.toggleSelMode} style=${stil('height:34px;padding:0 13px;border-radius:999px;background:var(--fill);display:flex;align-items:center;font-size:14px;font-weight:600;color:var(--acc);cursor:pointer')}>${v.selBtnLabel}</div>
      <div onClick=${v.openAdd} style=${stil('width:34px;height:34px;border-radius:50%;background:var(--acc);display:flex;align-items:center;justify-content:center;cursor:pointer')}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--onAcc)" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg></div>
    </div>
  </div>
  <div onClick=${v.openSearch} style=${stil('margin:14px 16px 0;display:flex;gap:8px;align-items:center;background:var(--fill);border-radius:12px;padding:10px 12px;color:var(--lab2);cursor:pointer')}>
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><path d="M16.8 16.8L21 21"></path></svg>
    <span style=${stil('font-size:16px')}>Titel, Absender oder Inhalt</span>
  </div>
  <div style=${stil('display:flex;gap:8px;overflow-x:auto;padding:12px 16px 4px;align-items:center')}>
    <div onClick=${v.openFilter} style=${stil('height:32px;padding:0 11px;border-radius:999px;background:var(--fill);display:flex;align-items:center;gap:6px;flex-shrink:0;cursor:pointer')}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" stroke-width="2" stroke-linecap="round"><path d="M4 7.5h16M7 12h10M10 16.5h4"></path></svg>
      <span style=${stil('font-size:13.5px;font-weight:600;color:var(--acc)')}>Filter</span>
    </div>
    ${(v.filterChips || []).map((c, cIdx) => html`<div key=${c && c.id != null ? c.id : cIdx} onClick=${c.tap} style=${stil(c.style)}><span>${c.label}</span></div>`)}
    <div onClick=${v.openSort} style=${stil('height:32px;padding:0 11px;border-radius:999px;background:var(--fill);display:flex;align-items:center;gap:5px;flex-shrink:0;cursor:pointer')}>
      <span style=${stil('font-size:13.5px;font-weight:500;color:var(--lab2)')}>${v.sortLabel}</span>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--lab2)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9l7 7 7-7"></path></svg>
    </div>
    <div onClick=${v.toggleView} style=${stil('width:32px;height:32px;border-radius:999px;background:var(--fill);display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer')}>
      ${v.viewIsList ? html`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--lab2)" stroke-width="1.8"><rect x="3.5" y="3.5" width="7.2" height="7.2" rx="1.5"></rect><rect x="13.3" y="3.5" width="7.2" height="7.2" rx="1.5"></rect><rect x="3.5" y="13.3" width="7.2" height="7.2" rx="1.5"></rect><rect x="13.3" y="13.3" width="7.2" height="7.2" rx="1.5"></rect></svg>` : null}
      ${v.viewIsGrid ? html`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--lab2)" stroke-width="2" stroke-linecap="round"><path d="M8.5 6h12M8.5 12h12M8.5 18h12"></path><path d="M4 6h0.1M4 12h0.1M4 18h0.1"></path></svg>` : null}
    </div>
  </div>
  <div style=${stil('font-size:12.5px;color:var(--lab3);padding:6px 20px 8px')}>${v.docsCountLabel}</div>
  ${v.viewIsList ? html`<div style=${stil(S.karte)}>
      ${(v.visDocs || []).map((d, dIdx) => html`<div key=${d && d.id != null ? d.id : dIdx} style=${stil('position:relative;overflow:hidden')}>
        <div style=${stil('position:absolute;top:0;bottom:0;right:0;display:flex')}>
          <div onClick=${d.swFav} style=${stil('width:68px;background:#F7B500;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;color:#fff')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.6l2.5 5.2 5.7.7-4.2 3.9 1.1 5.6-5.1-2.8-5.1 2.8 1.1-5.6-4.2-3.9 5.7-.7z"></path></svg>
            <span style=${stil('font-size:10px;font-weight:700')}>${d.swFavLabel}</span>
          </div>
          <div onClick=${d.swDel} style=${stil('width:68px;background:var(--red);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;color:#fff')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 6.5h15"></path><path d="M8.5 6.2V4.5h7v1.7"></path><path d="M6.5 6.5l1 14h9l1-14"></path></svg>
            <span style=${stil('font-size:10px;font-weight:700')}>Löschen</span>
          </div>
        </div>
        <div onClick=${d.tap} onPointerDown=${d.pd} onPointerMove=${d.pm} onPointerUp=${d.pu} onPointerLeave=${d.pu} style=${stil(d.rowStyle)}>
          ${d.selMode ? html`${d.selected ? html`<div style=${stil('width:22px;height:22px;border-radius:50%;background:var(--acc);display:flex;align-items:center;justify-content:center;flex-shrink:0')}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--onAcc)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></div>` : null}
            ${d.unselected ? html`<div style=${stil('width:22px;height:22px;border-radius:50%;border:1.5px solid var(--lab3);flex-shrink:0')}></div>` : null}` : null}
          <div style=${stil('width:40px;height:52px;border-radius:6px;background:var(--pg);border:0.5px solid var(--sep);padding:7px 6px;display:flex;flex-direction:column;gap:3.5px;flex-shrink:0;position:relative;overflow:hidden')}><div style=${stil('height:3px;width:65%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:3px;width:90%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:3px;width:75%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:3px;width:85%;background:var(--pgl);border-radius:2px')}></div>${d.bild ? html`<img src=${d.bild} alt="" loading="lazy" style=${stil('position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top')} />` : null}</div>
          <div style=${stil('flex:1;min-width:0')}>
            <div style=${stil('font-size:15.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>${d.titel}</div>
            <div style=${stil('font-size:13px;color:var(--lab2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px')}>${d.sub}</div>
            <div style=${stil('display:flex;gap:5px;margin-top:4px;align-items:center')}>
              ${d.neu ? html`<span style=${stil('font-size:10.5px;font-weight:600;color:var(--acc);background:var(--accT);padding:2px 7px;border-radius:5px')}>Neu</span>` : null}
              ${(d.tags2 || []).map((t, tIdx) => html`<span key=${t && t.id != null ? t.id : tIdx} style=${stil('font-size:10.5px;font-weight:500;color:var(--lab2);background:var(--fill);padding:2px 7px;border-radius:5px')}>${t.n}</span>`)}
            </div>
          </div>
          <div style=${stil('display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0')}>
            <span style=${stil('font-size:12.5px;color:var(--lab2)')}>${d.dShort}</span>
            <div style=${stil('display:flex;gap:5px;align-items:center')}>
              ${d.geteilt ? html`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--lab3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.2 13.8a4 4 0 005.6 0l3.1-3.1a4 4 0 00-5.7-5.6l-1.5 1.5"></path><path d="M13.8 10.2a4 4 0 00-5.6 0l-3.1 3.1a4 4 0 005.7 5.6l1.5-1.5"></path></svg>` : null}
              ${d.favorit ? html`<svg width="14" height="14" viewBox="0 0 24 24" fill="#F7B500" stroke="none"><path d="M12 3.6l2.5 5.2 5.7.7-4.2 3.9 1.1 5.6-5.1-2.8-5.1 2.8 1.1-5.6-4.2-3.9 5.7-.7z"></path></svg>` : null}
              <svg width="7" height="12" viewBox="0 0 8 14" fill="none" stroke="var(--lab3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l6 6-6 6"></path></svg>
            </div>
          </div>
          <div style=${stil('position:absolute;left:67px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div>
        </div>
        </div>`)}
    </div>` : null}
  ${v.viewIsGrid ? html`<div style=${stil('display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 16px')}>
      ${(v.visDocs || []).map((d, dIdx) => html`<div key=${d && d.id != null ? d.id : dIdx} onClick=${d.tap} style=${stil('background:var(--card);border-radius:14px;padding:10px;cursor:pointer;position:relative')}>
          <div style=${stil('height:118px;border-radius:8px;background:var(--pg);border:0.5px solid var(--sep);padding:14px 12px;display:flex;flex-direction:column;gap:6px;position:relative;overflow:hidden')}><div style=${stil('height:4px;width:50%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:4px;width:85%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:4px;width:70%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:4px;width:80%;background:var(--pgl);border-radius:2px;margin-top:10px')}></div><div style=${stil('height:4px;width:65%;background:var(--pgl);border-radius:2px')}></div>${d.bild ? html`<img src=${d.bild} alt="" loading="lazy" style=${stil('position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top')} />` : null}</div>
          <div style=${stil('font-size:13.5px;font-weight:600;margin-top:8px;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden')}>${d.titel}</div>
          <div style=${stil('font-size:11.5px;color:var(--lab2);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>${d.sub}</div>
          ${d.selMode ? html`<div style=${stil('position:absolute;top:16px;right:16px')}>
              ${d.selected ? html`<div style=${stil('width:22px;height:22px;border-radius:50%;background:var(--acc);display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.2)')}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--onAcc)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></div>` : null}
              ${d.unselected ? html`<div style=${stil('width:22px;height:22px;border-radius:50%;border:1.5px solid var(--lab3);background:rgba(255,255,255,0.6)')}></div>` : null}
            </div>` : null}
        </div>`)}
    </div>` : null}
  ${v.docsMoreOn ? html`<div onClick=${v.loadMore} style=${stil('margin:14px 16px 0;height:44px;border-radius:14px;background:var(--fill);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:600;color:var(--acc);cursor:pointer')}>${v.docsMoreLabel}</div>` : null}
  ${v.docsBusy ? html`<div style=${stil('padding:18px;text-align:center;font-size:13.5px;color:var(--lab3)')}>Wird geladen …</div>` : null}
  ${v.docsErrOn ? html`<div style=${stil('margin:14px 16px 0;background:var(--card);border-radius:14px;padding:14px 16px;text-align:center')}>
      <div style=${stil('font-size:14px;color:var(--lab2);line-height:1.45')}>${v.docsErr}</div>
      <div onClick=${v.retryLoad} style=${stil('display:inline-flex;margin-top:12px;height:38px;padding:0 18px;border-radius:999px;background:var(--fill);align-items:center;font-size:14.5px;font-weight:600;color:var(--acc);cursor:pointer')}>Erneut versuchen</div>
    </div>` : null}
  ${v.docsEmpty ? html`<div style=${stil('padding:56px 40px;text-align:center')}>
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--lab3)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" style=${stil(S.mitte)}><path d="M7 3.5h6.5L18 8v12.5H7z"></path><path d="M13.5 3.5V8H18"></path></svg>
      <div style=${stil('font-size:17px;font-weight:600;margin-top:14px')}>Keine Dokumente gefunden</div>
      <div style=${stil('font-size:14px;color:var(--lab2);margin-top:6px;line-height:1.45')}>${v.docsEmptyText}</div>
      ${v.filterOn ? html`<div onClick=${v.resetFilter} style=${stil('display:inline-flex;margin-top:16px;height:38px;padding:0 18px;border-radius:999px;background:var(--fill);align-items:center;font-size:14.5px;font-weight:600;color:var(--acc);cursor:pointer')}>Filter zurücksetzen</div>` : null}
    </div>` : null}
</div>` : null;
  };

  V.tabHome = function (v, html, stil) {
    return v.tabHome ? html`<div data-screen-label="Übersicht" style=${stil(`${v.paneL}overflow-y:auto;padding:64px 0 128px`)}>
  <div style=${stil('display:flex;align-items:center;justify-content:space-between;padding:8px 20px 0')}>
    <div style=${stil('font-size:31px;font-weight:700;letter-spacing:-0.6px')}>Übersicht</div>
    <div onClick=${v.openSettings} style=${stil('width:36px;height:36px;border-radius:50%;background:var(--fill2);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:var(--lab2);cursor:pointer')}>${v.kontoInitialen}</div>
  </div>
  <div onClick=${v.openSearch} style=${stil('margin:14px 16px 0;display:flex;gap:8px;align-items:center;background:var(--fill);border-radius:12px;padding:10px 12px;color:var(--lab2);cursor:pointer')}>
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><path d="M16.8 16.8L21 21"></path></svg>
    <span style=${stil('font-size:16px')}>Dokumente durchsuchen</span>
  </div>
  <div style=${stil('display:flex;gap:10px;margin:12px 16px 0')}>
    <div onClick=${v.startScan} style=${stil('flex:1;background:var(--accT);border-radius:14px;padding:12px 8px;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer')}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.2h3.1l1.9-2.7h6l1.9 2.7H20v10.3H4z"></path><circle cx="12" cy="13" r="3.1"></circle></svg>
      <span style=${stil('font-size:12.5px;font-weight:600;color:var(--acc)')}>Scannen</span>
    </div>
    <div onClick=${v.pickFile} style=${stil('flex:1;background:var(--card);border-radius:14px;padding:12px 8px;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer')}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3.5h6.5L18 8v12.5H7z"></path><path d="M13.5 3.5V8H18"></path></svg>
      <span style=${stil('font-size:12.5px;font-weight:600;color:var(--acc)')}>Datei</span>
    </div>
  </div>
  ${v.uploadsOn ? html`<div style=${stil('margin:16px 16px 0;background:var(--card);border-radius:16px;padding:12px 14px')}>
      ${(v.uploadRows || []).map((u, uIdx) => html`<div key=${u && u.id != null ? u.id : uIdx} style=${stil('display:flex;align-items:center;gap:10px')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" stroke-width="2" stroke-linecap="round" style=${stil('animation:spin 1s linear infinite')}><path d="M12 3a9 9 0 109 9"></path></svg>
          <div style=${stil('flex:1;min-width:0')}><div style=${stil('font-size:14.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>${u.name}</div><div style=${stil('font-size:12.5px;color:var(--lab2)')}>${u.st}</div></div>
        </div>`)}
    </div>` : null}
  <div style=${stil('font-size:13px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px;padding:22px 20px 8px')}>Erledigen</div>
  <div style=${stil(S.karte)}>
    ${v.inboxHasNew ? html`<div onClick=${v.goInbox} style=${stil('display:flex;align-items:center;gap:12px;padding:12px 16px;cursor:pointer;position:relative')}>
        <div style=${stil('width:32px;height:32px;border-radius:8px;background:var(--acc);display:flex;align-items:center;justify-content:center;flex-shrink:0')}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--onAcc)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 5h13l2 8v6h-17v-6z"></path><path d="M3.5 13.5h5l1.6 2.4h3.8l1.6-2.4h5"></path></svg></div>
        <div style=${stil('flex:1')}><div style=${stil('font-size:16px;font-weight:600')}>Posteingang prüfen</div><div style=${stil(S.neben)}>${v.inboxCountLabel}</div></div>
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="var(--lab3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l6 6-6 6"></path></svg>
        <div style=${stil('position:absolute;left:60px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div>
      </div>` : null}
    ${v.dupOn ? html`<div onClick=${v.openDup} style=${stil('display:flex;align-items:center;gap:12px;padding:12px 16px;cursor:pointer;position:relative')}>
        <div style=${stil('width:32px;height:32px;border-radius:8px;background:var(--org);display:flex;align-items:center;justify-content:center;flex-shrink:0')}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.5L2.8 19.5h18.4z"></path><path d="M12 10.2v3.6"></path><path d="M12 16.8v0.1"></path></svg></div>
        <div style=${stil('flex:1')}><div style=${stil('font-size:16px;font-weight:600')}>Mögliches Duplikat prüfen</div><div style=${stil(S.neben)}>Beitragsrechnung Hausrat 2026</div></div>
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="var(--lab3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l6 6-6 6"></path></svg>
        <div style=${stil('position:absolute;left:60px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div>
      </div>` : null}
    ${v.missOn ? html`<div onClick=${v.openMissing} style=${stil('display:flex;align-items:center;gap:12px;padding:12px 16px;cursor:pointer')}>
        <div style=${stil('width:32px;height:32px;border-radius:8px;background:var(--fill2);display:flex;align-items:center;justify-content:center;flex-shrink:0')}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--lab2)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.4"></circle><path d="M5 20c1-4 4-5.6 7-5.6s6 1.6 7 5.6"></path></svg></div>
        <div style=${stil('flex:1')}><div style=${stil('font-size:16px;font-weight:600')}>Angaben vervollständigen</div><div style=${stil(S.neben)}>Befundbericht Orthopädie – Absender fehlt</div></div>
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="var(--lab3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l6 6-6 6"></path></svg>
      </div>` : null}
    ${v.inboxAllDone ? html`<div style=${stil('display:flex;align-items:center;gap:12px;padding:14px 16px')}>
        <div style=${stil('width:32px;height:32px;border-radius:8px;background:var(--grn);display:flex;align-items:center;justify-content:center;flex-shrink:0')}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></div>
        <div style=${stil('flex:1')}><div style=${stil('font-size:16px;font-weight:600')}>Alles erledigt</div><div style=${stil(S.neben)}>Keine neuen Dokumente zu prüfen</div></div>
      </div>` : null}
  </div>
  <div style=${stil('font-size:13px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px;padding:22px 20px 8px')}>Zuletzt hinzugefügt</div>
  <div style=${stil('display:flex;gap:12px;overflow-x:auto;padding:2px 16px 6px')}>
    ${(v.recentDocs || []).map((r, rIdx) => html`<div key=${r && r.id != null ? r.id : rIdx} onClick=${r.open} style=${stil('width:122px;flex-shrink:0;background:var(--card);border-radius:14px;padding:10px;cursor:pointer')}>
        <div style=${stil('height:88px;border-radius:8px;background:var(--pg);border:0.5px solid var(--sep);padding:12px 10px;display:flex;flex-direction:column;gap:5px;position:relative;overflow:hidden')}><div style=${stil('height:4px;width:55%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:4px;width:85%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:4px;width:75%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:4px;width:80%;background:var(--pgl);border-radius:2px;margin-top:10px')}></div><div style=${stil('height:4px;width:60%;background:var(--pgl);border-radius:2px')}></div>${r.bild ? html`<img src=${r.bild} alt="" loading="lazy" style=${stil('position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top')} />` : null}</div>
        <div style=${stil('font-size:13px;font-weight:600;margin-top:8px;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden')}>${r.titel}</div>
        <div style=${stil('font-size:11.5px;color:var(--lab2);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>${r.absender}</div>
      </div>`)}
  </div>
  <div style=${stil('font-size:13px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px;padding:20px 20px 8px')}>Zuletzt geöffnet</div>
  <div style=${stil(S.karte)}>
    ${(v.lastOpened || []).map((r, rIdx) => html`<div key=${r && r.id != null ? r.id : rIdx} onClick=${r.open} style=${stil('display:flex;align-items:center;gap:12px;padding:10px 16px;cursor:pointer;position:relative')}>
        <div style=${stil('width:34px;height:44px;border-radius:6px;background:var(--pg);border:0.5px solid var(--sep);padding:6px 5px;display:flex;flex-direction:column;gap:3px;flex-shrink:0;position:relative;overflow:hidden')}><div style=${stil('height:3px;width:70%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:3px;width:90%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:3px;width:60%;background:var(--pgl);border-radius:2px')}></div>${r.bild ? html`<img src=${r.bild} alt="" loading="lazy" style=${stil('position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top')} />` : null}</div>
        <div style=${stil('flex:1;min-width:0')}><div style=${stil('font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>${r.titel}</div><div style=${stil(S.neben)}>${r.sub}</div></div>
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="var(--lab3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l6 6-6 6"></path></svg>
        <div style=${stil('position:absolute;left:62px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div>
      </div>`)}
  </div>
  <div style=${stil('font-size:13px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px;padding:20px 20px 8px')}>Favoriten</div>
  <div style=${stil(S.karte)}>
    ${(v.favDocs || []).map((r, rIdx) => html`<div key=${r && r.id != null ? r.id : rIdx} onClick=${r.open} style=${stil('display:flex;align-items:center;gap:12px;padding:10px 16px;cursor:pointer;position:relative')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#F7B500" stroke="none" style=${stil('flex-shrink:0')}><path d="M12 3.6l2.5 5.2 5.7.7-4.2 3.9 1.1 5.6-5.1-2.8-5.1 2.8 1.1-5.6-4.2-3.9 5.7-.7z"></path></svg>
        <div style=${stil('flex:1;min-width:0')}><div style=${stil('font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>${r.titel}</div><div style=${stil(S.neben)}>${r.sub}</div></div>
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="var(--lab3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l6 6-6 6"></path></svg>
        <div style=${stil('position:absolute;left:46px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div>
      </div>`)}
  </div>
</div>` : null;
  };

  V.tabInbox = function (v, html, stil) {
    return v.tabInbox ? html`<div data-screen-label="Posteingang" style=${stil(`${v.paneL}overflow-y:auto;padding:64px 0 128px`)}>
  <div style=${stil('padding:8px 20px 0')}>
    <div style=${stil('font-size:31px;font-weight:700;letter-spacing:-0.6px')}>Posteingang</div>
    <div style=${stil('font-size:14px;color:var(--lab2);margin-top:2px')}>${v.inboxCountLabel}</div>
  </div>
  ${v.inboxEmpty ? html`<div style=${stil('padding:80px 40px;text-align:center')}>
      <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="var(--lab3)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" style=${stil(S.mitte)}><path d="M5.5 5h13l2 8v6h-17v-6z"></path><path d="M3.5 13.5h5l1.6 2.4h3.8l1.6-2.4h5"></path></svg>
      <div style=${stil('font-size:17px;font-weight:600;margin-top:14px')}>Keine neuen Dokumente</div>
      <div style=${stil('font-size:14px;color:var(--lab2);margin-top:6px;line-height:1.45')}>Neue Scans, Uploads und E-Mail-Importe erscheinen hier zur Prüfung.</div>
      <div onClick=${v.startScan} style=${stil('display:inline-flex;margin-top:18px;height:42px;padding:0 20px;border-radius:999px;background:var(--acc);align-items:center;gap:7px;font-size:15px;font-weight:600;color:var(--onAcc);cursor:pointer')}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--onAcc)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.2h3.1l1.9-2.7h6l1.9 2.7H20v10.3H4z"></path><circle cx="12" cy="13" r="3.1"></circle></svg>
        Dokument scannen
      </div>
    </div>` : null}
  <div style=${stil('margin-top:14px')}>
    ${(v.inboxList || []).map((it, itIdx) => html`<div key=${it && it.id != null ? it.id : itIdx} onClick=${it.review} style=${stil('background:var(--card);border-radius:16px;margin:0 16px 10px;padding:12px 14px;display:flex;gap:12px;align-items:center;cursor:pointer')}>
        <div style=${stil('width:44px;height:56px;border-radius:7px;background:var(--pg);border:0.5px solid var(--sep);padding:8px 6px;display:flex;flex-direction:column;gap:4px;flex-shrink:0;position:relative;overflow:hidden')}><div style=${stil('height:3px;width:65%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:3px;width:90%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:3px;width:70%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:3px;width:80%;background:var(--pgl);border-radius:2px')}></div>${it.bild ? html`<img src=${it.bild} alt="" loading="lazy" style=${stil('position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top')} />` : null}</div>
        <div style=${stil('flex:1;min-width:0')}>
          <div style=${stil('font-size:15.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>${it.titel}</div>
          <div style=${stil('font-size:13px;color:var(--lab2);margin-top:1px')}>${it.quelle} · ${it.hinzugefuegt}</div>
          <div style=${stil('display:flex;gap:6px;margin-top:6px;align-items:center')}>
            ${it.dup ? html`<span style=${stil('font-size:11px;font-weight:600;color:#B25000;background:rgba(255,149,0,0.15);padding:2.5px 8px;border-radius:6px')}>Mögliches Duplikat</span>` : null}
            <span style=${stil('font-size:11px;font-weight:600;color:var(--acc);background:var(--accT);padding:2.5px 8px;border-radius:6px')}>${it.nSug}</span>
          </div>
        </div>
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="var(--lab3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l6 6-6 6"></path></svg>
      </div>`)}
  </div>
  ${v.inboxHasNew ? html`<div style=${stil('font-size:12.5px;color:var(--lab3);text-align:center;padding:10px 40px;line-height:1.5')}>Bestätigte Dokumente werden in deine Bibliothek übernommen.</div>` : null}
</div>` : null;
  };

  V.tabMore = function (v, html, stil) {
    return v.tabMore ? html`<div data-screen-label="Mehr" style=${stil(`${v.paneL}overflow-y:auto;padding:64px 0 128px`)}>
  <div style=${stil('font-size:31px;font-weight:700;letter-spacing:-0.6px;padding:8px 20px 0')}>Mehr</div>
  <div onClick=${v.openSettings} data-konto="1" style=${stil('background:var(--card);border-radius:16px;margin:16px 16px 0;padding:14px 16px;display:flex;gap:13px;align-items:center;cursor:pointer')}>
    <div style=${stil('width:46px;height:46px;border-radius:50%;background:var(--fill2);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600;color:var(--lab2);flex-shrink:0')}>${v.kontoInitialen}</div>
    <div style=${stil('flex:1;min-width:0')}>
      <div style=${stil('font-size:16.5px;font-weight:600')}>${v.kontoName}</div>
      <div style=${stil('display:flex;align-items:center;gap:5px;margin-top:2px')}><span style=${stil('width:7px;height:7px;border-radius:50%;background:var(--grn)')}></span><span style=${stil('font-size:13px;color:var(--lab2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>${v.serverAddr}</span></div>
    </div>
    <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="var(--lab3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l6 6-6 6"></path></svg>
  </div>
  <div style=${stil('font-size:13px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px;padding:22px 20px 8px')}>Bibliothek</div>
  <div style=${stil(S.karte)}>
    ${(v.bibRows || []).map((m, mIdx) => html`<div key=${m && m.id != null ? m.id : mIdx} onClick=${m.tap} style=${stil('display:flex;align-items:center;gap:12px;padding:11px 16px;cursor:pointer;position:relative')}>
        <div style=${stil(m.iconStyle)}><span style=${stil('display:flex')} dangerouslySetInnerHTML=${m.svg}></span></div>
        <div style=${stil('flex:1;font-size:16px')}>${m.label}</div>
        <span style=${stil('font-size:15px;color:var(--lab2);margin-right:2px')}>${m.detail}</span>
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="var(--lab3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l6 6-6 6"></path></svg>
        ${m.sep ? html`<div style=${stil('position:absolute;left:60px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div>` : null}
      </div>`)}
  </div>
  <div style=${stil('font-size:13px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px;padding:22px 20px 8px')}>Organisation</div>
  <div style=${stil(S.karte)}>
    ${(v.orgRows || []).map((m, mIdx) => html`<div key=${m && m.id != null ? m.id : mIdx} onClick=${m.tap} style=${stil('display:flex;align-items:center;gap:12px;padding:11px 16px;cursor:pointer;position:relative')}>
        <div style=${stil(m.iconStyle)}><span style=${stil('display:flex')} dangerouslySetInnerHTML=${m.svg}></span></div>
        <div style=${stil('flex:1;font-size:16px')}>${m.label}</div>
        <span style=${stil('font-size:15px;color:var(--lab2);margin-right:2px')}>${m.detail}</span>
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="var(--lab3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l6 6-6 6"></path></svg>
        ${m.sep ? html`<div style=${stil('position:absolute;left:60px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div>` : null}
      </div>`)}
  </div>
  <div style=${stil('font-size:13px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px;padding:22px 20px 8px')}>Verwaltung</div>
  <div style=${stil(S.karte)}>
    ${(v.adminRows || []).map((m, mIdx) => html`<div key=${m && m.id != null ? m.id : mIdx} onClick=${m.tap} style=${stil('display:flex;align-items:center;gap:12px;padding:11px 16px;cursor:pointer;position:relative')}>
        <div style=${stil(m.iconStyle)}><span style=${stil('display:flex')} dangerouslySetInnerHTML=${m.svg}></span></div>
        <div style=${stil('flex:1;font-size:16px')}>${m.label}</div>
        <span style=${stil('font-size:15px;color:var(--lab2);margin-right:2px')}>${m.detail}</span>
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="var(--lab3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l6 6-6 6"></path></svg>
        ${m.sep ? html`<div style=${stil('position:absolute;left:60px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div>` : null}
      </div>`)}
  </div>
  <div style=${stil('font-size:12.5px;color:var(--lab3);text-align:center;padding:14px 40px;line-height:1.5')}>Angemeldet als Administrator<br />Paperless-ngx 2.17.1 · API v9</div>
</div>` : null;
  };

  V.tabbarOn = function (v, html, stil) {
    return v.tabbarOn ? html`<div style=${stil(`position:absolute;${v.barPos}bottom:24px;height:60px;border-radius:999px;background:var(--glass);backdrop-filter:blur(18px) saturate(180%);-webkit-backdrop-filter:blur(18px) saturate(180%);border:0.5px solid var(--gbor);box-shadow:0 8px 28px rgba(0,0,0,0.14);display:flex;z-index:30`)}>
  <div onClick=${v.goHome} style=${stil(`flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;color:${v.cHome}`)}>
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11l8-7.2L20 11"></path><path d="M6 9.3V20h12V9.3"></path></svg>
    <span style=${stil('font-size:10px;font-weight:600')}>Übersicht</span>
  </div>
  <div onClick=${v.goDocs} style=${stil(`flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;color:${v.cDocs}`)}>
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3.5h6.5L18 8v12.5H7z"></path><path d="M13.5 3.5V8H18"></path><path d="M10 13h5M10 16.5h5"></path></svg>
    <span style=${stil('font-size:10px;font-weight:600')}>Dokumente</span>
  </div>
  <div onClick=${v.goInbox} style=${stil(`flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;color:${v.cInbox};position:relative`)}>
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 5h13l2 8v6h-17v-6z"></path><path d="M3.5 13.5h5l1.6 2.4h3.8l1.6-2.4h5"></path></svg>
    <span style=${stil('font-size:10px;font-weight:600')}>Posteingang</span>
    ${v.inboxHasNew ? html`<span style=${stil('position:absolute;top:8px;left:calc(50% + 6px);min-width:17px;height:17px;border-radius:9px;background:var(--red);color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 4px')}>${v.inboxBadge}</span>` : null}
  </div>
  <div onClick=${v.goMore} style=${stil(`flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;color:${v.cMore}`)}>
    <svg width="23" height="23" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="5" cy="12" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="19" cy="12" r="2"></circle></svg>
    <span style=${stil('font-size:10px;font-weight:600')}>Mehr</span>
  </div>
</div>` : null;
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);