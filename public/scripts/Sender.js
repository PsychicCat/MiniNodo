

var Sender = React.createClass({

    getInitialState: function() {
        return { amount: '', destination: '', pid: '' };
    },
    
    goToTxns: function() {
        window.alert('Check Transactions');
        $.getScript("scripts/Transactions.js", function(){
              writeTxns();
        });
    },

    send: function() {
        console.log('attempting');
        console.log(this.state.destination);
        var theURLSend = 'https://localhost:3000/api/localsendbtc/';
        if (this.state.destination.length > 40) {
            theURLSend = 'https://localhost:3000/api/localsendxmr/';
        } else {
            theURLSend = 'https://localhost:3000/api/localsendbtc/';
        }
         console.log('attempting2');       
        var thedata = {destination:this.state.destination, amount:this.state.amount};
        if (this.state.pid != '') {
            thedata = {destination:this.state.destination, amount:this.state.amount, pid:this.state.pid};
        } else {
            thedata = {destination:this.state.destination, amount:this.state.amount};
        }
                 console.log('attempting3');       
        if (window.confirm('Are you sure?')) {
            $.ajax({
                url: theURLSend,
                dataType: 'json',
                type: 'POST',
                data: thedata,
                success: function(data) {
                    this.goToTxns();                                    
                }.bind(this),
                error: function(xhr, status, err) {
                    this.goToTxns();
                }.bind(this)
                
            });
        }
    },

    saveAddress: function() {
        window.alert('Address book not yet implemented in MiniNero Web');
    },

    handleChangeDestination: function(event) {
        this.setState({ destination: event.target.value});
        //window.alert('changed destination');
    },

    handleChangeAmount: function(event) {
        this.setState({ amount: event.target.value});
        //window.alert('changed amount');
    },

    handleChangePID: function(event) {
        this.setState({ pid: event.target.value});
        //window.alert('changed pid');
    },

    render: function() {


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
    document.getElementById("qrcode").innerHTML = '';
    ReactDOM.render(
        <Sender />,
        document.getElementById('innercontent')
    );
}





