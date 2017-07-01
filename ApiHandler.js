var request = require('request');

var clientId = "143457452320.144253511221";
var clientSecret = "fdfb5b7fedfc81dca623f06e3e813a4b";

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

module.exports.getToken = getToken;

// get info of a team by token
var getTeamInfo = function(incomingToken){
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

module.exports.getTeamInfo = getTeamInfo;

// get information about the manager
var getManagerInfo = function(token){
  return new Promise(function(resolve,reject){
    var getUserString = 'https://slack.com/api/users.profile.get?token=' +token;
    request(getUserString, function(error,response, body){
      if(error != null){
        reject(error);
      }

      var jsonBody = JSON.parse(body);
      resolve(jsonBody);
    });
  });
}

module.exports.getManagerInfo = getManagerInfo;


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


      // return the json body
      resolve(body);
    });
  });
}
module.exports.sendDirectMessage = sendDirectMessage;


// get all the IM ids for direct messages
var getIM = function(tokenm){
  return new Promise(function(resolve, reject){
    var groupString = 'https://slack.com/api/im.list?token=' + tokenm;
    request(groupString, function(error, response, body){
      if(error !== null){
        reject(error);
      }
      var jsonBody = JSON.parse(body);
      var ims = jsonBody["ims"];
      // return the ims
      resolve(ims);
    });
  });
}

module.exports.getIM = getIM;

var getChannels = function(token){
  return new Promise(function(resolve, reject){
    var groupString = 'https://slack.com/api/channels.list?token=' + token;
    request(groupString, function(error, response, body){
      if(error != null){
        reject(error);
      }
      var jsonBody = JSON.parse(body);
      console.log(jsonBody.channels[0].members)
    });
  })
}

module.exports.getChannels = getChannels;

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
module.exports.getUsers = getUsers;
