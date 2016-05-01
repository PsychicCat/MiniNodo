var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var nacl = require("tweetnacl");
var naclutil = require("tweetnacl-util");
var request = require('request');
var request2 = require('request');
var Datastore = require('nedb')
    , db = new Datastore({ filename: 'txndb', autoload: true });
//var moneroWallet = require('monero-nodejs');
var moneroWallet = require('../monero-nodejs.js');
var Wallet = new moneroWallet('localhost', 18082);
var nconf = require('nconf');
var fs = require('fs');
nconf.argv().env().file({ file: 'config.json' });
var ip = require("ip");

//for whatever reason, couldn't get these to query order as desired..
var useEncryption = false; //this is set in the request for now

//helper functions - I assume there is a better place to put these..
function decimalToHex(d, padding) {
    var hex = Number(d).toString(16);
    padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;
    while (hex.length < padding) {
        hex = "0" + hex;
    }
    return hex;
}

//input is hex, output is string
var ToHex = function (sk) {
    var i, s = [];
    for (i = 0; i < sk.length; i++) s.push(decimalToHex(sk[i], 2));
    return s.join('');
}

//input is string, output is hex array
var FromHex = function (sk) {
    b = new Uint8Array(sk.length / 2);
    for (i = 0; i < 2 * b.length; i += 2) {
        b[i / 2] = parseInt(sk.substring(i, i + 2), 16);
    }
    return b;
}

