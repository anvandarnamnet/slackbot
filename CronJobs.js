var CronJob = require('cron').CronJob;

var startCron = function(){
  new CronJob('00 30 13 * * *', function() {
    console.log('You will see this message every second');
  }, null, true, 'Europe/Amsterdam');
}

module.exports.start = startCron;
