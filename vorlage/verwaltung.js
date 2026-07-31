// Vorlage: verwaltung. Maschinell erzeugt aus der DC-Fassung
// (tools/konvert.py) - Aenderungen gehoeren hierher, nicht in eine
// erneute Uebersetzung.
(function (global) {
  'use strict';
  const V = global.DWVorlage = global.DWVorlage || {};
  const S = global.DWStile;

  V.showAuto = function (v, html, stil) {
    return v.showAuto ? html`<div data-screen-label="Automatisierungen" style=${stil(`${v.paneL}background:var(--bg);${v.paneAnim}z-index:40`)}>
  <div style=${stil(S.kopf)}>
    <div onClick=${v.popPush} style=${stil(S.kopfKnopf)}><svg width="10" height="17" viewBox="0 0 10 17" fill="none" stroke="var(--acc)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 1.5L1.5 8.5l7 7"></path></svg></div>
    <div style=${stil(S.kopfTitel)}>Automatisierungen</div>
    <div style=${stil('width:36px;flex-shrink:0')}></div>
  </div>
  <div style=${stil(S.blatt)}>
    <div style=${stil('font-size:12.5px;color:var(--lab3);padding:0 20px 10px;line-height:1.5')}>Automatisierungen führen Aktionen aus, wenn neue Dokumente bestimmte Bedingungen erfüllen. In Paperless: Workflows.</div>
    <div style=${stil(S.karte)}>
      ${(v.autoRows || []).map((a, aIdx) => html`<div key=${a && a.id != null ? a.id : aIdx} style=${stil('display:flex;align-items:center;gap:12px;padding:12px 16px;position:relative')}>
          <div onClick=${a.open} style=${stil('flex:1;min-width:0;cursor:pointer')}><div style=${stil(S.zeileTitel)}>${a.name}</div><div style=${stil('font-size:12.5px;color:var(--lab2);margin-top:2px')}>${a.verlauf}</div></div>
          <div onClick=${a.toggle} style=${stil(a.tgBg)}><div style=${stil(a.tgKnob)}></div></div>
          <svg onClick=${a.open} width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="var(--lab3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style=${stil('cursor:pointer')}><path d="M1 1l6 6-6 6"></path></svg>
          <div style=${stil(S.trenner)}></div>
        </div>`)}
    </div>
  </div>
</div>` : null;
  };

  V.showAutoD = function (v, html, stil) {
    return v.showAutoD ? html`<div data-screen-label="Automatisierung Detail" style=${stil(`${v.paneL}background:var(--bg);${v.paneAnim}z-index:40`)}>
  <div style=${stil(S.kopf)}>
    <div onClick=${v.popPush} style=${stil(S.kopfKnopf)}><svg width="10" height="17" viewBox="0 0 10 17" fill="none" stroke="var(--acc)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 1.5L1.5 8.5l7 7"></path></svg></div>
    <div style=${stil('flex:1;text-align:center;font-size:15.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>${v.adName}</div>
    <div style=${stil('width:36px;flex-shrink:0')}></div>
  </div>
  <div style=${stil(S.blatt)}>
    <div style=${stil('background:var(--card);border-radius:16px;margin:0 16px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center')}>
      <div><div style=${stil(S.zeileTitel)}>Aktiv</div><div style=${stil('font-size:12.5px;color:var(--lab2)')}>${v.adVerlauf}</div></div>
      <div onClick=${v.adToggle} style=${stil(v.adTgBg)}><div style=${stil(v.adTgKnob)}></div></div>
    </div>
    <div style=${stil(S.abschnitt)}>Wenn</div>
    <div style=${stil('background:var(--card);border-radius:16px;margin:0 16px;padding:12px 16px')}>
      <div style=${stil(S.zeileText)}>${v.adAusl}</div>
    </div>
    <div style=${stil(S.abschnitt)}>Und</div>
    <div style=${stil(S.karte)}>
      ${(v.adBed || []).map((b, bIdx) => html`<div key=${b && b.id != null ? b.id : bIdx} style=${stil('padding:12px 16px;font-size:15px;position:relative')}>${b.t}<div style=${stil(S.trenner)}></div></div>`)}
    </div>
    <div style=${stil(S.abschnitt)}>Dann</div>
    <div style=${stil(S.karte)}>
      ${(v.adAkt || []).map((b, bIdx) => html`<div key=${b && b.id != null ? b.id : bIdx} style=${stil('padding:12px 16px;font-size:15px;position:relative')}>${b.t}<div style=${stil(S.trenner)}></div></div>`)}
    </div>
    <div onClick=${v.adTest} style=${stil('margin:16px 16px 0;height:46px;border-radius:14px;background:var(--fill);display:flex;align-items:center;justify-content:center;font-size:15.5px;font-weight:600;color:var(--acc);cursor:pointer')}>Testlauf starten</div>
    <div style=${stil('font-size:12.5px;color:var(--lab3);text-align:center;padding:10px 40px;line-height:1.5')}>Ein Testlauf zeigt, welche Dokumente betroffen wären – ohne etwas zu ändern.</div>
  </div>
</div>` : null;
  };

  V.showMail = function (v, html, stil) {
    return v.showMail ? html`<div data-screen-label="E-Mail-Import" style=${stil(`${v.paneL}background:var(--bg);${v.paneAnim}z-index:40`)}>
  <div style=${stil(S.kopf)}>
    <div onClick=${v.popPush} style=${stil(S.kopfKnopf)}><svg width="10" height="17" viewBox="0 0 10 17" fill="none" stroke="var(--acc)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 1.5L1.5 8.5l7 7"></path></svg></div>
    <div style=${stil(S.kopfTitel)}>E-Mail-Import</div>
    <div style=${stil('width:36px;flex-shrink:0')}></div>
  </div>
  <div style=${stil(S.blatt)}>
    <div style=${stil('background:var(--card);border-radius:16px;margin:0 16px;padding:14px 16px')}>
      <div style=${stil('display:flex;align-items:center;gap:12px')}>
        <div style=${stil('width:34px;height:34px;border-radius:8px;background:var(--acc);display:flex;align-items:center;justify-content:center;flex-shrink:0')}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--onAcc)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5.5" width="17" height="13" rx="2"></rect><path d="M4.5 7.5l7.5 5.5 7.5-5.5"></path></svg></div>
        <div style=${stil('flex:1;min-width:0')}><div style=${stil(S.zeileTitel)}>${v.kontoMail}</div><div style=${stil('display:flex;align-items:center;gap:5px;margin-top:2px')}><span style=${stil('width:7px;height:7px;border-radius:50%;background:var(--grn)')}></span><span style=${stil(S.neben)}>imap.gmx.net · Verbunden</span></div></div>
      </div>
      <div style=${stil('font-size:12.5px;color:var(--lab2);margin-top:10px')}>Letzter Abruf vor 12 Minuten · 1 Anhang importiert</div>
      <div onClick=${v.mailFetch} style=${stil('margin-top:10px;height:38px;border-radius:10px;background:var(--fill);display:flex;align-items:center;justify-content:center;font-size:14.5px;font-weight:600;color:var(--acc);cursor:pointer')}>Jetzt abrufen</div>
    </div>
    <div style=${stil(S.abschnitt)}>Regeln</div>
    <div style=${stil(S.karte)}>
      ${(v.mailRules || []).map((r, rIdx) => html`<div key=${r && r.id != null ? r.id : rIdx} style=${stil('display:flex;align-items:center;gap:12px;padding:12px 16px;position:relative')}>
          <div style=${stil('flex:1;min-width:0')}><div style=${stil(S.zeileTitel)}>${r.name}</div><div style=${stil('font-size:12.5px;color:var(--lab2);margin-top:2px')}>${r.desc}</div></div>
          <div onClick=${r.toggle} style=${stil(r.tgBg)}><div style=${stil(r.tgKnob)}></div></div>
          <div style=${stil(S.trenner)}></div>
        </div>`)}
    </div>
    <div style=${stil('font-size:12.5px;color:var(--lab3);text-align:center;padding:12px 40px;line-height:1.5')}>Passende Anhänge landen automatisch im Posteingang.</div>
  </div>
</div>` : null;
  };

  V.showSet = function (v, html, stil) {
    return v.showSet ? html`<div data-screen-label="Einstellungen" style=${stil(`${v.paneL}background:var(--bg);${v.paneAnim}z-index:40`)}>
  <div style=${stil(S.kopf)}>
    <div onClick=${v.popPush} style=${stil(S.kopfKnopf)}><svg width="10" height="17" viewBox="0 0 10 17" fill="none" stroke="var(--acc)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 1.5L1.5 8.5l7 7"></path></svg></div>
    <div style=${stil(S.kopfTitel)}>Einstellungen</div>
    <div style=${stil('width:36px;flex-shrink:0')}></div>
  </div>
  <div style=${stil('position:absolute;inset:0;overflow-y:auto;padding:112px 0 50px')}>
    <div style=${stil('display:flex;flex-direction:column;align-items:center;padding:6px 0 4px')}>
      <div style=${stil('width:64px;height:64px;border-radius:50%;background:var(--fill2);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:600;color:var(--lab2)')}>${v.kontoInitialen}</div>
      <div style=${stil('font-size:18px;font-weight:600;margin-top:10px')}>${v.kontoName}</div>
      <div style=${stil('font-size:13.5px;color:var(--lab2);margin-top:2px')}>Administrator</div>
    </div>
    <div style=${stil(S.abschnitt)}>Darstellung</div>
    <div style=${stil('background:var(--card);border-radius:16px;margin:0 16px;overflow:hidden;padding:12px 16px')}>
      <div style=${stil('display:flex;background:var(--fill);border-radius:10px;padding:2px')}>
        <div onClick=${v.setModeHell} style=${stil(v.msHell)}>Hell</div>
        <div onClick=${v.setModeDunkel} style=${stil(v.msDunkel)}>Dunkel</div>
        <div onClick=${v.setModeSystem} style=${stil(v.msSystem)}>System</div>
      </div>
      <div onClick=${v.toggleDefView} style=${stil('display:flex;justify-content:space-between;align-items:center;padding:13px 0 6px;cursor:pointer')}><span style=${stil('font-size:15.5px')}>Standardansicht</span><span style=${stil(S.nebenGross)}>${v.defViewLabel}</span></div>
      <div onClick=${v.doDynType} style=${stil('display:flex;justify-content:space-between;align-items:center;padding:10px 0 2px;cursor:pointer')}><span style=${stil('font-size:15.5px')}>Textgröße</span><span style=${stil(S.nebenGross)}>Systemeinstellung</span></div>
    </div>
    <div style=${stil(S.abschnitt)}>Verbindung</div>
    <div style=${stil(S.karte)}>
      <div style=${stil('display:flex;justify-content:space-between;align-items:center;padding:11px 16px;position:relative')}><span style=${stil('font-size:15.5px')}>Server</span><span style=${stil('font-size:14px;color:var(--lab2)')}>${v.serverAddr}</span><div style=${stil(S.trenner)}></div></div>
      <div style=${stil('display:flex;justify-content:space-between;align-items:center;padding:11px 16px;position:relative')}><span style=${stil('font-size:15.5px')}>Status</span><span style=${stil('display:flex;align-items:center;gap:6px;font-size:15px;color:var(--lab2)')}><span style=${stil('width:7px;height:7px;border-radius:50%;background:var(--grn)')}></span>Verbunden</span><div style=${stil(S.trenner)}></div></div>
      <div onClick=${v.switchServer} style=${stil('padding:12px 16px;cursor:pointer;position:relative')}><span style=${stil('font-size:15.5px;color:var(--acc)')}>Server wechseln</span><div style=${stil(S.trenner)}></div></div>
      <div onClick=${v.clearLocal} style=${stil('padding:12px 16px;cursor:pointer')}><span style=${stil('font-size:15.5px;color:var(--acc)')}>Lokale Daten löschen</span><div style=${stil('font-size:12.5px;color:var(--lab2);margin-top:1px')}>Cache und Offline-Kopien, 84 MB</div></div>
      ${v.sperreZeigen ? html`<div onClick=${v.sperreToggle} style=${stil('display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 16px;cursor:pointer;border-top:0.5px solid var(--sep)')}><div style=${stil('flex:1;min-width:0')}><div style=${stil('font-size:15.5px')}>Beim Öffnen entsperren</div><div style=${stil('font-size:12.5px;color:var(--lab2);margin-top:2px;line-height:1.45')}>${v.sperreHinweis}</div></div><div style=${stil(v.sperreBg)}><div style=${stil(v.sperreKnob)}></div></div></div>` : null}
      <div style=${stil('padding:12px 16px 14px;border-top:0.5px solid var(--sep)')}><div style=${stil('font-size:13.5px;font-weight:600')}>Zugangsschlüssel</div><div style=${stil('font-size:12.5px;color:var(--lab2);margin-top:3px;line-height:1.5')}>${v.schluesselHinweis}</div></div>
    </div>
    <div style=${stil('background:var(--card);border-radius:16px;margin:14px 16px 0;overflow:hidden')}>
      <div onClick=${v.doHelp} style=${stil('padding:12px 16px;cursor:pointer;position:relative')}><span style=${stil('font-size:15.5px')}>Hilfe & Support</span><div style=${stil(S.trenner)}></div></div>
      <div onClick=${v.doPrivacy} style=${stil('padding:12px 16px;cursor:pointer')}><span style=${stil('font-size:15.5px')}>Datenschutz</span></div>
    </div>
    <div style=${stil('background:var(--card);border-radius:16px;margin:14px 16px 0;overflow:hidden')}>
      <div onClick=${v.logout} style=${stil('padding:13px 16px;cursor:pointer;text-align:center')}><span style=${stil('font-size:15.5px;font-weight:600;color:var(--red)')}>Abmelden</span></div>
    </div>
  </div>
</div>` : null;
  };

  V.showStatus = function (v, html, stil) {
    return v.showStatus ? html`<div data-screen-label="Systemstatus" style=${stil(`${v.paneL}background:var(--bg);${v.paneAnim}z-index:40`)}>
  <div style=${stil(S.kopf)}>
    <div onClick=${v.popPush} style=${stil(S.kopfKnopf)}><svg width="10" height="17" viewBox="0 0 10 17" fill="none" stroke="var(--acc)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 1.5L1.5 8.5l7 7"></path></svg></div>
    <div style=${stil(S.kopfTitel)}>Systemstatus</div>
    <div style=${stil('width:36px;flex-shrink:0')}></div>
  </div>
  <div style=${stil(S.blatt)}>
    <div style=${stil(S.karte)}>
      ${(v.statusRows || []).map((r, rIdx) => html`<div key=${r && r.id != null ? r.id : rIdx} style=${stil('display:flex;justify-content:space-between;align-items:center;padding:11px 16px;position:relative')}>
          <span style=${stil(S.nebenGross)}>${r.k}</span>
          <span style=${stil('display:flex;align-items:center;gap:6px;font-size:15px;font-weight:500')}>${r.grn ? html`<span style=${stil('width:7px;height:7px;border-radius:50%;background:var(--grn)')}></span>` : null}${r.v}</span>
          <div style=${stil(S.trenner)}></div>
        </div>`)}
    </div>
    <div style=${stil(S.abschnitt)}>Protokoll</div>
    <div style=${stil('background:var(--card);border-radius:16px;margin:0 16px;padding:12px 16px')}>
      ${(v.logLines || []).map((l, lIdx) => html`<div key=${l && l.id != null ? l.id : lIdx} style=${stil('font-family:ui-monospace,\'SF Mono\',Menlo,monospace;font-size:11.5px;color:var(--lab2);line-height:1.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>${l.t}</div>`)}
      <div style=${stil('font-size:12px;color:var(--lab3);margin-top:8px')}>Nur für Administratoren sichtbar.</div>
    </div>
  </div>
</div>` : null;
  };

  V.showTasks = function (v, html, stil) {
    return v.showTasks ? html`<div data-screen-label="Verarbeitung" style=${stil(`${v.paneL}background:var(--bg);${v.paneAnim}z-index:40`)}>
  <div style=${stil(S.kopf)}>
    <div onClick=${v.popPush} style=${stil(S.kopfKnopf)}><svg width="10" height="17" viewBox="0 0 10 17" fill="none" stroke="var(--acc)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 1.5L1.5 8.5l7 7"></path></svg></div>
    <div style=${stil(S.kopfTitel)}>Verarbeitung</div>
    <div style=${stil('width:36px;flex-shrink:0')}></div>
  </div>
  <div style=${stil(S.blatt)}>
    <div style=${stil('font-size:12.5px;color:var(--lab3);padding:0 20px 10px;line-height:1.5')}>Uploads und Texterkennung deines Servers. In Paperless: Aufgaben.</div>
    ${v.tasksFehlerOn ? html`<div style=${stil('margin:0 16px 12px;padding:12px 14px;border-radius:12px;background:rgba(179,38,30,0.10);border:0.5px solid var(--red)')}>
        <div style=${stil('font-size:13.5px;color:var(--red);font-weight:600')}>Aufgaben nicht geladen</div>
        <div style=${stil('font-size:12.5px;color:var(--lab2);margin-top:3px;line-height:1.45')}>${v.tasksFehler}</div>
      </div>` : null}
    <div style=${stil(S.karte)}>
      ${(v.taskRows || []).map((t, tIdx) => html`<div key=${t && t.id != null ? t.id : tIdx} style=${stil('display:flex;align-items:center;gap:11px;padding:12px 16px;position:relative')}>
          ${t.run ? html`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" stroke-width="2" stroke-linecap="round" style=${stil('animation:spin 1s linear infinite;flex-shrink:0')}><path d="M12 3a9 9 0 109 9"></path></svg>` : null}
          ${t.ok ? html`<div style=${stil('width:20px;height:20px;border-radius:50%;background:var(--grn);display:flex;align-items:center;justify-content:center;flex-shrink:0')}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></div>` : null}
          ${t.err ? html`<div style=${stil('width:20px;height:20px;border-radius:50%;background:var(--red);display:flex;align-items:center;justify-content:center;flex-shrink:0')}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg></div>` : null}
          <div style=${stil('flex:1;min-width:0')}><div style=${stil('font-size:15px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>${t.name}</div><div style=${stil('font-size:12.5px;color:var(--lab2);margin-top:1px')}>${t.st}</div></div>
          ${t.hasRetry ? html`<div onClick=${t.retry} style=${stil('height:30px;padding:0 12px;border-radius:999px;background:var(--fill);display:flex;align-items:center;font-size:13px;font-weight:600;color:var(--acc);cursor:pointer;flex-shrink:0')}>Erneut</div>` : null}
          <div style=${stil(S.trenner)}></div>
        </div>`)}
    </div>
    ${v.tasksEmpty ? html`<div style=${stil('padding:60px 40px;text-align:center')}>
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="var(--lab3)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" style=${stil(S.mitte)}><circle cx="12" cy="12" r="8.2"></circle><path d="M12 7.5V12l3 2"></path></svg>
        <div style=${stil('font-size:17px;font-weight:600;margin-top:12px')}>Nichts in Arbeit</div>
        <div style=${stil('font-size:14px;color:var(--lab2);margin-top:6px;line-height:1.5')}>Der Server hat gerade keine Aufgaben in der Warteschlange.</div>
      </div>` : null}
  </div>
</div>` : null;
  };

  V.showUsers = function (v, html, stil) {
    return v.showUsers ? html`<div data-screen-label="Benutzer und Gruppen" style=${stil(`${v.paneL}background:var(--bg);${v.paneAnim}z-index:40`)}>
  <div style=${stil(S.kopf)}>
    <div onClick=${v.popPush} style=${stil(S.kopfKnopf)}><svg width="10" height="17" viewBox="0 0 10 17" fill="none" stroke="var(--acc)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 1.5L1.5 8.5l7 7"></path></svg></div>
    <div style=${stil(S.kopfTitel)}>Benutzer & Gruppen</div>
    <div onClick=${v.mitgliedNeu} style=${stil(S.kopfKnopf)}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg></div>
  </div>
  <div style=${stil(S.blatt)}>
    <div style=${stil('font-size:13px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px;padding:0 20px 8px')}>Benutzer</div>
    <div style=${stil(S.karte)}>
      ${(v.userRows || []).map((u, uIdx) => html`<div key=${u && u.id != null ? u.id : uIdx} onClick=${u.tap} style=${stil('display:flex;align-items:center;gap:12px;padding:11px 16px;cursor:pointer;position:relative')}>
          <div style=${stil(u.iniStyle)}>${u.ini}</div>
          <div style=${stil('flex:1;min-width:0')}><div style=${stil('font-size:15.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>${u.name}</div><div style=${stil('font-size:12.5px;color:var(--lab2);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>${u.detail}</div></div>
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="var(--lab3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l6 6-6 6"></path></svg>
          <div style=${stil('position:absolute;left:66px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div>
        </div>`)}
    </div>

    <div style=${stil(S.abschnitt)}>Gruppen</div>
    ${v.gruppenLeer ? html`<div style=${stil('background:var(--card);border-radius:16px;margin:0 16px;padding:20px 16px;text-align:center')}>
        <div style=${stil('font-size:14.5px;font-weight:600')}>Noch keine Gruppen</div>
        <div style=${stil('font-size:13px;color:var(--lab2);margin-top:5px;line-height:1.5')}>Gruppen bündeln Rechte für mehrere Personen. Anlegen und mit Rechten versehen lassen sie sich in Paperless unter Einstellungen.</div>
      </div>` : null}
    <div style=${stil(S.karte)}>
      ${(v.gruppenRows || []).map((g, gIdx) => html`<div key=${g && g.id != null ? g.id : gIdx} onClick=${g.tap} style=${stil('display:flex;align-items:center;gap:12px;padding:12px 16px;position:relative;cursor:pointer')}>
          <div style=${stil('width:34px;height:34px;border-radius:8px;background:var(--grn);display:flex;align-items:center;justify-content:center;flex-shrink:0')}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8.5" r="3"></circle><path d="M3.5 19c.8-3.4 3-4.7 5.5-4.7s4.7 1.3 5.5 4.7"></path><path d="M15.5 6.2a3 3 0 010 5.6M17.5 14.6c1.7.7 2.7 2 3 4.4"></path></svg></div>
          <div style=${stil('flex:1;min-width:0')}><div style=${stil(S.zeileTitel)}>${g.name}</div><div style=${stil('font-size:12.5px;color:var(--lab2);margin-top:1px')}>${g.detail}</div></div>
          <div style=${stil('position:absolute;left:62px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div>
        </div>`)}
    </div>

    <div onClick=${v.gruppeNeu} style=${stil('display:flex;align-items:center;gap:8px;margin:10px 16px 0;padding:12px 16px;background:var(--card);border-radius:16px;cursor:pointer;color:var(--acc)')}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg>
      <span style=${stil('font-size:15.5px;font-weight:500')}>Gruppe anlegen</span>
    </div>
    <div style=${stil('font-size:12.5px;color:var(--lab3);padding:14px 24px 0;line-height:1.55')}>${v.userHinweis}</div>
  </div>
</div>` : null;
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);