document.getElementById("balancelink").onclick = writeBalance;

//put it in the qrcode to be centered
function writeBalance() {
  var theUrl = 'https://localhost:3000/api/localbalance/';
  $.get(
    theUrl,
    function (data) {
      data = String(data);
      if (data.length < 32) {
        document.getElementById('balance').innerHTML = data+' XMR';
      } else {
        alert('no connection to wallet!');
      }
    }
  );
}

//check balance on launch...
writeBalance();