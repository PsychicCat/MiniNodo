var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var nacl = require("tweetnacl");
var naclutil = require("tweetnacl-util");
var request = require('request');
var request2 = require('request');
var Datastore = require('nedb')
  , db = new Datastore({ filename: 'txndb', autoload: true });
var moneroWallet = require('monero-nodejs');
var Wallet = new moneroWallet();
var nconf = require('nconf');
nconf.argv().env().file({ file: 'config.json' });
  
//for whatever reason, couldn't get these to query order as desired..
var xmr2btc = require('xmrto-api') 
var xmrTo = new xmr2btc();
var dummy = true;
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
var ToHex = function (sk ) {
    var i, s = [];
    for (i = 0; i < sk.length ; i++) s.push(decimalToHex(sk[i], 2));
        return s.join('');
}

//input is string, output is hex array
var FromHex = function(sk) {
    b = new Uint8Array(sk.length/2);
    for (i = 0; i < 2*b.length; i+=2) { 
        b[i/2] = parseInt(sk.substring(i, i+2), 16);
    }
    return b;
}

function parseQuery(body, qstr) {
        //var query = {};
        var a = qstr.split('&');
        for (var i = 0; i < a.length; i++) {
            var b = a[i].split('=');
            body[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
            console.log("found field:"+decodeURIComponent(b[0]));
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
    
var dataDecrypted = function(body) {
        console.log("attempting to decrypt");
        //console.log(cipher);
        console.log("sk:"+MiniNeroPk);
        var a = nacl.secretbox.open(FromHex(body.cipher), FromHex(body.nonce), FromHex(MiniNeroPk));
        //console.log("deciph ", a);
        return parseQuery(body, naclutil.encodeUTF8(a));
    }

var now = function() {
    return  String(Math.floor((new Date).getTime()/1000));
}
    
//under construction
var dataEncrypted = function(message) {
        var nonce = now();
        while (nonce.length < 48) {
            nonce = "0"+nonce;
        }
        var keypair = nacl.sign.keyPair.fromSeed(FromHex(MiniNeroPk));
        console.log("got keypair");
        var encrypted = nacl.secretbox(naclutil.decodeUTF8(message), FromHex(nonce), FromHex(MiniNeroPk));
        console.log("encrypted thing is"+ToHex(encrypted));
        var jsonReturn = {"cipher" : ToHex(encrypted), "nonce": nonce};
        //var encrypted = nacl.secretbox.open(FromHex(body.cipher), keypair.publicKey, FromHex(MiniNeroPk));
        
        //console.log("deciph ", a);
        return createResponse(jsonReturn);
    }
    
    
    
    

    
var appRouter = function(app) {

  //basic timestamping
  app.get("/api/mininero/", function(req, res) {
      var seconds = String(Math.floor((new Date).getTime()/1000));
      res.send(seconds);
  }); 
  
  //txns 
  app.post("/web/mininero/", function(req, res) {
      
      
        //If encryption is on
        var useEncryption = false;
        if (req.body.cipher) {
                console.log("encrypted data:");
                console.log(req.body.cipher);
                req.body = dataDecrypted(req.body);
                //req.body.Type = decry.Type;
                console.log("type: "+req.body.Type);
                useEncryption = true; //request was made using NaCl encryption, so response will be with NaCl encryption
        }      
        
        var times = Math.floor((new Date).getTime()/1000);
        var timestampi = parseInt(req.body.timestamp, 10);      
      
        if (!req.body.signature || !req.body.timestamp) {
            return res.send("missing signature, type, or timestamp" + req.body);
        } else if (Math.abs(times - timestampi) >= 60 ) {
            //verify timestamp
            return res.send("timestamp too old..");      
        }
        
        //dislay colors based on app colors
        var theme = "dark";
        if (!req.body.theme) {
            var theme = "dark";
        } else {
            var theme = req.body.theme;
        }
        
        m = "mininerotxnwebview"+req.body.timestamp;
        console.log("checking signature to server web-view");
        var ver = nacl.sign.detached.verify(naclutil.decodeUTF8(m), FromHex(req.body.signature), FromHex(MiniNeroPk));
        console.log(ver);
        console.log("lastNonce "+String(lastNonce));
        console.log("timestampi "+String(timestampi));
        if (ver == true && timestampi > lastNonce + 1) {
            lastNonce = timestampi;
            nconf.set('lastNonce:nonce', lastNonce);
            
            res.header('Content-type', 'text/html');
            var txnpage = '<html><head><title>Transactions</title><style>';
            txnpage = txnpage + 'html { margin-left: 0;  background-color: #505050; padding-right:15px; }';
            txnpage = txnpage + 'body { margin-left: 0;  margin:0; padding:0; padding-right:15px; background-color:  #505050; font-family: monospace; font:  small/1.3em, monospace; }';
            txnpage = txnpage + 'body #main { margin-left: 0; margin:0; padding:0; padding-right:15px; }';
            txnpage = txnpage + 'ul#items { margin:0; padding:0; list-style: none;word-wrap:break-word;}';
            txnpage = txnpage + 'ul#toplist ul {margin-left: 0;  list-style-type: none;  margin:0; list-style: none; font-weight: bold; padding: 0;  border-bottom: 1px solid #fff; color: #FFF; }';
            txnpage = txnpage + 'ul#toplist ul:hover { margin-left:0; padding:0; list-style-type: none;  margin:0; color: #FFF; background-color: #999; }';
            txnpage = txnpage + 'a.one:link, a.one:visited { background-color: #5B9A6F; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block; }';
            txnpage = txnpage + 'a.one:hover, a.one:active { background-color: red; }';
            txnpage = txnpage + 'a.two:link, a.two:visited { text-decoration:none; color:inherit;}';
            txnpage = txnpage + 'a.two:hover, a.two:active { color:white; font-weight:900; background-color: red; }';            txnpage = txnpage + '</style></head><body> <ul id="toplist">';
            db.find({}).sort({time: -1}).exec(function (err, docs) {
                for (var i = 0 ; i < docs.length ; i++) {
                        console.log("time:"+docs[i].time+"  "+docs[i].xmramount+ "xmr");
                        //xmr info
                        //txnpage = txnpage + '<h4>'+docs[i].time+'</h4>';
                        txnpage = txnpage + '<ul id="items">';
                        txnpage = txnpage + '<big>'+docs[i].time+'</big>';
                        txnpage = txnpage + '<li>Sent:'+docs[i].xmramount+' xmr </li>';
                        //txnpage = txnpage + ''+docs[i].xmramount+" xmr sent in the following transaction:";
                        txnpage = txnpage + '<li><a class="two" href="http://moneroblocks.info/tx/'+docs[i].txid+'">'+docs[i].txid+'</a></li>';
                        txnpage = txnpage + '<li>pid: '+docs[i].xmrpid+'</li>';
                        //btc info
                        if (docs[i].destination != "none") {
                            txnpage = txnpage + '<li>Sent '+docs[i].btcamount+" btc sent to:</li>";
                            //https://blockchain.info/address/1hmicRLjsNnWYvowK3wRrLP3MNw9BS9Za
                            txnpage = txnpage + '<li><a class="two" href="https://blockchain.info/address/'+docs[i].destination+'">'+docs[i].destination+'</a></li>';
                            txnpage = txnpage + '<li>xmr.to uuid: '+docs[i].xmrtouuid+'</a></li>';
                        }
                        txnpage = txnpage + '</ul>';
                    }
                    txnpage = txnpage + '</ul>';
                    txnpage = txnpage + '<center><h2><a class="one" href="http://moneroblocks.info/">Monero Block Explorer</a></h2></center>';
                    txnpage = txnpage + '<center><h2><a class="one" href="https://xmr.to">Xmr.to</a></h2></center>';
                    res.write(dataEncrypted(txnpage));
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
  
  
  app.post("/api/mininero/", function(req, res) {
      
    var times = Math.floor((new Date).getTime()/1000);
    var timestampi = parseInt(req.body.timestamp, 10);

  //If encryption is on
  var useEncryption = false;
  if (req.body.cipher) {
         console.log("encrypted data:");
         console.log(req.body.cipher);
         req.body = dataDecrypted(req.body);
         //req.body.Type = decry.Type;
         console.log("type: "+req.body.Type);
         useEncryption = true; //request was made using NaCl encryption, so response will be with NaCl encryption
  }
        
  if (!req.body.signature || !req.body.Type || !req.body.timestamp) {
        return res.send("missing signature, type, or timestamp" + req.body);

  } else if (Math.abs(times - timestampi) >= 30 ) {
        //verify timestamp
        return res.send("timestamp too old..");
  
   } else if (req.body.Type == "address") {
        m = req.body.Type+req.body.timestamp;
        console.log("getting address");
        var ver = nacl.sign.detached.verify(naclutil.decodeUTF8(m), FromHex(req.body.signature), FromHex(MiniNeroPk));
        console.log(ver);
        
        //asdf
        console.log("trying to encrypt");
        var en = dataEncrypted("test string to encrypt");
        console.log("encrypted thing"+en);
        
        if (ver == true) {
            Lasttime = times;
            if (dummy == false) {
                Wallet.address().then(function(addy) {
                    console.log(addy.address);
                    if (useEncryption == false) {
                        return res.send(String(addy.address));
                    } else {
                        return res.send(dataEncrypted(String(addy.address)));
                    }
                });
            } else { 
                console.log("dummy address");
                console.log("useEncryption value"+String(useEncryption))
                if (useEncryption == false) {
                    console.log("no encryption response");
                    return res.send("dummy address");
                } else {
                    console.log("yes encryption response");
                    return res.send(dataEncrypted("dummy address"));
                }
            }
        } else {
            return res.send("incorrect signature");
        }



    } else if (req.body.Type == "balance") {
        m = req.body.Type + req.body.timestamp;
        console.log("getting balance");
        var ver = nacl.sign.detached.verify(naclutil.decodeUTF8(m), FromHex(req.body.signature), FromHex(MiniNeroPk));
        console.log(ver);
        if (ver == true) {
            Lasttime = times;
            console.log("balance is:");
            if (dummy == false) {
            Wallet.balance().then(function(balance) {
                    console.log(balance);
                    console.log("try to get actual");
                    console.log(balance.balance/1000000000000);
                    //balanceUsual = balance.balance / 1
                    balanceUsual = (balance.balance/1000000000000);
                    //balanceParsed = JSON.parse(JSON.stringify(balance));
                    if (useEncryption == false) {
                        return res.send(String(balanceUsual));
                    } else {
                        return res.send(dataEncrypted(balanceUsual));
                    }
            });
            } else {
                console.log("balance 0");
                if (useEncryption == false) {
                    return res.send("0 balance");
                } else {
                    return res.send(dataEncrypted("0 balance"));
                }
            }
            //return res.send(Wallet.balance());
        } else {
            return res.send("incorrect signature");
        }



    } else if (req.body.Type == "send") {
        if (!req.body.amount || !req.body.destination) {
            return res.send("missing amount or destination");
        } else { 
            
            console.log("sending "+req.body.amount);
            m = req.body.Type + req.body.amount.replace(".", "d") +  req.body.timestamp + req.body.destination;
            var ver = nacl.sign.detached.verify(naclutil.decodeUTF8(m), FromHex(req.body.signature), FromHex(MiniNeroPk));
            console.log(ver);
            //check if last request was more than 30 seconds ago.. simple replay avoidance
            if (ver == true && (Math.abs(Lasttime - times) > 30)) {
                Lasttime = times;
                console.log("attempting btc2xmr via xmr.to");
                var uuid = "unknown"
                dest = req.body.destination;
                amount = req.body.amount;
                //make request #1 to xmr.to
                var headers1 = {
                    'Content-Type': 'application/json'
                };
                var dataString1 = '{"btc_dest_address": "'+dest+'",     "btc_amount": '+String(amount)+'}';

                var options1 = {
                    url: 'https://xmr.to/api/v1/xmr2btc/order_create/',
                    method: 'POST',
                    headers: headers1,
                    body: dataString1
                }; 
                
                request(options1, function(error, response, body) {
                    //get uuid
                    var first = JSON.parse(body);
                    uuid = first.uuid;
                    var dataString2 = '{"uuid": \"'+uuid+'\"}';
                    var options2 = {
                        url: 'https://xmr.to/api/v1/xmr2btc/order_status_query/',
                        method: 'POST',
                        headers: headers1,
                        body: dataString2
                    };
                    
                    setTimeout(function () {
                        request2(options2, function(error2, response2, body2) {
                            //get xmr dest, pid, amount
                            //log these to db with uuid
                            //do rpc call
                            //console.log("uuid in request2",  uuid);
                            //console.log("body2"+body2);
                            var second = JSON.parse(body2);
                            var xmr_amount = second.xmr_required_amount;
                            var xmr_addr = second.xmr_receiving_address;
                            var xmr_pid = second.xmr_required_payment_id;
                            
                            var destinations = {amount : xmr_amount, address : xmr_addr};
                            var options = {pid : xmr_pid };
                            if (xmr_pid) {
                                if (dummy == false) {
                                    Wallet.transfer(destinations, options).then(function(txids) {
                                        var txn = { destination : dest,
                                                btcamount : amount,
                                                xmrtouuid : uuid,
                                                xmramount : xmr_amount,
                                                xmraddr : xmr_addr,
                                                xmrpid : xmr_pid,
                                                time : new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                txid : String(txids)
                                        };
                                        console.log("txn :" + JSON.stringify(txn));
                                        db.insert(txn);                                
                                    });
                                } else {
                                        var txn = { destination : dest,
                                                btcamount : amount,
                                                xmrtouuid : uuid,
                                                xmramount : xmr_amount,
                                                xmraddr : xmr_addr,
                                                xmrpid : xmr_pid,
                                                time : new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                txid : "dummytxnid"
                                        };
                                        console.log("txn :" + JSON.stringify(txn));
                                        db.insert(txn);                                                                 }
                                }

                            //Wallet.transfer(destination, options);
                            //console.log("it's in db now!");
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
        
    //same as "send" but testing whether I can get xmrto-api working
    } else if (req.body.Type == "sendxmr2api") {
         
      console.log("sending");
      m = req.body.Type + req.body.amount.replace(".", "d") + req.body.timestamp + req.body.destination;
      var ver = nacl.sign.detached.verify(naclutil.decodeUTF8(m), FromHex(req.body.signature), FromHex(MiniNeroPk));
      console.log(ver);
      //check if last request was more than 30 seconds ago.. simple replay avoidance
      if (ver == true && (Math.abs(Lasttime - times) > 30)) {
          //do stuff 
          console.log("sending xmr2btc via api");
          res.send("not implemented yet");
      }

  } else if (req.body.Type == "sendXMR") {

      console.log("sending plain old XMR");
      m = req.body.Type + req.body.amount.replace(".", "d") + req.body.timestamp + req.body.destination;
      var ver = nacl.sign.detached.verify(naclutil.decodeUTF8(m), FromHex(req.body.signature), FromHex(MiniNeroPk));
      console.log(ver);
      //check if last request was more than 30 seconds ago.. simple replay avoidance
      if (ver == true && (Math.abs(Lasttime - times) > 30)) {
          Lasttime = times;
          console.log("valid request");
                var destinations = {amount : req.body.amount, address : req.body.destination};
                var Pid = "None";
                if (req.body.pid) {
                    var options = {pid : req.body.pid };
                    Pid = req.body.pid;
                }
                //log it 

                if (dummy == false) {

                    //send it
                    Wallet.transfer(destinations, options).then(function(txids) {
                        console.log(txids);
                        
                        var txn = { destination : "none",
                            btcamount : "0",
                            xmrtouuid : "none",
                            xmramount : req.body.amount,
                            xmraddr : req.body.destination,
                            xmrpid : Pid,
                            time : new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                            txid : String(txids)
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
                    console.log("dummy txids");
                    
                        var txn = { 
                            destination : "none",
                            btcamount : "0",
                            xmrtouuid : "none",
                            xmramount : req.body.amount,
                            xmraddr : req.body.destination,
                            xmrpid : Pid,
                            time : new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                            txid : "dummytxnid"
                        };
                        console.log("txn :" + JSON.stringify(txn));
                        db.insert(txn);      
                        if (useEncryption == false) {
                            return res.send("dummy txids");
                        } else {
                            return res.send(dataEncrypted("dummy txids"));
                        }
                        
                }
            } else {
                return res.send("incorrect signature");
            }
        }
  });
};

 
module.exports = appRouter;
