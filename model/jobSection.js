const mongoose = require('mongoose');

const jobSectionSchema = new mongoose.Schema({
  sectionName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  jobRoles: [
    {
      type: String,
      required: true,
      trim: true,
    },
  ],
});

const JobSection = mongoose.model('JobSection', jobSectionSchema);

module.exports = JobSection;
