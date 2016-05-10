var Txn = React.createClass({
    render: function () {
        var classes = "email-item pure-g";
        if (this.props.selected) {
            classes += " email-item-selected";
            return (
                <div className={classes} onClick={this.props.on_click.bind(null)} >
                    <div className="pure-u">
                        <h5 className="email-name">{this.props.tx.time}</h5>
                        <h4 className="email-subject">{this.props.tx.xmramount} XMR</h4>
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
        } 
        else 
        {
        return (
            <div className={classes} onClick={this.props.on_click.bind(null)} >
                    <div className="pure-u">
                        <h5 className="email-name">{this.props.tx.time}</h5>
                        <h4 className="email-subject">{this.props.tx.xmramount} XMR</h4>
                    </div>
                </div>
            );
        }
    }
});

var TxnList = React.createClass({

    render: function () {

        var items = this.props.txns.map(function (txn, i) {
            return (
                <Txn tx={txn} 
                    on_click={this.props.onTxnSelected.bind(null, i) }
                    selected={this.props.selected === i}  
                ></Txn>
            );
        }, this);

        return (
            <div className="pure-u-1">
                {items}
            </div>
        );
    }
});
var App = React.createClass({
    getInitialState: function () {
        return { selected: 0 };
    },
    handleTxnSelected: function (index) {
        this.setState({ selected: index });
    },
    render: function () {
        return (
            <TxnList txns={this.props.txns} selected={this.state.selected} onTxnSelected={this.handleTxnSelected} />
        );
    }
});
    
ReactDOM.render(
  <App txns={sampleData}/>,
  document.getElementById("list")
);