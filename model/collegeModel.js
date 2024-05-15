const mongoose = require('mongoose'); // Assuming you're using Mongoose

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

const collegeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  
   
   
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
  
 
  images: {
    type: [imageSchema],
    required: true,
    validate: {
      validator: (images) => images.length > 0,
      message: 'Please upload at least one image for the college.',
    },
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
