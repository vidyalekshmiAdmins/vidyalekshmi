const mongoose = require('mongoose');

const applyCertificateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        description: "Name as per certificate"
    },
    dateOfBirth: {
        type: Date,
        required: true,
        description: "Date of Birth"
    },
    fathersName: {
        type: String,
        required: true,
        description: "Father's Name"
    },
    mothersName: {
        type: String,
        required: true,
        description: "Mother's Name"
    },
    email: {
        type: String,
        required: true,
        match: /.+\@.+\..+/,
        description: "Email ID"
    },
    mobileNumber: {
        type: String,
        required: true,
        description: "Mobile Number"
    },
    collegeName: {
        type: String,
        required: true,
        description: "College Name or Centre of Examination"
    },
    modeOfStudy: {
        type: String,
        enum: ["distance", "regular", "online"],
        required: true,
        description: "Mode of Study"
    },
    university: {
        type: String,
        enum: ["University 1", "University 2", "University 3"],
        required: true,
        description: "University"
    },
    course: {
        type: String,
        required: true,
        description: "Course"
    },
    otherCourse: {
        type: String,
        description: "Specify other course",
        required: function() {
            return this.course === 'Other';
        }
    },
    mainSubject: {
        type: String,
        required: true,
        description: "Main Subject"
    },
    secondLanguage: {
        type: String,
        enum: ["Language 1", "Language 2", "Language 3"],
        required: true,
        description: "Second Language"
    },
    schemaOfStudy: {
        type: String,
        enum: ["yearWise", "semesterWise"],
        required: true,
        description: "Schema of Study"
    },
    schemaDetails: {
        type: String,
        required: true,
        description: "Year or Semester details",
    },
    purposeOfApplication: {
        type: String,
        required: true,
        description: "Purpose of Application"
    },
    otherPurpose: {
        type: String,
        description: "Specify other purpose",
        required: function() {
            return this.purposeOfApplication === 'Other';
        }
    },
    documents: {
        type: [String],
        required: true,
        description: "Uploaded documents"
    }
});

module.exports = mongoose.model('ApplyCertificate', applyCertificateSchema);
