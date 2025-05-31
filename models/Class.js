const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    year: {
        type: String,
        required: true,
        enum: ['1st', '2nd', '3rd', '4th']
    },
    department: {
        type: String,
        required: true
    },
    section: {
        type: String,
        required: true
    },
    subjects: [{
        name: String,
        code: String,
        type: {
            type: String,
            enum: ['Theory', 'Lab']
        },
        faculty: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure unique combination of year, department and section
classSchema.index({ year: 1, department: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);
