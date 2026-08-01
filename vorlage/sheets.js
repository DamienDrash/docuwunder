// Vorlage: sheets. Maschinell erzeugt aus der DC-Fassung
// (tools/konvert.py) - Aenderungen gehoeren hierher, nicht in eine
// erneute Uebersetzung.
(function (global) {
  'use strict';
  const V = global.DWVorlage = global.DWVorlage || {};
  const S = global.DWStile;

  V.sheetOn = function (v, html, stil) {
    return v.sheetOn ? html`
      <div onClick=${v.closeSheet} style=${stil('position:absolute;inset:0;background:rgba(0,0,0,0.42);animation:fadeIn .25s ease;z-index:60')}></div>
<div style=${stil(`position:absolute;${v.sheetPos}bottom:0;background:var(--card);border-radius:22px 22px 0 0;animation:sheetUp .34s cubic-bezier(.32,.72,.36,1);z-index:61;max-height:78%;display:flex;flex-direction:column;box-shadow:0 -8px 40px rgba(0,0,0,0.18)`)}>
  <div style=${stil('width:36px;height:5px;border-radius:3px;background:var(--fill2);margin:8px auto 0;flex-shrink:0')}></div>
  <div style=${stil('overflow-y:auto;padding:6px 0 44px')}>

  ${v.shDatenschutz ? html`<div style=${stil(S.sheetTitel)}>Datenschutz</div>
    <div style=${stil('font-size:14.5px;color:var(--lab2);padding:6px 20px 0;line-height:1.6')}>
      DocuWunder ist eine Oberfläche für deinen eigenen Paperless-Server. Es gibt keinen
      Dienst dahinter, den jemand anderes betreibt.
    </div>
    <div style=${stil(S.abschnitt)}>Was auf dem Gerät bleibt</div>
    <div style=${stil('font-size:14.5px;color:var(--lab2);padding:0 20px;line-height:1.6')}>
      Dein Zugangsschlüssel, der Suchverlauf und zuletzt geöffnete Dokumente. Ist die
      Bildschirmsperre eingerichtet, liegt der Schlüssel verschlüsselt da – ohne bestandene
      Biometrie ist er nicht lesbar. „Lokale Daten löschen“ in den Einstellungen entfernt alles davon.
    </div>
    <div style=${stil(S.abschnitt)}>Was den Server erreicht</div>
    <div style=${stil('font-size:14.5px;color:var(--lab2);padding:0 20px;line-height:1.6')}>
      Ausschließlich deinen Paperless-Server: Dokumente, Suchanfragen, Änderungen. Sonst
      nichts – die App lädt weder Schriften noch Bibliotheken noch Statistiken aus dem Netz.
      Es gibt keine Analyse, keine Absturzberichte, keine Werbekennungen.
    </div>
    <div style=${stil(S.abschnitt)}>Nachprüfbar</div>
    <div style=${stil('font-size:14.5px;color:var(--lab2);padding:0 20px 4px;line-height:1.6')}>
      Der Quelltext liegt offen. Was hier steht, lässt sich darin nachlesen – und im
      Netzwerk-Reiter der Entwicklerwerkzeuge nachmessen.
    </div>
    <div style=${stil('padding:14px 16px 0')}>
      <div onClick=${v.dsOeffnen} style=${stil(S.knopf)}>Quelltext ansehen</div>
    </div>` : null}

  ${v.shAusloeser ? html`<div style=${stil(S.sheetTitel)}>Auslöser</div>
      <div style=${stil('font-size:13.5px;color:var(--lab2);padding:0 20px 10px;line-height:1.5')}>Wann soll die Automatisierung laufen?</div>
      ${(v.ausloeserRows || []).map((r, rIdx) => html`<div key=${rIdx} onClick=${r.pick} style=${stil('display:flex;justify-content:space-between;align-items:center;padding:13px 20px;cursor:pointer;position:relative')}>
        <span style=${stil('font-size:16px')}>${r.label}</span>
        ${r.on ? html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5 10-11"></path></svg>` : null}
        <div style=${stil(S.trenner)}></div>
      </div>`)}
      <div style=${stil('height:20px')}></div>` : null}

  ${v.shAdd ? html`<div style=${stil('font-size:18px;font-weight:700;padding:10px 20px 6px')}>Hinzufügen</div>
    <div style=${stil('padding:4px 16px 0;display:flex;flex-direction:column;gap:8px')}>
      <div onClick=${v.startScan} style=${stil('display:flex;align-items:center;gap:13px;background:var(--fill);border-radius:14px;padding:13px 14px;cursor:pointer')}>
        <div style=${stil('width:36px;height:36px;border-radius:9px;background:var(--acc);display:flex;align-items:center;justify-content:center;flex-shrink:0')}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--onAcc)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.2h3.1l1.9-2.7h6l1.9 2.7H20v10.3H4z"></path><circle cx="12" cy="13" r="3.1"></circle></svg></div>
        <div style=${stil('flex:1')}><div style=${stil('font-size:16px;font-weight:600')}>Dokument scannen</div><div style=${stil(S.neben)}>Mehrere Aufnahmen werden ein Dokument</div></div>
      </div>
      <div onClick=${v.pickFile} style=${stil('display:flex;align-items:center;gap:13px;background:var(--fill);border-radius:14px;padding:13px 14px;cursor:pointer')}>
        <div style=${stil('width:36px;height:36px;border-radius:9px;background:#5856D6;display:flex;align-items:center;justify-content:center;flex-shrink:0')}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3.5h6.5L18 8v12.5H7z"></path><path d="M13.5 3.5V8H18"></path></svg></div>
        <div style=${stil('flex:1')}><div style=${stil('font-size:16px;font-weight:600')}>Datei hochladen</div><div style=${stil(S.neben)}>PDF, Bild, Text oder Office – auch mehrere</div></div>
      </div>
    </div>` : null}

  ${v.shSort ? html`<div style=${stil('font-size:18px;font-weight:700;padding:10px 20px 6px')}>Sortieren</div>
    ${(v.sortRows || []).map((r, rIdx) => html`<div key=${r && r.id != null ? r.id : rIdx} onClick=${r.pick} style=${stil('display:flex;justify-content:space-between;align-items:center;padding:13px 20px;cursor:pointer;position:relative')}>
        <span style=${stil('font-size:16px')}>${r.label}</span>
        ${r.on ? html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>` : null}
        <div style=${stil('position:absolute;left:20px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div>
      </div>`)}` : null}

  ${v.shFilter ? html`<div style=${stil('display:flex;justify-content:space-between;align-items:center;padding:10px 20px 6px')}>
      <span style=${stil('font-size:18px;font-weight:700')}>Filter</span>
      <span onClick=${v.resetFilter} style=${stil('font-size:14.5px;font-weight:600;color:var(--acc);cursor:pointer')}>Zurücksetzen</span>
    </div>
    <div style=${stil('font-size:12.5px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px;padding:12px 20px 8px')}>Dokumentart</div>
    <div style=${stil('display:flex;gap:7px;flex-wrap:wrap;padding:0 20px')}>${(v.fArtRows || []).map((c, cIdx) => html`<div key=${c && c.id != null ? c.id : cIdx} onClick=${c.tap} style=${stil(c.style)}>${c.label}</div>`)}</div>
    <div style=${stil('font-size:12.5px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px;padding:16px 20px 8px')}>Schlagwörter</div>
    <div style=${stil('display:flex;gap:7px;flex-wrap:wrap;padding:0 20px')}>${(v.fTagRows || []).map((c, cIdx) => html`<div key=${c && c.id != null ? c.id : cIdx} onClick=${c.tap} style=${stil(c.style)}>${c.label}</div>`)}</div>
    <div style=${stil('font-size:12.5px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px;padding:16px 20px 8px')}>Absender</div>
    <div style=${stil('display:flex;gap:7px;flex-wrap:wrap;padding:0 20px')}>${(v.fAbsRows || []).map((c, cIdx) => html`<div key=${c && c.id != null ? c.id : cIdx} onClick=${c.tap} style=${stil(c.style)}>${c.label}</div>`)}</div>
    <div style=${stil('font-size:12.5px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px;padding:16px 20px 8px')}>Zeitraum</div>
    <div style=${stil('display:flex;background:var(--fill);border-radius:10px;margin:0 20px;padding:2px')}>
      ${(v.fZeitRows || []).map((z, zIdx) => html`<div key=${z && z.id != null ? z.id : zIdx} onClick=${z.tap} style=${stil(z.style)}>${z.label}</div>`)}
    </div>
    <div onClick=${v.closeSheet} style=${stil('margin:20px 20px 0;height:50px;border-radius:14px;background:var(--acc);color:var(--onAcc);display:flex;align-items:center;justify-content:center;font-size:16.5px;font-weight:600;cursor:pointer')}>${v.filterApplyLabel}</div>` : null}

  ${v.shBulkTag ? html`<div style=${stil(S.sheetTitel)}>Schlagwort hinzufügen</div>
    <div style=${stil('font-size:13.5px;color:var(--lab2);padding:0 20px 10px')}>Wird auf ${v.selCountText} angewendet – mit Widerrufen-Option.</div>
    <div style=${stil('display:flex;gap:7px;flex-wrap:wrap;padding:4px 20px 0')}>${(v.bulkTagRows || []).map((c, cIdx) => html`<div key=${c && c.id != null ? c.id : cIdx} onClick=${c.tap} style=${stil(c.style)}>${c.label}</div>`)}</div>` : null}

  ${v.shDocMenu ? html`<div style=${stil('font-size:16px;font-weight:600;padding:10px 20px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--lab2)')}>${v.dTitel}</div>
    <div onClick=${v.dmFav} style=${stil('display:flex;align-items:center;gap:12px;padding:13px 20px;cursor:pointer;position:relative')}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--lab)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.6l2.5 5.2 5.7.7-4.2 3.9 1.1 5.6-5.1-2.8-5.1 2.8 1.1-5.6-4.2-3.9 5.7-.7z"></path></svg><span style=${stil('font-size:16px')}>${v.dmFavLabel}</span><div style=${stil('position:absolute;left:52px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div></div>
    <div onClick=${v.dmText} style=${stil('display:flex;align-items:center;gap:12px;padding:13px 20px;cursor:pointer;position:relative')}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--lab)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h16M4 17h10"></path></svg><span style=${stil('font-size:16px')}>Erkannten Text anzeigen</span><div style=${stil('position:absolute;left:52px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div></div>
    <div onClick=${v.dmDownload} style=${stil('display:flex;align-items:center;gap:12px;padding:13px 20px;cursor:pointer;position:relative')}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--lab)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5v11"></path><path d="M8.2 10.7l3.8 3.8 3.8-3.8"></path><path d="M5 20.5h14"></path></svg><span style=${stil('font-size:16px')}>Original herunterladen</span><div style=${stil('position:absolute;left:52px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div></div>
    <div onClick=${v.dmPrint} style=${stil('display:flex;align-items:center;gap:12px;padding:13px 20px;cursor:pointer;position:relative')}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--lab)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 8V3.5h10V8"></path><rect x="4" y="8" width="16" height="8" rx="1.5"></rect><path d="M7 13.5h10v7H7z"></path></svg><span style=${stil('font-size:16px')}>Drucken</span><div style=${stil('position:absolute;left:52px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div></div>
    <div onClick=${v.dmZuweisen} style=${stil('display:flex;align-items:center;gap:12px;padding:13px 20px;cursor:pointer;position:relative')}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8.5" r="3.2"></circle><path d="M3.5 19.5c.8-3.5 3-4.9 5.5-4.9s4.7 1.4 5.5 4.9"></path><path d="M17.5 8.5h5M20 6v5"></path></svg><span style=${stil('font-size:16px')}>Zuweisen …</span><div style=${stil('position:absolute;left:20px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div></div>
    <div onClick=${v.dmTrash} style=${stil('display:flex;align-items:center;gap:12px;padding:13px 20px;cursor:pointer')}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 6.5h15"></path><path d="M8.5 6.2V4.5h7v1.7"></path><path d="M6.5 6.5l1 14h9l1-14"></path></svg><span style=${stil('font-size:16px;color:var(--red)')}>In den Papierkorb</span></div>` : null}

  ${v.shZuweisen ? html`<div style=${stil(S.sheetTitel)}>Zuweisen</div>
    <div style=${stil('font-size:13.5px;color:var(--lab2);padding:0 20px 10px;line-height:1.5')}>${v.zuweisenHinweis}</div>
    ${v.zuweisenLeer ? html`<div style=${stil('padding:24px 20px 34px;text-align:center')}>
        <div style=${stil('font-size:15px;font-weight:600')}>Niemand zum Zuweisen da</div>
        <div style=${stil('font-size:13.5px;color:var(--lab2);margin-top:6px;line-height:1.5')}>Lege in Paperless unter Einstellungen weitere Benutzer oder Gruppen an. Sie erscheinen dann hier.</div>
      </div>` : null}
    ${(v.zuweisenZiele || []).map((z, zIdx) => html`<div key=${z && z.id != null ? z.id : zIdx} onClick=${z.tap} style=${stil('display:flex;align-items:center;gap:12px;padding:13px 20px;cursor:pointer;position:relative')}>
        <div style=${stil(z.iconStyle)}>${z.ini}</div>
        <div style=${stil('flex:1;min-width:0')}><div style=${stil('font-size:16px;font-weight:500')}>${z.name}</div><div style=${stil('font-size:13px;color:var(--lab2);margin-top:1px')}>${z.dokumentart}</div></div>
        <div style=${stil('position:absolute;left:20px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div>
      </div>`)}` : null}

  ${v.shEdit ? html`<div style=${stil('display:flex;justify-content:space-between;align-items:center;padding:10px 20px 6px')}>
      <span onClick=${v.eCancel} style=${stil('font-size:15.5px;color:var(--acc);cursor:pointer')}>Abbrechen</span>
      <span style=${stil('font-size:16.5px;font-weight:700')}>Bearbeiten</span>
      <span onClick=${v.eSave} style=${stil('font-size:15.5px;font-weight:700;color:var(--acc);cursor:pointer')}>Sichern</span>
    </div>
    <div style=${stil('padding:10px 20px 0')}>
      <div style=${stil('font-size:12.5px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px')}>Titel</div>
      <input value=${v.eTitel} onInput=${v.setETitel} style=${stil('width:100%;height:46px;border-radius:12px;border:1px solid var(--sep);background:var(--bg);padding:0 13px;font-size:16px;color:var(--lab);outline:none;margin-top:7px')} style-focus="border-color:var(--acc)" />
      ${v.eErrOn ? html`<div style=${stil('font-size:13px;color:var(--red);margin-top:6px')}>${v.eErr}</div>` : null}
      <div style=${stil('font-size:12.5px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px;margin-top:16px')}>Ausgestellt am</div>
      <input value=${v.eDatum} onInput=${v.setEDatum} style=${stil('width:100%;height:46px;border-radius:12px;border:1px solid var(--sep);background:var(--bg);padding:0 13px;font-size:16px;color:var(--lab);outline:none;margin-top:7px')} style-focus="border-color:var(--acc)" />
      <div style=${stil('background:var(--bg);border-radius:12px;margin-top:16px;overflow:hidden')}>
        <div onClick=${v.ePickAbs} style=${stil('display:flex;justify-content:space-between;align-items:center;padding:12px 13px;cursor:pointer;position:relative')}><span style=${stil('font-size:15.5px;color:var(--lab2)')}>Absender</span><span style=${stil('display:flex;align-items:center;gap:6px;font-size:15.5px;font-weight:500')}>${v.eAbs}<svg width="7" height="12" viewBox="0 0 8 14" fill="none" stroke="var(--lab3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l6 6-6 6"></path></svg></span><div style=${stil('position:absolute;left:13px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div></div>
        <div onClick=${v.ePickArt} style=${stil('display:flex;justify-content:space-between;align-items:center;padding:12px 13px;cursor:pointer;position:relative')}><span style=${stil('font-size:15.5px;color:var(--lab2)')}>Dokumentart</span><span style=${stil('display:flex;align-items:center;gap:6px;font-size:15.5px;font-weight:500')}>${v.eArt}<svg width="7" height="12" viewBox="0 0 8 14" fill="none" stroke="var(--lab3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l6 6-6 6"></path></svg></span><div style=${stil('position:absolute;left:13px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div></div>
        <div onClick=${v.ePickOrt} style=${stil('display:flex;justify-content:space-between;align-items:center;padding:12px 13px;cursor:pointer')}><span style=${stil('font-size:15.5px;color:var(--lab2)')}>Ablageort</span><span style=${stil('display:flex;align-items:center;gap:6px;font-size:15.5px;font-weight:500')}>${v.eOrt}<svg width="7" height="12" viewBox="0 0 8 14" fill="none" stroke="var(--lab3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l6 6-6 6"></path></svg></span></div>
      </div>
      <div style=${stil('font-size:12.5px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px;margin-top:16px')}>Schlagwörter</div>
      <div style=${stil('display:flex;gap:7px;flex-wrap:wrap;margin-top:8px')}>${(v.eTagRows || []).map((c, cIdx) => html`<div key=${c && c.id != null ? c.id : cIdx} onClick=${c.tap} style=${stil(c.style)}>${c.label}</div>`)}</div>
      <div style=${stil('font-size:12.5px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px;margin-top:16px')}>Notiz</div>
      <textarea value=${v.eNotiz} onInput=${v.setENotiz} placeholder="Optional, z. B. wo das Original liegt" style=${stil('width:100%;height:64px;border-radius:12px;border:1px solid var(--sep);background:var(--bg);padding:10px 13px;font-size:15px;color:var(--lab);outline:none;margin-top:7px;resize:none')} style-focus="border-color:var(--acc)"></textarea>
    </div>` : null}

  ${v.shPick ? html`<div style=${stil('font-size:18px;font-weight:700;padding:10px 20px 6px')}>${v.pickTitle}</div>
    ${(v.pickRows || []).map((r, rIdx) => html`<div key=${r && r.id != null ? r.id : rIdx} onClick=${r.pick} style=${stil('display:flex;justify-content:space-between;align-items:center;padding:12px 20px;cursor:pointer;position:relative')}>
        <span style=${stil('font-size:16px')}>${r.label}</span>
        ${r.on ? html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>` : null}
        <div style=${stil('position:absolute;left:20px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div>
      </div>`)}
    ${v.pickCanCreate ? html`<div style=${stil('display:flex;gap:8px;padding:12px 20px 0')}>
        <input value=${v.pickNew} onInput=${v.setPickNew} placeholder=${v.pickNewPlaceholder} style=${stil('flex:1;height:44px;border-radius:12px;border:1px solid var(--sep);background:var(--bg);padding:0 13px;font-size:15.5px;color:var(--lab);outline:none')} style-focus="border-color:var(--acc)" />
        <div onClick=${v.pickCreate} style=${stil('height:44px;padding:0 16px;border-radius:12px;background:var(--acc);color:var(--onAcc);display:flex;align-items:center;font-size:15px;font-weight:600;cursor:pointer')}>Erstellen</div>
      </div>` : null}` : null}

  ${v.shShare ? html`<div style=${stil(S.sheetTitel)}>Teilen</div>
    <div style=${stil('font-size:13.5px;color:var(--lab2);padding:0 20px 10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>${v.dTitel}</div>
    ${v.shNoLink ? html`<div style=${stil('padding:4px 20px 0')}>
        <div style=${stil('font-size:14px;color:var(--lab2);line-height:1.5')}>Erstelle einen Link, den du per Nachricht oder E-Mail verschicken kannst. Der Link lässt sich jederzeit widerrufen.</div>
        <div style=${stil('font-size:12.5px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px;margin-top:18px')}>Gültigkeit</div>
        <div style=${stil('display:flex;gap:7px;flex-wrap:wrap;margin-top:8px')}>${(v.shAblaufRows || []).map((c, cIdx) => html`<div key=${c && c.id != null ? c.id : cIdx} onClick=${c.pick} style=${stil(c.style)}>${c.label}</div>`)}</div>
        <div style=${stil('font-size:12.5px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px;margin-top:16px')}>Berechtigung</div>
        <div style=${stil('display:flex;gap:7px;flex-wrap:wrap;margin-top:8px')}>${(v.shRechtRows || []).map((c, cIdx) => html`<div key=${c && c.id != null ? c.id : cIdx} onClick=${c.pick} style=${stil(c.style)}>${c.label}</div>`)}</div>
        <div onClick=${v.shMake} style=${stil('margin-top:22px;height:50px;border-radius:14px;background:var(--acc);color:var(--onAcc);display:flex;align-items:center;justify-content:center;font-size:16.5px;font-weight:600;cursor:pointer')}>Freigabelink erstellen</div>
      </div>` : null}
    ${v.shHasLink ? html`<div style=${stil('padding:4px 20px 0')}>
        <div style=${stil('display:flex;align-items:center;gap:10px;background:var(--bg);border-radius:12px;padding:12px 13px')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style=${stil('flex-shrink:0')}><path d="M10.2 13.8a4 4 0 005.6 0l3.1-3.1a4 4 0 00-5.7-5.6l-1.5 1.5"></path><path d="M13.8 10.2a4 4 0 00-5.6 0l-3.1 3.1a4 4 0 005.7 5.6l1.5-1.5"></path></svg>
          <span style=${stil('flex:1;min-width:0;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--lab2)')}>${v.shLink}</span>
          <div onClick=${v.shCopy} style=${stil('height:32px;padding:0 13px;border-radius:999px;background:var(--acc);color:var(--onAcc);display:flex;align-items:center;font-size:13.5px;font-weight:600;cursor:pointer;flex-shrink:0')}>Kopieren</div>
        </div>
        <div style=${stil('font-size:13px;color:var(--lab2);margin-top:10px')}>${v.shMeta}</div>
        <div style=${stil('background:var(--bg);border-radius:12px;margin-top:16px;overflow:hidden')}>
          <div onClick=${v.dmDownload} style=${stil('padding:12px 13px;cursor:pointer;position:relative')}><span style=${stil('font-size:15.5px;color:var(--acc)')}>Als PDF exportieren</span><div style=${stil('position:absolute;left:13px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div></div>
          <div onClick=${v.shRevoke} style=${stil('padding:12px 13px;cursor:pointer')}><span style=${stil('font-size:15.5px;color:var(--red)')}>Freigabe widerrufen</span></div>
        </div>
      </div>` : null}` : null}

  ${v.shDelFinal ? html`<div style=${stil('padding:16px 24px 0;text-align:center')}>
      <div style=${stil('width:52px;height:52px;border-radius:50%;background:rgba(255,59,48,0.12);display:flex;align-items:center;justify-content:center;margin:0 auto')}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 6.5h15"></path><path d="M8.5 6.2V4.5h7v1.7"></path><path d="M6.5 6.5l1 14h9l1-14"></path></svg></div>
      <div style=${stil('font-size:19px;font-weight:700;margin-top:14px')}>Endgültig löschen?</div>
      <div style=${stil('font-size:14.5px;color:var(--lab2);margin-top:8px;line-height:1.5')}>„${v.delName}“ wird dauerhaft von deinem Server entfernt. Das kann nicht rückgängig gemacht werden.</div>
      <div onClick=${v.confirmDelFinal} style=${stil('margin-top:20px;height:50px;border-radius:14px;background:var(--red);color:#fff;display:flex;align-items:center;justify-content:center;font-size:16.5px;font-weight:600;cursor:pointer')}>Endgültig löschen</div>
      <div onClick=${v.closeSheet} style=${stil('margin-top:8px;height:46px;border-radius:14px;background:var(--fill);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600;color:var(--acc);cursor:pointer')}>Abbrechen</div>
    </div>` : null}

  ${v.shOrgEdit ? html`<div style=${stil('display:flex;justify-content:space-between;align-items:center;padding:10px 20px 6px')}>
      <span onClick=${v.closeSheet} style=${stil('font-size:15.5px;color:var(--acc);cursor:pointer')}>Abbrechen</span>
      <span style=${stil('font-size:16.5px;font-weight:700')}>${v.orgEditTitle}</span>
      <span onClick=${v.orgSaveTap} style=${stil('font-size:15.5px;font-weight:700;color:var(--acc);cursor:pointer')}>Sichern</span>
    </div>
    <div style=${stil('padding:10px 20px 0')}>
      <div style=${stil('font-size:12.5px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px')}>Name</div>
      <input value=${v.orgName} onInput=${v.setOrgName} style=${stil('width:100%;height:46px;border-radius:12px;border:1px solid var(--sep);background:var(--bg);padding:0 13px;font-size:16px;color:var(--lab);outline:none;margin-top:7px')} style-focus="border-color:var(--acc)" />
      ${v.orgErrOn ? html`<div style=${stil('font-size:13px;color:var(--red);margin-top:6px')}>${v.orgErr}</div>` : null}
      ${v.orgCountOn ? html`<div style=${stil('font-size:13px;color:var(--lab2);margin-top:10px')}>${v.orgCountLabel}</div>` : null}
      ${v.orgWarnOn ? html`<div style=${stil('margin-top:14px;background:rgba(255,149,0,0.13);border-radius:14px;padding:12px 14px')}>
          <div style=${stil('font-size:14px;font-weight:600')}>Wirklich löschen?</div>
          <div style=${stil('font-size:13px;color:var(--lab2);margin-top:2px;line-height:1.45')}>${v.orgWarnText}</div>
          <div onClick=${v.orgDelForce} style=${stil('margin-top:10px;height:38px;border-radius:10px;background:var(--red);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14.5px;font-weight:600;cursor:pointer')}>Trotzdem löschen</div>
        </div>` : null}
      ${v.orgDelOn ? html`<div onClick=${v.orgDelTap} style=${stil('margin-top:18px;height:46px;border-radius:14px;background:rgba(255,59,48,0.10);display:flex;align-items:center;justify-content:center;font-size:15.5px;font-weight:600;color:var(--red);cursor:pointer')}>Löschen</div>` : null}
    </div>` : null}

  ${v.shMitgliedNeu ? html`<div style=${stil(S.sheetTitel)}>Mitglied hinzufügen</div>
    <div style=${stil('font-size:13.5px;color:var(--lab2);padding:0 20px 12px;line-height:1.5')}>Das Konto wird auf deinem Server angelegt. Die Zugangsdaten bekommst du danach einmalig angezeigt, zum Weitergeben.</div>
    <div style=${stil('padding:0 20px')}>
      <div style=${stil('font-size:12px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px;padding-bottom:6px')}>Name</div>
      <input value=${v.nmName} onInput=${v.setNmName} placeholder="Anna Beispiel" style=${stil(S.feld)} />
      <div style=${stil('font-size:12px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px;padding:14px 0 6px')}>E-Mail</div>
      <input value=${v.nmMail} onInput=${v.setNmMail} placeholder="anna@beispiel.de" style=${stil(S.feld)} />
      ${v.nmOhneGruppe ? html`<div style=${stil('margin-top:14px;padding:12px 14px;border-radius:12px;background:rgba(194,118,27,0.10);border:0.5px solid var(--org)')}>
          <div style=${stil('font-size:13.5px;font-weight:600;color:var(--org)')}>Ohne Gruppe bleibt das Konto blind</div>
          <div style=${stil('font-size:12.5px;color:var(--lab2);margin-top:3px;line-height:1.45')}>${v.nmOhneGruppeText}</div>
        </div>` : null}
      ${v.nmGruppenDa ? html`<div style=${stil('font-size:12px;font-weight:600;color:var(--lab2);text-transform:uppercase;letter-spacing:0.3px;padding:14px 0 6px')}>Gruppe</div>
        <div style=${stil('display:flex;gap:8px;flex-wrap:wrap')}>
          ${(v.nmGruppen || []).map((g, gIdx) => html`<div key=${g && g.id != null ? g.id : gIdx} onClick=${g.pick} style=${stil(g.style)}>${g.label}</div>`)}
        </div>` : null}
      ${v.nmErrOn ? html`<div style=${stil('font-size:13px;color:var(--red);margin-top:10px')}>${v.nmErr}</div>` : null}
      <div onClick=${v.nmSave} style=${stil('height:50px;border-radius:12px;background:var(--acc);color:var(--onAcc);display:flex;align-items:center;justify-content:center;gap:8px;font-size:16.5px;font-weight:600;cursor:pointer;margin:16px 0 30px')}>${v.nmSaveLabel}</div>
    </div>` : null}

  ${v.shZugang ? html`<div style=${stil(S.sheetTitel)}>Zugang für ${v.zuName}</div>
    <div style=${stil('font-size:13.5px;color:var(--lab2);padding:0 20px 12px;line-height:1.5')}>Das Passwort wird nur jetzt angezeigt – dein Server speichert es ausschließlich verschlüsselt. Gib es weiter, bevor du dieses Fenster schließt.</div>
    <div style=${stil('margin:0 20px;background:var(--fill);border-radius:12px;padding:14px 16px')}>
      <div style=${stil('font-size:12px;color:var(--lab2)')}>Benutzername</div>
      <div style=${stil('font-family:ui-monospace,\'SF Mono\',Menlo,monospace;font-size:16px;font-weight:600;margin-top:2px')}>${v.zuBenutzer}</div>
      <div style=${stil('font-size:12px;color:var(--lab2);margin-top:12px')}>Passwort</div>
      <div style=${stil('font-family:ui-monospace,\'SF Mono\',Menlo,monospace;font-size:16px;font-weight:600;margin-top:2px;letter-spacing:0.5px')}>${v.zuPasswort}</div>
    </div>
    <div onClick=${v.zuTeilen} style=${stil('height:50px;border-radius:12px;background:var(--acc);color:var(--onAcc);display:flex;align-items:center;justify-content:center;gap:8px;font-size:16.5px;font-weight:600;cursor:pointer;margin:16px 20px 10px')}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5v11"></path><path d="M8.2 7L12 3.3 15.8 7"></path><path d="M6.5 11H5v9.5h14V11h-1.5"></path></svg>
      Zugangsdaten weitergeben
    </div>
    <div onClick=${v.closeSheet} style=${stil('text-align:center;padding:8px 20px 30px;font-size:15.5px;color:var(--lab2);cursor:pointer')}>Fertig</div>` : null}

  ${v.shGruppeNeu ? html`<div style=${stil(S.sheetTitel)}>Gruppe anlegen</div>
    <div style=${stil('font-size:13.5px;color:var(--lab2);padding:0 20px 12px;line-height:1.5')}>Gruppen bündeln Rechte für mehrere Personen. Welche Rechte eine Gruppe hat, legst du in Paperless unter Einstellungen fest.</div>
    <div style=${stil('padding:0 20px 30px')}>
      <input value=${v.ngName} onInput=${v.setNgName} placeholder="Buchhaltung" style=${stil(S.feld)} />
      <div onClick=${v.ngSave} style=${stil('height:50px;border-radius:12px;background:var(--acc);color:var(--onAcc);display:flex;align-items:center;justify-content:center;font-size:16.5px;font-weight:600;cursor:pointer;margin-top:16px')}>Anlegen</div>
    </div>` : null}

  ${v.shGruppeWeg ? html`<div style=${stil(S.sheetTitel)}>„${v.gwName}“ löschen?</div>
    <div style=${stil('font-size:13.5px;color:var(--lab2);padding:0 20px 14px;line-height:1.5')}>${v.gwHinweis}</div>
    <div style=${stil('padding:0 20px 30px')}>
      <div onClick=${v.gwGo} style=${stil('height:50px;border-radius:12px;background:var(--red);color:#fff;display:flex;align-items:center;justify-content:center;font-size:16.5px;font-weight:600;cursor:pointer')}>Gruppe löschen</div>
      <div onClick=${v.closeSheet} style=${stil('text-align:center;padding:14px;font-size:15.5px;color:var(--lab2);cursor:pointer')}>Abbrechen</div>
    </div>` : null}

  ${v.shUser ? html`<div style=${stil(S.sheetTitel)}>${v.userName}</div>
    <div style=${stil('font-size:13.5px;color:var(--lab2);padding:0 20px 8px')}>In welchen Gruppen ist diese Person?</div>
    ${v.userKeineGruppen ? html`<div style=${stil('padding:6px 20px 20px;font-size:13.5px;color:var(--lab2);line-height:1.5')}>Es gibt noch keine Gruppen. Lege unten auf dem Bildschirm eine an.</div>` : null}
    ${(v.userGruppen || []).map((r, rIdx) => html`<div key=${r && r.id != null ? r.id : rIdx} onClick=${r.pick} style=${stil('display:flex;justify-content:space-between;align-items:center;padding:12px 20px;cursor:pointer;position:relative')}>
        <span style=${stil('font-size:16px')}>${r.label}</span>
        ${r.on ? html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>` : null}
        <div style=${stil('position:absolute;left:20px;right:0;bottom:0;height:0.5px;background:var(--sep)')}></div>
      </div>`)}
    ${v.userAdminZeigen ? html`<div onClick=${v.userAdminToggle} style=${stil('display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 20px;cursor:pointer;margin-top:6px;border-top:0.5px solid var(--sep)')}>
        <div style=${stil('flex:1;min-width:0')}><div style=${stil('font-size:16px')}>Administrator</div><div style=${stil('font-size:12.5px;color:var(--lab2);margin-top:2px')}>Darf alles sehen und verwalten</div></div>
        <div style=${stil(v.userAdminBg)}><div style=${stil(v.userAdminKnob)}></div></div>
      </div>` : null}
    ${v.userWegZeigen ? html`<div onClick=${v.userWeg} style=${stil('padding:14px 20px 26px;cursor:pointer;border-top:0.5px solid var(--sep)')}>
        <div style=${stil('font-size:16px;color:var(--red)')}>Mitglied entfernen</div>
        <div style=${stil('font-size:12.5px;color:var(--lab2);margin-top:2px')}>Das Konto wird gelöscht. Dokumente dieser Person bleiben erhalten.</div>
      </div>` : null}` : null}

  </div>
</div>` : null;
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);