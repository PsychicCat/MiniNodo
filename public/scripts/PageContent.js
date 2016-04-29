var PageContent = React.createClass({

    render: function () {

        return (
            <div className="content">
                <h2 className="content-subhead">Welcome! </h2>
                <p>
                    MiniNero Web provides simple management for your Monero Mobile Wallet.
                    Right now, this is set-up to only allow actual access via localhost.
                    In the future, I will replace that with a password option, so you will be able 
                    to manage your node on the go, via the web-interface.
                    </p><p>
                    Additionally, this web-app will help set-up your mobile wallet.
                    All you have to do is scan the qr code in the Api-key tab.
                </p>

                <h2 className="content-subhead">Getting Started</h2>
                <p>
                    The first thing you need to do is to click on the Api Key link in the side-bar
                    and scan the qr code into your mobile app.You should not share the scanned qr code or the api-key at the top of that screen, as these will be your secret key
                    for communicating with the server.Once you have scanned qr and gotten your secret key into your mobile app, you should be able to send Monero, and Monero to Bitcoin from anywhere in the world (as long as you keep your server running).
                </p>
                
                <h2 className="content-subhead">SSL Certificate</h2>
                <p>
                If you find yourself frequently using this, you can add the generated cert.p12 to your web-browser key store (Change the p12 password if desired). 
                </p>

                <h2 className="content-subhead">More help</h2>
                <p>
                    The author can be contacted at shen.noether @gmx.com or at /u/NobleSir on reddit.
                    This software is provided free-of-charge and you use it at your own risk.
                </p>
            </div>
        );
    }
});


document.getElementById("homelink").onclick = writeHome;

function writeHome() {
    document.getElementById("qrcode").innerHTML = '';
    document.getElementById("innercontent").innerHTML='';

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
