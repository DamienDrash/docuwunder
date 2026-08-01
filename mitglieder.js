// Mitglieder und Gruppen.
//
// Ein Sachgebiet fuer sich, und deshalb eine Datei fuer sich. Es haengt an
// /api/users/ und /api/groups/, nicht an Dokumenten: nichts hier liest die
// Dokumentlisten, den Cache, die Filter oder die Suche. Umgekehrt ruft aus dem
// uebrigen app.js auch nichts hier herein - die Bildschirme greifen ueber
// valsVerwaltung und valsSheets zu, also ueber v, wie alle anderen auch.
//
// Warum als Aufsatz auf die Klasse und nicht als eigener Dienst mit eigenem
// Zustand? Weil der Zustand React gehoert. Ein zweiter Halter daneben muesste
// jede Aenderung selbst weitermelden, damit die Oberflaeche sie sieht - das
// waere ein Mechanismus mehr, der stillschweigend auseinanderlaufen kann.
// Stattdessen bleibt der Zustand in setState, und diese Datei liefert
// beides: die Startwerte des Sachgebiets (start) und seine Methoden
// (methoden), die app.js an den Prototyp haengt. Aufrufer merken davon nichts,
// this ist dasselbe wie vorher.
//
// Was hier ausdruecklich NICHT steht: die reinen Ableitungen. Passwort und
// Benutzername kommen aus DWLogik und sind dort ohne Browser geprueft.
(function (global) {
  'use strict';

  // Der Zustand dieses Sachgebiets, an einer Stelle statt verstreut im
  // Konstruktor.
  //
  //   neuMitglied  Entwurf des Anlegen-Dialogs (Name, Mail, Gruppe, Fehler)
  //   zugang       die einmalig gezeigten Zugangsdaten nach dem Anlegen
  //   neuGruppe    Eingabefeld fuer eine neue Gruppe
  //   gruppeSel    Gruppe, deren Loeschen gerade bestaetigt wird
  //   userSel      Person, deren Blatt offen ist
  function start() {
    return { neuMitglied: null, zugang: null, neuGruppe: '', gruppeSel: null, userSel: null };
  }

  // Was beim Schliessen eines Blattes zurueckgesetzt wird. userSel steht
  // bewusst nicht dabei: die Auswahl in der Liste ueberlebt das Blatt.
  function beimSchliessen() {
    return { neuMitglied: null, zugang: null, gruppeSel: null };
  }

  // Paperless kennt keinen Einladungslink: ein Konto anzulegen erfordert
  // Administratorrechte, die der Eingeladene noch nicht haben kann. Deshalb
  // legt der Administrator das Konto hier an und gibt die Zugangsdaten
  // anschliessend ueber den Teilen-Dialog des Geraets weiter.
  var methoden = {

    // Passwort aus dem Zufallsgenerator des Browsers. Ohne mehrdeutige Zeichen,
    // weil es abgetippt oder vorgelesen werden koennte - das Alphabet und die
    // Vierergruppen stehen in DWLogik.passwortAus.
    neuesPasswort(laenge) {
      var n = laenge || 16;
      var werte = new Uint32Array(n);
      (window.crypto || window.msCrypto).getRandomValues(werte);
      return global.DWLogik.passwortAus(werte, n);
    },

    // Benutzername aus der E-Mail ableiten, Kollisionen durchnummerieren.
    benutzernameAus(mail, name) {
      return global.DWLogik.benutzernameAus(mail, name, (this.state.users || []).map(u => u.username));
    },

    mitgliedAnlegen() {
      const A = this.api(), d = this.state.neuMitglied;
      if (!d) return;
      const name = (d.name || '').trim();
      const mail = (d.mail || '').trim();
      if (!name) { this.setState(s => ({ neuMitglied: Object.assign({}, s.neuMitglied, { err: 'Bitte gib einen Namen ein.' }) })); return; }
      if (!mail || mail.indexOf('@') < 1) { this.setState(s => ({ neuMitglied: Object.assign({}, s.neuMitglied, { err: 'Bitte gib eine gültige E-Mail-Adresse ein.' }) })); return; }
      // Rechte haengen in Paperless an der Gruppe. Ein Konto ohne Gruppe hat
      // keinerlei Grundrechte und bekommt schon beim Auflisten 403 - es koennte
      // sich anmelden und saehe ein leeres Archiv. Deshalb ist die Gruppe hier
      // Pflicht, solange es ueberhaupt eine gibt.
      if ((this.state.gruppen || []).length && !d.gruppe) {
        this.setState(st => ({ neuMitglied: Object.assign({}, st.neuMitglied, { err: 'Bitte wähle eine Gruppe. Ohne Gruppe hätte das Konto keine Rechte und würde ein leeres Archiv sehen.' }) }));
        return;
      }

      const teile = name.split(/\s+/);
      const passwort = this.neuesPasswort(16);
      const benutzername = this.benutzernameAus(mail, name);

      this.setState(s => ({ neuMitglied: Object.assign({}, s.neuMitglied, { busy: true, err: '' }) }));
      A.users.create({
        username: benutzername,
        password: passwort,
        email: mail,
        first_name: teile[0] || '',
        last_name: teile.slice(1).join(' '),
        is_active: true,
        is_superuser: false,
        is_staff: false,
        groups: d.gruppe ? [d.gruppe] : []
      }).then(() => this.loadAll()).then(() => {
        // Das Passwort ist ab jetzt nirgends mehr abrufbar - Paperless speichert
        // nur den Hash. Deshalb einmalig anzeigen und weitergeben lassen.
        this.setState({
          neuMitglied: null,
          sheet: 'zugang',
          zugang: { name: name, benutzername: benutzername, passwort: passwort, mail: mail }
        });
      }).catch(e => {
        this.setState(s => ({ neuMitglied: Object.assign({}, s.neuMitglied, { busy: false, err: e.message }) }));
      });
    },

    // Zugangsdaten weitergeben. Wo der Teilen-Dialog fehlt (Desktop-Browser),
    // in die Zwischenablage.
    zugangTeilen() {
      const z = this.state.zugang;
      if (!z) return;
      const text = global.DWLogik.zugangText(z, location.href.split('#')[0]);
      if (navigator.share) {
        navigator.share({ title: 'Zugang zu DocuWunder', text: text }).catch(e => {
          // AbortError heisst: der Nutzer hat den Dialog geschlossen. Das ist
          // seine Entscheidung und keine Meldung wert - alles andere schon.
          if (e && e.name === 'AbortError') return;
          this.note('Teilen fehlgeschlagen. Die Zugangsdaten stehen weiter oben.');
        });
        return;
      }
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
          .then(() => this.note('Zugangsdaten kopiert'))
          .catch(() => this.note('Kopieren nicht möglich'));
        return;
      }
      this.note('Teilen wird von diesem Browser nicht unterstützt');
    },

    adminUmschalten(nutzer) {
      const A = this.api();
      if (!nutzer) return;
      if (this.state.me && nutzer.id === this.state.me.id) {
        // Sich selbst die Adminrechte zu nehmen wuerde den Zugang zur
        // Verwaltung sofort beenden.
        this.note('Dein eigenes Administratorrecht lässt sich hier nicht ändern');
        return;
      }
      const neu = !nutzer.is_superuser;
      this.setState(s => ({ users: s.users.map(u => u.id === nutzer.id ? Object.assign({}, u, { is_superuser: neu }) : u) }));
      A.users.update(nutzer.id, { is_superuser: neu })
        .then(() => this.note(neu ? nutzer.name + ' ist jetzt Administrator' : 'Administratorrecht entzogen'))
        .catch(e => {
          this.setState(s => ({ users: s.users.map(u => u.id === nutzer.id ? Object.assign({}, u, { is_superuser: !neu }) : u) }));
          this.note('Nicht gespeichert: ' + e.message);
        });
    },

    mitgliedEntfernen(nutzer) {
      const A = this.api();
      if (!nutzer) return;
      if (this.state.me && nutzer.id === this.state.me.id) { this.note('Du kannst dich nicht selbst entfernen'); return; }
      A.users.remove(nutzer.id)
        .then(() => { this.setState({ sheet: null, userSel: null }); return this.loadAll(); })
        .then(() => this.note(nutzer.name + ' entfernt'))
        .catch(e => this.note('Nicht entfernt: ' + e.message));
    },

    gruppeAnlegen(name) {
      const A = this.api();
      const sauber = String(name || '').trim();
      if (!sauber) return;
      if ((this.state.gruppen || []).some(g => g.name.toLowerCase() === sauber.toLowerCase())) {
        this.note('„' + sauber + '“ gibt es schon');
        return;
      }
      A.groups.create(sauber)
        .then(() => this.loadAll())
        .then(() => { this.setState({ sheet: null, neuGruppe: '' }); this.note('Gruppe „' + sauber + '“ erstellt'); })
        .catch(e => this.note('Nicht erstellt: ' + e.message));
    },

    gruppeEntfernen(gruppe) {
      const A = this.api();
      if (!gruppe) return;
      A.groups.remove(gruppe.id)
        .then(() => this.loadAll())
        .then(() => { this.setState({ sheet: null }); this.note('Gruppe „' + gruppe.name + '“ gelöscht'); })
        .catch(e => this.note('Nicht gelöscht: ' + e.message));
    },

    // Setzt oder entfernt die Mitgliedschaft einer Person in einer Gruppe.
    // Das ist der Hebel, den diese App bei den Rechten anbietet: die Rechte
    // selbst haengen in Paperless an der Gruppe, nicht an der Person.
    gruppeUmschalten(nutzer, gruppeId) {
      const A = this.api();
      if (!nutzer) return;
      const vorher = (nutzer.groups || []).slice();
      const drin = vorher.indexOf(gruppeId) >= 0;
      const nachher = drin ? vorher.filter(g => g !== gruppeId) : vorher.concat([gruppeId]);
      const name = (this.state.gruppen.find(g => g.id === gruppeId) || {}).name || 'Gruppe';

      // Optimistisch anzeigen, bei Fehlschlag zuruecknehmen.
      this.setState(s => ({ users: s.users.map(u => u.id === nutzer.id ? Object.assign({}, u, { groups: nachher }) : u) }));
      A.users.setGroups(nutzer.id, nachher)
        .then(() => this.note(drin ? 'Aus „' + name + '“ entfernt' : 'Zu „' + name + '“ hinzugefügt'))
        .catch(e => {
          this.setState(s => ({ users: s.users.map(u => u.id === nutzer.id ? Object.assign({}, u, { groups: vorher }) : u) }));
          this.note('Nicht gespeichert: ' + e.message);
        });
    }
  };

  global.DWMitglieder = { start: start, beimSchliessen: beimSchliessen, methoden: methoden };
})(typeof globalThis !== 'undefined' ? globalThis : this);
