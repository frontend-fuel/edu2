const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect('mongodb+srv://edu2:edu2@cluster0.ixai6mt.mongodb.net/edusquare?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('MongoDB connected...');
    createStudent();
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

async function createStudent() {
    try {
        // Check if student already exists
        const existingUser = await User.findOne({ email: 'student@edu.com' });
        
        if (existingUser) {
            console.log('Student account already exists:');
            console.log('Email: student@edu.com');
            console.log('Password: 123456');
            mongoose.connection.close();
            return;
        }
        
        // Create new student with pre-hashed password for '123456'
        const student = new User({
            name: 'Test Student',
            email: 'student@edu.com',
            password: '$2a$10$YPTtov/FKtDrJy0p27fa/.rWJnQaS0/RMnQweqBjUUpt1/Re.6nxi', // 123456 hashed
            role: 'student',
            rollNumber: 'TEST001',
            year: '1',
            department: 'Computer Science',
            section: 'A'
        });
        
        await student.save();
        console.log('Student account created successfully:');
        console.log('Email: student@edu.com');
        console.log('Password: 123456');
        
        mongoose.connection.close();
    } catch (error) {
        console.error('Error creating student:', error);
        mongoose.connection.close();
        process.exit(1);
    }
}
