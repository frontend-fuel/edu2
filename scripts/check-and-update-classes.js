const mongoose = require('mongoose');
const User = require('../models/User');
const Class = require('../models/Class');
require('dotenv').config();

// MongoDB Atlas URI (same as in server.js)
const MONGODB_ATLAS_URI = 'mongodb+srv://edu2:edu2@cluster0.ixai6mt.mongodb.net/edusquare?retryWrites=true&w=majority';

async function checkAndUpdateClasses() {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGODB_ATLAS_URI);
        console.log('Connected to MongoDB Atlas');

        // Find the HOD
        const hod = await User.findOne({ email: 'it@gmail.com' });
        if (!hod) {
            console.log('HOD not found with email it@gmail.com');
            return;
        }
        
        console.log(`Found HOD: ${hod.name}, Department: ${hod.department}`);
        
        // Find faculty members
        const faculty = await User.find({ role: 'faculty', department: hod.department });
        console.log(`Found ${faculty.length} faculty members`);
        
        if (faculty.length === 0) {
            // Create a faculty member if none exist
            const newFaculty = new User({
                name: 'Test Faculty',
                email: 'testfaculty@example.com',
                password: '$2a$10$YPTtov/FKtDrJy0p27fa/.rWJnQaS0/RMnQweqBjUUpt1/Re.6nxi', // 123456 hashed
                role: 'faculty',
                department: hod.department
            });
            await newFaculty.save();
            console.log(`Created new faculty: ${newFaculty.name}`);
            faculty.push(newFaculty);
        }
        
        // Find all classes for this HOD's department
        let classes = await Class.find({ department: hod.department });
        console.log(`Found ${classes.length} classes for department ${hod.department}`);
        
        if (classes.length === 0) {
            // Create a new class if none exist
            const newClass = new Class({
                year: '1st',
                department: hod.department,
                section: 'A',
                createdBy: hod._id
            });
            await newClass.save();
            console.log(`Created new class: 1st Year ${hod.department} Section A`);
            classes = [newClass];
        }
        
        // Add subjects to the class with faculty assignments
        for (const classItem of classes) {
            console.log(`Working with class: ${classItem.year} Year ${classItem.department} Section ${classItem.section}`);
            
            // Define subjects to add
            const subjectsToAdd = [
                { name: 'Programming Fundamentals', code: 'CS101', type: 'Theory' },
                { name: 'Database Systems', code: 'DB101', type: 'Theory' },
                { name: 'Web Development', code: 'WD101', type: 'Lab' }
            ];
            
            // Only add subjects if the class doesn't have any
            if (!classItem.subjects || classItem.subjects.length === 0) {
                const classSubjects = subjectsToAdd.map((subject, index) => ({
                    name: subject.name,
                    code: subject.code,
                    type: subject.type,
                    faculty: faculty[index % faculty.length]._id
                }));
                
                classItem.subjects = classSubjects;
                await classItem.save();
                console.log(`Added ${classSubjects.length} subjects to class ${classItem._id}`);
            } else {
                console.log(`Class already has ${classItem.subjects.length} subjects`);
            }
        }
        
        // Count students for each class
        for (const classItem of classes) {
            const studentCount = await User.countDocuments({
                role: 'student',
                year: classItem.year,
                department: classItem.department,
                section: classItem.section
            });
            
            console.log(`Class ${classItem.year} Year ${classItem.department} Section ${classItem.section} has ${studentCount} students`);
            
            // Add students if none exist
            if (studentCount === 0) {
                console.log('Adding students to this class...');
                
                for (let i = 1; i <= 5; i++) {
                    const student = new User({
                        name: `Student ${i}`,
                        email: `student${i}_${classItem.year}_${classItem.section}@example.com`,
                        password: '$2a$10$YPTtov/FKtDrJy0p27fa/.rWJnQaS0/RMnQweqBjUUpt1/Re.6nxi', // 123456 hashed
                        role: 'student',
                        rollNumber: `${classItem.department}${i.toString().padStart(3, '0')}`,
                        year: classItem.year,
                        department: classItem.department,
                        section: classItem.section
                    });
                    
                    await student.save();
                    console.log(`Added student: ${student.name}`);
                }
            }
        }
        
        // Get updated class data to verify changes
        const updatedClasses = await Class.find({ department: hod.department })
            .populate({
                path: 'subjects.faculty',
                select: 'name email'
            });
        
        console.log('\nUpdated Class Data:');
        for (const classItem of updatedClasses) {
            console.log(`Class: ${classItem.year} Year ${classItem.department} Section ${classItem.section}`);
            console.log(`- Subjects: ${classItem.subjects ? classItem.subjects.length : 0}`);
            
            if (classItem.subjects && classItem.subjects.length > 0) {
                classItem.subjects.forEach((subject, i) => {
                    console.log(`  ${i+1}. ${subject.name} - Faculty: ${subject.faculty ? subject.faculty.name : 'None'}`);
                });
            }
            
            const studentCount = await User.countDocuments({
                role: 'student',
                year: classItem.year,
                department: classItem.department,
                section: classItem.section
            });
            console.log(`- Students: ${studentCount}`);
        }
        
        console.log('\nCheck and update completed successfully');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

checkAndUpdateClasses();
