var CronJob = require('cron').CronJob;
var jsonHandler = require('./JsonHandeler');
var apiHandler = require('./ApiHandler');
var schedule = require('node-schedule');
var cronJobs = new Map();
let messageQueue = require('./DMMessageHandeler');

// method when someone change a message (updates or deletes)
var messageChanged = function(id) {

}

// start the cronjob
var startCron = function() {
  var now = new Date();
  scheduleMessages(now.getDay())

  new CronJob('00 00 00 * * *', function() {
    for (var cronJob of cronJobs.values()) {
      cronJob.stop();
    }

    cronJobs = new Map();
    var now = new Date();
    scheduleMessages(now.getDay())

  }, null, true, 'GMT0');
}

// get all the messages for a specifc day and schedule the messages
var scheduleMessages = function(day) {
  jsonHandler.getMessageByDay(day).then(function(messages) {
    for (var i = 0; i < messages.length; i++) {
      scheduleMessage(messages[i]);
    }
  });
}


module.exports.start = startCron;

// schedule a message with a cronjob
var scheduleMessage = function(message) {
  // just add a method to the Date object; //you dont have to care about that :)
  fixWeekNumberMethod();

  if (checkMessageShouldBeSend(message)) {
    var cron = new CronJob('00 ' + message.minute + ' ' + message.hour + ' * * *', function() {
      // get the newest version of the message object
      jsonHandler.getMessageById(message.id).then(function(cb) {
        // the user has removed the 1on1
        if (cb.length == 0) {
          console.log("User removed 1 on 1");
          return;
        }
        var updatedMessage = cb[0];

        var now = new Date();
        var users = updatedMessage.users;
        jsonHandler.messageHasBeenSend(updatedMessage, now.getWeek());
        for (var i = 0; i < users.length; i++) {
           var message = function(id){
             messageQueue.getMessageQueue(updatedMessage.teamInfo.team.id, users[i].id).then(function(queue){
                 console.log(id)
                 if(id !== 'USLACKBOT'){
                   if(queue[0].messageQueue.length === 0){
                   apiHandler.sendDirectMessage(id, updatedMessage.message[0], updatedMessage.token).then(function(cb) {});
                   updatedMessage.message.slice(0,1);
                   console.log("SENDING")
                   console.log(updatedMessage.message)
                   messageQueue.addMessage(updatedMessage.teamInfo.team.id, id, updatedMessage.message, updatedMessage.token);
                 }
                 else{
                     messageQueue.addMessage(updatedMessage.teamInfo.team.id, id, updatedMessage.message, updatedMessage.token);
               }
               }
             });
           } (users[i].id)

        }
      });
    }, null, true, 'GMT0');
    console.log('det händer!')
    cronJobs.set(message.id, cron);
  } else{
    console.log("det händer inte");
  }
}

// check if message should be send depending on biweekly and so on.

var checkMessageShouldBeSend = function(message) {
  var now = new Date();
  var week = now.getWeek();
  var repeatsEvery = message.repeatsEvery;

  if (message.lastMessageSendWeek === week) {
    return true;
  }
  if (message.lastMessageSendWeek === -1) {
    return true;
  }
  if (week < message.lastMessageSendWeek) {
    var numberOfWeeks = 52 - message.lastMessageSendWeek + week;


    if (numberOfWeeks == repeatsEvery) {
      return true;
    }
  } else if (now.getWeek() - message.lastMessageSendWeek == repeatsEvery) {
    return true;
  }

  return false;
}

// compare messages, make sure the message hasn't been changed
var compareMessages = function(newMsg, oldMsg) {
  for (var i = 0; i < newMsg.users.length; i++) {
    if (newMsg.users[i].id != oldMsg.users[i].id) {
      return false;
    }
  }

  if (newMsg.hour != oldMsg.hour || newMsg.minute != oldMsg.minute) {
    return false;
  }

  if (newMsg.message !== oldMsg.message) {
    return false;
  }

  return true;
}


var fixWeekNumberMethod = function() {
    Date.prototype.getWeek = function() {
      var date = new Date(this.getTime());
      date.setHours(0, 0, 0, 0);
      // Thursday in current week decides the year.
      date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
      // January 4 is always in week 1.
      var week1 = new Date(date.getFullYear(), 0, 4);
      // Adjust to Thursday in week 1 and count number of weeks from date to week1.
      return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    }
  }
