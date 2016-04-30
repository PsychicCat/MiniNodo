//under construction



document.getElementById("loginlink").onclick = writeMain;

//put it in the qrcode to be centered
function writeSend() 
{
  ReactDOM.render(
    <Sender />,
    document.getElementById('innercontent')
  );
}