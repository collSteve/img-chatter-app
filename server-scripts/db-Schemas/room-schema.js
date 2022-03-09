const mongoose = require('mongoose');
const UserSchema = require('./user-schema');
const StringMsgSchema = require('./string-message-schema');

const RoomSchema = mongoose.Schema({
    room_id: String,
    name: String,
    members: [UserSchema],
    messages: [StringMsgSchema],
    created_time: Number,
    tags: [String],
    type: ['free_room']
});

// let ChatMsg = (collectionName) => mongoose.model('ChatMsgModel', MsgSchema, collectionName);

module.exports = RoomSchema;