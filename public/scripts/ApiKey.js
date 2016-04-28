document.getElementById("apilink").onclick = genApiKey;

function decimalToHex(d, padding) {
  var hex = Number(d).toString(16);
  padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;
  while (hex.length < padding) {
    hex = "0" + hex;
  }
  return hex;
}

function ToHex(sk) {
  var i, s = [];
  for (i = 0; i < sk.length; i++) s.push(decimalToHex(sk[i], 2));
  return s.join('');
}

function genApiKey() {

  var q = document.getElementById("qrcode");
  q.innerHTML = '';
  
  var skpk = nacl.sign.keyPair();
  var sk = ToHex(skpk.secretKey);
  
  ic = document.getElementById("innercontent");
  ic.innerHTML = '<div class="content"><p style="word-break:break-all">' + sk + ' <button id="saveqrbutton" class="button-xsmall pure-button" onclick="saveApiKey()">Save</button></p></div>';
  new QRCode(q, sk);
}

function saveApiKey() {
  if (confirm('Save generated Api Key?')) {
    // Save it!
    alert('saved');
     } else {
    alert('not saved');
    // Do nothing!
    }
}