var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var nacl = require("tweetnacl");
var naclutil = require("tweetnacl-util");
var request = require('request');
var request2 = require('request');
var Datastore = require('nedb')
    , db = new Datastore({ filename: 'txndb', autoload: true });
var MNW = require('../MNW.js'), mnw = new MNW();
var nconf = require('nconf');
var fs = require('fs');
nconf.argv().env().file({ file: 'config.json' });
    
//var moneroWallet = require('monero-nodejs');
var moneroWallet = require('../monero-nodejs.js');
var simplewalletport = parseInt(nconf.get("simplewallet:port"), 10);
var Wallet = new moneroWallet('localhost', simplewalletport);

var ip = require("ip");

var TOKENTIMEOUT = 60 * 60; //timeout tokens for mininero web (change if desired)
var TIMEOUT = 300; //requests must have been made within last TIMEOUT seconds.. this avoids a scenario where someone mitm you, and you change your mind, after they hold your transaction..

//this is set in the request for now and doesn't affect https
var useEncryption = false; 

const xmr2btc = require('xmrto-api')
const xmrTo = new xmr2btc();

var setPk = function (pk) {
    //replace with qr in web-browser
    nconf.set('MiniNeroPk:key', pk);
    nconf.save(function (err) {
        fs.readFile('config.json', function (err, data) {
            console.dir(JSON.parse(data.toString()))
        });
    });
}

var sessionStart = '';
var sessionPk = '';

//move to mnw later..
var Verifier = function (body) {
    if (body.timestamp == null) {
        console.log('no timestamp');
        return false;
    }
    if (isNaN(body.timestamp)) {
        console.log('isNaN');
        lastNonce = parseInt(nconf.get("lastNonce:nonce"), 10);
        console.log('lastnonce', lastNonce);
        return false;
    }
    var timestampi = parseInt(body.timestamp, 10);
    lastNonce = parseInt(nconf.get("lastNonce:nonce"), 10);

    //Note,that this could be messed up by server offset.. 
    //increment nonce condition
    if (timestampi <= lastNonce) {
        console.log('bad nonce');
        console.log('last nonce', lastNonce);
        console.log('timestamp', timestampi);
        return false;
    } else {
        nconf.set('lastNonce:nonce', timestampi);
    }

    //timeout condition
    if (timestampi - mnw.Now() > TIMEOUT) {
        console.log('timeout');
        console.log('last nonce', mnw.Now());
        console.log('timestamp', timestampi);
        return false;
    } else {
        console.log('last nonce', mnw.Now());
        console.log('timestamp', timestampi);
    }

    //verify signature
    var m = body.Type;
    if (body.amount != null) {
        m = m + body.amount.replace(".", "d");
    }
    m = m + body.timestamp;
    if (body.destination != null) {
        m = m + body.destination;
    }
    if (body.apikey != null) {
        m = m + body.apikey;
    }
    var key = MiniNeroPk;
    if (body.salt2 != null) {
        ss = nconf.get('ss:key');
        //note the two different timestamps..
        if (body.issuetime == null) {
            return false;
        } else if (Math.abs(parseInt(body.issuetime, 10) - mnw.now()) > TOKENTIMEOUT) {
            console.log('tokentimeout');
            return false;
        }
        key = mnw.genTokenServer(ss, body.salt2, body.issuetime);
    }
    var ver = mnw.Verify(m, body.signature, key);
    if (ver) {
        console.log('verified!');
        return true;
    } else {
        console.log('not verified!');
        return false;
    }
}

