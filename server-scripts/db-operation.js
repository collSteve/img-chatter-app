const mongoose = require('mongoose');

/**
 * Save a mongoose model to a database
 * @param {*} db the mongo database to save to
 * @param {*} model the mongoose model to save
 */
function save_model(db, model, callback=(err,item)=>{if (err) return console.log(err);}) {
    db.once('open', function() {
        model.save(callback);
    });
}

module.exports = {
    save_model: save_model
}