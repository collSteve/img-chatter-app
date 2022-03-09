const express = require('express');
const http = require('http');
var path = require('path');
const fs = require('fs');

const NeDatastore = require('nedb-promises'); // NeDB

const mongoose = require('mongoose');


const db = require("./server-scripts/load-db");
const Book = require('./server-scripts/db-models/book');
const ChatMsg = require('./server-scripts/db-models/chat-msg');

const app = express(),
    port = process.env.PORT||3080;

const server = http.createServer(app);
const { Server } = require("socket.io");
const { Socket } = require('dgram');
const io_function = require('./server-scripts/chatting-scripts/socket-io');
const { resolveSoa } = require('dns');
const io = new Server(server, {cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"]
  }});

app.use(express.json({ limit: '1mb' })); // make server able to parse json

// Add headers
app.use(function (req, res, next) {

    const allowedOrigins = [
        'http://localhost:4200', 
        'http://localhost:3000'
    ];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    // Website you wish to allow to connect
    //res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

// listening at port
server.listen(port, () => console.log(`listened at post: ${port}`)); 

// host public
app.use(express.static('public'));
app.use("/pdata", express.static('data')); // server public data

// param
const userIDs= ['1','2','3','4','5'];

app.param('userid', function (req, res, next, id) {
    console.log('User ID requested: '+id);
    if (userIDs.includes(id)) {
        next();
    }
    else {
        const error =  new Error("Invalid User ID");
        error.status = 403;
        return next(error);
    }
    
});

// mongoDB 2

// create test room
const RoomSchema = require('./server-scripts/db-Schemas/room-schema');
const roomCollectionName = "ChatRooms";
const ChatRoomModel = mongoose.model('ChatRoomModel', RoomSchema, roomCollectionName);
/*
const testRoom = new ChatRoomModel({
    room_id: '00',
    name: 'test room',
    members: [],
    messages: [],
    created_time: Date.now(),
    tags: ['test'],
    type: 'free_room'
});

testRoom.save(function (err) {
    if (err) return console.log(`[error] Unable to save model: ${testRoom.name}: ${err}`);
    console.log(`Room [${testRoom.name}] successfully saved to Collection`);
  });
*/

// update Mongo db

const MsgSchema = require('./server-scripts/db-Schemas/string-message-schema');
const UserSchema = require('./server-scripts/db-Schemas/user-schema');

const MsgModel = mongoose.model('MsgModel', MsgSchema);
const UserModel = mongoose.model('UserModel', UserSchema, 'Users');
/*
const a_user = {
    name: 'test user',
    uid: '00',
    type: 'user'
};
const a_msg = {
    user: a_user,
    message: 'test test is db working?',
    time: Date.now()
};

const b_user = new UserModel({
    name: 'test user',
    uid: '00',
    type: 'user'
});

const b_msg = new MsgModel({
    user: b_user,
    message: 'test test is db working?',
    time: Date.now()
});

ChatRoomModel.updateOne({'name':'test room'}, {$push:{messages:b_msg}}, function(err) {
    if (err) {return console.log('[error] Fail to update db');}
    console.log(`room updated`);
});
*/


// query msg
// ChatRoomModel.find({ name: 'test room' }, 'messages', function (err, msgs) {
//     console.log('Get messages: ' + msgs);
// });



// routing
app.get('/user/:userid', function (req, res) {
    //res.send("Your ID is "+ req.params.userid);
    const options = {
        root: __dirname,
    }
    const filePath = path.join(__dirname, 'data', 'pinkie.png');

    res.sendFile(filePath, (err)=>{
        if (err) {
            //throw new Error("file fetching error");
            res.status(404).send("Fetch File Error");
        } else {
            console.log('Sent:', filePath);
        }
    });
    //res.sendFile(filePath);
    //console.log(filePath);
});

// error handler middleware
app.use((error, req, res, next) => {
    console.error(error.stack);
    res.status(error.status||505).send(
        {
            error: {
                status: error.status||505,
                message: error.message || 'Server Error',
            },
        }
    );
});

// query
const validQ= {
    a: '1234',
    b: '2345'
};

app.param('dataImg', function (req, res, next, imgFile) {
    console.log('Image requested: '+ imgFile);
    const rootPath = "./data/";
    if (fs.existsSync(rootPath+imgFile)) {
        next();
    }
    else {
        const error =  new Error("Image doesn't exist");
        error.status = 404;
        return next(error);
    }
    
});

app.get("/img/:dataImg", function (req,res){
    const approved = req.query.a == validQ.a && req.query.b == validQ.b;
    if (approved) {
        //res.json(req.query);
        res.sendFile(path.join(__dirname, 'data', req.params.dataImg));
    }
    else {
        res.status(403).send("Access Forbiden");
    }
    
});

// angular rout
app.get('*',(req,res) =>{
    res.sendFile(path.join(__dirname,'angular-public/index.html'));
});

// socket.io
let users = [];
let allClients = [];
let msgDataArray = [];

// load msg DataBase
// const msgDB = new NeDatastore('data/database/msgDB.db');
// msgDB.loadDatabase();
const msgDB = NeDatastore.create('data/database/msgDB.db');

const mongodb_operations = require('./server-scripts/chat-room-operations/mongodb-operations');

const mongoDBOptions = {
    db_save : true,
    db: ChatRoomModel,
    db_operations: {
        user_model: UserModel,
        msg_model: MsgModel,
        add_msg_to_room: mongodb_operations.operations.add_msg_to_room,
        get_msg_array_from_room: mongodb_operations.operations.get_msg_array_from_room
    }
}

/*
// test getting msg arrays from db
mongoDBOptions.db_operations.get_msg_array_from_room(ChatRoomModel, '00', (err,arr)=>{
    if (err) {return console.log("[error]");}
    console.log(arr);
});

// test adding to db
const b_user = new UserModel({
    name: 'test user 03',
    uid: '03',
    type: 'user'
});

const b_msg = new MsgModel({
    user: b_user,
    message: 'test test is db still working with type?',
    time: Date.now()
});

mongoDBOptions.db_operations.add_msg_to_room(ChatRoomModel, '00', b_msg);
*/


//io_function.start(io, users, allClients, msgDataArray, true, msgDB);
const io_function2 = require('./server-scripts/chatting-scripts/socket-io2');
const socket_users = {
    name_array:[],
    socket_array:[]
};

// start io;
// io_function2.start(io, socket_users, mongoDBOptions);

let rooms_array = {
    // name:
    // id: 
};

const permit_code = 'yoyoyo';

io.on('connection', async (socket)=>{
    // for private calling purposes
    //const userId = await fetchUserId(socket);
    const userId = socket.id;
    socket.join(userId);
    io.to(userId).emit('on connection'); // ask for user info

    // store user info for future usage
    const user_info = new Object();
    user_info.socket_id = userId;

    // on connect, collect user info
    socket.on('user info recieved', async function(recieved_user_info){
        if (!recieved_user_info.new_user) {
            // old user, search for his data on db
            const user_datas = await mongoDBOptions.db.find({uid:String(recieved_user_info.uid)}).exec();
            if (user_datas.length > 0) {
                const user_data = user_datas[0]; 
                user_info.user_data = user_data;
                user_info.allow_access = true;
                // emit allow percieve event
                io.to(userId).emit('allow access');
            }
            else {
                user_info.allow_access = false;
                const fail_to_login = {
                    status: "403",
                    allow_access: false,
                    msg: "invalid user id, please sign up"
                };
                io.to(userId).emit('login', fail_to_login);
            }
        }
        else {
            user_info.allow_access = false;
            const fail_to_login = {
                status: "403",
                allow_access: false,
                msg: "new user need to sign up"
            };
            io.to(userId).emit('login', fail_to_login);
        }
    });

    socket.on('login', async function(login_info){
        // old user, search for his data on db
        const user_datas = await mongoDBOptions.db.find({uid:String(login_info.uid)}).exec();
        if (user_datas.length > 0 && user_datas[0].password==login_info.password) {
            const user_data = user_datas[0]; 
            user_info.user_data = user_data;
            user_info.allow_access = true;
            // emit allow percieve event
            io.to(userId).emit('allow access');
        }
        else {
            user_info.allow_access = false;
            const fail_to_login = {
                status: "403",
                allow_access: false,
                msg: "invalid user id or password, please login in again"
            };
            io.to(userId).emit('login', fail_to_login);
        }
    });

    socket.on('sign up', async function(sign_up_info){
        if (sign_up_info.permit_code == permit_code){
            const new_user = new UserModel({
                uid: sign_up_info.user_name+Date.now(),
                name: sign_up_info.user_name,
                type: sign_up_info.user_type,
                password: sign_up_info.password
            });

            await new_user.save();
            console.log(`successfully signed up user ${sign_up_info.user_name}`);
            io.to(userId).emit('allow access');
        }
        else {
            const fail_to_sign_up = {
                status: "403",
                allow_access: false,
                msg: "invalid permission code"
            };
            console.log(`sign up failed`);
            io.to(userId).emit('sign up', fail_to_sign_up);
        }
    });



    socket.on('join room', async function (join_data){
        // search if room exist
        const room_data = await mongoDBOptions.db.find({room_id:String(join_data.room_id)}).exec();

        if (room_data.length > 0) {
            // choose the first room to join
            const room_to_join = room_data[0]; 
        }
        else {
            const fail_to_join_msg = {
                target_room: {name:join_data.room_name,room_id:join_data.room_id},
                status: "404",
                permit_to_join: false,
                msg: "room doesn't exist"
            };
            io.to(userId).emit('fail joining room', fail_to_join_msg);
            return;
        }

        // check if user is permitted to join
        if (room_to_join.type.includes('free_room')) {
            socket.join(`room:${room_to_join.room_id}`);
            io.to(`room:${room_to_join.room_id}`).emit('new user'); // trigger onUnnamed User joined event
            console.log(`new user joined room:${room_to_join.room_id}`);
        }
        else if (room_to_join.type.includes('bi_private_room')) {
            const fail_to_join_msg = {
                target_room: {name:join_data.room_name,room_id:join_data.room_id},
                status: "403",
                request_allowed: true, // allow sending request to join
                permit_to_join: false,
                msg: "room is restricted to members only, requests allowed"
            };
            io.to(userId).emit('fail joining room', fail_to_join_msg);
        }
        else if (room_to_join.type.includes('enclosed_private_room')) {
            const fail_to_join_msg = {
                target_room: {name:join_data.room_name,room_id:join_data.room_id},
                status: "403",
                request_allowed: false, // does not allow request to join
                permit_to_join: false,
                msg: "room is restricted to invited members only"
            };
            io.to(userId).emit('fail joining room', fail_to_join_msg);
        }

    });
});

async function matching_rooms_length(room_id) {
    const data = await mongoDBOptions.db.findOne({room_id:String(room_id)}).exec();

    console.log("data: "+data);

    //console.log("length of found room: "+ data.length);
}

matching_rooms_length('01');