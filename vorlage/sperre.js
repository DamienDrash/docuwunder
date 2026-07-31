// Vorlage: Entsperren beim Öffnen.
(function (global) {
  'use strict';
  const V = global.DWVorlage = global.DWVorlage || {};
  const S = global.DWStile;

  V.sperreOffen = function (v, html, stil) {
    return v.sperreOffen ? html`<div data-screen-label="Entsperren" style=${stil('position:absolute;inset:0;background:var(--bg);z-index:90;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 32px')}>
      <img src="./icons/icon-512.png" alt="" width="76" height="76" style=${stil('border-radius:19px;box-shadow:0 12px 30px rgba(20,126,115,0.22)')} />
      <div style=${stil("font-size:24px;font-weight:700;margin-top:22px;font-family:'Manrope',-apple-system,BlinkMacSystemFont,'Inter',sans-serif;letter-spacing:-0.3px")}>DocuWunder</div>
      <div style=${stil('font-size:15px;color:var(--lab2);margin-top:8px;line-height:1.5;max-width:290px')}>Dein Zugang ist verschlüsselt. Bestätige kurz, dass du es bist.</div>
      ${v.sperreFehler ? html`<div style=${stil('font-size:13.5px;color:var(--red);margin-top:14px;max-width:290px;line-height:1.45')}>${v.sperreFehler}</div>` : null}
      <div style=${stil('flex:1')}></div>
      <div onClick=${v.entsperren} style=${stil(S.knopf + ';width:100%')}>${v.sperreLabel}</div>
      <div onClick=${v.sperreAbmelden} style=${stil('margin-top:14px;font-size:15px;color:var(--lab2);cursor:pointer;padding:8px')}>Stattdessen abmelden</div>
    </div>` : null;
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
