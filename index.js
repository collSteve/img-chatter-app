const express = require('express');
const http = require('http');
var path = require('path');
const fs = require('fs');

const NeDatastore = require('nedb'); // NeDB

//const mongoose = require('mongoose');

/*
const db = require("./server-scripts/load-db");
const Book = require('./server-scripts/db-models/book');
const ChatMsg = require('./server-scripts/db-models/chat-msg');*/

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
app.use(express.static('angular-public'));
app.use("/pdata", express.static('data')); // server public data

// database
/*
const BookModel = Book('testData'); // save in collection 'testData'
const ChatMsgModel = ChatMsg('chatMsg');
*/
//db_find({name:'Hello Mongo'});

// BookModel.find({}, 'name', (err,data)=>{
//     if (err) return console.log(err);
//     console.log(data);
// });
/*

function save_book1() {
    let book1 = new BookModel({name:"Hello Mongo5", price:2, qty:32});

    book1.save((err, item)=>{
        if (err) return console.log(err);
        console.log(item.name + " saved to collection");
    });
}

async function db_find(options={}) {
    const data = await BookModel.find(options);
    console.log(data);
}


app.get('/api', (req, res) =>{
    BookModel.find({}, (err, data)=>{
        if (err) return console.log(err);
        
        const jsonData = JSON.parse(JSON.stringify(data));
        res.json(jsonData); // response with found data
    });
});
*/

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

// socket.io
let users = [];
let allClients = [];
let msgDataArray = [];

// load msg DataBase
const msgDB = new NeDatastore('data/database/msgDB.db');
msgDB.loadDatabase();

io_function.start(io, users, allClients, msgDataArray, true, msgDB);
