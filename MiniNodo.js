var https = require('https');
var pem = require('pem');
var express = require("express");
var bodyParser = require("body-parser");
var nacl = require("tweetnacl");
var fs    = require('fs');
var nconf = require('nconf');
var Datastore = require('nedb')
  , db = new Datastore({ filename: 'txndb', autoload: true });


//https://www.npmjs.com/package/tweetnacl
//https://tweetnacl.cr.yp.to/

var moneroWallet = require('monero-nodejs');
var Wallet = new moneroWallet();

var approxTime = function(height) {
    if (height <= 1009827) {
        return 1458748658 - 2 * 60 * (1009827 - height)
    } else {
        return (height - 1009827) * 2 * 60 + 1458748658
    }
}
var now = function() {
    return  String(Math.floor((new Date).getTime()/1000));
}

//
//Check for incoming transfers, and add new transfers to wallet..
//
function checkTransfers() {
    Wallet.incomingTransfers("all").then(function(t) {
        //console.log(t.transfers);
        console.log("Checking for incoming transactions..");
        tx = t.transfers
        tx_hashes = []
        tmp = ""
        tx_amounts = []
        try {
            var i = 0;
            var n = -1;
            while (i < tx.length) {
                tmp = tx[i].tx_hash;
                tx_amounts.push(tx[i].amount /  1000000000000.0);
                tx_hashes.push(tmp.replace("<","").replace(">",""));
                n++;
                j = i+1;
                //group transactions with same txn hash
                while (j < tx.length) {
                    if (tx[j].tx_hash != tmp) {
                        break;
                    } else {
                        tx_amounts[n] += tx[j].amount / 1000000000000.0;
                    }
                    j++;
                }
                var txnsave = { destination : "me",
                    xmramount : tx_amounts[n],
                    time : new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                    txid : tx_hashes[n],
                    _id : tx_hashes[n]
                };
                try {
                    db.insert(txnsave);                                
                } catch(err) {
                    //already inserted!
                }
                i = j;
            }
        } catch (errit) {
            console.log("error in checking transactions!");
        }
        console.log("checked transactions.");

    });

}


//remove old incoming transfers, and add them again, parsed properly
//Note, this will mess up the time received, so only use it sparingly!
function reCheckTransfers() {
    db.remove({ destination: 'me' }, { multi: true }, function (err, numRemoved) {
        console.log("number of documents removed:", numRemoved);
    });
    checkTransfers();
}

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

     
nconf.argv().env().file({ file: 'config.json' });

//set this true, to update from old-style parsing.
if (1 == 0) {
    reCheckTransfers();
} else {
    checkTransfers();
}
 
//Update to use a let's encrypt certificate..
pem.createCertificate({days:365, selfSigned:true}, function(err, keys){
    var app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    
    var routes = require("./routes/routes.js")(app);

    //var server = app.listen(3000,  function () {
    var server = https.createServer({key: keys.serviceKey, cert: keys.certificate}, app).listen(3000, function()  {
        console.log("Listening on port %s...", server.address().port);
        //check every 60 seconds for new transfers, which is half of the block-speed
        var txnChecker = setInterval(checkTransfers, 60 * 1000);
        
        //replace with qr in web-browser
        if (!nconf.get("MiniNeroPk")) {
            skpk = nacl.sign.keyPair();
            console.log("this is your api secret key (store in the app /password manager but keep secret!)");
            console.log("save this in the app:");
            console.log(ToHex(skpk.secretKey));
            console.log("");
            MiniNeroPk = ToHex(skpk.publicKey);
            console.log("MiniNeroPk"+MiniNeroPk);
            nconf.set('MiniNeroPk:key', MiniNeroPk);
            nconf.save(function (err) {
                    fs.readFile('config.json', function (err, data) {
                    console.dir(JSON.parse(data.toString()))
                });
            });
        } else {
            MiniNeroPk = nconf.get("MiniNeroPk:key");
            console.log("MiniNeroPK: "+MiniNeroPk);
            console.log("MiniNeroPk / api_key already set, if you need to reset it, delete config.json and restart app.js");
        }
        if (!nconf.get("lastNonce")) {
            lastNonce = Math.floor((new Date).getTime()/1000);
            } else {
            lastNonce = nconf.get("lastNonce:nonce");
        }
        Lasttime = 0;
    });
});
