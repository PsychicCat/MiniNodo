var https = require('https');
var pem = require('pem');
var express = require("express");
var bodyParser = require("body-parser");
var nacl = require("tweetnacl");
var fs    = require('fs');
var nconf = require('nconf');
//https://www.npmjs.com/package/tweetnacl
//https://tweetnacl.cr.yp.to/

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
