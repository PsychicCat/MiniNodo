var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var nacl = require("tweetnacl");
//https://www.npmjs.com/package/tweetnacl
//https://tweetnacl.cr.yp.to/
 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
 
var routes = require("./routes/routes.js")(app);

var server = app.listen(3000, function () {
    console.log("Listening on port %s...", server.address().port);
    MiniNeroPk = "cd9db8fafbf2b99605cee870ada0dd64ae5a583a4414c3d5d34e8e8072d520b6"; //Maybe load from a separate file like MiniNero does..
    Lasttime = 0;
});
