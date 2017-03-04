var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var schedule = require('node-schedule');
var jsonHandler = require('./JsonHandeler')
var mongoose = require('mongoose');

// setup our database connection
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://oskar:oskar@ds157809.mlab.com:57809/slackbot");

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.set('port', (process.env.PORT || 5000));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

var slackApiTokenString = 'slackApiToken';
var token;
var jsonfile = require('jsonfile')
var apiHandler = require('./ApiHandler');
//var file = './tmp/data.json'
//var obj = {name: 'JP'}

//jsonfile.writeFile(file, obj, function (err) {
//  console.error(err)
//});

setInterval(function(){
  checkOutgoingMessages();
}, 1000);

var jsonfile = require('jsonfile')
var file = './tmp/data.json'
var checkOutgoingMessages = function(){
  jsonfile.readFile(file, function(err, obj) {
    // fix shit (automated)

  });
}

app.get('/', function(reques, response) {
  if(reques.cookies.slackApiToken){
    console.log(reques.cookies.slackApiToken);
    token = reques.cookies.slackApiToken.split(',');
    var promises = [];

    for(var i = 0; i < token.length; i++){
      promises.push(apiHandler.getChannelInfo(token[i]));
      promises.push(apiHandler.getUsers(token[i]))
    }

    Promise.all(promises).then(values => {
        var val = getReformatedValues(values);
        console.log(val.team);
        response.render('pages/index', {data: val});
    });

  } else{
    response.render('pages/index', {data: []});
  }
});

var getApiTokenFromCookie = function(cookie){
  return cookie.split(',');
}

app.get('/s', function(reques, responsee){
  var tokens = getApiTokenFromCookie(reques.cookies.slackApiToken)
  // teamnamn ska komma via request iallafall
  var token = tokens[0];
  var teaminfo;
  // denna ska komma via request
  var message = 'Hello frieeend';
  // denna ska kommma via request
  var time = new Date(2017,02,01, 19, 00, 00);
  // denna ska komma via post requestet
  var days = {
    monday: false,
    tuesday: true,
  };
  apiHandler.getUsers(token).then(function(users){
    //console.log(users);
    apiHandler.getChannelInfo(token).then(function(info){
      //console.log(info)
      teaminfo = info.team;
      jsonHandler.addNewMessage(token, teaminfo,users, time.getHours(), message,days).then(function(back){
        console.log(back);
      });
    });
  });
  responsee.redirect('/');
});

app.get('/callback', function(reques, responsee) {
  var code = reques.query.code;
  apiHandler.getToken(code).then(function(tokenm){
    token = tokenm;
    if(reques.cookies.slackApiToken == null){
      responsee.cookie(slackApiTokenString, tokenm, { maxAge: 90000000000, httpOnly: true }).redirect('/');
    } else{
      var oldToken = reques.cookies.slackApiToken;
      var tokenArr = oldToken.split(',');
      for(var i = 0; i < tokenArr.length; i++){
        if(tokenArr[i] === tokenm){
          responsee.cookie(slackApiTokenString, oldToken,{ maxAge: 90000000000, httpOnly: true }).redirect('/');
          return;
        }
      }
      oldToken = oldToken + ',' + tokenm;
      responsee.cookie(slackApiTokenString, oldToken,{ maxAge: 90000000000, httpOnly: true }).redirect('/');
    }
  });
});


var getReformatedValues = function(values){
  var returnArray = [];
  for(var i = 0; i < values.length; i += 2){
    var teamInfo = values[i].team;
    var incomingUsers = values[i+1];
    var obj = {
      team: teamInfo,
      users: incomingUsers
    }
    returnArray.push(obj);
  }
  return returnArray;
}

var scheduleMessage = function(message, userChannel, date){
  var now = new Date();
  var j = schedule.scheduleJob(date, function(){
    console.log('The answer to life, the universe, and everything! ' + date.getTime());
  });
}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
