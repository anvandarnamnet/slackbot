var CronJob = require('cron').CronJob;
var jsonHandler = require('./JsonHandeler');
var schedule = require('node-schedule');



var startCron = function(){
  new CronJob('00 03 17 * * *', function() {
    console.log("hej");
    var now = new Date();
    jsonHandler.getMessageByDay(now.getDay()).then(function(messages){
      console.log(messages);
      for(var i = 0; i < messages.length; i++){
        console.log("hej");

        scheduleMessage(messages[i]);
      }
    });
  }, null, true, 'Europe/Amsterdam');
}

module.exports.start = startCron;

var scheduleMessage = function(message){
  console.log(message)
  var now = new Date();
  now.setHours(message.hour - 3);
  now.setMinutes(05);
  console.log("now: " + now)
  var j = schedule.scheduleJob(now, function(){
    console.log('The answer to life, the universe, and everything! ' + now.getTime());
    var users = message.users;
    for(var i = 0; i < users.length; i++){
    //  apiHandler.sendDirectMessage(users[i].id, "Hello friend", message.token).then(function(cb){
        console.log("it works?");
      //});
    }
  });
}
