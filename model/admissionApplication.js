const mongoose = require('mongoose');
const { Schema } = mongoose;

const admissionApplicationSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function(value) {
                return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
            },
            message: 'Invalid email format.'
        }
    },
    contactNumber: {
        type: String,
        required: true,
        trim: true,
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Subject', // Reference to the subject
        required: true
    },
    status: {
        type: String,
        enum: ['contacted','not yet contacted', 'took admission', 'cancelled', 'admission under process'],
        default: 'not yet contacted',
    },
    collegeId: {
        type: Schema.Types.ObjectId,
        ref: 'College',
        required: true
    },
    deptId: {
        type: Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('AdmissionApplication', admissionApplicationSchema);
