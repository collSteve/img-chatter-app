
//const db = require("../load-db");
const mongoose = require('mongoose');

const ChatMsg = require('../db-models/chat-msg');
const ChatMsgModel = ChatMsg('chatMsg');

// NeDB
function getAll(neDB) {
    neDB.find({},(err, data)=>{
        return data;
    });
}

/**
 * 
 * @param {*} io the Io server for socket 
 * @param {*} users Array containing all users' socket ID and user name: {id: user_id, name: user_name}
 * Ideally to be a global empty array, the function will act as mutator to change the array contents
 * @param {*} allClients Array containing all users' original socket info: socket{}
 * Ideally to be a global empty array, the function will act as mutator to change the array contents
 */
function start_IO(io, users, allClients, msgDataArray, dbsave=false, msgDB=null) {
    io.on('connection', (socket)=>{
        allClients.push(socket);
        console.log('a user connected');
    
        io.emit('new user', 'hi');
        socket.on('new user', async function(userData){
            let nameAvailable = true;
            users.forEach(user => {
                if (user.name == userData.name){
                    nameAvailable = false;
                }
            });
    
            if (nameAvailable) {
                users.push({
                    id: socket.id,
                    name: userData.name
                });
    
                console.log(`[${userData.name}] joined the room`);
                io.emit('named user joined', userData);

                let TrueMsgArray = null;
                if (msgDB!=null) {
                    // use NeDB
                    // TrueMsgArray = await msgDB.find({}, (err, data)=>{
                    //     if (err) {
                    //         return console.log('[Error] Find reach MSg datas from NeDB');
                    //     }
                    //     console.log(data);
                    // });
                    TrueMsgArray =  await msgDB.find({}).sort({time: 1});

                }
                else {
                    TrueMsgArray = msgDataArray;
                }
                console.log(TrueMsgArray);

                const approve_msg = {
                    action: 'name change',
                    approved: true,
                    action_data: {
                        name:userData.name,
                        msgDataArray: TrueMsgArray
                    }
                };
                socket.emit('name_change_approved', approve_msg);
                // only display chat after validating user name
                io.emit('display-full-chat', TrueMsgArray); // !!need change
            }
            else {
    
            }
        })
    
        // disconnection event
        socket.on('disconnect', () => {
            console.log("disconnecting");

            let disUser = users.find(user=> user.id==socket.id);
    
            if (disUser !== undefined) {
                console.log(`user [${disUser.name}] disconnected`);
    
                // remove the user from user list
                let i = users.indexOf(disUser);
                users.splice(i, 1);
            }
    
            // remove client from client list
            let j = allClients.indexOf(socket);
            if (j>=0) {
                allClients.splice(j,1);
            }
        });
    
        socket.on('chat message', async function(data) {
            console.log(data.user+ ": " + data.msg);

            const msgData = {
                user: data.user,
                msg: data.msg,
                time: Date.now()
            };

            // save msg to messages array
            msgDataArray.push(msgData);

            // save msg to database if available:
            if (dbsave && msgDB!=null) {
                /* 
                // MongoDB
                const chatMsg = new ChatMsgModel(msgData);

                chatMsg.save((err, msg)=>{
                    if (err) return console.log(err);
                    console.log(msg.user+ ' msg' + " saved to collection");
                });
                */

                // NeDB
                msgDB.insert(msgData, function (err, newDoc) {   // Callback is optional
                    // newDoc is the newly inserted document, including its _id
                    if (err) {
                        console.log(err);
                        return console.log('save msg to NeDB failed.');
                    }
                    console.log("Saved msg from "+newDoc.user+" to NeDB");
                });
            }

            let TrueMsgArray = null;
            if (msgDB!=null) {
                // use NeDB
                TrueMsgArray =  await msgDB.find({}).sort({time: 1});
            }
            else {
                TrueMsgArray = msgDataArray;
            }

            io.emit('chat message', TrueMsgArray); // emit 'chat message event' back to all clients side to act
        });
    });
}

module.exports = {
    start: start_IO
}