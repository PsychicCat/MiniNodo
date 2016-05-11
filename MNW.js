'use strict';

var nacl = require("tweetnacl");
var naclutil = require("tweetnacl-util");

class MNW {
  constructor() {
    
  }
}

MNW.prototype.genSalt = function() {
    return this.ToHex(nacl.randomBytes(32));
}

MNW.prototype.Sign = function (m, sk) {
    return this.ToHex(nacl.sign.detached(this.FromString(m), this.FromHex(sk)));
}

MNW.prototype.Verify = function (m, signature, pk) {
    return nacl.sign.detached.verify(this.FromString(m), this.FromHex(signature), this.FromHex(pk));
}


//helper functions - I assume there is a better place to put these..
MNW.prototype.decimalToHex = function(d, padding) {
    var hex = Number(d).toString(16);
    padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;
    while (hex.length < padding) {
        hex = "0" + hex;
    }
    return hex;
}

//input is hex, output is string
MNW.prototype.ToHex = function (sk) {
    var i, s = [];
    for (i = 0; i < sk.length; i++) s.push(this.decimalToHex(sk[i], 2));
    return s.join('');
}

//input is string, output is hex array
MNW.prototype.FromHex = function (sk) {
    var b = new Uint8Array(sk.length / 2);
    for (var i = 0; i < 2 * b.length; i += 2) {
        b[i / 2] = parseInt(sk.substring(i, i + 2), 16);
    }
    return b;
}

//epoch time (as a string)
MNW.prototype.now = function () {
    return String(Math.floor((new Date).getTime() / 1000));
}

//epoch time as int
MNW.prototype.Now = function () {
    return Math.floor((new Date).getTime() / 1000);
}

//like FromHex but inputting arbitrary string
MNW.prototype.FromString = function (s) {
  return naclutil.decodeUTF8(s);
}

MNW.prototype.ToString = function (s) {
  return naclutil.encodeUTF8(s);
}

//gets server stored password..
MNW.prototype.getSS = function(password, salt1) {
  return this.ToHex(nacl.hash(this.FromString(password + salt1))).substring(0, 64);
}

//takes as input 'salt1' which is a 32 byte string
MNW.prototype.genTokenClient = function(password, salt1, salt2, time) {
  var ss = this.getSS(password, salt1);
    //for testing
  console.log('time', time);
  console.log('salt1', salt1);
  console.log('salt2', salt2);
  console.log('ss', ss);
  var token = nacl.hash(this.FromString(ss + time + salt2)).slice(0, 32);
  console.log("length", token.length);
  var skpk = nacl.sign.keyPair.fromSeed(token);
  return this.ToHex(skpk.secretKey);
}

MNW.prototype.genTokenServer = function (ss, salt2, time) {
  //for testing
  console.log('time', time);
  console.log('salt2', salt2);
  console.log('ss', ss);
  var token = nacl.hash(this.FromString(ss + time + salt2)).slice(0,32);
  var skpk = nacl.sign.keyPair.fromSeed(token);
  return this.ToHex(skpk.publicKey);
}

MNW.prototype.encrypt = function(m, tk) {
  var nonce = '';
  nonce = this.getSS(m, this.ToHex(nacl.randomBytes(32))).substring(0, 48);
  return this.ToHex(nacl.secretbox(this.FromString(m), this.FromHex(nonce), this.FromHex(tk)));
}

MNW.prototype.decrypt = function (c, nonce, tk) {
  return ToString(nacl.secretbox.open(FromHex(c), this.FromHex(nonce), this.FromHex(tk)));
}

MNW.prototype.parseQuery = function(body, qstr) {
    //var query = {};
    var a = qstr.split('&');
    for (var i = 0; i < a.length; i++) {
        var b = a[i].split('=');
        body[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
        console.log("found field:" + decodeURIComponent(b[0]));
    }
    return body;
}

MNW.prototype.createResponse = function(bodyObject) {
    var a = "&";
    var rv = "";
    for (var key in bodyObject) {
        rv = rv + key + "=" + bodyObject[key] + "&";
    }
    return rv;
}

MNW.prototype.dataDecrypted = function (body) {
    var a = nacl.secretbox.open(this.FromHex(body.cipher), this.FromHex(body.nonce), this.FromHex(MiniNeroPk));
    return this.parseQuery(body, naclutil.encodeUTF8(a));
}


//Encrypt json
MNW.prototype.dataEncrypted = function (message, passthrough) {
    if (passthrough == false) {
        return message;
    } else {
        var nonce = this.now();
        while (nonce.length < 48) {
            nonce = "0" + nonce;
        }
        var keypair = nacl.sign.keyPair.fromSeed(this.FromHex(MiniNeroPk));
        var encrypted = nacl.secretbox(naclutil.decodeUTF8(message), this.FromHex(nonce), this.FromHex(MiniNeroPk));
        var jsonReturn = { "cipher": this.ToHex(encrypted), "nonce": nonce };
        return this.createResponse(jsonReturn);
    }
}


module.exports = MNW;