var express = require('express');
var app = express();
var fs = require("fs");

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var dataBsurl = 'mongodb://localhost:27017/PANINKATH_DATABASE';

var url;
var url_parts;
var query;

var authenticateUser = function(db, callback) {
   var cursor = db.collection('paninkathUsers').find({ "uName": query.uName, "passWord": query.pwd});
   
   cursor.each(function(err, doc) {
      assert.equal(err, null);
	  
      if (doc != null) {
         console.dir(doc);
		 console.log("login successful" + doc);
      } else {
		 console.log("login failed" + doc);
         callback();
      }
   });
};

var addUser = function(db, callback) {	
	
   db.collection('paninkathUsers').insertOne( {
	   
	   "fName" : query.fName,
	   "lName" : query.lName,
	   "email" : query.email,
	   "uName" : query.userName,
	   "passWord" : query.passWord,
	   "cPassWord" : query.cPassWord
   }, function(err, result) {
    assert.equal(err, null);
    console.log("Inserted a document into the paninkathUsers collection.");
    callback();
  });
};

function establishConnectionWithDBase(operation){
	
		MongoClient.connect(dataBsurl, function(err, db) {
		assert.equal(null, err);

		if(operation === "addUser"){
				
			addUser(db, function() {
				db.close();
			});
		}else if (operation === "authenticateUser"){
			
			authenticateUser(db, function() {
				db.close();
			});
		}
		

		});
		

};

//Disabled CORSE to allow access from any origin
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/addUser', function (req, res) {
	
	url = require('url');
	url_parts = url.parse(req.url, true);
	query = url_parts.query;
	
	establishConnectionWithDBase("addUser");
	
})

app.get('/loginUser', function (req, res) {
	
	url = require('url');
	url_parts = url.parse(req.url, true);
	query = url_parts.query;
    establishConnectionWithDBase("authenticateUser");
})

var server = app.listen(3800, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port);

})