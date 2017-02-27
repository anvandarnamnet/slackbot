var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

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

app.get('/', function(reques, response) {
  if(reques.cookies.slackApiToken != null){
    console.log(reques.cookies.slackApiToken);
    var token = reques.cookies.slackApiToken.split(',');
    console.log(token[0]);
    getChannelInfo(token[0]).then(function(body){
      response.render('pages/index');

    });
  } else{
    response.render('pages/index');

  }
});


app.get('/callback', function(reques, responsee) {
  var code = reques.query.code;
  getToken(code).then(function(tokenm){
    token = tokenm;
    if(reques.cookies.slackApiToken == null){
      responsee.cookie(slackApiTokenString, tokenm).redirect('/');
    } else{
      var oldToken = reques.cookies.slackApiToken;
      var tokenArr = oldToken.split(',');
      for(var i = 0; i < tokenArr.length; i++){
        if(tokenArr[i] === tokenm){
          responsee.cookie(slackApiTokenString, oldToken).redirect('/');
          return;
        }
      }

      oldToken = oldToken + ',' + tokenm;
      responsee.cookie(slackApiTokenString, oldToken).redirect('/');

    }
  });

  /*
  getToken(code).then(function(tokenm){
    return getIM()
  }).then(function(users){
    console.log(users[2].id);
    return sendDirectMessage(users[2].id, 'weeey!!')
  }).then(function(response){
    responsee.send(response);
  }).catch(function (error) {
     console.log(error);
   });
  */

});


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
        console.log(jsonBody);
        resolve(jsonBody);
      }
    });
  });
}
// send a direct message to somone in the slack channel
// @channel - the channel id for the direct message
// @text - the text to send
var sendDirectMessage = function(channel, text){
  return new Promise(function(resolve, reject){
    var sendDMMessageString = 'https://slack.com/api/chat.postMessage?token=' + token + '&channel=' + channel + '&text=' + text + '&as_user=true'  ;
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
var getIM = function(){
  return new Promise(function(resolve, reject){
    var groupString = 'https://slack.com/api/im.list?token=' + token;
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
var getUsers = function(){
  return new Promise(function(resolve, reject){
    var groupString = 'https://slack.com/api/users.list?token=' + token;
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
