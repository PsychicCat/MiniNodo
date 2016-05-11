

var Sender = React.createClass({

    getInitialState: function () {
        return { amount: '', destination: '', pid: '' };
    },

    goToTxns: function () {
        window.alert('Check Transactions');
        $.getScript("scripts/Transactions.js", function () {
            writeTxns();
        });
    },

    send: function () {
        var Type = 'send';
        if (this.state.destination.length > 40) {
            Type = 'sendXMR';
        }
        //I should refactor this process, since it's same for each request..
        //Also, I can likely do the xmr to part from the web-client, which is more annoying, but can implement an exchange rate check..
        var ip = 'https://' + window.location.host;
        var route = '/api/mininero';
        var theUrl = ip + route;
        var token = sessionStorage.getItem('_sk');
        var issuetime = sessionStorage.getItem('issuetime');
        var offset = parseInt(sessionStorage.getItem('offset'), 10);
        var timenow = String(mnw.Now() + offset);
        var salt2 = sessionStorage.getItem('salt2');
        var signature = mnw.Sign(Type + String(this.state.amount).replace(".", "d") + timenow + this.state.destination);
        var theData = { "Type": Type, "timestamp": timenow, "salt2": salt2, "issuetime": issuetime, "signature": signature, destination: this.state.destination, amount: this.state.amount };
        if (this.state.pid != '') {
            theData.push({ pid: this.state.pid });
        }
        if (window.confirm('Are you sure?')) {
            $.ajax({
                url: theUrl,
                dataType: 'json',
                type: 'POST',
                data: theData,
                success: function (data) {
                    this.goToTxns();
                }.bind(this),
                error: function (xhr, status, err) {
                    this.goToTxns();
                }.bind(this)
            });
        }
    },

    saveAddress: function () {
        window.alert('Address book not yet implemented in MiniNero Web');
    },

    handleChangeDestination: function (event) {
        this.setState({ destination: event.target.value });
        //window.alert('changed destination');
    },

    handleChangeAmount: function (event) {
        this.setState({ amount: event.target.value });
    },

    handleChangePID: function (event) {
        this.setState({ pid: event.target.value });
    },

    render: function () {

        return (
            <div className="content">
                <h2 className="content-subhead">Send Coins</h2>
                <form className="pure-form">
                    <fieldset className="pure-group">
                        <input type="text" className="pure-input-1" value={this.state.destination} onChange={this.handleChangeDestination} placeholder="Destination (BTC or XMR)" required/>
                        <input type="text" className="pure-input-1" value={this.state.pid} onChange={this.handleChangePID} placeholder="PID"/>
                        <input type="number" className="pure-input-1" value={this.state.amount} onChange={this.handleChangeAmount} placeholder="Amount" step="any" required/>
                    </fieldset>

                    <fieldset className="pure-group">
                        <input type="text" className="pure-input-1" placeholder="Save Name"/>
                        <textarea className="pure-input-1" placeholder="Transaction Memo"></textarea>
                    </fieldset>
                    <button onClick={this.saveAddress} className="pure-button pure-input-1 pure-button-primary">Save Address</button>
                    <button onClick={this.send} className="pure-button pure-input-1 pure-button-primary">Send</button>
                </form>
            </div>
        );
    }
});

document.getElementById("sendlink").onclick = writeSend;

//put it in the qrcode to be centered
function writeSend() {
    sk = sessionStorage.getItem('_sk');
    if (sk != null) {
        document.getElementById("qrcode").innerHTML = '';
        ReactDOM.render(
            <Sender />,
            document.getElementById('innercontent')
        );
    }
}





