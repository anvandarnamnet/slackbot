var CronJob = require('cron').CronJob;
var jsonHandler = require('./JsonHandeler');
var apiHandler = require('./ApiHandler');
var schedule = require('node-schedule');
var cronJobs = new Map();

// method when someone change a message (updates or deletes)
var messageChanged = function(id){

}

// start the cronjob
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

// get all the messages for a specifc day and schedule the messages
var getMessageByDay = function(day){
  jsonHandler.getMessageByDay(day).then(function(messages){
    for(var i = 0; i < messages.length; i++){
      scheduleMessage(messages[i]);
    }
  });
}


module.exports.start = startCron;

// schedule a message with a cronjob
var scheduleMessage = function(message){

  //KP DISCUSS!!!(SAMMA MEDDELANDE ELLER EJ?)
  if(checkMessageShouldBeSend(message)){
    var cron = new CronJob('00 ' + message.minute + ' ' + message.hour  +  ' * * *', function() {
      jsonHandler.getMessageById(message.id).then(function(cb){
        // the user has removed the 1on1
        if(cb.length == 0){
          console.log("User removed 1 on 1");
          return;
        }

          var updatedMessage = cb[0];
          var users = updatedMessage.users;
          for(var i = 0; i < users.length; i++){
           apiHandler.sendDirectMessage(users[i].id, updatedMessage.message, updatedMessage.token).then(function(cb){
              console.log("Direct message has been send");
            });
          }

        });
      }, null, true, 'Europe/Amsterdam');

      cronJobs.set(message.id, cron);
  }
}

// check if message should be send depending on biweekly and so on.
var checkMessageShouldBeSend = function(message){
  var schouldBeSend = false;

  // schould we d
  jsonHandler.decreaseWeeksUntilMessage(message.id);

  if(message.weeksUntilNewMessage === 1){
    return true;
  }

  return false;
}

// compare messages, make sure the message hasn't been changed
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
