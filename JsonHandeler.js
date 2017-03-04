var mongoose = require("mongoose");

// the shema of the todolists
var messageSchema = mongoose.Schema({
  token: {type: String, required: true},
  teamInfo: {type: Object, required: true},
  hour: {type: String, required: true},
  days: {type: Object, required: true},
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



var addNewMessage = function(token, teaminfoInput, users,time, message, days){
  return new Promise(function(resolve, reject){
    var newMessage = {
      token: token,
      teamInfo: teaminfoInput,
      hour: time,
      days: days,
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
