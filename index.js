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

var clientId = "143457452320.144253511221";
var clientSecret = "fdfb5b7fedfc81dca623f06e3e813a4b";
app.get('/callback', function(reques, responsee) {

  var code = reques.query.code;
  var redirectString = 'http://slack.com/api/oauth.access?client_id=' +clientId + '&client_secret=' + clientSecret + '&code=' + code;
  var token = "hej";
  request(redirectString, function(error,response,body){
    var jsonBody = JSON.parse(body);
    token = jsonBody["access_token"];
  //  console.log(body);
    var groupString = 'https://slack.com/api/users.list?token=' + token;
    request(groupString, function(error, response, body){
      console.log(body + " hejk");
    });

    responsee.redirect(groupString);
  });


});

/*
app.post('/', function(req, res) {
  payload.text = req.body.name;
  payload.username = req.body.user;
  options.url = req.body.chat;

  console.log(req.body);
  request(options, function (err, res, body) {
    console.log(body);
  });
  res.render('pages/index');


});

*/

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
