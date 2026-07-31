// Wurzel der Vorlage. Die Bildschirme liegen in vorlage/ und
// haengen sich an globalThis.DWVorlage.
(function (global) {
  'use strict';
  const V = global.DWVorlage = global.DWVorlage || {};
  V.wurzel = function (v, html, stil) {
    return html`<div style=${stil('position:absolute;inset:0;z-index:0;--bg:#F7FAFA;--card:#FFFFFF;--fill:rgba(94,107,120,0.10);--fill2:rgba(94,107,120,0.20);--lab:#0D1B2A;--lab2:#5E6B78;--lab3:rgba(94,107,120,0.55);--sep:#E2EFED;--acc:#147E73;--onAcc:#FFFFFF;--accT:rgba(142,229,218,0.30);--mint:#8EE5DA;--grn:#147E73;--org:#C2761B;--red:#B3261E;--glass:rgba(247,250,250,0.86);--gbor:rgba(13,27,42,0.07);--mark:rgba(142,229,218,0.55);--pg:#FFFFFF;--pgl:rgba(94,107,120,0.16);background:var(--bg);color:var(--lab);font-family:-apple-system,BlinkMacSystemFont,\'SF Pro Text\',\'Inter\',sans-serif;-webkit-font-smoothing:antialiased')}>
<div style=${stil(v.themeVars)}>
${v.showApp ? html`${DWVorlage.tabHome(v, html, stil)}

${DWVorlage.tabDocs(v, html, stil)}

${DWVorlage.tabInbox(v, html, stil)}

${DWVorlage.tabMore(v, html, stil)}

${DWVorlage.tabbarOn(v, html, stil)}

${DWVorlage.selbarOn(v, html, stil)}

${DWVorlage.docPaneEmpty(v, html, stil)}

${DWVorlage.showDoc(v, html, stil)}

${DWVorlage.showRev(v, html, stil)}

${DWVorlage.showSearch(v, html, stil)}

${DWVorlage.showOrg(v, html, stil)}

${DWVorlage.showListe(v, html, stil)}

${DWVorlage.showTrash(v, html, stil)}

${DWVorlage.showSet(v, html, stil)}

${DWVorlage.showAuto(v, html, stil)}

${DWVorlage.showAutoD(v, html, stil)}

${DWVorlage.showMail(v, html, stil)}

${DWVorlage.showUsers(v, html, stil)}

${DWVorlage.showTasks(v, html, stil)}

${DWVorlage.showStatus(v, html, stil)}

${DWVorlage.sheetOn(v, html, stil)}

${DWVorlage.scanOn(v, html, stil)}

${DWVorlage.toastOn(v, html, stil)}` : null}

${DWVorlage.showOnb(v, html, stil)}${DWVorlage.sperreOffen(v, html, stil)}
</div>
</div>`;
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
