
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , bodyParser = require('body-parser')
  , methodOverride = require('method-override')
  , errorHandler = require('errorhandler')
  , http = require('http');

var app = express();

var env = process.env.NODE_ENV || 'development';

// Configuration

app.set('views', __dirname + '/views');
app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride());

if (env == 'development') {
  app.use(errorHandler({ dumpExceptions: true, showStack: true }));
}

if (env == 'production') {
  app.use(errorHandler());
}

// Routes

app.get('/', routes.index);

app.use(express.static(__dirname + '/public'));

var server = http.createServer(app);
server.listen(8000, function(){
  console.log("Express server listening on %s in %s mode", server.address().address, app.settings.env);
});
