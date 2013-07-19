$(function() {
	// generate unique user id
	var userId = Math.random().toString(16).substring(2,15);
	var socket = io.connect('/');
	var map;

	var info = $('#infobox');
	var doc = $(document);

	// custom marker's icon styles
	var tinyIcon = L.Icon.extend({
		options: {
			shadowUrl: '../assets/marker-shadow.png',
			iconSize: [25, 39],
			iconAnchor:   [12, 36],
			shadowSize: [41, 41],
			shadowAnchor: [12, 38],
			popupAnchor: [0, -30]
		}
	});
	var nypl = L.Icon.extend({
		options: {
			iconSize: [20, 20]
		}
	});
	var redIcon = new tinyIcon({ iconUrl: '../assets/marker-red.png' });
	var yellowIcon = new tinyIcon({ iconUrl: '../assets/marker-yellow.png' });
	var nyplIcon = new nypl({ iconUrl: '../assets/favicon.ico' });

	var sentData = {};

	var connects = {};
	var markers = {};
	var all_markers = [];
	var active = false;

	socket.on('updatemap', function(data) {
		alert(data);
	});

	socket.on('load:library_directions', function(data) {
		console.log(data);
		var libdir = $('#library_directions').html('');
		//var libevt = $('#library_events').html('');
		var dir = '<h2>Directions</h2>';
		//var evt = '<h2>Events</h2>';

		for (var i in data) {
			dir += '<p><em>Mode:</em> ' + data[i]['mode'] + '<br />';
			dir += 'Transit: ' + data[i]['identifier'] + '<br />';
			dir += 'Route: ' + data[i]['route'] + '</p><br />';
		}
		
		libdir.append(dir);
		//libevt.append(evt);
		$('#library_events').show();
	});
	var nyplLibraries = L.layerGroup();
	socket.on('load:coords', function(data) {
		nyplLibraries.clearLayers();
		console.log(data);

		all_markers.splice(0, all_markers.length);
		for (var i in data) {
			var marker = L.marker([data[i]['latitude'], data[i]['longitude']], { icon: nyplIcon });
			all_markers.push(marker);
			var link = $('<p><a href="#" class="library_loc" id="'+ data[i]['sid'] + '">' + data[i]['name'] + '</a><br/ >' + data[i]['address'] + '</p>')
				.click(function(e) {
					e.preventDefault();
					console.log($(this).find('a').attr('id'));
					socket.emit('send:sid', $(this).find('a').attr('id'));
				})[0];
			marker.bindPopup(link);
		}
		nyplLibraries = L.layerGroup(all_markers);
		map.addLayer(nyplLibraries);
	});


	// check whether browser supports geolocation api
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(positionSuccess, positionError, { enableHighAccuracy: true });
	} else {
		$('.map').text('Your browser is out of fashion, there\'s no geolocation!');
	}

	function positionSuccess(position) {
		var lat = position.coords.latitude;
		var lng = position.coords.longitude;
		var acr = position.coords.accuracy;

		// mark user's position
		var userMarker = L.marker([lat, lng], {
			icon: redIcon
		});
		// uncomment for static debug
		// userMarker = L.marker([51.45, 30.050], { icon: redIcon });

		// load leaflet map
		map = L.map('map').setView([lat, lng], 13);

		// leaflet API key tiler
		L.tileLayer('http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png', { maxZoom: 18, detectRetina: true }).addTo(map);
		userMarker.addTo(map);
		userMarker.bindPopup('<p>You are here!</p>').openPopup();

		sentData = {
			coords: {
				lat: lat,
				lng: lng,
				acr: acr
			}
		};


		socket.emit('send:coords', sentData);
	}

	$('#submit_miles').click(function() {

		var miles = parseInt($("#miles").val(), 10);
		socket.emit('send:miles', miles);
	});
	// showing markers for connections
	function setMarker(data) {
		// for (var i = 0; i < data.coords.length; i++) {
		// 	var marker = L.marker([data.coords[i].lat, data.coords[i].lng], { icon: yellowIcon }).addTo(map);
		// 	marker.bindPopup('<p>One more external user is here!</p>');
		// 	markers[data.id] = marker;
		// }

		var marker = L.marker([$(this).data('lat'), $(this).data('long')], { icon: yellowIcon }).addTo(map);
		markers[data.id] = marker;
	}

	// handle geolocation api errors
	function positionError(error) {
		var errors = {
			1: 'Authorization fails', // permission denied
			2: 'Can\'t detect your location', //position unavailable
			3: 'Connection timeout' // timeout
		};
		showError('Error:' + errors[error.code]);
	}

	function showError(msg) {
		info.addClass('error').text(msg);

		doc.click(function() {
			info.removeClass('error');
		});
	}
});