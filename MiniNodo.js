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
function checkTransfers() {
    Wallet.incomingTransfers("all").then(function(txns) {
        for (var i = 0 ; i < txns['transfers'].length ; i++) {
            txn = txns['transfers'][String(i)];
            keys = Object.keys(txn);
            keys.forEach(function(entry) {
                console.log(entry+": "+txn[entry]);
            });
            //note the "time" below won't reflect actual time received, instead the time inserted to db..
            var txnsave = { destination : "me",
                            xmramount : parseInt(txn['amount'])/1000000000000.0,
                            time : new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                            txid : txn['tx_hash'].replace('<', "").replace('>', ""),
                            _id : txn['tx_hash'].replace('<', "").replace('>', "")
            };
            console.log("txn :" + JSON.stringify(txnsave));
            try {
                db.insert(txnsave);                                
            } catch(err) {
                console.log("already inserted!");
            }
        }
    });
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
            
        //MiniNeroPk = "cd9db8fafbf2b99605cee870ada0dd64ae5a583a4414c3d5d34e8e8072d520b6"; //Maybe load from a separate file like MiniNero does..
        Lasttime = 0;
        
        
       //txn page test..
        
    });
});
