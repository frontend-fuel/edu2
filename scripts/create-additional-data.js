const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Timetable = require('../models/Timetable');
require('dotenv').config();

// MongoDB connection options
const MONGODB_OPTIONS = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000
};

// MongoDB Atlas URI (same as in server.js)
const MONGODB_ATLAS_URI = 'mongodb+srv://edu2:edu2@cluster0.ixai6mt.mongodb.net/edusquare?retryWrites=true&w=majority';

async function createAdditionalData() {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGODB_ATLAS_URI, MONGODB_OPTIONS);
        console.log('Connected to MongoDB Atlas');

        // Find the HOD by email
        const hod = await User.findOne({ email: 'it@gmail.com' });
        if (!hod) {
            console.log('HOD not found with email it@gmail.com');
            return;
        }
        
        console.log(`Found HOD: ${hod.name}, Department: ${hod.department}`);

        // Create classes if they don't exist
        const classYears = ['1st', '2nd', '3rd', '4th'];
        const sections = ['A', 'B'];
        
        for (const year of classYears) {
            for (const section of sections) {
                const existingClass = await Class.findOne({
                    year,
                    section,
                    department: hod.department
                });

                if (!existingClass) {
                    const newClass = new Class({
                        year,
                        section,
                        department: hod.department,
                        createdBy: hod._id
                    });
                    await newClass.save();
                    console.log(`Created class: ${year} ${section}`);
                } else {
                    console.log(`Class ${year} ${section} already exists`);
                }
            }
        }

        // Create subjects if they don't exist
        const subjectData = [
            { name: 'Introduction to Programming', code: 'IT101', type: 'Theory' },
            { name: 'Data Structures', code: 'IT201', type: 'Theory' },
            { name: 'Database Systems', code: 'IT301', type: 'Lab' },
            { name: 'Web Development', code: 'IT401', type: 'Lab' },
            { name: 'Computer Networks', code: 'IT501', type: 'Theory' }
        ];

        for (const subject of subjectData) {
            const existingSubject = await Subject.findOne({
                code: subject.code,
                department: hod.department
            });

            if (!existingSubject) {
                const newSubject = new Subject({
                    name: subject.name,
                    code: subject.code,
                    type: subject.type,
                    department: hod.department,
                    createdBy: hod._id
                });
                await newSubject.save();
                console.log(`Created subject: ${subject.name}`);
            } else {
                console.log(`Subject ${subject.name} already exists`);
            }
        }

        // Create faculty members if they don't exist
        const facultyData = [
            { name: 'Dr. John Smith', email: 'john@example.com' },
            { name: 'Prof. Jane Doe', email: 'jane@example.com' },
            { name: 'Dr. Robert Johnson', email: 'robert@example.com' },
            { name: 'Prof. Sarah Wilson', email: 'sarah@example.com' }
        ];

        for (const faculty of facultyData) {
            const existingFaculty = await User.findOne({ email: faculty.email });
            if (!existingFaculty) {
                const newFaculty = new User({
                    name: faculty.name,
                    email: faculty.email,
                    password: '$2a$10$YPTtov/FKtDrJy0p27fa/.rWJnQaS0/RMnQweqBjUUpt1/Re.6nxi', // 123456 hashed
                    role: 'faculty',
                    department: hod.department
                });
                await newFaculty.save();
                console.log(`Created faculty: ${faculty.name}`);
            } else {
                console.log(`Faculty ${faculty.name} already exists`);
            }
        }

        // Create students (20 students distributed across classes)
        const classes = await Class.find({ department: hod.department });
        if (classes.length > 0) {
            for (let i = 1; i <= 20; i++) {
                const rollNumber = `IT${i.toString().padStart(3, '0')}`;
                const email = `student${i}@example.com`;
                
                const existingStudent = await User.findOne({ email });
                
                if (!existingStudent) {
                    const classIndex = i % classes.length;
                    const studentClass = classes[classIndex];
                    
                    const student = new User({
                        name: `Student ${i}`,
                        email,
                        password: '$2a$10$YPTtov/FKtDrJy0p27fa/.rWJnQaS0/RMnQweqBjUUpt1/Re.6nxi', // 123456 hashed
                        role: 'student',
                        rollNumber,
                        year: studentClass.year,
                        section: studentClass.section,
                        department: hod.department
                    });
                    
                    await student.save();
                    console.log(`Created student: Student ${i}`);
                } else {
                    console.log(`Student ${i} already exists`);
                }
            }
        }

        // Create timetable entries for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const subjects = await Subject.find({ department: hod.department });
        const faculty = await User.find({ role: 'faculty', department: hod.department });
        
        if (subjects.length > 0 && faculty.length > 0 && classes.length > 0) {
            // Check for existing timetable entries
            const existingEntries = await Timetable.countDocuments({
                department: hod.department,
                date: {
                    $gte: today,
                    $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
            });
            
            if (existingEntries === 0) {
                console.log('Creating timetable entries for today...');
                
                // Create entries for each class
                for (const classItem of classes) {
                    // Create 3 periods for each class
                    const startTimes = ['09:00', '11:00', '14:00'];
                    const endTimes = ['10:30', '12:30', '15:30'];
                    
                    for (let i = 0; i < 3; i++) {
                        // Randomly select subject and faculty
                        const subjectIndex = Math.floor(Math.random() * subjects.length);
                        const facultyIndex = Math.floor(Math.random() * faculty.length);
                        
                        const timetableEntry = new Timetable({
                            date: today,
                            startTime: startTimes[i],
                            endTime: endTimes[i],
                            subject: subjects[subjectIndex]._id,
                            faculty: faculty[facultyIndex]._id,
                            year: classItem.year,
                            section: classItem.section,
                            department: hod.department,
                            createdBy: hod._id
                        });
                        
                        await timetableEntry.save();
                        console.log(`Created timetable entry for ${classItem.year} ${classItem.section} at ${startTimes[i]}`);
                    }
                }
                
                console.log(`Created ${classes.length * 3} timetable entries for today`);
            } else {
                console.log(`${existingEntries} timetable entries already exist for today`);
            }
        }

        console.log('Additional test data created successfully');
    } catch (error) {
        console.error('Error creating additional test data:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

createAdditionalData();
