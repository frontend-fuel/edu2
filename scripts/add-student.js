const User = require('../models/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

async function addStudent() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://127.0.0.1:27017/edusquare');

        // Use roll number as password
        const rollNumber = '22781A3542';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rollNumber, salt);

        // Check if student already exists
        const existingStudent = await User.findOne({
            $or: [
                { email: 'student@test.com' },
                { rollNumber },
                {
                    role: 'student',
                    department: 'CSE',
                    year: '4th',
                    section: 'A',
                    rollNumber
                }
            ]
        });

        if (existingStudent) {
            console.error('Student already exists');
            return;
        }

        // Create student
        const student = new User({
            name: 'Test Student',
            email: 'student@test.com',
            password: hashedPassword,
            role: 'student',
            rollNumber: rollNumber,
            year: '4th',
            department: 'CSE',
            section: 'A',
            createdAt: new Date()
        });

        await student.save();
        console.log('Student created successfully!');
        console.log('Use your roll number as password:', rollNumber);
        
        // Disconnect from MongoDB
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

addStudent();
