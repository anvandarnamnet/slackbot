var express = require('express');
var app = express();
var request = require('request');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(reques, response) {
  response.render('pages/index');
  request.post({url:'https://hooks.slack.com/services/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', payload: {"text":"yo"}}, function(err,httpResponse,body){ console.log("body")});
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
