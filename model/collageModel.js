const mongoose = require('mongoose'); // Assuming you're using Mongoose

const collegeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: Object,
    required: true,
    properties: {
      district: {
        type: String,
        required: true,
        trim: true,
      },
      pincode: {
        type: String,
        required: true,
        trim: true,
        validate: {
          validator: function(value) {
            return /^\d{6}$/.test(value); // Validates Indian pincode format
          },
          message: 'Invalid pincode format. Please enter a 6-digit code.'
        }
      },
      country: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        required: true,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
    },
  },
  img: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ['aided', 'un-aided', 'govt'],
    required: true,
  },
  category: {
    type: String,
    enum: ['mens', 'women', 'mixed'],
    required: true,
  },
  courses: {
    type: [String], // Array of strings representing course names
  },
});

module.exports = mongoose.model('College', collegeSchema);
