var Txn = React.createClass({
    render: function () {
        var address;
        if (this.props.destination == 'none') {
            address = this.props.xmraddr;
        } else {
            address = this.props.destination;
        }

        var classes = 'email-item pure-g';
        if (this.props.selected) {
            classes += ' email-item-selected';
        }

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
                    props={txn.props}
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

var Component = React.createClass({
    iframe: function () {
        return {
            __html: this.props.iframe
        }
    },

    render: function () {
        return <div>
            <div dangerouslySetInnerHTML={ this.iframe() } />
        </div>;
    }
});

var iframe = '<div id="root"><iframe src="https://xmr.to/"></iframe></div>';

var TxnContent = React.createClass({
    render: function () {
        var address;
        if (this.props.txn.destination == 'none') {
            address = this.props.txn.xmraddr;
        } else {
            address = this.props.txn.destination;
        }

        var content = JSON.stringify(this.props.txn).split(",").join("\n");

        return (


            <div id="main" className="pure-u">
                <div className="email-content">
                    <div className="email-content-header pure-g">
                        <div className="pure-u">
                            <h1 className="email-content-title">{this.props.txn.time}</h1>
                            <p className="email-content-subtitle">
                                To: <a>{address}</a> amount: {this.props.txn.xmramount} <span> </span>
                            </p>
                        </div>
                    </div>


                </div>
                <div className="email-content-body">
                    {content}
                </div>
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
            <div className="pure-g-r content id-layout">

                <TxnList txns={this.props.txns} selected={this.state.selected} onTxnSelected={this.handleTxnSelected} />

                <TxnContent txn={this.props.txns[this.state.selected]} />
            </div>
        );
    }
});


document.getElementById("txnlink").onclick = writeTxns;

function writeTxns() {
    var theUrl = 'https://localhost:3000/api/localtransactions/';

    $.get(
        theUrl,
        function (data) {
            document.getElementById("qrcode").innerHTML = '';
            document.getElementById('innercontent').innerHTML = '';
            ReactDOM.render(
                <App txns={JSON.parse(data) } />,
                document.getElementById('innercontent')
            );
        }
    );
}