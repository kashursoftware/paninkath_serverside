var express = require('express');
var app = express();
var jwt = require('jwt-simple');
var fs = require("fs");
var moment = require("moment");
var request = require('request');

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
				
				db.collection('paninkathUsers').findOne({ "uNumber": decoded.uNumber }, function(err, user) {
					req.user = user;
					console.log("TOKEN VALIDATED>>......");
					return res.sendStatus(200);					
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
	
	console.log("query.phone>>>> "+query.phone);
	
	db.collection('paninkathUsers').findOne({ "uNumber": query.phone}, function(err, user) {
		
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
   
	db.collection('paninkathUsers').findOne({ "uNumber": query.uNumber, "passWord": query.pwd}, function(err, user) {
		
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
		uNumber: user.uNumber,
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

var updatePassword = function(db,req, res, callback) {	

	db.collection('paninkathUsers').updateOne({ "uNumber": query.phone },
		{
			$set: {
				passWord:query.newPwd
			}
			
		},
		{
			upsert: true
		}, function(err, result) {
				assert.equal(err, null);
				console.log("Password updated.");
				callback();
				return res.sendStatus("PASSWORD_UPDATED");
				
		});
   
};


var addUser = function(db,req, res, callback) {	

	
   db.collection('paninkathUsers').insertOne( {
	   
	   "fName" : query.fName,
	   "lName" : query.lName,
	   "uNumber" : query.nUNumber,
	   "passWord" : query.passWord
   }, function(err, result) {
    assert.equal(err, null);
    console.log("Inserted a document into the paninkathUsers collection.");
	callback();
	return res.sendStatus("USER_ADDED");
    
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
		}else if(operation === "updatePassword"){
			
			updatePassword(db, req, res, function() {
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

app.get('/getOTP', function (req, res) {
	
	request.get({ url: "https://2factor.in/API/V1/c5db2602-72a3-11e6-a584-00163ef91450/SMS/"+require('url').parse(req.url, true).query.phone+"/AUTOGEN/verifyNumber"}, 
		function(error, response, body) { 
			if (!error && response.statusCode == 200) { 

				 res.json({
					sId: JSON.parse(response.body).Details
				});

			} else{
				
				console.log("Failed.............."+JSON.stringify(error));
				res.sendStatus(401);
			}
    });
	
});

app.get('/validateOTP', function (req, res) {
	
	console.log(""+(require('url').parse(req.url, true).query.vCode));
	
	request.get({ url: "https://2factor.in/API/V1/c5db2602-72a3-11e6-a584-00163ef91450/SMS/VERIFY/"+require('url').parse(req.url, true).query.sId+"/"+require('url').parse(req.url, true).query.vCode}, 
		function(error, response, body) { 
			if (!error && response.statusCode == 200) { 
                 // res.json(body); 
				 console.log("OTP Matched!!!!!");
				 res.sendStatus(200);
			} else{
				
				console.log("Failed.............."+JSON.stringify(error));
				res.sendStatus(401);
			}
    });
	
	
});

app.get('/getTP', function (req, res) {
	
	request.get({ url: "https://2factor.in/API/V1/c5db2602-72a3-11e6-a584-00163ef91450/SMS/"+require('url').parse(req.url, true).query.phone+"/AUTOGEN/forgotPassword"}, 
		function(error, response, body) { 
			if (!error && response.statusCode == 200) { 

				 res.json({
					sId: JSON.parse(response.body).Details
				});

			} else{
				
				console.log("Failed.............."+JSON.stringify(error));
				res.sendStatus(401);
			}
    });
	
	
});

app.get('/validateTP', function (req, res) {
	
	console.log(""+(require('url').parse(req.url, true).query.vCode));
	
	request.get({ url: "https://2factor.in/API/V1/c5db2602-72a3-11e6-a584-00163ef91450/SMS/VERIFY/"+require('url').parse(req.url, true).query.sId+"/"+require('url').parse(req.url, true).query.tmpPwd}, 
		function(error, response, body) { 
			if (!error && response.statusCode == 200) { 
                 // res.json(body); 
				 console.log("TP Verified!!!!!");
				 res.sendStatus(200);
			} else{
				
				console.log("Failed.............."+JSON.stringify(error));
				res.sendStatus(401);
			}
    });
	
	
});

app.get('/updatePassword', function (req, res) {
	
	url = require('url');
	url_parts = url.parse(req.url, true);
	query = url_parts.query;
	
	establishConnectionWithDBase("updatePassword", req, res);
	
	
	
	
})


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

app.get('/validateLoggedInUser', function (req, res, next) {
	
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