const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        sparse: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['owner', 'admin', 'hod', 'faculty', 'student'],
        required: true
    },
    department: {
        type: String,
        required: function() {
            return ['admin', 'hod', 'faculty', 'student'].includes(this.role);
        }
    },
    subjects: [{
        type: String,
        required: function() {
            return this.role === 'faculty';
        }
    }],
    year: {
        type: String,
        required: function() {
            return this.role === 'student';
        }
    },
    section: {
        type: String,
        required: function() {
            return this.role === 'student';
        }
    },
    rollNumber: {
        type: String,
        required: function() {
            return this.role === 'student';
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
