const mongoose = require('mongoose');

const dbPassword = "k503702M",
      dbName = "testDB",
      testDbURL = `mongodb+srv://Ohfancy:${dbPassword}@cluster0.g7r3r.mongodb.net/${dbName}?retryWrites=true&w=majority`;

// connect to Mongo DB
mongoose.connect(testDbURL, {useNewUrlParser: true, useUnifiedTopology: true});


const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => console.log('connected db'));
db.on('connected', ()=>console.log('database is connected successfully'));
db.on('disconnected',()=>console.log('database is disconnected successfully'));

module.exports = db;