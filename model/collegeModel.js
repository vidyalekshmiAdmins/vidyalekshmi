const mongoose = require('mongoose');
const { Schema } = mongoose;

// Image Schema
const imageSchema = new Schema({
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

// Subject Schema inside College Schema
const collegeSubjectSchema = new Schema({
  subjectId: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  noOfSemesters: {
    type: Number,
    validate: {
      validator: Number.isInteger,
      message: 'Number of semesters should be an integer.'
    }
  },
  feePerSemester: {
    type: Number,
    validate: {
      validator: (value) => value > 0,
      message: 'Fee per semester should be a positive number.'
    }
  }
});

// Department Schema inside College Schema
const collegeDeptSchema = new Schema({
  deptId: {
    type: Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  deptName: {
    type: String,
    trim: true,
    required: true,
  },
  subjects: [collegeSubjectSchema]
});

// College Schema
const collegeSchema = new Schema({
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
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    trim: true,
    unique: true,
    validate: {
      validator: function(value) {
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
      },
      message: 'Invalid email format.'
    }
  },
  noOfFaculty: {
    type: String,
    enum: ['10+', '30+', '50+', '100+', '300+', '500+'],
    default: null,
  },
  establishedIn: {
    type: Number,
    default: null,
    validate: {
      validator: function(value) {
        return Number.isInteger(value) && value > 0;
      },
      message: 'Established year should be a positive integer.'
    }
  },
  courses: [collegeDeptSchema],
});

module.exports = mongoose.model('College', collegeSchema);
