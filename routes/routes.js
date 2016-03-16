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
var nconf = require('nconf');
nconf.argv().env().file({ file: 'config.json' });
  
//for whatever reason, couldn't get these to query order as desired..
var xmr2btc = require('xmrto-api') 
var xmrTo = new xmr2btc();
var dummy = true;




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

  //basic timestamping
  app.get("/api/mininero/", function(req, res) {
      var seconds = String(Math.floor((new Date).getTime()/1000));
      res.send(seconds);
  }); 
  
  //txns 
  app.post("/web/mininero/", function(req, res) {
      
        var times = Math.floor((new Date).getTime()/1000);
        var timestampi = parseInt(req.body.timestamp, 10);      
      
        if (!req.body.signature || !req.body.timestamp) {
            return res.send("missing signature, type, or timestamp" + req.body);
        } else if (Math.abs(times - timestampi) >= 60 ) {
            //verify timestamp
            return res.send("timestamp too old..");      
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
            var txnpage = '<body style="text-align: center; font-family: monospace">';
            //res.write(txnpage);
            db.find({}, function (err, docs) {
                //console.log(docs);
                //console.log("\n time:");
                //console.log(docs[0].time);
                for (var i = 0 ; i < docs.length ; i++) {
                        console.log("time:"+docs[i].time+"  "+docs[i].xmramount+ "xmr");
                        //xmr info
                        txnpage = txnpage + '<h4>'+docs[i].time+'</h4>';
                        txnpage = txnpage + ''+docs[i].xmramount+" xmr sent in the following transaction:";
                        //http://moneroblocks.info/tx/554b99fcf111d45f446937157a12ce1848d9d431c1428186e2cbc2ea55200a78
                        txnpage = txnpage + '<br><a href="http://moneroblocks.info/tx/'+docs[i].txid+'">'+docs[i].txid+'</a>';
                        txnpage = txnpage + '<br>pid: '+docs[i].xmrpid;
                        //btc info
                        if (docs[i].destination != "none") {
                            txnpage = txnpage + '<br><br>'+docs[i].btcamount+" btc sent to the following address:";
                            //https://blockchain.info/address/1hmicRLjsNnWYvowK3wRrLP3MNw9BS9Za
                            txnpage = txnpage + '<br><a href="https://blockchain.info/address/'+docs[i].destination+'">'+docs[i].destination+'</a>';
                            txnpage = txnpage + '<br><a href="https://xmr.to">xmr.to</a> uuid: '+docs[i].xmrtouuid+'</a>';
                        }
                        txnpage = txnpage + '<br><br>';
                    }
                    res.write(txnpage);
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
                            return res.send(uuid); //must have a return or complains about headers
                        });                
                    }, 5000);
                 });
                    
                //return res.send(uuid); //can't have return here if I return in the reqest..

            } else {
                return res.send("incorrect signature");
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
                    var options = {pid : req.body.PID };
                    Pid = req.body.PID;
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
                        return res.send(String(txids));

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
                        return res.send("dummy txids");
                }
            } else {
                return res.send("incorrect signature");
            }
        }
  });
};

 
module.exports = appRouter;
