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
});

module.exports = mongoose.model('Subject', subjectSchema);
