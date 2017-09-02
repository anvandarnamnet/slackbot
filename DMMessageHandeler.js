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
    },
    token:{
      type:String,
      required:true
    },
    imId:{
        type:String,
        required:true
    }

})

var messageQueue = mongoose.model("messageQueue", queueSchema);
module.exports = messageQueue;


var addMessage = function(teamId, userId, messages, token, imId) {
    return new Promise(function (resolve, reject) {
            getMessagesQueue(teamId, userId, token).then(function (queues) {
                if (queues.length === 0) {
                    var newMessageQueue = {
                        teamId: teamId,
                        userId: userId,
                        messageQueue:messages,
                        imId: imId,
                        token:token
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
                  
                     addMessagesToQueue(messages, teamId,userId, token);
                     resolve()
                }
                })
            }
        );

    };

var addMessagesToQueue = function(messages, teamId, userId, token){
    getMessagesQueue(teamId,userId, token).then(function(queue){
       var existingMessages = queue[0].messageQueue;
       for(var i = 0; i < messages.length; i++){
           exists = false;
           if(existingMessages === null){
               existingMessages = []
           }
           for(var j = 0; j < existingMessages.length; j++){
               if(existingMessages[j] === messages[i]){
                   exists = true;
                   break;
               }
           }
           if(!exists){
               existingMessages.push(messages[i]);
           }
       }

       updateObject(teamId,userId, existingMessages, token);


    });
};

var updateObject = function (teamId, userId, messages, token){
    var query = {
        'teamId':teamId,
        'userId':userId,
        'token': token
    };

    var data = {
        'teamId':teamId,
        'userId':userId,
        'messageQueue':messages
    };

    // fixa lite error fix fixing
    messageQueue.findOneAndUpdate(query, data, {upsert:true}, function(err, doc){

    });
}

module.exports.addMessage = addMessage;


var popMessage = function(teamId, userId){
    return new Promise(function(resolve, reject) {
        getMessagesQueue(teamId,userId).then(function(queue) {
            var message = ""
            if(queue[0].messageQueue.length === 0){
                reject("no message in queue");
                return;
            }else{
                message = queue[0].messageQueue[0];
            }
            queue[0].messageQueue.splice(0,1);
            updateObject(teamId, userId, queue[0].messageQueue)
            resolve({message:message, token: queue[0].token});
        });
    });
};

module.exports.popMessage = popMessage;

var getMessagesQueue = function(teamId, userId, token){
    return new Promise(function(resolve, reject) {
        var query = messageQueue.find({
            teamId: teamId,
            userId: userId,
            token:token

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

module.exports.getMessageQueue = getMessagesQueue;
