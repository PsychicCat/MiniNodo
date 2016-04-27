var PageContent = React.createClass({
  
    render: function () {
    
        return (
        <div className="content">
            <h2 className="content-subhead">Welcome! (MiniNero Web is under construction and not currently operational)</h2>
            <p>
            MiniNero Web provides simple management for your Monero Mobile Wallet. 
            It is recommended not to run this web-app over the internet, and only to use
            the actual apps (MiniNero Universal/ MiniNero Droid / MiniNero iOS) when on the go. 
            However, this web-app may be useful for connecting to your MiniNero Node, 
            setting up your api-key, sending transactions from your home computer, and more.
            Your address book can also be synced from here to your mobile apps, if desired. 
            </p>

            <h2 className="content-subhead">Getting Started</h2>
            <p>
            The first thing you need to do is to click on the Api Key link in the side-bar
            and scan the qr code into your mobile app. You should not share the scanned qr code or the api-key at the top of that screen, as these will be your secret key 
            for communicating with the server. Once you have scanned qr and gotten your secret key into your mobile app, you should be able to send Monero, and Monero to Bitcoin from anywhere in the world (as long as you keep your server running).
            </p>

            <h2 className="content-subhead">More help</h2>
            <p>
            The author can be contacted at shen.noether@gmx.com or at /u/NobleSir on reddit. 
            This software is provided free-of-charge and you use it at your own risk.  
            </p>
        </div>
        );
    }
});


document.getElementById("homelink").onclick = writeHome;

function writeHome() 
{
document.getElementById("qrcode").innerHTML = '';
  ReactDOM.render(
    <PageContent />,
    document.getElementById('innercontent')
  );
}

//Also load it on start..
ReactDOM.render(
    <PageContent />,
    document.getElementById('innercontent')
  );
