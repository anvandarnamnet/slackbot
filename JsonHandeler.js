var mongoose = require("mongoose");

// the shema of the todolists
var messageSchema = mongoose.Schema({
  token: {type: String, required: true},
  teamInfo: {type: Object, required: true},
  hour: {type: String, required: true},
  monday: {type: Boolean, required: true},
  tuesday: {type: Boolean, required: true},
  wednesday: {type: Boolean, required: true},
  thursday: {type: Boolean, required: true},
  friday: {type: Boolean, required: true},
  saturday: {type: Boolean, required: true},
  sunday: {type: Boolean, required: true},
  message: {type: String, required: true},
  users: {type: Object, required: true},
  createdAt: {type: Date, default:Date.now}
});

// model our schema and make it available
var messages = mongoose.model("messages", messageSchema);
module.exports = messages;

var getMessagesByToken = function(token){
  return new Promise(function(resolve, reject){
    var query = messages.find({token: token});

    query.exec(function(err, messages){
     if(err){
       return console.log(err);
     }
     resolve(messages);
    });
  });
}

module.exports.getMessagesByToken = getMessagesByToken;


var getMessagesByTime = function(startTime, endTime){

  return new Promise(function(resolve,reject){
    var query = messages.find({
      hour: {
          $gt: startTime,
          $lt: endTime
        },
      monday: true
    });

    query.exec(function(err, messages){
      resolve(messages);
    })
  });
}

module.exports.getMessagesByTime = getMessagesByTime;

var addNewMessage = function(token, teaminfoInput, users,time, message, days){
  return new Promise(function(resolve, reject){
    var newMessage = {
      token: token,
      teamInfo: teaminfoInput,
      hour: time,
      monday: days.monday,
      tuesday:days.tuesday,
      wednesday:days.wednesday,
      thursday:days.thursday,
      friday:days.friday,
      saturday:days.saturday,
      sunday:days.sunday,
      message: message,
      users: users
    }
    var uploadMessages = messages(newMessage);
    uploadMessages.save(function(err){
      if(err){
        reject("Something went wrong when adding a new message to the db");
        console.log("Something went wrong when adding a new message to the db: " + err);
      } else{
        console.log("whey");

        resolve("Whey");
      }
    });
  });
}

module.exports.addNewMessage = addNewMessage;
