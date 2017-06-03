let express = require('express');
let app = express();
let request = require('request');
let bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
let schedule = require('node-schedule');
let jsonHandler = require('./JsonHandeler')
let mongoose = require('mongoose');
let cronJob = require('./CronJobs');

// grab the Mixpanel factory
let Mixpanel = require('mixpanel');

// create an instance of the mixpanel client
let mixpanel = Mixpanel.init('28446a6b8950088604497db036de5bc2');

// start cronstuff (sending messages at a specific time)
cronJob.start();

// setup our database connection
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://oskar:oskar@ds157809.mlab.com:57809/slackbot");

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.set('port', (process.env.PORT || 5000));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

var slackApiTokenString = 'slackApiToken';
var apiHandler = require('./ApiHandler');


// the landingpage
app.get('/', function(reques, response) {
  mixpanel.track('home_page_view');
  if (reques.cookies.slackApiToken) {
    var token = reques.cookies.slackApiToken.split(',');
    var promises = [];
    for (var i = 0; i < token.length; i++) {
      promises.push(apiHandler.getTeamInfo(token[i]));
      promises.push(apiHandler.getUsers(token[i]));
      promises.push(jsonHandler.getMessagesByToken(token[i]));
      promises.push(apiHandler.getManagerInfo(token[i]));
    }

    Promise.all(promises).then(values => {
      var val = getReformatedValues(values);
      for (var i = 0; i < val.length; i++) {
        val[i].token = token[i];
      }
      response.render('pages/index', {
        data: val
      });
    });
  } else {
    response.render('pages/index', {
      data: []
    });
  }
});

// small split function
var getApiTokenFromCookie = function(cookie) {
  return cookie.split(',');
}

app.post('/slackverification', function(request, response){
  let challenge = request;
  console.log("yes")
  response.send("yoo2")
});

// route for managerportal
app.get('/team', function(reques, responsee) {
  var teamToken = reques.query.token;
  var promises = [];

  promises.push(apiHandler.getTeamInfo(teamToken));
  promises.push(apiHandler.getUsers(teamToken));
  promises.push(jsonHandler.getMessagesByToken(teamToken));


  Promise.all(promises).then(values => {
    var val = getReformatedValues(values)[0];
    console.log(val);
    val.token = teamToken;
    responsee.render('pages/team', {
      data: val
    });
  });

});

// test route to add messagesb
app.get('/s', function(reques, responsee) {
  var tokens = getApiTokenFromCookie(reques.cookies.slackApiToken)
  // teamnamn ska komma via request iallafall
  var token = tokens[0];
  var teaminfo;

  // denna ska komma via request
  var message = 'Hello yo';

  //timezone ska komma via request
  var tz_offset = -7200;

  // HÄR SKER TIMEZONEFIX
  // denna ska kommma via request
  var time = new Date()
  time.setHours(23)


  // denna ska komma via post requestet
  var days = {
    monday: false,
    tuesday: true,
    wednesday: false,
    thursday: true,
    friday: false,
    saturday: true,
    sunday: false
  };

  let scheduleTimes = correctTimeZone(days, time, tz_offset)

  var promises = [];

  promises.push(apiHandler.getTeamInfo(token));
  promises.push(apiHandler.getUsers(token));

  Promise.all(promises).then(values => {
    var rep = 2;
    //jsonHandler.addNewMessage(token, values[0], values[1], time.getHours(), time.getMinutes(), message, days, rep).then(function(back) {
      //console.log(back);
    //});
  });

  responsee.redirect('/');
});

let correctTimeZone = function(days, time, tz_off){
  newTime = time.getTime() - tz_off*1000;
  time.setTime(newTime);
  let yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if(time.getDate() == yesterday.getDate()){
      let temp = days.monday;
      days.monday = days.sunday;
      let temp2 = days.tuesday;
      days.tuesday = temp;
      temp = days.wednesday;
      days.wednesday = temp2
      temp2 = days.thursday;
      days.thursday = temp;
      temp = days.friday;
      days.friday = temp2;
      temp2 = days.saturday;
      days.saturday = temp;
      days.sunday = temp2;
  }
  let tommorrow = new Date()
  tommorrow.setDate(tommorrow.getDate() + 1);
  if(time.getDate() == tommorrow.getDate()){
    let temp = days.monday;
    days.monday = days.tuesday;
    days.tuesday = days.wednesday;
    days.wednesday = days.thursday;
    days.thursday = days.friday;
    days.friday = days.saturday;
    days.saturday = days.sunday;
    days.sunday = temp;
  }
  console.log(days);
  console.log(yesterday.getDate());
  console.log(time.toISOString());

}


// this is the callback function when coming back from slack login page
app.get('/callback', function(reques, responsee) {
  mixpanel.track('login_with_slack');
  var code = reques.query.code;
  apiHandler.getToken(code).then(function(tokenm) {
    if (reques.cookies.slackApiToken == null) {
      responsee.cookie(slackApiTokenString, tokenm, {
        maxAge: 90000000000,
        httpOnly: true
      }).redirect('/');
    } else {
      var oldToken = reques.cookies.slackApiToken;
      var tokenArr = oldToken.split(',');
      for (var i = 0; i < tokenArr.length; i++) {
        if (tokenArr[i] === tokenm) {
          responsee.cookie(slackApiTokenString, oldToken, {
            maxAge: 90000000000,
            httpOnly: true
          }).redirect('/');
          return;
        }
      }
      oldToken = oldToken + ',' + tokenm;
      responsee.cookie(slackApiTokenString, oldToken, {
        maxAge: 90000000000,
        httpOnly: true
      }).redirect('/');
    }
  });
});

// remove information from values and only add the important stuff
var getReformatedValues = function(values) {
  var returnArray = [];
  for (var i = 0; i < values.length; i += 4) {
    var teamInfo = values[i].team;
    var incomingUsers = values[i + 1];
    var messages = values[i + 2];
    var managerInfo = values[i + 3];
    //console.log(incomingUsers);
    var users = [];

    for (var i = 0; i < incomingUsers.length; i++) {
      var user = {
        id: incomingUsers[i].id,
        name: incomingUsers[i].real_name,
        user_name: incomingUsers[i].name,
        time_zone: incomingUsers[i].tz,
        time_zone_offset: incomingUsers[i].tz_offset,
        is_bot: incomingUsers[i].is_bot,
        image: incomingUsers[i].profile.image_48
      }

      users.push(user);
    }
    var obj = {
      team: teamInfo,
      users: users,
      messages: messages
    }
    //console.log(users);
    returnArray.push(obj);
  }
  return returnArray;
}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
