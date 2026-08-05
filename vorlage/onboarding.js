// Vorlage: onboarding. Maschinell erzeugt aus der DC-Fassung
// (tools/konvert.py) - Aenderungen gehoeren hierher, nicht in eine
// erneute Uebersetzung.
(function (global) {
  'use strict';
  const V = global.DWVorlage = global.DWVorlage || {};
  const S = global.DWStile;

  V.showOnb = function (v, html, stil) {
    return v.showOnb ? html`<div data-screen-label="Onboarding" style=${stil('position:absolute;inset:0;background:var(--bg);z-index:20')}>
  ${v.ob0 ? html`<div style=${stil('position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;text-align:center;padding:96px 32px 48px;max-width:430px;margin:0 auto;left:0;right:0')}>
      <img src="./icons/icon-512.png" alt="" width="86" height="86" style=${stil('border-radius:21px;box-shadow:0 12px 30px rgba(20,126,115,0.22)')} />
      <div style=${stil('font-size:30px;font-weight:700;margin-top:22px;font-family:\'Manrope\',-apple-system,BlinkMacSystemFont,\'Inter\',sans-serif;letter-spacing:-0.5px')}>DocuWunder</div>
      <div style=${stil('font-size:16.5px;color:var(--lab2);margin-top:10px;line-height:1.45;max-width:280px')}>Deine Dokumente. Ohne Technikstress.</div>
      <div style=${stil('flex:1')}></div>
      <button type="button" aria-label="Einrichtung starten" onClick=${v.obStart} style=${stil(S.buttonReset + ';width:100%;max-width:340px;min-height:54px;height:auto;padding:0 22px;line-height:1.25;border-radius:16px;background:var(--acc);color:var(--onAcc);display:flex;align-items:center;justify-content:center;font-size:16.5px;font-weight:600;cursor:pointer;box-shadow:0 6px 18px rgba(13,27,42,0.18)')}>Los geht’s</button>
      <div style=${stil('font-size:12.5px;color:var(--lab3);margin-top:24px;line-height:1.6;max-width:320px')}>DocuWunder verbindet sich mit deinem bestehenden Paperless-ngx-Archiv. Deine Dokumente bleiben bei dir. Ein unabhängiger Client – nicht vom Paperless-ngx-Projekt betrieben.</div>
    </div>` : null}
  ${v.ob1 ? html`<div style=${stil('position:absolute;inset:0;overflow-y:auto;padding:70px 24px 48px;max-width:430px;margin:0 auto;left:0;right:0')}>
      <button type="button" aria-label="Zurück" onClick=${v.obBack} style=${stil(S.buttonReset + ';width:36px;height:36px;border-radius:50%;background:var(--fill);display:flex;align-items:center;justify-content:center;cursor:pointer')}><svg width="10" height="17" viewBox="0 0 10 17" fill="none" stroke="var(--acc)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 1.5L1.5 8.5l7 7"></path></svg></button>
      <div style=${stil('font-size:26px;font-weight:700;letter-spacing:-0.4px;margin-top:22px')}>Mit deinem Server verbinden</div>
      <div style=${stil('font-size:15px;color:var(--lab2);margin-top:8px;line-height:1.5')}>Gib die Adresse deines Paperless-ngx-Archivs ein.</div>
      <div style=${stil('font-size:12.5px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px;margin-top:26px')}>Serveradresse</div>
      <input aria-label="Serveradresse" value=${v.onbServerVal} onInput=${v.setOnbServer} placeholder="https://paperless.beispiel.de" style=${stil('width:100%;height:50px;border-radius:12px;border:1px solid var(--sep);background:var(--card);padding:0 14px;font-size:16px;color:var(--lab);outline:none;margin-top:8px')} style-focus="border-color:var(--acc)" />
      <div style=${stil('font-size:13px;color:var(--lab3);margin-top:8px;line-height:1.5')}>Die Adresse findest du in deinem Browser, wenn du Paperless öffnest – oder du fragst die Person, die den Server eingerichtet hat.</div>
      ${v.onbErrOn ? html`<div style=${stil('margin-top:14px;background:rgba(255,59,48,0.10);border-radius:14px;padding:12px 14px;display:flex;gap:10px')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style=${stil('flex-shrink:0;margin-top:1px')}><path d="M12 4.5L2.8 19.5h18.4z"></path><path d="M12 10.2v3.6"></path><path d="M12 16.8v0.1"></path></svg>
          <div><div style=${stil('font-size:14.5px;font-weight:600')}>Verbindung nicht möglich</div><div style=${stil('font-size:13px;color:var(--lab2);margin-top:2px;line-height:1.45')}>${v.onbErr}</div></div>
        </div>` : null}
      <button type="button" aria-expanded=${v.onbShowAdv ? 'true' : 'false'} onClick=${v.obToggleAdv} style=${stil(S.buttonReset + ';display:flex;align-items:center;gap:8px;margin-top:28px;min-height:42px;padding:8px 0;cursor:pointer')}>
        <span style=${stil('font-size:14.5px;font-weight:600;color:var(--acc)')}>Erweiterte Optionen</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9l7 7 7-7"></path></svg>
      </button>
      ${v.onbShowAdv ? html`<div style=${stil('margin-top:10px;background:var(--card);border-radius:14px;padding:4px 16px')}>
        </div>` : null}
      <button type="button" onClick=${v.obConnect} style=${stil(S.buttonReset + ';width:100%;margin-top:34px;min-height:54px;height:auto;padding:0 22px;line-height:1.25;border-radius:16px;background:var(--acc);color:var(--onAcc);display:flex;align-items:center;justify-content:center;gap:8px;font-size:16.5px;font-weight:600;cursor:pointer')}>
        ${v.onbChecking ? html`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" style=${stil('animation:spin 0.9s linear infinite')}><path d="M12 3a9 9 0 109 9"></path></svg>` : null}
        <span>${v.obConnectLabel}</span>
      </button>
    </div>` : null}
  ${v.ob2 ? html`<div style=${stil('position:absolute;inset:0;overflow-y:auto;padding:70px 24px 48px;max-width:430px;margin:0 auto;left:0;right:0')}>
      <button type="button" aria-label="Zurück" onClick=${v.obBack} style=${stil(S.buttonReset + ';width:36px;height:36px;border-radius:50%;background:var(--fill);display:flex;align-items:center;justify-content:center;cursor:pointer')}><svg width="10" height="17" viewBox="0 0 10 17" fill="none" stroke="var(--acc)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 1.5L1.5 8.5l7 7"></path></svg></button>
      <div style=${stil('font-size:26px;font-weight:700;letter-spacing:-0.4px;margin-top:22px')}>Anmelden</div>
      <div style=${stil('display:flex;align-items:center;gap:7px;margin-top:10px;background:var(--card);border-radius:10px;padding:9px 12px')}>
        <span style=${stil('width:7px;height:7px;border-radius:50%;background:var(--grn);flex-shrink:0')}></span>
        <span style=${stil('font-size:13.5px;color:var(--lab2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>${v.onbServerShown}</span>
      </div>
      ${v.onbUserMode ? html`<div style=${stil('font-size:12.5px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px;margin-top:24px')}>Benutzername</div>
        <input aria-label="Benutzername" value=${v.onbUserVal} onInput=${v.setOnbUser} placeholder="jonas" style=${stil('width:100%;height:50px;border-radius:12px;border:1px solid var(--sep);background:var(--card);padding:0 14px;font-size:16px;color:var(--lab);outline:none;margin-top:8px')} style-focus="border-color:var(--acc)" />
        <div style=${stil('font-size:12.5px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px;margin-top:16px')}>Passwort</div>
        <input aria-label="Passwort" type="password" value=${v.onbPassVal} onInput=${v.setOnbPass} placeholder="••••••••" style=${stil('width:100%;height:50px;border-radius:12px;border:1px solid var(--sep);background:var(--card);padding:0 14px;font-size:16px;color:var(--lab);outline:none;margin-top:8px')} style-focus="border-color:var(--acc)" />
        <div style=${stil('font-size:12.5px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px;margin-top:16px')}>Zweifaktor-Code</div>
        <input aria-label="Zweifaktor-Code" inputMode="numeric" autocomplete="one-time-code" value=${v.onbCodeVal} onInput=${v.setOnbCode} placeholder="optional" style=${stil('width:100%;height:50px;border-radius:12px;border:1px solid var(--sep);background:var(--card);padding:0 14px;font-size:16px;color:var(--lab);outline:none;margin-top:8px')} style-focus="border-color:var(--acc)" />
        <div style=${stil('font-size:13px;color:var(--lab3);margin-top:8px;line-height:1.5')}>Nur nötig, wenn du einen zweiten Faktor aktiviert hast.</div>` : null}
      ${v.onbTokMode ? html`<div style=${stil('font-size:12.5px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px;margin-top:24px')}>Zugangsschlüssel</div>
        <input aria-label="Zugangsschlüssel" value=${v.onbTokenVal} onInput=${v.setOnbToken} placeholder="Token einfügen" style=${stil('width:100%;height:50px;border-radius:12px;border:1px solid var(--sep);background:var(--card);padding:0 14px;font-size:16px;color:var(--lab);outline:none;margin-top:8px')} style-focus="border-color:var(--acc)" />
        <div style=${stil('font-size:13px;color:var(--lab3);margin-top:8px;line-height:1.5')}>Den Token findest du in Paperless unter „Mein Profil“.</div>` : null}
      ${v.onbErrOn ? html`<div style=${stil('margin-top:14px;background:rgba(255,59,48,0.10);border-radius:14px;padding:12px 14px')}>
          <div style=${stil('font-size:13.5px;color:var(--red);font-weight:500;line-height:1.45')}>${v.onbErr}</div>
        </div>` : null}
      <button type="button" onClick=${v.obLoginTap} style=${stil(S.buttonReset + ';width:100%;margin-top:34px;min-height:54px;height:auto;padding:0 22px;line-height:1.25;border-radius:16px;background:var(--acc);color:var(--onAcc);display:flex;align-items:center;justify-content:center;gap:8px;font-size:16.5px;font-weight:600;cursor:pointer')}>
        ${v.onbChecking ? html`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" style=${stil('animation:spin 0.9s linear infinite')}><path d="M12 3a9 9 0 109 9"></path></svg>` : null}
        <span>Anmelden</span>
      </button>
      <button type="button" onClick=${v.obSSO} style=${stil(S.buttonReset + ';width:100%;margin-top:18px;min-height:50px;height:auto;padding:0 22px;line-height:1.25;border-radius:16px;background:var(--fill);display:flex;align-items:center;justify-content:center;font-size:15.5px;font-weight:600;color:var(--acc);cursor:pointer')}>Mit Single Sign-On anmelden</button>
      <button type="button" onClick=${v.obToggleTok} style=${stil(S.buttonReset + ';width:100%;text-align:center;margin-top:24px;min-height:46px;padding:12px 14px;line-height:1.3;font-size:14.5px;font-weight:600;color:var(--acc);cursor:pointer')}>${v.obTokLinkLabel}</button>
    </div>` : null}
  ${v.ob3 ? html`<div style=${stil('position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;text-align:center;padding:136px 32px 48px;max-width:430px;margin:0 auto;left:0;right:0')}>
      <div style=${stil('width:76px;height:76px;border-radius:19px;background:var(--accT);display:flex;align-items:center;justify-content:center')}><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5 10-11"></path></svg></div>
      <div style=${stil('font-size:24px;font-weight:700;margin-top:20px;letter-spacing:-0.3px')}>Verbunden</div>
      <div style=${stil('font-size:15px;color:var(--lab2);margin-top:8px;line-height:1.5;max-width:280px')}>${v.obFertigText}</div>
      <div style=${stil('flex:1')}></div>
      <button type="button" onClick=${v.obFertig} style=${stil(S.buttonReset + ';width:100%;max-width:340px;min-height:54px;height:auto;padding:0 22px;line-height:1.25;border-radius:16px;background:var(--acc);color:var(--onAcc);display:flex;align-items:center;justify-content:center;font-size:16.5px;font-weight:600;cursor:pointer')}>Los geht’s</button>
    </div>` : null}
</div>` : null;
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);