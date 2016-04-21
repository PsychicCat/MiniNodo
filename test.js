var https = require('https');
var pem = require('pem');
var express = require("express");
var bodyParser = require("body-parser");
var nacl = require("tweetnacl");
var fs    = require('fs');
var nconf = require('nconf');

var moneroWallet = require('monero-nodejs');
var Wallet = new moneroWallet();



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
                tx_amounts.push(tx[i].amount);
                tx_hashes.push(tmp.replace("<","").replace(">",""));
                n++;
                j = i+1;
                //group transactions with same txn hash
                while (j < tx.length) {
                    if (tx[j].tx_hash != tmp) {
                        break;
                    } else {
                        tx_amounts[n] += tx[j].amount / 1000000000000;
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

    });

}

//remove old incoming transfers, and add them again, parsed properly
function reCheckTransfers() {
    db.remove({ destination: 'me' }, { multi: true }, function (err, numRemoved) {
        console.log("number of documents removed:", numRemoved);
    });
    checkTransfers();
}




checkTransfers();
