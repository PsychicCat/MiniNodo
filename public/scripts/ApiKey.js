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

var pk = '';//this will be the new MiniNeroPk..

function genApiKey() {
  var token = sessionStorage.getItem('_sk');
  if (token != null & token != '') {
    //fix for more even css
    var q = document.getElementById("qrcode");
    q.innerHTML = '';
    var skpk = nacl.sign.keyPair();
    var sk = ToHex(skpk.secretKey);
    pk = ToHex(skpk.publicKey);
    var ip = 'https://' + window.location.host;
    var q = document.getElementById("qrcode");
    q.innerHTML = '';
    ic = document.getElementById("innercontent");
    var skqr = "apikey:" + sk + "?" + ip;
    ic.innerHTML = '<div class="content"><p style="word-break:break-all">' + sk + ' <button id="saveqrbutton" class="button-xsmall pure-button" onclick="saveApiKey()">Save</button></p></div>';
    new QRCode(q, skqr);
  }
}

function saveApiKey() {
  if (confirm('Save generated Api Key?')) {
    // Save it!
    var ip = 'https://' + window.location.host;
    var route = '/api/mininero';
    var theUrl = ip + route;
    var token = sessionStorage.getItem('_sk');
    var time = sessionStorage.getItem('time');
    var offset = sessionStorage.getItem('offset');
    var timenow = String(mnw.Now()+offset);
    var salt2 = sessionStorage.getItem('salt2');
    var signature = mnw.Sign('apikey' + timenow + pk, token);
    if (token != null & token != '') {
      spinner.spin(spint);
      $.ajax({
        type: "POST",
        url: theUrl,
        data: { "Type": "apikey", "timestamp": timenow, "salt2": salt2, "issuetime": time, "signature": signature, apikey: pk },
        success: function (data) {
          spinner.stop();
          alert(data);
        },
        error: function (data) {
          spinner.stop();
          alert('error saving apikey!');
        },
        timeout: 1000 // sets timeout to 3 seconds
      });
    }
  }
}