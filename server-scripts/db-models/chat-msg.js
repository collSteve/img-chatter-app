const mongoose = require('mongoose');

let MsgSchema = mongoose.Schema({
    user: String,
    msg: String,
    time: Number
});

let ChatMsg = (collectionName) => mongoose.model('ChatMsgModel', MsgSchema, collectionName);

module.exports = ChatMsg;