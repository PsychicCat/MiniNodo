var https = require('https');
var pem = require('pem');
var express = require("express");
var bodyParser = require("body-parser");
var nacl = require("tweetnacl");
var fs    = require('fs');
var nconf = require('nconf');

var moneroWallet = require('monero-nodejs');
var Wallet = new moneroWallet();

Wallet.incomingTransfers("available").then(function(t) {
    console.log(t);

    for (var i = 0 ; i < t.length ; i++) {
        console.log(t[i]);
    }
});
