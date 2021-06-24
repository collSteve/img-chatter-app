const mongoose = require('mongoose');

let BookSchema = mongoose.Schema({
    name: String,
    price: Number,
    qty: Number
});

let Book = (collectionName)=> mongoose.model('Book', BookSchema, collectionName);

module.exports = Book;