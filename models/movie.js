//movies.js
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var movieSchema = new Schema({
  title: String,
  ownerid: String,
  posterurl: String,
  year: String,
});

movieSchema.set('autoIndex', false);

module.exports = mongoose.model('Pinned', movieSchema);
