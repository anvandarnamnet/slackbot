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
        messages:[{
            type:String
        }],

        id:String
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


var addMessage = function(teamId, userId, messages, token, imId, messageId) {
    return new Promise(function (resolve, reject) {
            getMessagesQueue(teamId, userId, token).then(function (queues) {
                if (queues.length === 0) {
                    var newMessageQueue = {
                        teamId: teamId,
                        userId: userId,
                        messageQueue:[],
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
                    if(messages !== null){
                        addMessagesToQueue(messages, teamId,userId, token, messageId);

                    }
                     resolve()
                }
                })
            }
        );

    };

var addMessagesToQueue = function(messages, teamId, userId, token, messageId){
    getMessagesQueue(teamId,userId, token).then(function(queue){
       var existingMessages = queue[0].messageQueue;
        if(existingMessages === null){
            existingMessages = []
        }

        var exists = false;
        for(var j = 0; j < existingMessages.length; j++){
            if(existingMessages[j].id === messageId){
                exists = true;
                break;
            }
        }
        if(!exists){
            existingMessages.push(messages);
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


var popMessage = function(teamId, userId, channel){
    return new Promise(function(resolve, reject) {
        getMessagesQueueFromChannel(teamId,userId, channel).then(function(queue) {
            var message = ""
            // WADUP
            if(queue[0].messageQueue !== null && queue[0].messageQueue.length === 0){
                reject("no message in queue");
                return;
            }else{
                message = queue[0].messageQueue[0];
            }
            queue[0].messageQueue.splice(0,1);
            updateObject(teamId, userId, queue[0].messageQueue, queue[0].token);
            resolve({message:message, token: queue[0].token});
        });
    });
};

module.exports.popMessage = popMessage;

var getMessagesQueueFromChannel = function(teamId, userId, channel){
    return new Promise(function(resolve, reject) {
        var s = {
            teamId: teamId,
            userId: userId,
            imId:channel
        };

        var query = messageQueue.find(s);

        query.exec(function(err, queues) {
            if (err) {
                reject(err);
            } else {
                resolve(queues);
            }
        })
    });
};

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
