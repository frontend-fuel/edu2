const mongoose = require('mongoose');
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

async function createTestData() {
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

        // Create faculty members in the HOD's department
        const facultyData = [
            { name: 'John Smith', email: 'john@example.com' },
            { name: 'Jane Doe', email: 'jane@example.com' },
            { name: 'Robert Johnson', email: 'robert@example.com' }
        ];

        console.log('Creating faculty members...');
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

        // Create subjects
        const subjectData = [
            { name: 'Introduction to Programming', code: 'CS101', type: 'Theory' },
            { name: 'Data Structures', code: 'CS201', type: 'Theory' },
            { name: 'Database Systems', code: 'CS301', type: 'Lab' }
        ];

        console.log('Creating subjects...');
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

        // Create classes
        const classData = [
            { year: '1st', section: 'A' },
            { year: '2nd', section: 'B' }
        ];

        console.log('Creating classes...');
        for (const classInfo of classData) {
            const existingClass = await Class.findOne({
                year: classInfo.year,
                section: classInfo.section,
                department: hod.department
            });

            if (!existingClass) {
                const newClass = new Class({
                    year: classInfo.year,
                    section: classInfo.section,
                    department: hod.department,
                    createdBy: hod._id
                });
                await newClass.save();
                console.log(`Created class: ${classInfo.year} ${classInfo.section}`);
            } else {
                console.log(`Class ${classInfo.year} ${classInfo.section} already exists`);
            }
        }

        // Create students
        const classes = await Class.find({ department: hod.department });
        
        if (classes.length > 0) {
            console.log('Creating students...');
            for (let i = 1; i <= 10; i++) {
                const rollNumber = `ST${i.toString().padStart(3, '0')}`;
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
        } else {
            console.log('No classes found to add students');
        }

        // Create timetable entries for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const subjects = await Subject.find({ department: hod.department });
        const faculty = await User.find({ role: 'faculty', department: hod.department });
        
        if (subjects.length > 0 && faculty.length > 0 && classes.length > 0) {
            console.log('Creating timetable entries...');
            
            // Check if timetable entries already exist for today
            const existingEntries = await Timetable.find({
                department: hod.department,
                date: {
                    $gte: today,
                    $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
            });
            
            if (existingEntries.length === 0) {
                // Create 3 slots for each class
                for (const classItem of classes) {
                    const startTimes = ['09:00', '11:00', '14:00'];
                    const endTimes = ['10:30', '12:30', '15:30'];
                    
                    for (let i = 0; i < 3; i++) {
                        const timetableEntry = new Timetable({
                            date: today,
                            startTime: startTimes[i],
                            endTime: endTimes[i],
                            subject: subjects[i % subjects.length]._id,
                            faculty: faculty[i % faculty.length]._id,
                            year: classItem.year,
                            department: hod.department,
                            section: classItem.section,
                            createdBy: hod._id
                        });
                        
                        await timetableEntry.save();
                        console.log(`Created timetable entry for ${classItem.year} ${classItem.section} at ${startTimes[i]}`);
                    }
                }
            } else {
                console.log(`${existingEntries.length} timetable entries already exist for today`);
            }
        } else {
            console.log('Missing subjects, faculty, or classes for timetable creation');
        }

        console.log('Test data creation completed successfully');
    } catch (error) {
        console.error('Error creating test data:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

createTestData();
