const mongoose = require('mongoose');
const User = require('../models/User');
const Class = require('../models/Class');
require('dotenv').config();

// MongoDB Atlas URI (same as in server.js)
const MONGODB_ATLAS_URI = 'mongodb+srv://edu2:edu2@cluster0.ixai6mt.mongodb.net/edusquare?retryWrites=true&w=majority';

async function fixClassData() {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGODB_ATLAS_URI);
        console.log('Connected to MongoDB Atlas');

        // Find the HOD with email it@gmail.com
        const hod = await User.findOne({ email: 'it@gmail.com' });
        if (!hod) {
            console.error('HOD not found with email it@gmail.com');
            return;
        }
        
        console.log(`Found HOD: ${hod.name}, Department: ${hod.department}`);

        // Find or create faculty members
        let faculty = await User.find({ role: 'faculty', department: hod.department });
        console.log(`Found ${faculty.length} faculty members`);
        
        if (faculty.length === 0) {
            const newFaculty = new User({
                name: "Test Faculty",
                email: "faculty@example.com",
                password: '$2a$10$YPTtov/FKtDrJy0p27fa/.rWJnQaS0/RMnQweqBjUUpt1/Re.6nxi', // 123456 hashed
                role: 'faculty',
                department: hod.department
            });
            await newFaculty.save();
            faculty.push(newFaculty);
            console.log('Created test faculty member');
        }
        
        // Find the specific class
        let classToUpdate = await Class.findOne({ 
            year: '1st', 
            department: 'IT',
            section: 'A'
        });
        
        if (!classToUpdate) {
            console.log('Class not found, creating it...');
            classToUpdate = new Class({
                year: '1st',
                department: 'IT',
                section: 'A',
                createdBy: hod._id
            });
            await classToUpdate.save();
            console.log('Created class successfully');
        } else {
            console.log('Found existing class');
        }
        
        // Add subjects to class
        if (!classToUpdate.subjects || classToUpdate.subjects.length === 0) {
            console.log('Adding subjects to class...');
            classToUpdate.subjects = [
                {
                    name: 'Programming Fundamentals',
                    code: 'IT101',
                    type: 'Theory',
                    faculty: faculty[0]._id
                },
                {
                    name: 'Database Systems',
                    code: 'IT102',
                    type: 'Theory',
                    faculty: faculty[0]._id
                },
                {
                    name: 'Web Development',
                    code: 'IT103',
                    type: 'Lab',
                    faculty: faculty[0]._id
                }
            ];
            await classToUpdate.save();
            console.log('Added subjects to class');
        } else {
            console.log(`Class already has ${classToUpdate.subjects.length} subjects`);
        }
        
        // Add students
        const studentCount = await User.countDocuments({
            role: 'student',
            year: '1st',
            department: 'IT',
            section: 'A'
        });
        
        console.log(`Found ${studentCount} students in the class`);
        
        if (studentCount === 0) {
            console.log('Adding students to class...');
            for (let i = 1; i <= 5; i++) {
                const student = new User({
                    name: `Student ${i}`,
                    email: `student${i}@example.com`,
                    password: '$2a$10$YPTtov/FKtDrJy0p27fa/.rWJnQaS0/RMnQweqBjUUpt1/Re.6nxi', // 123456 hashed
                    role: 'student',
                    rollNumber: `IT${i.toString().padStart(3, '0')}`,
                    year: '1st',
                    department: 'IT',
                    section: 'A'
                });
                await student.save();
            }
            console.log('Added 5 students to class');
        }
        
        console.log('Class update completed');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

fixClassData();