var appRouter = function (app) {

    //after login... 
    app.get('/', function (req, res) {
        data = fs.readFile('public/mininero.html', function (err, data) {
            res.setHeader('Content-Type', 'text/html');
            res.send(data);
        });
    });

    //get salt 1...
    app.get('/api/salt1/', function (req, res) {
        console.log('salt1 request');
        var salt1 = nconf.get("salt1:key");
        var lastNonce = nconf.get("lastNonce:nonce") ;
        
        if (isNaN(lastNonce)) {
            lastNonce = mnw.now();
            console.log('saving last nonce as ', lastNonce);
            nconf.set('lastNonce:nonce', lastNonce);
            nconf.save(function (err) {
                console.log('error saving to config...');
            });
        } else {
            lastNonce = parseInt(lastNonce, 10);
        }
        
        var m = salt1+','+mnw.now()+','+lastNonce;
        console.log(m);
        return res.send(m);
    });

    //basic timestamping
    app.get("/api/mininero/", function (req, res) {
        var seconds = mnw.now();
        res.send(seconds);
    });

    //txn webivew
    app.post("/mininero/", function (req, res) {
        console.log("request for txn webview");
        var useEncryption = false;
        if (req.body.cipher) {
            req.body = mnw.dataDecrypted(req.body);
            useEncryption = true;
        }
        if (Verifier(req.body)) {
            //do a string replace here..
            data = fs.readFile('public/txns.html', function (err, data) {
                res.setHeader('Content-Type', 'text/html');
                res.send(data);
            });
        } else {
            return res.send('error!');
        }
    });

    app.post("/api/mininero/", function (req, res) {
        console.log(req.body);

        var useEncryption = false;
        if (req.body.cipher) {
            req.body = mnw.dataDecrypted(req.body);
            useEncryption = true;
        }

        if (!Verifier(req.body)) {
            return res.send('error!');
        } else {
            if (req.body.Type == "address") {
                console.log('address request');
                Wallet.address().then(function (addy) {
                    console.log(addy.address);
                    return res.send(mnw.dataEncrypted(String(addy.address), useEncryption));
                });
            } else if (req.body.Type == "balance") {
                console.log("getting balance");
                Wallet.balance().then(function (balance) {
                    balanceUsual = String(balance.balance / 1000000000000);
                    return res.send(mnw.dataEncrypted(balanceUsual, useEncryption));
                });
            } else if (req.body.Type == "apikey") {
                console.log("set api key request");
                apipk = req.body.apikey;
                console.log("new apikey", apipk);
                setPk(apipk);
                return res.send(mnw.dataEncrypted("Success!", useEncryption));
            } else if (req.body.Type == "transactions") {
                db.find({}).sort({ time: -1 }).exec(function (err, docs) {
                return res.send(mnw.dataEncrypted(JSON.stringify(docs), useEncryption)); });
             } else if (req.body.Type == "xmrtoorder") {
                dest = req.body.destination;
                amount = req.body.amount;
                var uuid = 'none';
                xmrTo.createOrder(req.body.amount, req.body.destination).then(function(order){
                    console.log(order);
                    uuid = order.uuid;
                    setTimeout(function () {
                        xmrTo.queryOrder(uuid).then(function(qorder){
                            console.log(qorder);
                            return res.send(JSON.stringify(qorder));
                         });
                    }, 5000); 
                });
                
            //use this only for apps, and not web..
            //(with apps, you don't have to worry about the cors.., so set and forget)
            } else if (req.body.Type == "send") {
                if (!req.body.amount || !req.body.destination) {
                    return res.send("missing amount or destination");
                } else {
                    var uuid = "unknown"
                    dest = req.body.destination;
                    amount = req.body.amount;
                    var headers1 = {
                        'Content-Type': 'application/json'
                    };
                    var dataString1 = '{"btc_dest_address": "' + dest + '",     "btc_amount": ' + String(amount) + '}';
                    var options1 = {
                        url: 'https://xmr.to/api/v1/xmr2btc/order_create/',
                        method: 'POST',
                        headers: headers1,
                        body: dataString1
                    };
                    request(options1, function (error, response, body) {
                        //get uuid
                        var first = JSON.parse(body);
                        uuid = first.uuid;
                        var dataString2 = '{"uuid": \"' + uuid + '\"}';
                        var options2 = {
                            url: 'https://xmr.to/api/v1/xmr2btc/order_status_query/',
                            method: 'POST',
                            headers: headers1,
                            body: dataString2
                        };

                        setTimeout(function () {
                            request2(options2, function (error2, response2, body2) {
                                var second = JSON.parse(body2);
                                var xmr_amount = second.xmr_required_amount;
                                var xmr_addr = second.xmr_receiving_address;
                                var xmr_pid = second.xmr_required_payment_id;

                                var destinations = { amount: xmr_amount, address: xmr_addr };
                                var options = { pid: xmr_pid };
                                if (xmr_pid) {
                                    Wallet.transfer(destinations, options).then(function (txids) {
                                        var txn = {
                                            destination: dest,
                                            btcamount: amount,
                                            xmrtouuid: uuid,
                                            xmramount: xmr_amount,
                                            xmraddr: xmr_addr,
                                            xmrpid: xmr_pid,
                                            time: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                            txid: String(txids['tx_hash'].replace("<", "").replace(">", "")),
                                            _id: String(txids['tx_hash'].replace("<", "").replace(">", ""))

                                        };
                                        console.log("txn :" + JSON.stringify(txn));
                                        db.insert(txn);
                                    });
                                }
                                return res.send(mnw.dataEncrypted(uuid, useEncryption));
                            });
                        }, 5000);
                    });
                }

            } else if (req.body.Type == "sendXMR") {
                var destinations = { amount: req.body.amount, address: req.body.destination };
                var Pid = "None";
                if (req.body.pid) {
                    var options = { pid: req.body.pid };
                    Pid = req.body.pid;
                }
                var uuid = "None";
                if (req.body.uuid) {
                    uuid = req.body.uuid;
                }
                Wallet.transfer(destinations, options).then(function (txids) {
                    console.log("transfer results:",txids);
                    var txn = {
                        destination: "none",
                        btcamount: "0",
                        xmrtouuid: uuid,
                        xmramount: req.body.amount,
                        xmraddr: req.body.destination,
                        xmrpid: Pid,
                        time: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                        txid: String(txids['tx_hash'].replace("<", "").replace(">", "")),
                        _id: String(txids['tx_hash'].replace("<", "").replace(">", ""))
                    };
                    console.log("txn :" + JSON.stringify(txn));
                    db.insert(txn);
                    return res.send(dataEncrypted(String(txids), useEncryption));
                });
            }
        }
    }); //end post..

}

module.exports = appRouter;


