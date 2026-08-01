// Vorlage: ordnung. Maschinell erzeugt aus der DC-Fassung
// (tools/konvert.py) - Aenderungen gehoeren hierher, nicht in eine
// erneute Uebersetzung.
(function (global) {
  'use strict';
  const V = global.DWVorlage = global.DWVorlage || {};
  const S = global.DWStile;

  V.showListe = function (v, html, stil) {
    return v.showListe ? html`<div data-screen-label="Dokumentliste" style=${stil(`${v.paneL}background:var(--bg);${v.paneAnim}z-index:40`)}>
  <div style=${stil(S.kopf)}>
    <div onClick=${v.popPush} style=${stil(S.kopfKnopf)}><svg width="10" height="17" viewBox="0 0 10 17" fill="none" stroke="var(--acc)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 1.5L1.5 8.5l7 7"></path></svg></div>
    <div style=${stil(S.kopfTitel)}>${v.listeTitle}</div>
    <div style=${stil('width:36px;flex-shrink:0')}></div>
  </div>
  <div style=${stil(S.blatt)}>
    ${v.listeEmpty ? html`<div style=${stil('padding:70px 40px;text-align:center')}>
        <div style=${stil('font-size:17px;font-weight:600')}>Noch nichts hier</div>
        <div style=${stil('font-size:14px;color:var(--lab2);margin-top:6px;line-height:1.5')}>${v.listeEmptyText}</div>
      </div>` : null}
    <div style=${stil(S.karte)}>
      ${(v.listeRows || []).map((d, dIdx) => html`<div key=${d && d.id != null ? d.id : dIdx} onClick=${d.open} style=${stil('display:flex;align-items:center;gap:11px;padding:10px 16px;cursor:pointer;position:relative')}>
          <div style=${stil('width:40px;height:52px;border-radius:6px;background:var(--pg);border:0.5px solid var(--sep);padding:7px 6px;display:flex;flex-direction:column;gap:3.5px;flex-shrink:0;position:relative;overflow:hidden')}><div style=${stil('height:3px;width:65%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:3px;width:90%;background:var(--pgl);border-radius:2px')}></div><div style=${stil('height:3px;width:75%;background:var(--pgl);border-radius:2px')}></div>${d.bild ? html`<img src=${d.bild} alt="" loading="lazy" style=${stil('position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top')} />` : null}</div>
          <div style=${stil('flex:1;min-width:0')}><div style=${stil('font-size:15.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>${d.titel}</div><div style=${stil('font-size:13px;color:var(--lab2);margin-top:1px')}>${d.sub}</div></div>
          <span style=${stil('font-size:12.5px;color:var(--lab2);flex-shrink:0')}>${d.dShort}</span>
          <svg width="7" height="12" viewBox="0 0 8 14" fill="none" stroke="var(--lab3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l6 6-6 6"></path></svg>
          <div style=${stil('position:absolute;left:67px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div>
        </div>`)}
    </div>
  </div>
</div>` : null;
  };

  V.showOrg = function (v, html, stil) {
    return v.showOrg ? html`<div data-screen-label="Organisation" style=${stil(`${v.paneL}background:var(--bg);${v.paneAnim}z-index:40`)}>
  <div style=${stil(S.kopf)}>
    <div onClick=${v.popPush} style=${stil(S.kopfKnopf)}><svg width="10" height="17" viewBox="0 0 10 17" fill="none" stroke="var(--acc)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 1.5L1.5 8.5l7 7"></path></svg></div>
    <div style=${stil(S.kopfTitel)}>${v.orgTitle}</div>
    <div onClick=${v.orgAdd} style=${stil(S.kopfKnopf)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg></div>
  </div>
  <div style=${stil(S.blatt)}>
    <div style=${stil('font-size:12.5px;color:var(--lab3);padding:0 20px 10px')}>${v.orgHint}</div>
    ${v.ordnerAn ? html`<div style=${stil(S.karte)}>
        ${(v.ordnerListe || []).map((f, fIdx) => html`<div key=${f && f.id != null ? f.id : fIdx} onClick=${f.tap} style=${stil(S.zeile)}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style=${stil('flex-shrink:0')}><path d="M3.5 6.5h6l2 2.5h9V19h-17z"></path></svg>
            <div style=${stil('flex:1;min-width:0')}><div style=${stil('font-size:15.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>${f.name}</div><div style=${stil('font-size:13px;color:var(--lab2);margin-top:1px')}>${f.countLabel}</div></div>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="var(--lab3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l6 6-6 6"></path></svg>
            <div style=${stil(S.trenner)}></div>
          </div>`)}
        ${(v.ordnerDateien || []).map((d, dIdx) => html`<div key=${d && d.id != null ? d.id : dIdx} onClick=${d.open} style=${stil(S.zeile)}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="var(--lab2)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style=${stil('flex-shrink:0')}><path d="M7 3.5h6.5L18 8v12.5H7z"></path><path d="M13.5 3.5V8H18"></path></svg>
            <div style=${stil('flex:1;min-width:0')}><div style=${stil('font-size:15.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>${d.titel}</div><div style=${stil('font-size:13px;color:var(--lab2);margin-top:1px')}>${d.sub}</div></div>
            <div style=${stil(S.trenner)}></div>
          </div>`)}
      </div>
      ${v.ordnerLeer ? html`<div style=${stil('padding:60px 40px;text-align:center')}>
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="var(--lab3)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" style=${stil(S.mitte)}><path d="M3.5 6.5h6l2 2.5h9V19h-17z"></path></svg>
          <div style=${stil('font-size:17px;font-weight:600;margin-top:12px')}>Dieser Ordner ist leer</div>
          <div style=${stil('font-size:13.5px;color:var(--lab2);margin-top:6px;line-height:1.5')}>${v.ordnerLeerText}</div>
        </div>` : null}` : null}

    ${v.ordnerAus ? html`<div style=${stil(S.karte)}>
      ${(v.orgList || []).map((o, oIdx) => html`<div key=${o && o.id != null ? o.id : oIdx} onClick=${o.tap} style=${stil(S.zeile)}>
          <div style=${stil('flex:1;min-width:0')}><div style=${stil('font-size:15.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>${o.name}</div><div style=${stil('font-size:12.5px;color:var(--lab2);margin-top:1px')}>${o.countLabel}</div></div>
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="var(--lab3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l6 6-6 6"></path></svg>
          <div style=${stil(S.trenner)}></div>
        </div>`)}
    </div>` : null}
  </div>
</div>` : null;
  };

  V.showTrash = function (v, html, stil) {
    return v.showTrash ? html`<div data-screen-label="Papierkorb" style=${stil(`${v.paneL}background:var(--bg);${v.paneAnim}z-index:40`)}>
  <div style=${stil(S.kopf)}>
    <div onClick=${v.popPush} style=${stil(S.kopfKnopf)}><svg width="10" height="17" viewBox="0 0 10 17" fill="none" stroke="var(--acc)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 1.5L1.5 8.5l7 7"></path></svg></div>
    <div style=${stil(S.kopfTitel)}>Papierkorb</div>
    <div style=${stil('width:36px;flex-shrink:0')}></div>
  </div>
  <div style=${stil(S.blatt)}>
    <div style=${stil('font-size:12.5px;color:var(--lab3);padding:0 20px 10px;line-height:1.5')}>Gelöschte Dokumente bleiben 30 Tage erhalten und werden dann endgültig entfernt.</div>
    ${v.trashEmpty ? html`<div style=${stil('padding:70px 40px;text-align:center')}>
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="var(--lab3)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" style=${stil(S.mitte)}><path d="M4.5 6.5h15"></path><path d="M8.5 6.2V4.5h7v1.7"></path><path d="M6.5 6.5l1 14h9l1-14"></path></svg>
        <div style=${stil('font-size:17px;font-weight:600;margin-top:12px')}>Der Papierkorb ist leer</div>
      </div>` : null}
    <div style=${stil(S.karte)}>
      ${(v.trashRows || []).map((d, dIdx) => html`<div key=${d && d.id != null ? d.id : dIdx} style=${stil('padding:12px 16px;position:relative')}>
          <div style=${stil(S.zeileTitel)}>${d.titel}</div>
          <div style=${stil('font-size:13px;color:var(--lab2);margin-top:1px')}>${d.sub}</div>
          <div style=${stil('font-size:12.5px;color:var(--org);margin-top:3px')}>${d.gel} · ${d.rest}</div>
          <div style=${stil('display:flex;gap:8px;margin-top:10px')}>
            <div onClick=${d.restore} style=${stil('height:34px;padding:0 14px;border-radius:999px;background:var(--accT);display:flex;align-items:center;gap:6px;font-size:13.5px;font-weight:600;color:var(--acc);cursor:pointer')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h11a5 5 0 010 10h-3"></path><path d="M8 6l-4 4 4 4"></path></svg>
              Wiederherstellen
            </div>
            <div onClick=${d.delF} style=${stil('height:34px;padding:0 14px;border-radius:999px;background:rgba(255,59,48,0.12);display:flex;align-items:center;font-size:13.5px;font-weight:600;color:var(--red);cursor:pointer')}>Endgültig löschen</div>
          </div>
          <div style=${stil(S.trenner)}></div>
        </div>`)}
    </div>
  </div>
</div>` : null;
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);