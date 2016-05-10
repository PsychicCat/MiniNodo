var nacl = require("tweetnacl");

var MNW = require('./MNW.js'), mnw = new MNW();

var salt1 = mnw.genSalt();
var pass = 'cat';
var ss = mnw.getSS(pass, salt1);
var salt2 = mnw.genSalt();
var time = mnw.now();
var ssk = mnw.genTokenClient(pass, salt1, salt2, time);
console.log('sk', ssk);
var ppk = mnw.genTokenServer(ss, salt2, time);
console.log('pk', ppk);

var skpk = nacl.sign.keyPair();
//ssk = mnw.ToHex(skpk.secretKey);
//ppk = mnw.ToHex(skpk.publicKey);
var mess = 'address' + time;
var signature = mnw.Sign(mess, ssk);
console.log(signature);
console.log(mnw.Verify(mess, signature, ppk));