function parseQuery(body, qstr) {
    //var query = {};
    var a = qstr.split('&');
    for (var i = 0; i < a.length; i++) {
        var b = a[i].split('=');
        body[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
        console.log("found field:" + decodeURIComponent(b[0]));
    }
    return body;
}

function createResponse(bodyObject) {
    var a = "&";
    var rv = "";
    for (var key in bodyObject) {
        rv = rv + key + "=" + bodyObject[key] + "&";
    }
    return rv;
}

var dataDecrypted = function (body) {
    console.log("attempting to decrypt");
    //console.log(cipher);
    console.log("sk:" + MiniNeroPk);
    var a = nacl.secretbox.open(FromHex(body.cipher), FromHex(body.nonce), FromHex(MiniNeroPk));
    //console.log("deciph ", a);
    return parseQuery(body, naclutil.encodeUTF8(a));
}

var now = function () {
    return String(Math.floor((new Date).getTime() / 1000));
}

var setPk = function (pk) {
    //replace with qr in web-browser
    nconf.set('MiniNeroPk:key', pk);
    nconf.save(function (err) {
        fs.readFile('config.json', function (err, data) {
            console.dir(JSON.parse(data.toString()))
        });
    });
}

//Encrypt json
var dataEncrypted = function (message) {
    var nonce = now();
    while (nonce.length < 48) {
        nonce = "0" + nonce;
    }
    var keypair = nacl.sign.keyPair.fromSeed(FromHex(MiniNeroPk));
    console.log("got keypair");
    var encrypted = nacl.secretbox(naclutil.decodeUTF8(message), FromHex(nonce), FromHex(MiniNeroPk));
    console.log("encrypted thing is" + ToHex(encrypted));
    var jsonReturn = { "cipher": ToHex(encrypted), "nonce": nonce };
    return createResponse(jsonReturn);
}

var appRouter = function (app) {

    //basic timestamping
    app.get("/api/mininero/", function (req, res) {
        var seconds = String(Math.floor((new Date).getTime() / 1000));
        res.send(seconds);
    });

    //txns
    //Fix this route, this is super old and awful
    //For a better example, use the MiniNero Web Transactions view 
    //(see public folder)
    app.post("/web/mininero/", function (req, res) {

        //If encryption is on
        var useEncryption = false;
        if (req.body.cipher) {
            req.body = dataDecrypted(req.body);
            useEncryption = true;
        }

        var times = Math.floor((new Date).getTime() / 1000);
        var timestampi = parseInt(req.body.timestamp, 10);

        if (!req.body.signature || !req.body.timestamp) {
            return res.send("missing signature, type, or timestamp" + req.body);
        } else if (Math.abs(times - timestampi) >= 60) {
            return res.send("timestamp too old..");
        }

        m = "mininerotxnwebview" + req.body.timestamp;
        console.log("checking signature to server web-view");
        var ver = nacl.sign.detached.verify(naclutil.decodeUTF8(m), FromHex(req.body.signature), FromHex(MiniNeroPk));
        if (ver == true && timestampi > lastNonce + 1) {
            lastNonce = timestampi;
            nconf.set('lastNonce:nonce', lastNonce);
            res.header('Content-type', 'text/html');
            var txnpage = '<html><head><title>Transactions</title><style>';
            txnpage = txnpage + 'html { background-color: #505050; } \n';
            txnpage = txnpage + 'body { background-color:  #505050; font-family: Courier; font:Courier; } \n';
            txnpage = txnpage + '.rarrow_box {width:90%; margin:5px; word-wrap:break-word; position: relative; float:left; background: #5b9a6f; } .rarrow_box:after { left: 100%; top: 50%; border: solid transparent; content: " "; height: 0; width: 0; position: absolute; pointer-events: none; border-color: rgba(91, 154, 111, 0); border-left-color: #5b9a6f; border-width: 30px; margin-top: -30px; }'
            txnpage = txnpage + '.larrow_box {width:90%; margin:5px; word-wrap:break-word; position: relative; float:right; background: #fff; } .larrow_box:after { right: 100%; top: 50%; border: solid transparent; content: " "; height: 0; width: 0; position: absolute; pointer-events: none; border-color: rgba(255, 255, 255, 0); border-right-color: #fff; border-width: 30px; margin-top: -30px; }';

            txnpage = txnpage + 'a.one:link, a.one:visited {background-color: #5B9A6F; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block; clear:both;}';
            txnpage = txnpage + 'a.one:hover, a.one:active { background-color: red; } ';
            txnpage = txnpage + 'a.two:link, a.two:visited { text-decoration:none; color:inherit; clear:both;} ';
            txnpage = txnpage + 'a.two:hover, a.two:active { color:white; font-weight:bold; background-color: red; } ';
            txnpage = txnpage + '.clearfix:after {content:"."; display:block; height:0; clear:both; visibility:hidden;} ';
            txnpage = txnpage + '</style></head><body>';
            db.find({}).sort({ time: -1 }).exec(function (err, docs) {
                for (var i = 0; i < docs.length; i++) {
                    console.log("time:" + docs[i].time + "  " + docs[i].xmramount + "xmr");
                    //received
                    if (docs[i].destination == "me") {
                        txnpage = txnpage + '<div class="larrow_box">';
                    } else {
                        txnpage = txnpage + '<div class="rarrow_box">';
                    }
                    //txnpage = txnpage +  '<ul id="items">';
                    txnpage = txnpage + '<big>' + docs[i].time + '</big>';
                    txnpage = txnpage + '<ul>';
                    txnpage = txnpage + '<li>xmr txid: <a class="two" href="http://moneroblocks.info/tx/' + docs[i].txid + '">' + docs[i].txid + '</a></li>';
                    //btc info
                    if ((docs[i].destination != "none") && (docs[i].destination != "me")) {
                        //https://blockchain.info/address/1hmicRLjsNnWYvowK3wRrLP3MNw9BS9Za
                        txnpage = txnpage + '<li>btc dest: <a class="two" href="https://blockchain.info/address/' + docs[i].destination + '">' + docs[i].destination + '</a></li>';
                        txnpage = txnpage + '<li>btc amount: ' + docs[i].btcamount + "</li>";
                        txnpage = txnpage + '<li>xmr.to uuid: ' + docs[i].xmrtouuid + '</a></li>';
                    } else {
                        txnpage = txnpage + '<li>xmr dest:<a class="two" href="http://moneroblocks.info/tx/' + docs[i].txid + '">' + docs[i].destination + '</a></li>';
                        txnpage = txnpage + '<li>xmr amount:' + docs[i].xmramount + '</li>';
                        txnpage = txnpage + '<li>xmr pid: ' + docs[i].xmrpid + '</li>';
                    }
                    txnpage = txnpage + '</ul>';
                    txnpage = txnpage + '</div>';
                }
                txnpage = txnpage + '<br><div class="clearfix"></div><div>';
                txnpage = txnpage + '<center><h2><a class="one" href="http://moneroblocks.info/">Monero Block Explorer</a></h2></center>';
                txnpage = txnpage + '<center><h2><a class="one" href="https://xmr.to">Xmr.to</a></h2></center></div>';
                if (useEncryption == true) {
                    res.write(dataEncrypted(txnpage));
                } else {
                    res.write(txnpage);
                }
                return res.end();
            });
        } else {
            if (ver == false) {
                return res.send("Bad sig");
            } else {
                return res.send("2 second refresh rate");
            }
        }
    });

    //txns (just returns a json of the transactions if authentication succeeds)
    app.post("/api/transactions/", function (req, res) {

        //If encryption is on
        var useEncryption = false;
        if (req.body.cipher) {
            req.body = dataDecrypted(req.body);
            useEncryption = true; //request was made using NaCl encryption, so response will be with NaCl encryption
        }

        var times = Math.floor((new Date).getTime() / 1000);
        var timestampi = parseInt(req.body.timestamp, 10);

        if (!req.body.signature || !req.body.timestamp) {
            return res.send("missing signature, type, or timestamp" + req.body);
        } else if (Math.abs(times - timestampi) >= 60) {
            return res.send("timestamp too old..");
        }
        if (ver == true && timestampi > lastNonce + 1) {
            lastNonce = timestampi;
            nconf.set('lastNonce:nonce', lastNonce);
            db.find({}).sort({ time: -1 }).exec(function (err, docs) {
                console.log("docs:");
                console.log(JSON.stringify(docs));
                return res.send(JSON.stringify(docs));
            });
        }
    });

    app.post("/api/mininero/", function (req, res) {

        var times = Math.floor((new Date).getTime() / 1000);
        var timestampi = parseInt(req.body.timestamp, 10);

        //If encryption is on
        var useEncryption = false;
        if (req.body.cipher) {
            console.log("encrypted data:");
            console.log(req.body.cipher);
            req.body = dataDecrypted(req.body);
            //req.body.Type = decry.Type;
            console.log("type: " + req.body.Type);
            useEncryption = true; //request was made using NaCl encryption, so response will be with NaCl encryption
        }

        if (!req.body.signature || !req.body.Type || !req.body.timestamp) {
            return res.send("missing signature, type, or timestamp" + req.body);

        } else if (Math.abs(times - timestampi) >= 30) {
            //verify timestamp
            return res.send("timestamp too old..");
        }

        if (req.body.Type == "address") {
            m = req.body.Type + req.body.timestamp;
            var ver = nacl.sign.detached.verify(naclutil.decodeUTF8(m), FromHex(req.body.signature), FromHex(MiniNeroPk));
            var en = dataEncrypted("test string to encrypt");

            if (ver == true) {
                Lasttime = times;
                Wallet.address().then(function (addy) {
                    console.log(addy.address);
                    if (useEncryption == false) {
                        return res.send(String(addy.address));
                    } else {
                        return res.send(dataEncrypted(String(addy.address)));
                    }
                });
            } else {
                return res.send("incorrect signature");
            }
        } else if (req.body.Type == "balance") {
            m = req.body.Type + req.body.timestamp;
            console.log("getting balance");
            var ver = nacl.sign.detached.verify(naclutil.decodeUTF8(m), FromHex(req.body.signature), FromHex(MiniNeroPk));
            if (ver == true) {
                Lasttime = times;
                Wallet.balance().then(function (balance) {
                    balanceUsual = (balance.balance / 1000000000000);
                    if (useEncryption == false) {
                        return res.send(String(balanceUsual));
                    } else {
                        return res.send(dataEncrypted(balanceUsual));
                    }
                });
            } else {
                return res.send("incorrect signature");
            }
        } else if (req.body.Type == "send") {
            if (!req.body.amount || !req.body.destination) {
                return res.send("missing amount or destination");
            } else {
                m = req.body.Type + req.body.amount.replace(".", "d") + req.body.timestamp + req.body.destination;
                var ver = nacl.sign.detached.verify(naclutil.decodeUTF8(m), FromHex(req.body.signature), FromHex(MiniNeroPk));
                //check if last request was more than 30 seconds ago.. simple replay avoidance
                if (ver == true && (Math.abs(Lasttime - times) > 30)) {
                    Lasttime = times;
                    var uuid = "unknown"
                    dest = req.body.destination;
                    amount = req.body.amount;
                    //make request #1 to xmr.to
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
                                if (useEncryption == false) {
                                    return res.send(uuid); //must have a return or complains about headers
                                } else {
                                    return res.send(dataEncrypted(uuid));
                                }
                            });
                        }, 5000);
                    });

                    //return res.send(uuid); //can't have return here if I return in the reqest..

                } else {
                    return res.send("incorrect signature or too rapid txns");
                }
            }

        } else if (req.body.Type == "sendXMR") {
            m = req.body.Type + req.body.amount.replace(".", "d") + req.body.timestamp + req.body.destination;
            var ver = nacl.sign.detached.verify(naclutil.decodeUTF8(m), FromHex(req.body.signature), FromHex(MiniNeroPk));
            //check if last request was more than 30 seconds ago.. simple replay avoidance
            if (ver == true && (Math.abs(Lasttime - times) > 30)) {
                Lasttime = times;
                console.log("valid request");
                var destinations = { amount: req.body.amount, address: req.body.destination };
                var Pid = "None";
                if (req.body.pid) {
                    var options = { pid: req.body.pid };
                    Pid = req.body.pid;
                }
                Wallet.transfer(destinations, options).then(function (txids) {
                    console.log(txids);
                    var txn = {
                        destination: "none",
                        btcamount: "0",
                        xmrtouuid: "none",
                        xmramount: req.body.amount,
                        xmraddr: req.body.destination,
                        xmrpid: Pid,
                        time: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                        txid: String(txids['tx_hash'].replace("<", "").replace(">", "")),
                        _id: String(txids['tx_hash'].replace("<", "").replace(">", ""))
                    };
                    console.log("txn :" + JSON.stringify(txn));
                    db.insert(txn);
                    if (useEncryption == false) {
                        return res.send(String(txids));
                    } else {
                        return res.send(dataEncrypted(String(txids)));
                    }
                });
            } else {
                return res.send("incorrect signature");
            }
        }
    });


    useEncryption = false;
    //refactor into a method and combine with above. 
    app.get("/api/localip/", function (req, res) {
        console.log("local ip address request");
        console.log(addr);
        if (useEncryption == false) {
            return res.send(addr);
        } else {
            return res.send(dataEncrypted(String(addr)));
        }
    });


















    //MiniNero Web api calls (refactor and combine with above later, once you add a session key..)
    //the remaining api calls should be accessible only to localhost
    app.use(function (req, res, next) {
        var ipOfSource = req.connection.remoteAddress;
        console.log(" request ip ", ipOfSource);
        //the ::1 is ipv6..
        var cont = (ipOfSource == '127.0.0.1');
        cont = cont || (ipOfSource == 'localhost')
        cont = cont || (ipOfSource == '::1')
        cont = cont || (ipOfSource == '::ffff:127.0.0.1')
        if (cont) {
            console.log("allowed attempt from " + ipOfSource);
            next();
        } else {
            console.log("ignored attempt from " + ipOfSource);
            res.status(400);
            res.send('None shall pass');
        }
    });


    //all routes which need to be need to accessed from localhost goes here.
    app.get("/api/localtransactions/", function (req, res) {
        console.log("local txn request");
        db.find({}).sort({ time: -1 }).exec(function (err, docs) {
            //console.log(JSON.stringify(docs));
            return res.send(JSON.stringify(docs));
        });
    });

    //refactor into a method and combine with above. 
    app.get("/api/localaddress/", function (req, res) {
        console.log("local address request");
        Wallet.address().then(function (addy) {
            if (useEncryption == false) {
                return res.send(String(addy.address));
            } else {
                return res.send(dataEncrypted(String(addy.address)));
            }
        });
    });



    //refactor into a method and combine with above..
    app.get("/api/localbalance/", function (req, res) {
        console.log("local balance request");
        Wallet.balance().then(function (balance) {
            balanceUsual = (balance.balance / 1000000000000);
            if (useEncryption == false) {
                return res.send(String(balanceUsual));
            } else {
                return res.send(dataEncrypted(balanceUsual));
            }
        });
    });

    //set api key
    app.post("/api/localsetapikey/", function (req, res) {
        console.log("local set api key request");
        apipk = req.body.apikey;
        console.log("apikey", apipk);
        setPk(apipk);
        return res.send("Success!");
    });

    //refactor this into a method, and combine with above..
    app.post("/api/localsendbtc/", function (req, res) {
        console.log("local send btc request");
        var uuid = "unknown"
        dest = req.body.destination;
        amount = req.body.amount;
        //make request #1 to xmr.to
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
                    if (useEncryption == false) {
                        return res.send(uuid); //must have a return or complains about headers
                    } else {
                        return res.send(dataEncrypted(uuid));
                    }
                });
            }, 5000);
        });
    });

    //refactor this into a method, and combine with above..
    app.post("/api/localsendxmr/", function (req, res) {
        console.log("local send xmr request");
        var destinations = { amount: req.body.amount, address: req.body.destination };
        var Pid = "None";
        if (req.body.pid) {
            var options = { pid: req.body.pid };
            Pid = req.body.pid;
        }
        Wallet.transfer(destinations, options).then(function (txids) {
            console.log(txids);
            var txn = {
                destination: "none",
                btcamount: "0",
                xmrtouuid: "none",
                xmramount: req.body.amount,
                xmraddr: req.body.destination,
                xmrpid: Pid,
                time: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                txid: String(txids['tx_hash'].replace("<", "").replace(">", "")),
                _id: String(txids['tx_hash'].replace("<", "").replace(">", ""))
            };
            console.log("txn :" + JSON.stringify(txn));
            db.insert(txn);
            if (useEncryption == false) {
                return res.send(String(txids));
            } else {
                return res.send(dataEncrypted(String(txids)));
            }
        });
    });
};

module.exports = appRouter;
