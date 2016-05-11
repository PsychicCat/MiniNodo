
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

document.getElementById("addresslink").onclick = writeAddress;

function writeAddress() {
  var ip = 'https://' + window.location.host;
  var route = '/api/mininero';
  var theUrl = ip + route;
  var token = sessionStorage.getItem('_sk');
  var issuetime = sessionStorage.getItem('issuetime');
  var timenow = mnw.now();
  var offset = parseInt(sessionStorage.getItem('offset'), 10);
  var timenow = String(mnw.Now()+offset);
  var salt2 = sessionStorage.getItem('salt2');
  var signature = mnw.Sign('address' + timenow, token);
  if (token != null & token != '') {
    spinner.spin(spint);
    $.ajax({
      type: "POST",
      url: theUrl,
      data: { "Type": "address", "timestamp": timenow, "salt2": salt2, "issuetime": issuetime, "signature": signature },
      success: function (data) {
        spinner.stop();
        addy = String(data);
        if (addy == '') {
          addy = String('Failed to contact simplewallet');
        }
        ic = document.getElementById("innercontent");
        ic.innerHTML = '';
        qr = document.getElementById("qrcode");
        qr.innerHTML = '';
        new QRCode(qr, "monero:" + addy);

        ic.innerHTML = '<div class="content"><p style="word-break:break-all">' + addy + '</p></div>';
      },
      error: function (data) {
        spinner.stop();
        addy = String('Failed to contact simplewallet');
        ic = document.getElementById("innercontent");
        ic.innerHTML = '';
        qr = document.getElementById("qrcode");
        qr.innerHTML = '';
        new QRCode(qr, "monero:" + addy);

        ic.innerHTML = '<div class="content"><p style="word-break:break-all">' + addy + '</p></div>';
      },
      timeout: 5000 // sets timeout to 3 seconds
    });
  }
}