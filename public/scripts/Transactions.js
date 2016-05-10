var sampleData = [{ "destination": "me", "xmramount": 315.57, "time": "2016-04-21 20:39:04", "txid": "065b87fd5abe0128d790779d20a8e538cd0ca4299c85724b407f1ff5629d94ba", "_id": "065b87fd5abe0128d790779d20a8e538cd0ca4299c85724b407f1ff5629d94ba" },
    { "destination": "1H5gGeZPEHbCgCs5tWUwYedQ25H3FRNcRv", "btcamount": "0.001", "xmrtouuid": "xmrto-3sjXfh", "xmramount": 0.3, "xmraddr": "44TVPcCSHebEQp4LnapPkhb2pondb2Ed7GJJLc6TkKwtSyumUnQ6QzkCCkojZycH2MRfLcujCM7QR1gdnRULRraV4UpB5n4", "xmrpid": "15cf9ba32c5169b03bb2250051a2dd7ee94ec66c9410035e8f8c59e0352600ba", "time": "2016-04-06 22:32:52", "txid": "tx_hash", "_id": "tx_hash" },
    { "destination": "1H5gGeZPEHbCgCs5tWUwYedQ25H3FRNcRv", "btcamount": "0.001", "xmrtouuid": "xmrto-YXhBFT", "xmramount": 0.3, "xmraddr": "44TVPcCSHebEQp4LnapPkhb2pondb2Ed7GJJLc6TkKwtSyumUnQ6QzkCCkojZycH2MRfLcujCM7QR1gdnRULRraV4UpB5n4", "xmrpid": "dfc2ac8d9f473e2233c5b8883550a8219ff7115919299845681107bea738a70a", "time": "2016-04-06 22:33:58", "txid": "tx_key", "_id": "tx_key" },
    { "destination": "1H5gGeZPEHbCgCs5tWUwYedQ25H3FRNcRv", "btcamount": "0.001", "xmrtouuid": "xmrto-JTGkHp", "xmramount": 0.3, "xmraddr": "44TVPcCSHebEQp4LnapPkhb2pondb2Ed7GJJLc6TkKwtSyumUnQ6QzkCCkojZycH2MRfLcujCM7QR1gdnRULRraV4UpB5n4", "xmrpid": "0cb02adedfefbd197c3263be453f89e383b5782c32799c64dcc6c2086149b034", "time": "2016-04-06 22:35:31", "txid": "undefined", "_id": "undefined" }];

var Txn = React.createClass({

    render: function () {
        var address;
        if (this.props.destination == 'none') {
            address = this.props.xmraddr;
        } else {
            address = this.props.destination;
        }

        var classes = 'email-item pure-g';
        var content = "To: " + address;
        if (this.props.selected) {
            classes += ' email-item-selected';
            return (
                <div className={classes} onClick={this.props.on_click.bind(null) }>
                    <div className="pure-u" onClick={this.props.on_click.bind(null) }>
                        <h5 className="email-name">{this.props.time}</h5>
                        <h4 className="email-subject">{this.props.xmramount} XMR</h4>
                        <p className="email-desc">
                            <ul>
                                <li>DEST: {this.props.tx.destination}</li>
                                <li>XMR.TO: {this.props.tx.xmrtouuid}</li>
                                <li>HASH: {this.props.tx.txid}</li>
                            </ul>
                        </p>
                    </div>
                </div>
            );
        } else {
            return (
                <div className={classes} onClick={this.props.on_click.bind(null) }>
                    <div className="pure-u" onClick={this.props.on_click.bind(null) }>
                        <h5 className="email-name">{this.props.time}</h5>
                        <h4 className="email-subject">{this.props.xmramount} XMR</h4>
                        <p className="email-desc">
                            Destination: {address}
                        </p>
                    </div>
                </div>
            );
        }
    }
});

//Basically, I want a smooth e-mailish Txn List
//You click on the txn, and it opens more details
var TxnList = React.createClass({

    render: function () {

        var items = this.props.txns.map(function (txn, i) {
            return (
                <Txn
                    key={txn._id}
                    onClick={this.props.onTxnSelected.bind(null, i) }
                    on_click={this.props.onTxnSelected.bind(null, i) }
                    selected={this.props.selected === i}
                    time={txn.time}
                    tx={txn}
                    xmramount={txn.xmramount}
                    destination={txn.destination}
                    xmraddr={txn.xmraddr}
                    >
                    "tx"
                </Txn>
            );
        }, this);

        return (
            <div id="list" className="pure-u-1">
                {items}
            </div>
        );
    }
});

var App = React.createClass({
    getInitialState: function () {
        return { selected: 1 };
    },
    handleTxnSelected: function (index) {
        this.setState({ selected: index });
    },
    render: function () {
        return (
            //<div id="layout" className="content pure-g">
            <div className="pure-g-r id-layout">

                <TxnList txns={this.props.txns} selected={this.state.selected} onTxnSelected={this.handleTxnSelected} />

            </div>
        );
    }
});


document.getElementById("txnlink").onclick = writeTxns;

function writeTxns() {
    var ip = 'https://' + window.location.host;
    var route = '/api/mininero';
    var theUrl = ip + route;
    var token = sessionStorage.getItem('_sk');
    var issuetime = sessionStorage.getItem('issuetime');
    var timenow = mnw.now();
    var offset = parseInt(sessionStorage.getItem('offset'), 10);
    var timenow = String(mnw.Now() + offset);
    var salt2 = sessionStorage.getItem('salt2');
    var signature = mnw.Sign('transactions' + timenow, token);
    if (token != null & token != '') {
        spinner.spin(spint);
        $.ajax({
            type: "POST",
            url: theUrl,
            data: { "Type": "transactions", "timestamp": timenow, "salt2": salt2, "issuetime": issuetime, "signature": signature },
            success: function (data) {
                spinner.stop();
                document.getElementById("qrcode").innerHTML = '';
                document.getElementById('innercontent').innerHTML = '';
                ReactDOM.render(
                    <App txns={JSON.parse(data) } />,
                    document.getElementById('innercontent')
                )
            },
            error: function (data) {
                alert('error contacting simplewallet, displaying sample data!'); //or whatever
                document.getElementById("qrcode").innerHTML = '';
                document.getElementById('innercontent').innerHTML = '';
                spinner.stop();
                ReactDOM.render(
                    <App txns={sampleData} />,
                    document.getElementById('innercontent')
                )
            },
            timeout: 1000
        });
    }
}