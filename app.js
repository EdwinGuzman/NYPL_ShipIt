var http = require('http');
var Static = require('node-static');
var app = http.createServer(handler);
var io = require('socket.io').listen(app);
var port = 3000;

var files = new Static.Server('./public');

function handler (request, response) {
  request.on('end', function() {
    files.serve(request, response);
  }).resume();
}

// start app on specified port
app.listen(port);
console.log('Your server goes on localhost:' + port);

var url = 'http://localhost:8766/location/libraries_loc';
var locations;
var locations_filter=[];

http.get(url, function(res) {
  var data = '';

  res.on('data', function(chunk) {
    data += chunk;
  });

  res.on('end', function() {
    locations = JSON.parse(data);
  });
}).on('error', function(e) {
  console.log("Got error: ", e);
});

// delete to see more logs from sockets
io.set('log level', 1);

var user_location = {};
var library_directions;
io.sockets.on('connection', function (socket) {
  console.log('connect!');
  socket.on('send:coords', function (data) {
    user_location['lat'] = data.coords.lat;
      user_location['long'] = data.coords.lng;

      setLibraries(1);

    socket.emit('load:coords', locations_filter);
  });
  socket.on('send:miles', function (data) {
    //console.log(data);
    setLibraries(data);
    socket.emit('load:coords', locations_filter);
  });
  socket.on('send:sid', function (data) {
    var url = 'http://localhost:8766/location/libraries_directions?sid=' + data;

    http.get(url, function(res) {
      var data = '';
      res.on('data', function(chunk) {
        data += chunk;
      });

      res.on('end', function() {
        library_directions = JSON.parse(data);
        socket.emit('load:library_directions', library_directions);
      });
    }).on('error', function(e) {
        console.log("Got error: ", e);
    });
    socket.emit('load:library_directions', library_directions);
  });
});

function setLibraries(miles) {
  locations_filter = [];
  for (var i=0, len=locations.length; i < len; i++) {
      if (distance(user_location['lat'], user_location['long'], locations[i]['latitude'], locations[i]['longitude']) <= miles) {
        //console.log(locations[i]['name']);
        locations_filter.push(locations[i]);
      }
    }
}

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