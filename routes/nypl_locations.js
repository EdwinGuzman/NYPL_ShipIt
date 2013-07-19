var mongo = require('mongodb');

var Server = mongo.Server,
	Db = mongo.Db,
	BSON = mongo.BSONPure;

var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('mydb', server, {safe: true});

var listAll = function(err, collection) {
	collection.find().toArray(function(err, items) {
  	console.log(items);
  });
}
// db.open(function(err, db) {
// 	if (!err) {
// 		console.log("Connected to 'mydb' database!");
// 		db.collection('locations_spaces', {safe: true}, function(err, collection) {
// 			collection.find().toArray(function (err, results) {
// 		    console.log(results);
// 		  });
// 			if (err) {
// 				console.log("locations_spaces doesn't exit?");
// 			}
// 		});
// 	}
// });

exports.findById = function(req, res) {
	db.open(function(err, db) {
	  db.collection('locations_spaces', function(err, collection) {
	    collection.findOne().toArray(function(err, item) {
	      res.send(item);
	    });
	  });
	});
	db.close();
};

exports.findAll = function(req, res) {
	db.open(function(err, db) {
		db.collection('locations_spaces', listAll);
	});
	db.close();
};