const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const crypto = require('crypto');

const imageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  path: {
    type: String,
    required: true,
    trim: true,
  },
});


const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  mobileNumber: {
    type: String,
    
  },
  image: {
    type:  [imageSchema], 
  },
 
}, { timestamps: true });

userSchema.methods.authenticate = function (password) {
  try {
    return bcrypt.compareSync(password, this.password);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

// Export the model
module.exports = mongoose.model('User', userSchema);
