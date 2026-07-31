// Zugangsschlüssel per Biometrie schützen.
//
// Der Unterschied zu einer Bildschirmsperre ist der Punkt: hier wird der
// Zugangsschlüssel **verschlüsselt** abgelegt. Ohne bestandene Biometrie
// existiert der Schlüssel zum Entschlüsseln nirgends — auch nicht für jemanden,
// der die Entwicklerwerkzeuge öffnet oder den localStorage kopiert.
//
// Das geht über die PRF-Erweiterung von WebAuthn: der Authentifikator des
// Geräts (Face ID, Touch ID, Windows Hello) leitet aus einem festen Salz und
// einem Geheimnis, das er nie herausgibt, immer dasselbe Schlüsselmaterial ab.
// Daraus wird ein AES-GCM-Schlüssel.
//
// Was dabei NICHT versprochen wird: Schutz gegen jemanden, der die Seite selbst
// verändert. Wer Code in die Origin einschleusen kann, kann auch die Entsperrung
// abwarten. Das schützt gegen ein verlorenes Gerät und gegen fremde Blicke,
// nicht gegen einen kompromittierten Server.
//
// Ohne Plattform-Authentifikator wird die Funktion gar nicht erst angeboten -
// eine Sperre, die sich mit einem Klick umgehen lässt, wäre ein Versprechen
// ohne Substanz.
(function (global) {
  'use strict';

  var SPEICHER = 'docuwunder.sperre';
  var RP_NAME = 'DocuWunder';

  function b64(buf) {
    var b = new Uint8Array(buf), s = '';
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s);
  }
  function ausB64(s) {
    var roh = atob(s), b = new Uint8Array(roh.length);
    for (var i = 0; i < roh.length; i++) b[i] = roh.charCodeAt(i);
    return b;
  }
  function zufall(n) { return global.crypto.getRandomValues(new Uint8Array(n)); }

  function gespeichert() {
    try { return JSON.parse(localStorage.getItem(SPEICHER) || 'null'); }
    catch (e) { return null; }
  }

  // Ist die Funktion auf diesem Gerät überhaupt verfügbar?
  //
  // Drei Bedingungen: WebAuthn vorhanden, ein Authentifikator im Gerät (kein
  // Sicherheitsstick, der auch mal zuhause liegt), und ein sicherer Kontext.
  // PRF selbst lässt sich erst beim Anlegen sicher feststellen.
  function moeglich() {
    if (!global.isSecureContext) return Promise.resolve(false);
    if (typeof global.PublicKeyCredential === 'undefined') return Promise.resolve(false);
    if (!global.crypto || !global.crypto.subtle) return Promise.resolve(false);
    if (!global.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      return Promise.resolve(false);
    }
    return global.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      .catch(function () { return false; });
  }

  function eingerichtet() { return !!gespeichert(); }

  // Aus dem PRF-Ergebnis einen AES-GCM-Schlüssel machen.
  function schluesselAus(material) {
    return global.crypto.subtle.importKey('raw', material, 'HKDF', false, ['deriveKey'])
      .then(function (basis) {
        return global.crypto.subtle.deriveKey(
          { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: new TextEncoder().encode('docuwunder-zugang') },
          basis, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
      });
  }

  function prfErgebnis(cred) {
    var e = cred.getClientExtensionResults();
    var r = e && e.prf && e.prf.results && e.prf.results.first;
    return r || null;
  }

  // Einrichten: Anmeldedaten anlegen, Schlüsselmaterial holen, Token damit
  // verschlüsseln. Der Token selbst verlässt den Browser nicht.
  function einrichten(token, benutzername) {
    var salz = zufall(32);
    return global.navigator.credentials.create({
      publicKey: {
        challenge: zufall(32),
        rp: { name: RP_NAME, id: location.hostname },
        user: { id: zufall(16), name: benutzername || 'DocuWunder', displayName: benutzername || 'DocuWunder' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'required',
        },
        timeout: 60000,
        extensions: { prf: { eval: { first: salz } } },
      },
    }).then(function (cred) {
      var material = prfErgebnis(cred);
      if (!material) {
        // Der Authentifikator kann kein PRF. Dann gäbe es nur eine Sperre ohne
        // Verschlüsselung - und die wird hier nicht angeboten.
        var e = new Error('Dieses Gerät unterstützt die nötige Verschlüsselung nicht.');
        e.name = 'PrfFehlt';
        throw e;
      }
      return schluesselAus(material).then(function (k) {
        var iv = zufall(12);
        return global.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: iv }, k, new TextEncoder().encode(token)
        ).then(function (geheim) {
          localStorage.setItem(SPEICHER, JSON.stringify({
            id: b64(cred.rawId), salz: b64(salz), iv: b64(iv), geheim: b64(geheim),
          }));
          return true;
        });
      });
    });
  }

  // Entsperren: Biometrie abfragen, Schlüsselmaterial holen, Token entschlüsseln.
  function entsperren() {
    var s = gespeichert();
    if (!s) return Promise.reject(new Error('Nicht eingerichtet.'));
    return global.navigator.credentials.get({
      publicKey: {
        challenge: zufall(32),
        allowCredentials: [{ type: 'public-key', id: ausB64(s.id), transports: ['internal'] }],
        userVerification: 'required',
        timeout: 60000,
        extensions: { prf: { eval: { first: ausB64(s.salz) } } },
      },
    }).then(function (cred) {
      var material = prfErgebnis(cred);
      if (!material) throw new Error('Das Gerät hat kein Schlüsselmaterial geliefert.');
      return schluesselAus(material);
    }).then(function (k) {
      return global.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ausB64(s.iv) }, k, ausB64(s.geheim));
    }).then(function (klar) {
      return new TextDecoder().decode(klar);
    });
  }

  function aufheben() { localStorage.removeItem(SPEICHER); }

  global.DWSperre = {
    moeglich: moeglich,
    eingerichtet: eingerichtet,
    einrichten: einrichten,
    entsperren: entsperren,
    aufheben: aufheben,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
