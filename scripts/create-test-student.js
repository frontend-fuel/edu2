const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Connect to MongoDB with the same connection string as in server.js
mongoose.connect('mongodb+srv://edu2:edu2@cluster0.ixai6mt.mongodb.net/edusquare?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000
})
.then(() => console.log('MongoDB connected...'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

async function createTestStudent() {
    try {
        // Check if student already exists
        const existingUser = await User.findOne({ email: 'student@edu.com' });
        
        if (existingUser) {
            console.log('Student with email student@edu.com already exists');
            process.exit(0);
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);
        
        // Create student
        const student = new User({
            name: 'Test Student',
            email: 'student@edu.com',
            password: hashedPassword,
            role: 'student',
            rollNumber: 'TEST001',
            year: '1',
            department: 'Computer Science',
            section: 'A'
        });
        
        await student.save();
        console.log('Test student created successfully:');
        console.log('- Email: student@edu.com');
        console.log('- Password: 123456');
        console.log('- Role: student');
        
        process.exit(0);
    } catch (error) {
        console.error('Error creating test student:', error);
        process.exit(1);
    }
}

createTestStudent();
