var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

var payload = {
    'text':'YEEE',
    'username': 'Mr slack bot',
    'icon_emoji': ':nerd_face:'
}

app.use(bodyParser.urlencoded({ extended: true }));

var url = 'https://hooks.slack.com/services/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'
var options = {
  method: 'post',
  body: payload,
  json: true,
  url: url
}

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(reques, response) {
  response.render('pages/index');

});

app.post('/', function(req, res) {
  payload.text = req.body.name;
  payload.username = req.body.user;
  console.log(req.body);
  request(options, function (err, res, body) {
    console.log(body);
  });
  res.render('pages/index');


});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
