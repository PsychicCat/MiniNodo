var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var nacl = require("tweetnacl");
var naclutil = require("tweetnacl-util");
var request = require('request');
var request2 = require('request');
var Datastore = require('nedb')
  , db = new Datastore({ filename: '../txndb', autoload: true });
var moneroWallet = require('monero-nodejs');
var Wallet = new moneroWallet();
  
//for whatever reason, couldn't get these to query order as desired..
//const xmr2btc = require('xmrto-api') 
//const xmrTo = new xmr2btc();
//const xmrTutu = new xmr2btc();
var dummy = true;

function decimalToHex(d, padding) {
    var hex = Number(d).toString(16);
    padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;
    while (hex.length < padding) {
        hex = "0" + hex;
    }
    return hex;
}

var ToHex = function (sk ) {
    var i, s = [];
    for (i = 0; i < sk.length ; i++) s.push(decimalToHex(sk[i], 2));
        return s.join('');
}
    
var FromHex = function(sk) {
    b = new Uint8Array(sk.length/2);
    for (i = 0; i < 2*b.length; i+=2) { 
        b[i/2] = parseInt(sk.substring(i, i+2), 16);
    }
    return b;
}

//Needs a little work..
var dataDecrypted = function(cipher, nonce) {
        console.log("attempting to decrypt");
        console.log(cipher);
        var hashBytes = nacl.hash(FromHex(MiniNeroPk));
        var appBytes = nacl.sign.keyPair.fromSeed(hashBytes);
        console.log("app encryption key", appSecretBytes);
        var a = nacl.secretbox.open(FromHex(cipher), FromHex(nonce),  appBytes.secretKey);
        console.log("deciph ", a);
        return a;
        
    }

var appRouter = function(app) {

  app.get("/api/mininero/", function(req, res) {
      var seconds = String(Math.floor((new Date).getTime()/1000));
      res.send(seconds);
  }); 

  app.post("/api/mininero/", function(req, res) {
      
    var times = Math.floor((new Date).getTime()/1000);
    var timestampi = parseInt(req.body.timestamp, 10);

  //If encryption is on
  if (req.body.cipher) {
         console.log("attempting decipher");
         var deciphered = dataDecrypted(req.body.cipher, req.body.nonce);
         return res.send("this functionality is under construction");
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
        if (ver == true) {
            Lasttime = times;
            if (dummy == false) {
                Wallet.address().then(function(addy) {
                    console.log(addy.address);
                    return res.send(String(addy.address));
                });
            } else { 
                console.log("dummy address");
                return res.send("dummy address");
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
                    return res.send(String(balanceUsual));
            });
            } else {
                console.log("balance 0");
                return res.send("0 balance");
            }
            //return res.send(Wallet.balance());
        } else {
            return res.send("incorrect signature");
        }



    } else if (req.body.Type == "send") {
        if (!req.body.amount || !req.body.destination) {
            return res.send("missing amount or destination");
        } else { 
            
            console.log("sending");
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
                            var txn = { destination : dest,
                                        btcamount : amount,
                                        xmrtouuid : uuid,
                                        xmramount : xmr_amount,
                                        xmraddr : xmr_addr,
                                        xmrpid : xmr_pid };
                            console.log("txn :" + JSON.stringify(txn));
                            db.insert(txn);
                            var destinations = {amount : xmr_amount, address : xmr_addr};
                            var options = {pid : xmr_pid };
                            if (xmr_pid) {
                                if (dummy == false) {
                                    Wallet.transfer(destinations, options).then(function(txids) {
                                    console.log(txids);
                                });
                                } else {
                                     console.log("fake tx id");
                                     }
                            }

                            //Wallet.transfer(destination, options);
                            
                            //console.log("it's in db now!");
                            return res.send(uuid); //must have a return or complains about headers
                        });                
                    }, 5000);
                 });
                    
                //return res.send(uuid); //can't have return here if I return in the reqest..

            } else {
                return res.send("incorrect signature");
            }
        }
    } else if (req.body.Type == "sendXMR") {
    
            console.log("sending plain old XMR");
            m = req.body.Type + req.body.amount.replace(".", "d") +  req.body.timestamp + req.body.destination;
            var ver = nacl.sign.detached.verify(naclutil.decodeUTF8(m), FromHex(req.body.signature), FromHex(MiniNeroPk));
            console.log(ver);
            //check if last request was more than 30 seconds ago.. simple replay avoidance
            if (ver == true && (Math.abs(Lasttime - times) > 30)) {
                Lasttime = times;
                console.log("valid request");
                var destinations = {amount : req.body.amount, address : req.body.destination};
                if (req.body.pid) {
                    var options = {pid : req.body.PID };
                }
                if (dummy ==false) {
                    Wallet.transfer(destinations, options).then(function(txids) {
                        console.log(txids);
                        return res.send(String(txids));

                    });
                } else {
                    console.log("dummy txids");
                    return res.send("dummy txids");
                }

            }

    }
  });
};

 
module.exports = appRouter;
