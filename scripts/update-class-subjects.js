const mongoose = require('mongoose');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
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

async function updateClassSubjects() {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGODB_ATLAS_URI, MONGODB_OPTIONS);
        console.log('Connected to MongoDB Atlas');

        // Find the HOD
        const hod = await User.findOne({ email: 'it@gmail.com' });
        if (!hod) {
            console.log('HOD not found with email it@gmail.com');
            return;
        }
        
        const department = hod.department;
        console.log(`Working with department: ${department}`);
        
        // Get all faculty members for the department
        const facultyMembers = await User.find({ role: 'faculty', department: { $regex: new RegExp(`^${department}$`, 'i') } });
        if (facultyMembers.length === 0) {
            console.log('No faculty members found for this department');
            return;
        }
        console.log(`Found ${facultyMembers.length} faculty members`);
        
        // Find all classes for this department
        const classes = await Class.find({ department: { $regex: new RegExp(`^${department}$`, 'i') } });
        if (classes.length === 0) {
            console.log('No classes found for this department');
            return;
        }
        console.log(`Found ${classes.length} classes`);
        
        // Define some subject data to add to classes
        const subjectsData = [
            { name: 'Introduction to Programming', code: 'IT101', type: 'Theory' },
            { name: 'Database Management Systems', code: 'IT102', type: 'Theory' },
            { name: 'Web Development', code: 'IT103', type: 'Lab' },
            { name: 'Computer Networks', code: 'IT104', type: 'Theory' },
            { name: 'Data Structures', code: 'IT201', type: 'Theory' }
        ];
        
        // Update each class with subjects
        for (const classItem of classes) {
            console.log(`Updating class: ${classItem.year} ${classItem.section}`);
            
            // Skip if class already has subjects
            if (classItem.subjects && classItem.subjects.length > 0) {
                console.log(`Class ${classItem.year} ${classItem.section} already has ${classItem.subjects.length} subjects. Skipping.`);
                continue;
            }
            
            // Create 3-5 subjects for this class (different number for variety)
            const numSubjects = 3 + Math.floor(Math.random() * 3); // 3 to 5 subjects
            const classSubjects = [];
            
            for (let i = 0; i < numSubjects; i++) {
                // Select a random subject from the data
                const subjectData = subjectsData[i % subjectsData.length];
                
                // Select a random faculty member
                const facultyMember = facultyMembers[i % facultyMembers.length];
                
                // Create the subject with faculty assigned
                classSubjects.push({
                    name: subjectData.name,
                    code: subjectData.code,
                    type: subjectData.type,
                    faculty: facultyMember._id
                });
                
                console.log(`Added subject ${subjectData.name} assigned to ${facultyMember.name}`);
            }
            
            // Update the class with the subjects
            classItem.subjects = classSubjects;
            await classItem.save();
            
            console.log(`Updated class ${classItem.year} ${classItem.section} with ${classSubjects.length} subjects`);
        }
        
        // Verify the updates
        const updatedClasses = await Class.find({ department: { $regex: new RegExp(`^${department}$`, 'i') } })
            .populate({
                path: 'subjects.faculty',
                select: 'name email'
            });
        
        console.log('\nVerification of updates:');
        for (const classItem of updatedClasses) {
            console.log(`Class ${classItem.year} ${classItem.section} has ${classItem.subjects ? classItem.subjects.length : 0} subjects`);
            if (classItem.subjects && classItem.subjects.length > 0) {
                classItem.subjects.forEach((subject, index) => {
                    console.log(`  ${index+1}. ${subject.name} (${subject.type}) - Faculty: ${subject.faculty ? subject.faculty.name : 'None'}`);
                });
            }
        }

        console.log('\nClass subjects update completed successfully');
    } catch (error) {
        console.error('Error updating class subjects:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

updateClassSubjects();
