const mongoose = require('mongoose');
const UserSchema = require('./user-schema');

const MSG_Schema = mongoose.Schema({
    user: UserSchema,
    message: String,
    time: Number
});

// let ChatMsg = (collectionName) => mongoose.model('ChatMsgModel', MsgSchema, collectionName);

module.exports = MSG_Schema;