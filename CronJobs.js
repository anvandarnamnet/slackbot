var CronJob = require('cron').CronJob;
var jsonHandler = require('./JsonHandeler');
var apiHandler = require('./ApiHandler');
var schedule = require('node-schedule');
var cronJobs = new Map();

// method when someone change a message (updates or deletes)
var messageChanged = function(id) {

}

// start the cronjob
var startCron = function() {
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
var getMessageByDay = function(day) {
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

  //KP DISCUSS!!!(SAMMA MEDDELANDE ELLER EJ?)
  if (checkMessageShouldBeSend(message)) {
    console.log("det händer!");
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
          apiHandler.sendDirectMessage(users[i].id, updatedMessage.message, updatedMessage.token).then(function(cb) {
            console.log("Direct message has been send");
          });
        }
      });
    }, null, true, 'Europe/Amsterdam');
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
