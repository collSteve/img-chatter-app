const mongoose = require('mongoose');

const io_event_enum = {
    OnNewUnamedUserJoined: 'new user',
    OnNamedUserJoined: 'named user joined',
    onRecievedMsg: 'chat message',
};

const client_event_enum = {
    OnNewUnamedUserJoined: 'new user',
    OnNamedUserJoined: 'named user joined',
    OnNameChangeApproved: 'name_change_approved',
    OnDisplayFullChat: 'display-full-chat',
    OnNameChangeDisapproved: 'name_change_disapproved',
    onRecievedMsg: 'chat message',
};

function start_IO(io, socket_users, db_options) {

};

const socket_users = {
    name_array:[{name:'l', socket_id:1}],
    socket_array:[]
};

async function onNewUnamedUserJoined(io, socket, socket_users, new_user_name_data, room_data, db_options) {
    // check if user's nick name is available
    let nameAvailable = true;
    socket_users.name_array.forEach(user => {
        if (user.name == new_user_name_data.name){
            nameAvailable = false;
        }
    });

    if (nameAvailable) {
        users.push({
            socket_id: socket.id,
            name: new_user_name_data.name
        });

        console.log(`[${new_user_name_data.name}] joined the room`);
        // tell every sockets new user joined and his/her name
        io.emit(client_event_enum.OnNamedUserJoined, new_user_name_data); 

        // fetch msg array from db to new user (if db specified)
        const msgArray = await db_options.db_operations.get_msg_array_from_room(db_options.db,room_data.room_id);

        const approve_msg = {
            action: 'name change',
            approved: true,
            action_data: {
                name:new_user_name_data.name,
                msgDataArray: msgArray
            }
        };
        // approved msg only send to new user
        socket.emit(client_event_enum.OnNameChangeApproved, approve_msg); 
        // only display chat after validating user name
        io.emit(client_event_enum.OnDisplayFullChat, msgArray); // !!need change
    }
    else {
        const disapprove_msg = {
            action: 'name change',
            approve: false,
            action_data: {
                name:new_user_name_data.name,
            }
        };
        // disapproved msg only send to new user
        socket.emit(client_event_enum.OnNameChangeDisapproved, disapprove_msg); 
    }
}

function onDisconnect(socket, socket_users) {
    console.log("disconnecting");
    // find user's name 
    const disUser = socket_users.name_array.find(user=> user.id==socket.id);
    // remove user from socket_users.name_arrray
    if (disUser !== undefined) {
        console.log(`user [${disUser.name}] disconnected`);

        // remove the user from name_arrray list
        let i = socket_users.name_array.indexOf(disUser);
        socket_users.name_array.splice(i, 1);
    }

    // remove client from socket_array
    const j = socket_users.socket_array.indexOf(socket);
    if (j>=0) {
        socket_users.socket_array.splice(j,1);
    }
}

async function onRecievedChatMsg(io, socket, socket_users, msg_data, room_data, db_options) {
    console.log(msg_data.user+ ": " + msg_data.msg);

    const msgData = db_options.db_operations.msg_model({
        user: msg_data.user,
        message: msg_data.msg,
        time: Date.now()
    });

    // save msg to db
    await db_options.db_operations.add_msg_to_room(db_options.db, room_data.room_id, msgData);

    // retrieve msg array from db
    const msgArray = await db_options.db_operations.get_msg_array_from_room(db_options.db,room_data.room_id);

    io.emit(client_event_enum.onRecievedMsg, msgArray); // emit 'chat message event' back to all clients side to act
}

function start_IO(io, socket_users, db_options) {
    io.on('connection', (socket)=>{
        socket_users.socket_array.push(socket);
        console.log('a user connected');
    
        io.emit('new user', 'hi');
        socket.on('new user', function(new_user_name_data) {
            onNewUnamedUserJoined(io, socket, socket_users, new_user_name_data, room_data, db_options);
        });
    
        // disconnection event
        socket.on('disconnect', () => {
            onDisconnect(socket, socket_users);
        });
    
        socket.on('chat message', function(msg_data) {
            onRecievedChatMsg(io, socket, socket_users, msg_data, room_data, db_options);
        });
    });
}

module.exports = {
    start: start_IO
}