var express = require('express');
var app = express();
var jwt = require('jwt-simple');
var fs = require("fs");
var moment = require("moment");

app.set('jwtTokenSecret', 'PANINKATH_SECRET');

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var dataBsurl = 'mongodb://localhost:27017/paninkathDb';

var url;
var url_parts;
var query;



var validateToken = function(db, req, res) {
	
	
	var token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-auth-token'];

	if (token) {
		try {
			var decoded = jwt.decode(token, app.get('jwtTokenSecret'));

			if (decoded.exp <= Date.now()) {
				res.end('Access token has expired', 400);
			}else{
				
				db.collection('paninkathUsers').findOne({ "uName": decoded.uName }, function(err, user) {
					req.user = user;
					return res.sendStatus(200);
					console.log("TOKEN VALIDATED>>......");
				});
			}

		} 
		catch (err) {
			return next();
		}
	} else {
		next();
	}
	
};

var checkUserNameAvailability = function(db, req, res, callback){
	
	db.collection('paninkathUsers').findOne({ "uName": query.userName.toLowerCase()}, function(err, user) {
		
	console.log("query.userName.toLowerCase()................. >> "+query.userName.toLowerCase());
	  if (err) { 
		callback();
		return res.sendStatus(200);
	  }
	  
	  if (!user) {
		callback();
		return res.sendStatus(200);
	  }
	  
	  return res.sendStatus(401);

	  
	  callback();

	});
	
	
};

var authenticateUser = function(db, req, res, callback) {
   
	db.collection('paninkathUsers').findOne({ "uName": query.uName.toLowerCase(), "passWord": query.pwd}, function(err, user) {
		
	  if (err) { 
		// user not found 
		console.log("USER NOT Found....");
		callback();
		return res.sendStatus(401);
	  }

	  if (!user) {
		// incorrect username
		callback();
		return res.sendStatus(401);
	  }
	  
	  var expires = moment().add(90000,'days').valueOf();
	  var token = jwt.encode({
		uName: user.uName,
		exp: expires
	  }, app.get('jwtTokenSecret'));
	

	  res.json({
		token : token,
		expires: expires,
		user: JSON.stringify(user)
	  });
	
		callback();

	});
};

var addUser = function(db,req, res, callback) {	

   var UNameInLowerCase = query.userName.toLowerCase();
	
   db.collection('paninkathUsers').insertOne( {
	   
	   "fName" : query.fName,
	   "lName" : query.lName,
	   "email" : query.email,
	   "uName" : UNameInLowerCase,
	   "passWord" : query.passWord
   }, function(err, result) {
    assert.equal(err, null);
    console.log("Inserted a document into the paninkathUsers collection."+UNameInLowerCase);
	return res.sendStatus("USER_ADDED");
    callback();
  });
};

function establishConnectionWithDBase(operation, req, res){
	
	
		MongoClient.connect(dataBsurl, function(err, db) {
		assert.equal(null, err);

		if(operation === "addUser"){
				
			addUser(db,req, res, function() {
				db.close();
			});
		}else if (operation === "authenticateUser"){
			
			authenticateUser(db, req, res, function() {
				db.close();
			});
		}else if(operation === "validateToken"){
			
			validateToken(db, req, res);
		}else if(operation === "checkUserNameAvailability"){
			
			checkUserNameAvailability(db, req, res, function() {
				db.close();
			});
		}
		

		});
		

};

//Disabled CORSE to allow access from any origin
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Auth-Token, Content-Type, Accept");
    
  next();
});

app.get('/addUser', function (req, res) {
	
	url = require('url');
	url_parts = url.parse(req.url, true);
	query = url_parts.query;
	
	establishConnectionWithDBase("addUser", req, res);
	
})

app.get('/loginUser', function (req, res) {
	
	url = require('url');
	url_parts = url.parse(req.url, true);
	query = url_parts.query;
    establishConnectionWithDBase("authenticateUser", req, res);
})

app.get('/welcomeUser', function (req, res, next) {
	
	url = require('url');
	url_parts = url.parse(req.url, true);
	query = url_parts.query;
		
    establishConnectionWithDBase("validateToken", req, res);
})

app.get('/checkUserNameAvailability', function (req, res, next) {
	
	url = require('url');
	url_parts = url.parse(req.url, true);
	query = url_parts.query;
		
    establishConnectionWithDBase("checkUserNameAvailability", req, res);
})


app.get('/logout', function (req, res, next) {
	
	url = require('url');
	url_parts = url.parse(req.url, true);
	query = url_parts.query;
		
    establishConnectionWithDBase("validateToken", req, res);
})

var server = app.listen(3800, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://119.18.52.6:", port);

})