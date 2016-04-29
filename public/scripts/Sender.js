var Sender = React.createClass({

    send: function () {
        $.ajax({
            url :'https://localhost:3000/api/localbalance/',
            dataType: 'json',
            type: 'POST',
            data: {
            success: function (data) {
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {


        return (
            <div className="content">
                <h2 className="content-subhead">Send Coins</h2>
                <form className="pure-form">
                    <fieldset className="pure-group">
                        <input type="text" className="pure-input-1" placeholder="Destination (BTC or XMR)" />
                        <input type="text" className="pure-input-1" placeholder="PID"/>
                        <input type="email" className="pure-input-1" placeholder="Amount"/>
                    </fieldset>

                    <fieldset className="pure-group">
                        <input type="text" className="pure-input-1" placeholder="Save Name"/>
                        <textarea className="pure-input-1" placeholder="Transaction Memo"></textarea>
                    </fieldset>
                    <button  className="pure-button pure-input-1 pure-button-primary">Save Address</button>
                    <button onclick={this.send} className="pure-button pure-input-1 pure-button-primary">Send</button>
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





