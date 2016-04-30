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

var pk = '';

function genApiKey() {

  var q = document.getElementById("qrcode");
  q.innerHTML = '';

  var skpk = nacl.sign.keyPair();
  var sk = ToHex(skpk.secretKey);
  pk = ToHex(skpk.publicKey);

  var theUrl = 'https://localhost:3000/api/localip/';

  $.ajax({
    url: theUrl,
    type: 'POST',
    success: function (data) {
      data = String(data);
      if (data.length < 100) {
        var q = document.getElementById("qrcode");
        q.innerHTML = '';
        ic = document.getElementById("innercontent");
        var skqr = "apikey:" + sk + "?" + data;
        ic.innerHTML = '<div class="content"><p style="word-break:break-all">' + sk + ' <button id="saveqrbutton" class="button-xsmall pure-button" onclick="saveApiKey()">Save</button></p></div>';
        new QRCode(q, skqr);
      } else {
        alert('no connection to wallet!');
      }
    },
    error: function (data) {

      alert('error contacting simplewallet, displaying sample data!'); //or whatever
      data = String('https://localhost:3000');
      if (data.length < 100) {
        var q = document.getElementById("qrcode");
        q.innerHTML = '';
        ic = document.getElementById("innercontent");
        var skqr = "apikey:" + sk + "?" + data;
        ic.innerHTML = '<div class="content"><p style="word-break:break-all">' + sk + ' <button id="saveqrbutton" class="button-xsmall pure-button" onclick="saveApiKey()">Save</button></p></div>';
        new QRCode(q, skqr);
      } else {
        alert('no connection to wallet!');
      }
    }
  });
}

function saveApiKey() {
  if (confirm('Save generated Api Key?')) {
    // Save it!
    var theUrl2 = 'https://localhost:3000/api/localsetapikey/';
    $.post(
      theUrl2,
      { apikey: pk },
      function (data) {
        data = String(data);
        if (data.length < 100) {
          alert('saved');
        } else {
          alert('no connection to wallet!');
        }
      }
    );
  } else {
    alert('not saved');
    // Do nothing!
  }
}