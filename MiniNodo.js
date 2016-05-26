var https = require('https');
var pem = require('./pem.js');
var express = require("express");
var bodyParser = require("body-parser");
var nacl = require("tweetnacl");
var fs = require('fs');
var path = require('path');
var nconf = require('nconf');
nconf.argv().env().file({ file: 'config.json' });
var Datastore = require('nedb')
    , db = new Datastore({ filename: 'txndb', autoload: true });
var moneroWallet = require('./monero-nodejs.js');
var MNW = require('./MNW.js'), mnw = new MNW();
var open = require('open');
var ip = require("ip");
var prompt = require('prompt');


var portset = process.env.PORT || 3000;
var simplewalletport = 18082;

//simple way to do it, will update later..
//for now: password is first arg, server port is second arg, simplewallet port is third arg
//get command line arguments via mininist

var argv = require('minimist')(process.argv.slice(2));
if (argv['h'] != undefined || argv['help'] != undefined) {
    console.log('possible command line arguments are:');
    console.log('-p <password> ');
    console.log('-mp <port for mininero web>');
    console.log('-swp <simplewallet port>');
    console.log('-w    opens your browser to the app');
}
if (argv['mp'] != undefined) {
    portset = argv['mp'];
    console.log('read mininero web port from command line as ' + portset);
}
if (argv['swp'] != undefined) {
    simplewalletport = argv['swp'];
    console.log('read simplewallet port from command line as ' + simplewalletport);
}

nconf.set('simplewallet:port', simplewalletport);
nconf.set('mininodo:port', portset);
nconf.save();
var hateHttps = false;
var addrset = 'https://' + String(ip.address()) + ':' + String(portset);

var Wallet = new moneroWallet('localhost', simplewalletport);






//
//Check for incoming transfers, and add new transfers to wallet..
//
//To do: split into outgoing / incoming, and handle better
function checkTransfers() {
    //console.log("Checking for incoming transactions..");
    try {
        Wallet.incomingTransfers("all").then(function (t) {
            //console.log('found transfers, comparing with saved db');
            tx = t.transfers
            tx_hashes = []
            tmp = ""
            tx_amounts = []
            try {
                var i = 0;
                var n = -1;
                while (i < tx.length) {
                    tmp = tx[i].tx_hash;
                    tx_amounts.push(tx[i].amount / 1000000000000.0);
                    tx_hashes.push(tmp.replace("<", "").replace(">", ""));
                    n++;
                    j = i + 1;
                    //group transactions with same txn hash
                    while (j < tx.length) {
                        if (tx[j].tx_hash != tmp) {
                            break;
                        } else {
                            tx_amounts[n] += tx[j].amount / 1000000000000.0;
                        }
                        j++;
                    }
                    var txnsave = {
                        destination: "me",
                        xmramount: tx_amounts[n],
                        time: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                        txid: tx_hashes[n],
                        _id: tx_hashes[n]
                    };
                    try {
                        db.insert(txnsave);
                    } catch (err) {
                        //already inserted!
                    }
                    i = j;
                }
            } catch (errit) {
                //console.log("error in checking transactions!");
            }
            //console.log("checked transactions.");
        });
    } catch (err) {
        //console.log('that error...');
    }
}


//remove old incoming transfers, and add them again, parsed properly
//Note, this will mess up the time received, so only use it sparingly!
function reCheckTransfers() {
    db.remove({ destination: 'me' }, { multi: true }, function (err, numRemoved) {
        console.log("number of documents removed:", numRemoved);
    });
    checkTransfers();
}



//set this true, to update from old-style parsing.
if (1 == 0) {
    reCheckTransfers();
} else {
    checkTransfers();
}

