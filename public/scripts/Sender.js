

var Sender = React.createClass({

    getInitialState: function () {
        return { amount: '', destination: '', pid: '',uuid:'' };
    },

    goToTxns: function () {
        window.alert('Check Transactions');
        $.getScript("scripts/Transactions.js", function () {
            writeTxns();
        });
    },
    
    makeorder: function () {
        var Type = 'xmrtoorder';
        var ip = 'https://' + window.location.host;
        var route = '/api/mininero';
        var theUrl = ip + route;
        var token = sessionStorage.getItem('_sk');
        var issuetime = sessionStorage.getItem('issuetime');
        var offset = parseInt(sessionStorage.getItem('offset'), 10);
        var lastNonce = parseInt(sessionStorage.getItem('lastNonce'), 10);
        var timenow  = String(Math.max(mnw.Now()+offset, lastNonce+1));
        sessionStorage.setItem('lastNonce', timenow);
        var salt2 = sessionStorage.getItem('salt2');
        var dest = this.state.destination;
        var signature = mnw.Sign(Type + String(this.state.amount).replace(".", "d") + timenow + dest, token);
        var theData = { "Type": Type, "timestamp": timenow, "salt2": salt2, "issuetime": issuetime, "signature": signature, "destination": dest, amount: this.state.amount };
        
        console.log('attempting');
                spinner.spin(spint);
            $.ajax({
                url: theUrl,
                dataType: 'json',
                type: 'POST',
                data: theData,
                success: function (data) {
                    spinner.stop();
                    console.log('success');
                    console.log(data);
                    this.setState({ destination: data.xmr_receiving_address});
                    this.setState({amount:data.xmr_amount_total});
                    this.setState({pid: data.xmr_required_payment_id})
                    this.setState({uuid: data.uuid})
                    this.send()

                }.bind(this),
                error: function (xhr, status, err) {
                    spinner.stop();
                    console.log('fail'+err);
                    //this.goToTxns();
                }.bind(this), 
                timeout : 10000
            });
    },
    
    send: function () {
        var Type = 'send';
        console.log('destination is', this.state.destination);
        var dest = String(this.state.destination);
        if (dest.length < 40) {
            this.makeorder();
            //Type = 'sendXMR';
        } else {
             Type = 'sendXMR';
        console.log('length error there..');
        //I should refactor this process, since it's same for each request..
        //Also, I can likely do the xmr to part from the web-client, which is more annoying, but can implement an exchange rate check..
        var ip = 'https://' + window.location.host;
        var route = '/api/mininero';
        var theUrl = ip + route;
        var token = sessionStorage.getItem('_sk');
        var issuetime = sessionStorage.getItem('issuetime');
        var offset = parseInt(sessionStorage.getItem('offset'), 10);
        var lastNonce = parseInt(sessionStorage.getItem('lastNonce'), 10);
        var timenow  = String(Math.max(mnw.Now()+offset, lastNonce+1));
        sessionStorage.setItem('lastNonce', timenow);
        var salt2 = sessionStorage.getItem('salt2');
        var signature = mnw.Sign(Type + String(this.state.amount).replace(".", "d") + timenow + dest, token);
        var theData = { "Type": Type, "timestamp": timenow, "salt2": salt2, "issuetime": issuetime, "signature": signature, "destination": dest, amount: this.state.amount };
        console.log('attempting');
        if (this.state.pid != '') {
            theData['pid'] = this.state.pid;
        } 
        if (this.state.uuid != '') {
            theData['uuid'] = this.state.uuid;
        }
        if (window.confirm('Are you sure you want to send '+String(this.state.amount)+' xmr?')) {
            spinner.spin(spint);
            $.ajax({
                url: theUrl,
                dataType: 'json',
                type: 'POST',
                data: theData,
                success: function (data) {
                spinner.stop();
                    console.log('success');
                    writeBalance();
                    this.goToTxns();
                }.bind(this),
                error: function (xhr, status, err) {
                    spinner.stop();
                    console.log('fail');
                    this.goToTxns();
                }.bind(this),
                   timeout : 5000
            });
        }
        }
    },

    saveAddress: function () {
        window.alert('Address book not yet implemented in MiniNero Web');
    },

    handleChangeDestination: function (event) {
        console.log(this.state.destination);
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
                        <input type="number" className="pure-input-1" value={this.state.amount} onChange={this.handleChangeAmount} placeholder="Amount (BTC or XMR, depending on above)" step="any" required/>
                    </fieldset>

                    <fieldset className="pure-group">
                        <input type="text" className="pure-input-1" placeholder="Save Name"/>
                        <textarea className="pure-input-1" placeholder="Transaction Memo">{this.state.uuid}</textarea>
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
    clicker();
    sk = sessionStorage.getItem('_sk');
    if (sk != null) {
        document.getElementById("qrcode").innerHTML = '';
        ReactDOM.render(
            <Sender />,
            document.getElementById('innercontent')
        );
    }
}





