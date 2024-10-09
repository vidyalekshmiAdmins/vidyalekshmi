const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const staffSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true, 
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true,
  },
  alternativeNumber: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  jobRole: {
    section: {
      type:  String,
      ref: 'JobSection', // Reference to JobSection model
      required: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
  },
  salary: {
    type: Number,
  },
  profilePicture: {
    type: String,
  },
  documents: [
    {
      type: String, // Assuming documents are stored as file paths or URLs
    },
  ],
  application: {
    id: {
      type: String,
      required: false,
      unique: true,
      trim: true,
    },
    date: {
      type: Date,
      required: false,
    },
  },
}, { timestamps: true });

staffSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

staffSchema.methods.authenticate = function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Staff', staffSchema);
