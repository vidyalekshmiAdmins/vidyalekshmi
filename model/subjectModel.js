const mongoose = require('mongoose');
const { Schema } = mongoose;

const subjectSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  department: [{
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  }],
  GraduationType: {
    type: String,
    enum: ['Under Graduate', 'Post Graduate', 'Diploma', 'Post Diploma', 'Research', 'Certificate Course' , 'Craft Course', 'Others'],
    default: 'Under Graduate',
    required: true,
},
});

module.exports = mongoose.model('Subject', subjectSchema);
