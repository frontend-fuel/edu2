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

        // Get faculty members or create new ones if needed
        let faculty = await User.find({ role: 'faculty', department: hod.department });
        console.log(`Found ${faculty.length} faculty members in the ${hod.department} department`);
        
        if (faculty.length < 3) {
            console.log('Creating additional faculty members...');
            const newFacultyData = [
                { name: 'John Smith', email: 'john@example.com' },
                { name: 'Jane Doe', email: 'jane@example.com' },
                { name: 'Robert Johnson', email: 'robert@example.com' }
            ];
            
            for (const data of newFacultyData) {
                const exists = await User.findOne({ email: data.email });
                if (!exists) {
                    const newFaculty = new User({
                        name: data.name,
                        email: data.email,
                        password: '$2a$10$YPTtov/FKtDrJy0p27fa/.rWJnQaS0/RMnQweqBjUUpt1/Re.6nxi', // 123456 hashed
                        role: 'faculty',
                        department: hod.department
                    });
                    await newFaculty.save();
                    faculty.push(newFaculty);
                    console.log(`Created faculty: ${data.name}`);
                }
            }
            faculty = await User.find({ role: 'faculty', department: hod.department });
            console.log(`Now have ${faculty.length} faculty members`);
        }

        // Find the specific class in question: 1st Year - IT - Section A
        const targetClass = await Class.findOne({
            year: '1st',
            department: 'IT',
            section: 'A'
        });

        if (!targetClass) {
            console.log('Target class not found. Creating 1st Year - IT - Section A');
            const newClass = new Class({
                year: '1st',
                department: 'IT',
                section: 'A',
                subjects: [], // Start with empty subjects
                createdBy: hod._id
            });
            await newClass.save();
            console.log('Created new class');
            targetClassId = newClass._id;
        } else {
            console.log('Found target class:', targetClass._id.toString());
            targetClassId = targetClass._id;
        }

        // Get the class again to ensure we have the latest data
        let classToUpdate = await Class.findById(targetClassId);
        
        // Define subjects to add
        const subjectsToAdd = [
            { name: 'Introduction to Programming', code: 'IT101', type: 'Theory' },
            { name: 'Database Management Systems', code: 'IT102', type: 'Theory' },
            { name: 'Web Development', code: 'IT103', type: 'Lab' },
            { name: 'Computer Networks', code: 'IT104', type: 'Theory' },
            { name: 'Data Structures', code: 'IT105', type: 'Theory' }
        ];
        
        // Clear existing subjects and add new ones
        classToUpdate.subjects = [];
        
        // Add subjects with faculty assignments
        for (let i = 0; i < subjectsToAdd.length; i++) {
            const subject = subjectsToAdd[i];
            const assignedFaculty = faculty[i % faculty.length];
            
            classToUpdate.subjects.push({
                name: subject.name,
                code: subject.code,
                type: subject.type,
                faculty: assignedFaculty._id
            });
            
            console.log(`Added subject: ${subject.name}, Faculty: ${assignedFaculty.name}`);
        }
        
        await classToUpdate.save();
        console.log(`Updated class with ${classToUpdate.subjects.length} subjects`);
        
        // Now make sure there are students for this class
        const existingStudents = await User.find({
            role: 'student',
            year: '1st',
            department: 'IT',
            section: 'A'
        });
        
        console.log(`Found ${existingStudents.length} existing students in this class`);
        
        // Add students if fewer than 5 exist
        if (existingStudents.length < 5) {
            console.log('Adding students to the class...');
            
            for (let i = 1; i <= 10; i++) {
                const studentEmail = `student${i}_1st_A@example.com`;
                const exists = await User.findOne({ email: studentEmail });
                
                if (!exists) {
                    const newStudent = new User({
                        name: `Student ${i}`,
                        email: studentEmail,
                        password: '$2a$10$YPTtov/FKtDrJy0p27fa/.rWJnQaS0/RMnQweqBjUUpt1/Re.6nxi', // 123456 hashed
                        role: 'student',
                        rollNumber: `IT${i.toString().padStart(3, '0')}`,
                        year: '1st',
                        department: 'IT',
                        section: 'A'
                    });
                    
                    await newStudent.save();
                    console.log(`Created student: ${newStudent.name}`);
                }
            }
        }
        
        // Verify the final state
        const updatedClass = await Class.findById(targetClassId).populate({
            path: 'subjects.faculty',
            select: 'name email'
        });
        
        const finalStudentCount = await User.countDocuments({
            role: 'student',
            year: '1st',
            department: 'IT',
            section: 'A'
        });
        
        console.log('\nFinal verification:');
        console.log(`Class: 1st Year - IT - Section A`);
        console.log(`- ID: ${updatedClass._id}`);
        console.log(`- Subjects: ${updatedClass.subjects.length}`);
        updatedClass.subjects.forEach((subject, i) => {
            console.log(`  ${i+1}. ${subject.name} - Faculty: ${subject.faculty ? subject.faculty.name : 'None'}`);
        });
        console.log(`- Students: ${finalStudentCount}`);
        
        console.log('\nClass data fix completed successfully');
    } catch (error) {
        console.error('Error fixing class data:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

fixClassData();
