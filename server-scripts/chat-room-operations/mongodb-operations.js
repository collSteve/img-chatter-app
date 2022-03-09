// Mongo DB
const mongoose = require('mongoose');
const RoomSchema = require('../db-Schemas/room-schema');
const roomCollectionName = "ChatRooms";
const ChatRoomModel = mongoose.model('ChatRoomModel', RoomSchema, roomCollectionName);

const MsgSchema = require('../db-Schemas/string-message-schema');
const UserSchema = require('../db-Schemas/user-schema');

const MsgModel = mongoose.model('MsgModel', MsgSchema);
const UserModel = mongoose.model('UserModel', UserSchema);

function add_msg_to_room(db, room_id, msg_model, callback=null) {
    db.updateOne({'room_id':room_id}, {$push:{messages:msg_model}}, function(err) {
        if (err) {return console.log(`[error] Fail to update db: ${err}`);}
        console.log(`Msg added to room id:[${room_id}]`);
    });
}

async function get_msg_array_from_room(db, room_id, callback=null) {
    let message_array = null;
    let error = null;
    try {
        const messages = await db.findOne({ 'room_id': room_id }, 'messages').lean().exec();
        console.log(`Successfully fetched messages from room id:[${room_id}]`);
        //console.log("messages array: "+ JSON.stringify(messages.messages));
        
        message_array = messages.messages;
    } catch (err) {
        error = err;
    }
    if (callback) {
        callback(error, message_array);
    }
    return message_array;
}

module.exports = {
    operations: {
        add_msg_to_room:add_msg_to_room,
        get_msg_array_from_room:get_msg_array_from_room
    },
    schemas: {
        RoomSchema:RoomSchema,
        UserSchema:UserSchema,
        MsgSchema:MsgSchema
    },
    models: {
        UserModel:UserModel,
        MsgModel: MsgModel,
        ChatRoomModel:ChatRoomModel
    }
};