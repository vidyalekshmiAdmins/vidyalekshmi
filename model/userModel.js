const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: false,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  mobileNumber: {
    type: String,
  },
  profileImage: {
    type: String,
  },
  applications: [
    {
      type: Schema.Types.ObjectId,
      ref: 'AdmissionApplication',
    }
  ]
}, { timestamps: true });




module.exports = mongoose.model('User', userSchema);




