const mongoose = require('mongoose');
const User = require('../models/User');
const Class = require('../models/Class');
require('dotenv').config();

// MongoDB Atlas URI
const MONGODB_ATLAS_URI = 'mongodb+srv://edu2:edu2@cluster0.ixai6mt.mongodb.net/edusquare?retryWrites=true&w=majority';

async function verifyClassData() {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGODB_ATLAS_URI);
        console.log('Connected to MongoDB Atlas');

        // Find the target class
        const targetClass = await Class.findOne({
            year: '1st',
            department: 'IT',
            section: 'A'
        }).populate({
            path: 'subjects.faculty',
            select: 'name email'
        });

        if (!targetClass) {
            console.log('Class not found!');
            return;
        }

        // Log class details
        console.log('CLASS DETAILS:');
        console.log('==============');
        console.log(`ID: ${targetClass._id}`);
        console.log(`Year: ${targetClass.year}`);
        console.log(`Department: ${targetClass.department}`);
        console.log(`Section: ${targetClass.section}`);
        
        // Check subjects
        console.log('\nSUBJECTS:');
        console.log('=========');
        if (!targetClass.subjects || targetClass.subjects.length === 0) {
            console.log('No subjects found in this class!');
        } else {
            console.log(`Found ${targetClass.subjects.length} subjects:`);
            targetClass.subjects.forEach((subject, i) => {
                console.log(`${i+1}. ${subject.name} (${subject.code}) - Type: ${subject.type}`);
                console.log(`   Faculty: ${subject.faculty ? subject.faculty.name : 'None'}`);
            });
        }

        // Check students
        console.log('\nSTUDENTS:');
        console.log('=========');
        const students = await User.find({
            role: 'student',
            year: targetClass.year,
            department: targetClass.department,
            section: targetClass.section
        });

        if (students.length === 0) {
            console.log('No students found in this class!');
        } else {
            console.log(`Found ${students.length} students:`);
            students.forEach((student, i) => {
                console.log(`${i+1}. ${student.name} (${student.rollNumber}) - Email: ${student.email}`);
            });
        }

        // Check if there's an issue with character cases in department field
        const departmentVariations = await User.distinct('department', {
            role: 'student',
            $or: [
                { department: { $regex: new RegExp(targetClass.department, 'i') } },
                { department: { $regex: new RegExp(targetClass.department.toUpperCase(), 'i') } },
                { department: { $regex: new RegExp(targetClass.department.toLowerCase(), 'i') } }
            ]
        });

        if (departmentVariations.length > 1) {
            console.log('\nWARNING: Multiple department spellings found:');
            departmentVariations.forEach(dept => console.log(`- "${dept}"`));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

verifyClassData();
