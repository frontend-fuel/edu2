const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// MongoDB Atlas URI
const MONGODB_ATLAS_URI = 'mongodb+srv://edu2:edu2@cluster0.ixai6mt.mongodb.net/edusquare?retryWrites=true&w=majority';

async function addStudentsToClass() {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGODB_ATLAS_URI);
        console.log('Connected to MongoDB Atlas');

        // Define the class parameters
        const year = '1st';
        const department = 'IT';
        const section = 'A';

        // Check if students already exist
        const existingStudents = await User.find({
            role: 'student',
            year: year,
            department: department,
            section: section
        });

        console.log(`Found ${existingStudents.length} existing students in ${year} - ${department} Section ${section}`);

        // Delete existing students if any (to avoid duplicates)
        if (existingStudents.length > 0) {
            await User.deleteMany({
                role: 'student',
                year: year,
                department: department,
                section: section
            });
            console.log('Removed existing students to avoid duplicates');
        }

        // Add new students
        const studentsToAdd = 10;
        const newStudents = [];

        console.log(`Adding ${studentsToAdd} students to class...`);
        for (let i = 1; i <= studentsToAdd; i++) {
            const student = new User({
                name: `Student ${i}`,
                email: `student${i}_${year}_${section}@example.com`,
                password: '$2a$10$YPTtov/FKtDrJy0p27fa/.rWJnQaS0/RMnQweqBjUUpt1/Re.6nxi', // 123456 hashed
                role: 'student',
                rollNumber: `IT${i.toString().padStart(3, '0')}`,
                year: year,
                department: department,
                section: section
            });
            
            await student.save();
            newStudents.push(student);
            console.log(`Added student ${i}: ${student.name} (${student.rollNumber})`);
        }

        console.log(`Successfully added ${newStudents.length} students to ${year} - ${department} Section ${section}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

addStudentsToClass();
