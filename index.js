require('newrelic');
let express = require('express');
let app = express();
let request = require('request');
let bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
let schedule = require('node-schedule');
let jsonHandler = require('./JsonHandeler')
let mongoose = require('mongoose');
let cronJob = require('./CronJobs');
let messageQueue = require('./DMMessageHandeler');
// grab the Mixpanel factory
let Mixpanel = require('mixpanel');

// create an instance of the mixpanel client
let mixpanel = Mixpanel.init('28446a6b8950088604497db036de5bc2');

// start cronstuff (sending messages at a specific time)
cronJob.start();

// setup our database connection
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://104.236.104.19:27017/slackbot");
//mongodb://<dbuser>:<dbpassword>@ds157809.mlab.com:57809/slackbot
//
//mongodb://oskarr:oskar@ds157624.mlab.com:57624/slackk


app.use(express.static(__dirname + '/public'));

// configure the app to use bodyParser()
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());
app.use(cookieParser());

app.set('port', (process.env.PORT || 5000));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

var slackApiTokenString = 'slackApiToken';
var apiHandler = require('./ApiHandler');


// the landingpage
app.post('/api/getInformation', function(reques, response) {
  mixpanel.track('home_page_view');
  var token = reques.body.token;

    var promises = [];

    promises.push(apiHandler.getTeamInfo(token));
    promises.push(apiHandler.getUsers(token));
    promises.push(jsonHandler.getMessagesByToken(token));
    promises.push(apiHandler.getManagerInfo(token));


    Promise.all(promises).then(values => {
      var val = getReformatedValues(values);
      for (var i = 0; i < val.length; i++) {
        val[i].token = token;
      }
      response.send(val[0]);
    });

});

// small split function
var getApiTokenFromCookie = function(cookie) {
  return cookie.split(',');
}

app.post('/api/slackverification', function(request, response){
  var challenge = request.body.challenge;
  var teamId = request.body.team_id;
  var userId = request.body.event.user;
  var channel = request.body.event.channel;
  messageQueue.popMessage(teamId, userId, channel).then(function(messageObj){
    apiHandler.sendDirectMessage(userId, messageObj.message, messageObj.token).then(function(body){

    }).catch(function(err){
        console.log(err)
    });
  }).catch(function(err){
    console.log(err)
  });

  response.send(challenge)
});

// route for managerportal
app.get('/api/team', function(reques, responsee) {
  var teamToken = reques.query.token;
  var promises = [];

  promises.push(apiHandler.getTeamInfo(teamToken));
  promises.push(apiHandler.getUsers(teamToken));
  promises.push(jsonHandler.getMessagesByToken(teamToken));

  Promise.all(promises).then(values => {
    var val = getReformatedValues(values)[0];
    val.token = teamToken;
    responsee.render('pages/team', {
      data: val
    });
  });
});

//xoxp-143457452320-144242893812-147204566484-cbf27d9eca033a3d136fdf12b10ab505

// test route to add messagesb
app.post('/api/newmessage', function(reques, responsee) {
  var requestBody = reques.body;

  // teamnamn ska komma via request iallafall
  var token = requestBody.token
  var teaminfo;

  // denna ska komma via request
  var message = requestBody.questions;

  var users = [];

  for(i in requestBody.users){
     if(requestBody.users[i].selected){
        users.push(requestBody.users[i]);
     }
  }

  //timezone ska komma via request
  var tz_offset = requestBody.timeZoneOffset * 60;

  var timeString =  requestBody.schedule.time;
  var hours = timeString.split(":")[0];
  var minutes = timeString.split(":")[1];
  var time = new Date();
  time.setHours(hours);
  time.setMinutes(minutes);

  // denna ska komma via post requestet
  var days = requestBody.schedule.repeat_on;
  var dayFormat = {
    monday: days.mon,
    tuesday: days.tue,
    wednesday: days.wed,
    thursday: days.thu,
    friday: days.fri,
    saturday: days.sat,
    sunday: days.sun
  };

  days = dayFormat
  correctTimeZone(days, time, tz_offset)

  var promises = [];

  promises.push(apiHandler.getTeamInfo(token));
  promises.push(apiHandler.channelInfo(token));


    Promise.all(promises).then(values => {
    var repeatEvery = requestBody.schedule.repeat_every;
    jsonHandler.addNewMessage(token, values[0], users, time.getHours(), time.getMinutes(), message, days, repeatEvery, values[1]).then(function(back) {
      responsee.send({});
    });
  });

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
  if(time.getDate() === tommorrow.getDate()){
    let temp = days.monday;
    days.monday = days.tuesday;
    days.tuesday = days.wednesday;
    days.wednesday = days.thursday;
    days.thursday = days.friday;
    days.friday = days.saturday;
    days.saturday = days.sunday;
    days.sunday = temp;
  }

}


app.get('/api/getToken', function(request, response){
  var code = request.query.code;
  apiHandler.getToken(code).then(function(tokenm) {
    response.send({token: tokenm});
  });

});

// this is the callback function when coming back from slack login page
app.get('/api/callback', function(reques, responsee) {
  mixpanel.track('login_with_slack');
  var code = reques.query.code;
  responsee.redirect("https://www.speakupcheckin.com/onboard?code=" + code)
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
      if(incomingUsers[i].id === "USLACKBOT"){
        continue;
      }
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
    };

     returnArray.push(obj);
  }
  return returnArray;
}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