var getPk = function () {
    //replace with qr in web-browser
    if (!nconf.get("MiniNeroPk")) {
        skpk = nacl.sign.keyPair();
        //console.log(mnw.ToHex(skpk.secretKey));
        MiniNeroPk = mnw.ToHex(skpk.publicKey);
        nconf.set('MiniNeroPk:key', MiniNeroPk);
        nconf.save();
    } else {
        MiniNeroPk = nconf.get("MiniNeroPk:key");
    }
    return MiniNeroPk;
}

function serverCallback() {
    //console.log("Listening on port %s...", server.address().port);
    //check every 100 seconds for new transfers, which is half of the block-speed
    var txnChecker = setInterval(checkTransfers, 100 * 1000);

    MiniNeroPk = getPk();
    port = portset;
    var swport = simplewalletport
    addr = addrset;

    //automatically open web app on launch
    localaddr = 'https://localhost:' + port;
    //this might not work for purely remote users
    console.log("MiniNero web running on ", addrset);
    console.log("If you are on an internal network, or something like Azure, then");
    console.log("you will need to get your external ip from your Azure control panel");
    console.log("(I will try to clean up external ip handling if I can figure out some");
    console.log("easy way to do it in the future).");

    //auto open on start.. (needs better error handling) 
    if (argv['w'] != undefined) {
        open(localaddr, function (err) {
            if (err) throw err;
            console.log('Possible error opening browser');
        });
    }

    if (!nconf.get("lastNonce")) {
        lastNonce = Math.floor((new Date).getTime() / 1000);
    } else {
        lastNonce = nconf.get("lastNonce:nonce");
    }
    Lasttime = 0;
}

function passwordPromptCallback(err, result) {

    if (result.password != result.repeat) {
        console.log('passwords not the same');
        process.exit();
    }

    var salt1 = mnw.ToHex(nacl.randomBytes(32));
    nconf.set('salt1:key', salt1);
    var ss = mnw.getSS(result.password, salt1);
    nconf.set('ss:key', ss);
    nconf.save(doPemStuff(err));
}

function passwordArgCallback(pass) {
    console.log('read password from command line as ' + pass);
    var salt1 = mnw.ToHex(nacl.randomBytes(32));
    nconf.set('salt1:key', salt1);
    var ss = mnw.getSS(pass, salt1);
    nconf.set('ss:key', ss);
    nconf.save(doPemStuff());
}

function doPemStuff(err) {

    pem.createPrivateKey(function (error, data) {
        var key = (data && data.key || '').toString();

        pem.createCertificate({ clientKey: key, days: 365, selfSigned: true }, function (err, keysnew) {

            pem.readPkcs12('cert.p12', { p12Password: 'cat' }, function (error, keys) {
                if (error != null) {
                    //console.log("created new ssl cert.p12\n");
                    keys = keysnew;

                    pem.createPkcs12(keysnew.serviceKey, keysnew.certificate, 'cat', { cipher: 'aes256' }, function (err, pkcs12) {
                        fs.writeFile('cert.p12', pkcs12['pkcs12'], 'binary');
                    });
                } else {
                    //console.log("loaded ssl cert.p12");
                    keys.serviceKey = keys.key;
                    keys.certificate = keys.cert;
                }

                var app = express();
                //MiniNero Web (for now, comment this line out if desired)
                app.use('/', express.static(path.join(__dirname, 'public')));

                app.use(bodyParser.json());
                app.use(bodyParser.urlencoded({ extended: true }));

                var routes = require("./routes/routes.js")(app);

                port = portset;
                addr = addrset;

                if (hateHttps == true) {
                    //not recommended, but possibly necessary for heroku or such
                    var server = app.listen(port, serverCallback);
                } else {
                    var server = https.createServer({ key: keys.serviceKey, cert: keys.certificate }, app).listen(port, serverCallback);
                }
            });
        });
    });
}

//
//MAIN
//
if (argv['p'] != undefined) {
    passwordArgCallback(argv['p']);
} else {
    prompt.start();
    prompt.get(['password', 'repeat'], passwordPromptCallback);
}
