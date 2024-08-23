const mongoose = require('mongoose');
const { Schema } = mongoose;

const departmentSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    required: false,
    trim: true,
  },
});

module.exports = mongoose.model('Department', departmentSchema);
