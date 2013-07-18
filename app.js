
/**
 * Module dependencies.
 */

var express = require('express'),
		routes = require('./routes'),
		user = require('./routes/user'),
		http = require('http'),
		path = require('path'),
		mysql = require('mysql');

var app = express();

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

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var connection = mysql.createConnection({
	host: '',
	user: '',
	password: '',
	database: ''
});

connection.connect();

var chapter_titles = [];
connection.query('SELECT * FROM book2', function(err, rows, fields) {
	if (err) console.log('fail');

	for (var i in rows) {
		console.log(typeof rows[i]['title']);
		chapter_titles.push(rows[i]['title']);
		//console.log('test: ', fields);
	}
});

connection.end();


app.get('/', function(req, res) {

	res.render('index', { title: 'Express',
  	block: chapter_titles.join('')
	});
});
app.get('/users', user.list);