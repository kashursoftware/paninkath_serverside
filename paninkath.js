var express = require('express');
var app = express();
var fs = require("fs");


var user = {
   "user4" : {
      "name" : "Amjad",
      "password" : "password4",
      "profession" : "Developer...",
      "id": 4
   }
}

//Disabled CORSE to allow access from any origin
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/addUser', function (req, res) {
	
	var url = require('url');
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	var user = {"fName":query.uName};//,"lName":query.lName,"email":query.email,"uName":query.userName,"passWord":query.passWord,"cPassWord":query.cPassWord};
	
	var obj = JSON.stringify(user);
	
	var util = require('util');
	fs.appendFile('public/data/paninkathUsers.json', util.inspect(user) , 'utf-8');
	
})

app.get('/loginUser', function (req, res) {
	
	var url = require('url');
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	
   fs.readFile( __dirname + "/" + "public/data/paninkathUsers.json", 'utf8', function (err, data) {
	   
	   var users = JSON.parse( data );	   
       var user = users[query.uName] 
       console.log("users"+users);
	   console.log("query"+query.uName);
       res.end( JSON.stringify(user));
   });
})

/*app.get('/listUsers', function (req, res) {
   fs.readFile( __dirname + "/" + "public/data/paninkathUsers.json", 'utf8', function (err, data) {
       console.log( data );
       res.end( data );
   });
})


app.get('/:id', function (req, res) {
   // First read existing users.
   fs.readFile( __dirname + "/" + "data/paninkathUsers.json", 'utf8', function (err, data) {
       users = JSON.parse( data );
       var user = users["user" + req.params.id] 
       console.log( user );
       res.end( JSON.stringify(user));
   });
})*/

var server = app.listen(3500, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port);

})