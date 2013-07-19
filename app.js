
/**
 * Module dependencies.
 */

var express = require('express'),
		routes = require('./routes'),
    nypl_locations = require('./routes/nypl_locations'),
		user = require('./routes/user'),
		http = require('http'),
		path = require('path'),
    //app = http.createServer(),
    app = express(),
    server = http.createServer(app),
		mysql = require('mysql'),
    io = require('socket.io').listen(server),
    Static = require('node-static');

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

//development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}
// http.createServer(app).listen(app.get('port'), function(){
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});



// var files = new Static.Server('./public');

// function handler(req, res) {
//   req.on('end', function() {
//     files.serve(req, res);
//   }).resume();
// }

var url = 'http://localhost:8766/location/node-test';
var locations;
var locations_filter=[];

http.get(url, function(res) {
    //var body = '';

    res.on('data', function(data) {
        //body += chunk;
        // console.log(JSON.parse(data));
        locations = JSON.parse( data );
        //console.log(typeof locations[0]['name']);
    });

    res.on('end', function() {
        // var fbResponse = JSON.parse(body)
        // console.log("Got response: ", fbResponse.name);
    });
}).on('error', function(e) {
      console.log("Got error: ", e);
});
var user_location = {};
io.sockets.on('connection', function (socket) {
  socket.on('send:coords', function (data) {
    user_location['lat'] = data.coords.lat;
    user_location['long'] = data.coords.lng;

    for (var i=0, len=locations.length; i < len; i++) {
      // console.log(locations[i]);
      if (distance(user_location['lat'], user_location['long'], locations[i]['latitude'], locations[i]['longitude']) <= 10) {
        //console.log(locations[i]['name']);
        locations_filter.push(locations[i]);
      }
    }
    //console.log(locations_filter);
    socket.broadcast.emit('updateMap', locations_filter);
    io.sockets.emit('updateMap', locations_filter);
  });
  // socket.on('map', function(data) {
  //   io.sockets.emit('updateMap', locations);
  // });

});

function distance(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

io.set('log level', 1);

// app.get('/', function(req, res) {
//   for (var i=0, len=locations.length; i < len; i++) {
//     //console.log(locations[i]['name']);
//   }
// 	res.render('index', { 
//     title: 'NYPL Libraries', 
//     location: locations_filter
// 	});
// });
app.get('/', function(req, res) {
  res.render('index', {
    title: 'NYPL Libraries',  
    location: locations_filter
  });
});