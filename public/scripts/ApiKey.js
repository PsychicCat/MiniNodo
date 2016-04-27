


function decimalToHex(d, padding) {
  var hex = Number(d).toString(16);
  padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;
  while (hex.length < padding) {
    hex = "0" + hex;
  }
  return hex;
}

var ToHex = function (sk) {
  var i, s = [];
  for (i = 0; i < sk.length; i++) s.push(decimalToHex(sk[i], 2));
  return s.join('');
}



document.getElementById("apilink").onclick = writeApiKey;


function writeApiKey() {
  skpk = nacl.sign.keyPair();
  sk = ToHex(skpk.secretKey);
  ic = document.getElementById("innercontent");
  ic.innerHTML = '';
  qr = document.getElementById("qrcode");
  qr.innerHTML = '';
  new QRCode(qr, sk);
  
  ic.innerHTML='<div class="content"><p style="word-break:break-all">'+sk+'</p></div>';
  return false;
}
