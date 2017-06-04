var mongoose = require("mongoose");

var queueSchema = mongoose.Schema({
    teamId: {
        type: String,
        required: true
    },
    userId: {
        type:String,
        required:true
    },
    messageQueue:{
        type: [{
            type: String
        }]
    }

})

var messageQueue = mongoose.model("messageQueue", queueSchema);
module.exports = messageQueue;


var addNewQueueSchema = function(teamId, userId) {
    console.log(teamId + ' ' + userId)
    return new Promise(function (resolve, reject) {
            getMessagesQueue(teamId, userId).then(function (queues) {
                if (queues.length === 0) {
                    var newMessageQueue = {
                        teamId: teamId,
                        userId: userId,
                        messageQueue:[]
                    }

                    var uploadMessageQueue = messageQueue(newMessageQueue);

                    uploadMessageQueue.save(function(err) {
                        if (err) {
                            reject("Something went wrong when adding a new message to the db");

                            console.log("Something went wrong when adding a new message to the db: " + err);
                        } else {
                            resolve("Messagequeue added");
                        }
                    });
                } else{
                    console.log("Queue already exists")
                }
                })
            }
        );

    };

var addMessagesToQueue = function(messages, teamId, userId){
    getMessagesQueue(teamId,userId).then(function(queue){
       var existingMessages = queue.messageQueue;
       for(var i = 0; i < messages.length; i++){
           exists = false;
           for(var j = 0; j < existingMessages.length; j++){
               if(existingMessages[j] === messages){
                   exists = true;
                   break;
               }
           }
           if(!exists){
               existingMessages.append(messages[i]);
           }
       }
    });
}

module.exports.addMessagesToQueue = addMessagesToQueue;

var getMessagesQueue = function(teamId, userId){
    return new Promise(function(resolve, reject) {
        var query = messageQueue.find({
            teamId: teamId,
            userId: userId
        });

        query.exec(function(err, queues) {
            if (err) {
                reject(err);
            } else {
                resolve(queues);
            }
        })
    });
}

module.exports.addNewQueueSchema = addNewQueueSchema;
