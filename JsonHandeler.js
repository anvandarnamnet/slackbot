var mongoose = require("mongoose");

// the shema of the todolists
var messageSchema = mongoose.Schema({
  token: {type: String, required: true},
  teamInfo: {type: Object, required: true},
  hour: {type: String, required: true},
  minute: {type: String, required: true},
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


var getMessageByDay = function(day){
  return new Promise(function(resolve, reject){
    var query;
    switch (day) {
      case 0:
      query = messages.find({
        sunday: true
      });
      break;

      case 1:
      query = messages.find({
        monday: true
      });
      break;

      case 2:
      query = messages.find({
        tuesday: true
      });
      break;

      case 3:
      query = messages.find({
        wednesday: true
      });
      break;

      case 4:
      query = messages.find({
        thursday: true
      });
      break;

      case 5:
      query = messages.find({
        friday: true
      });
      break;

      case 6:
      query = messages.find({
        saturday: true
      });
      break;

      default:
      query = messages.find();
    }

    query.exec(function(err, messages){
      if(err){
        reject(err);
      } else{
          resolve(messages);
        }
    });

  });
}

module.exports.getMessageByDay = getMessageByDay;

var getMessagesByTime = function(startTime, endTime){

  return new Promise(function(resolve,reject){
    var query = messages.find({
      hour: {
          $gt: startTime,
          $lt: endTime
        }
    });

    query.exec(function(err, messages){
      if(err){
        reject(err);
      }else{
        resolve(messages);
      }
    })
  });
}

module.exports.getMessagesByTime = getMessagesByTime;

var getMessageById = function(id){
  return new Promise(function(resolve,reject){
    var query = messages.find({
      _id:id
    });

    query.exec(function(err, messages){
      if(err){
        reject(err);
      }else{
        resolve(messages);
      }
    })
  });
}

module.exports.getMessageById = getMessageById;


var addNewMessage = function(token, teaminfoInput, users,hour, minute, message, days){
  return new Promise(function(resolve, reject){
    var newMessage = {
      token: token,
      teamInfo: teaminfoInput,
      hour: time,
      minute: minute,
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
        resolve("Message added");
      }
    });
  });
}

module.exports.addNewMessage = addNewMessage;
