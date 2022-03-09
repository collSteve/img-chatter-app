const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    name: String,
    uid: String,
    type: ['user','room_keeper','admin','super_admin'],
    password: String
});

// let ChatMsg = (collectionName) => mongoose.model('ChatMsgModel', MsgSchema, collectionName);

module.exports = UserSchema;