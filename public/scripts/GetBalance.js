document.getElementById("balancelink").onclick = writeBalance;

//put it in the qrcode to be centered
//replace with async request..
function writeBalance() {
  var ip = 'https://' + window.location.host;
  var route = '/api/mininero';
  var theUrl = ip + route;
  var token = sessionStorage.getItem('_sk');
  var issuetime = sessionStorage.getItem('issuetime');
  var timenow = mnw.now();
  var offset = parseInt(sessionStorage.getItem('offset'), 10);
  var timenow = String(mnw.Now() + offset);
  var salt2 = sessionStorage.getItem('salt2');
  var signature = mnw.Sign('balance' + timenow, token);
  if (token != null & token != '') {
    spinner.spin(spint);
    $.ajax({
      type: "POST",
      url: theUrl,
      data: { "Type": "balance", "timestamp": timenow, "salt2": salt2, "issuetime": issuetime, "signature": signature },
      success: function (data) {
        spinner.stop();
        data = String(data);
        if (data.length < 32) {
          document.getElementById('balance').innerHTML = data + ' XMR';
        } else {
          alert('no connection to wallet!');
        }
      },
      error: function (data) {
        spinner.stop();
        alert('no connection to wallet!');
      },
      timeout: 1000
    });
  }
}

//check balance on launch...
//writeBalance();