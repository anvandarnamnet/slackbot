var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var schedule = require('node-schedule');
var jsonHandler = require('./JsonHandeler')

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

var clientId = "143457452320.144253511221";
var clientSecret = "fdfb5b7fedfc81dca623f06e3e813a4b";
var slackApiTokenString = 'slackApiToken';
var token;
var jsonfile = require('jsonfile')

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

  })
}

app.get('/', function(reques, response) {

  if(reques.cookies.slackApiToken){
    console.log(reques.cookies.slackApiToken);
    token = reques.cookies.slackApiToken.split(',');
    var promises = [];
    for(var i = 0; i < token.length; i++){
      promises.push(getChannelInfo(token[i]));
      promises.push(getUsers(token[i]))
    }

    Promise.all(promises).then(values => {
        var val = getReformatedValues(values);
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
  var token = tokens[0];
  var teaminfo;
  var message = 'Hello frieeend';
  var time = new Date(2017,02,01, 19, 00, 00);
  console.log(time);
  getChannelInfo(token).then(function(info){
    //console.log(info);
    teaminfo = info.team;
  });

  responsee.render('pages/index', {data: []});

});


app.get('/callback', function(reques, responsee) {
  var code = reques.query.code;
  getToken(code).then(function(tokenm){
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


// get a token based on the code recieved from the slack oAtuh and the apps client id and client secret.
var getToken = function(code){
  return new Promise(function(resolve, reject) {

    // the question string to slack
    var questionString = 'http://slack.com/api/oauth.access?client_id=' + clientId + '&client_secret=' + clientSecret + '&code=' + code;
    request(questionString, function(error,response,body){
      var jsonBody = JSON.parse(body);
      if(error != null){
        reject(error);
      } else{
        token = jsonBody["access_token"];
        // return the token
        resolve(token);
      }
    });
  });
}

// get info of a team by token
var getChannelInfo = function(incomingToken){
  return new Promise(function(resolve, reject){
    var getInfoString = 'https://slack.com/api/team.info?token=' + incomingToken;
    request(getInfoString, function(error, response, body){
      if(error != null){
        reject(error);
      } else{
        var jsonBody = JSON.parse(body);
        resolve(jsonBody);
      }
    });
  });
}

// send a direct message to somone in the slack channel
// @channel - the channel id for the direct message
// @text - the text to send
var sendDirectMessage = function(channel, text, tokenm){
  return new Promise(function(resolve, reject){
    var sendDMMessageString = 'https://slack.com/api/chat.postMessage?token=' + tokenm + '&channel=' + channel + '&text=' + text + '&as_user=true'  ;
    request(sendDMMessageString, function(error, response, body){
      if(error != null){
        reject(error);
      }

      var jsonBody = JSON.parse(body);

      // return the json body
      resolve(jsonBody);
    });
  });
}



// get all the IM ids for direct messages
var getIM = function(tokenm){
  return new Promise(function(resolve, reject){
    var groupString = 'https://slack.com/api/im.list?token=' + tokenm;
    request(groupString, function(error, response, body){
      if(error != null){
        reject(error);
      }
      var jsonBody = JSON.parse(body);
      var ims = jsonBody["ims"];
      // return the ims
      resolve(ims);
    });
  });
}


// get the specifik users for a token (a channel)
var getUsers = function(tokenm){
  return new Promise(function(resolve, reject){
    var groupString = 'https://slack.com/api/users.list?token=' + tokenm;
    request(groupString, function(error, response, body){
      if(error != null){
        reject(error);
      }

      var jsonBody = JSON.parse(body);
      var users = jsonBody["members"];
      // return the users
      resolve(users);
    });
  })
}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
