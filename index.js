var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var schedule = require('node-schedule');
var jsonHandler = require('./JsonHandeler')
var mongoose = require('mongoose');
var cronJob = require('./CronJobs');
cronJob.start();
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
var apiHandler = require('./ApiHandler');

app.get('/', function(reques, response) {


  if(reques.cookies.slackApiToken){
    var token = reques.cookies.slackApiToken.split(',');
    var promises = [];
    for(var i = 0; i < token.length; i++){
      promises.push(apiHandler.getTeamInfo(token[i]));
      promises.push(apiHandler.getUsers(token[i]));
      promises.push(jsonHandler.getMessagesByToken(token[i]));
    }

    Promise.all(promises).then(values => {
        var val = getReformatedValues(values);
        for(var i = 0; i < val.length; i++){
          val[i].token = token[i];
        }

        console.log(val)
        response.render('pages/index', {data: val});
    });
  } else{
    response.render('pages/index', {data: []});
  }
});

var getApiTokenFromCookie = function(cookie){
  return cookie.split(',');
}

app.get('/add', function(reques, responsee){
  responsee.render('pages/add');
});

app.get('/team', function(reques,responsee){
  var teamToken = reques.query.token;
  var promises = [];

  promises.push(apiHandler.getTeamInfo(teamToken));
  promises.push(apiHandler.getUsers(teamToken));
  promises.push(jsonHandler.getMessagesByToken(teamToken));

  Promise.all(promises).then(values => {
      var val = getReformatedValues(values)[0];
      console.log(val);
      val.token = teamToken;
      responsee.render('pages/team', {data: val});
  });

});

app.get('/s', function(reques, responsee){
  var tokens = getApiTokenFromCookie(reques.cookies.slackApiToken)
  // teamnamn ska komma via request iallafall
  var token = tokens[0];
  var teaminfo;
  // denna ska komma via request
  var message = 'Hello frieeend';
  // denna ska kommma via request
  var time = new Date(2017,02,01, 20, 00, 00);
  // denna ska komma via post requestet
  var days = {
    monday: false,
    tuesday: true,
    wednesday: false,
    thursday: true,
    friday: false,
    saturday: false,
    sunday: true
  };
  var promises = [];

  promises.push(apiHandler.getTeamInfo(token));
  promises.push(apiHandler.getUsers(token));

  Promise.all(promises).then(values => {
      console.log(values);
      jsonHandler.addNewMessage(token, values[0],values[1], time.getHours(), message,days).then(function(back){
        console.log(back);
      });

  });

  responsee.redirect('/');
});


app.get('/callback', function(reques, responsee) {
  var code = reques.query.code;
  apiHandler.getToken(code).then(function(tokenm){
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
  console.log(values.length);
  for(var i = 0; i < values.length; i += 3){
    var teamInfo = values[i].team;
    var incomingUsers = values[i+1];
    var messages = values[i+2];
    var users = [];

    for(var i = 0; i < incomingUsers.length; i++){
        var user = {
            id: incomingUsers[i].id,
            name: incomingUsers[i].real_name,
            user_name: incomingUsers[i].name,
            time_zone: incomingUsers[i].tz,
            time_zone_offset: incomingUsers[i].tz_offset,
            is_bot: incomingUsers[i].is_bot,
            image:incomingUsers[i].profile.image_48
        }

        users.push(user);
    }

    console.log(users);

      var obj = {
      team: teamInfo,
      users: users,
      messages: messages
    }

    returnArray.push(obj);
  }
  return returnArray;
}



app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
