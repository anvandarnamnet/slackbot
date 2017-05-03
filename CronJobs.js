var CronJob = require('cron').CronJob;
var jsonHandler = require('./JsonHandeler');
var apiHandler = require('./ApiHandler');
var schedule = require('node-schedule');
var cronJobs = new Map();

var messageUpdated = function(id){

}

var startCron = function(){
  var now = new Date();
  getMessageByDay(now.getDay())

  new CronJob('00 00 00 * * *', function() {
    for (var cronJob of cronJobs.values()) {
        cronJob.stop();
    }
    cronJobs = new Map();

    var now = new Date();
    getMessageByDay(now.getDay())

  }, null, true, 'Europe/Amsterdam');
}

var getMessageByDay = function(day){
  jsonHandler.getMessageByDay(day).then(function(messages){
    for(var i = 0; i < messages.length; i++){
      scheduleMessage(messages[i]);
    }
  });
}

module.exports.start = startCron;

var scheduleMessage = function(message){
  var cron = new CronJob('00 ' + message.minute + ' ' + message.hour  +  ' * * *', function() {
    jsonHandler.getMessageById(message.id).then(function(cb){
      if(compareMessages(cb[0], message)){
        var users = message.users;
        for(var i = 0; i < users.length; i++){
         apiHandler.sendDirectMessage(users[i].id, message.message, message.token).then(function(cb){
            console.log(cb);
          });
        }
      } else{
        console.log("problem");
      }
      });
    }, null, true, 'Europe/Amsterdam');

    cronJobs.set(message.id, cron);
}


var compareMessages = function(newMsg, oldMsg){
  for(var i = 0; i < newMsg.users.length; i++){
    if(newMsg.users[i].id != oldMsg.users[i].id){
      return false;
    }
  }

  if(newMsg.hour != oldMsg.hour || newMsg.minute != oldMsg.minute){
    return false;
  }

  if(newMsg.message !== oldMsg.message){
    return false;
  }

  return true;
}
