const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection string (hardcoded for simplicity)
const MONGO_URI = 'mongodb+srv://edu2:edu2@cluster0.ixai6mt.mongodb.net/edusquare?retryWrites=true&w=majority';

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected...'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Define a simple User schema for this script
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String,
    rollNumber: String,
    year: String,
    department: String,
    section: String
});

const User = mongoose.model('User', UserSchema);

async function createStudent() {
    try {
        // Hash the password (123456)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);
        
        // Create a new student user
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
        
        // Save the student to the database
        await student.save();
        console.log('Student created successfully!');
        console.log('Login credentials:');
        console.log('Email: student@edu.com');
        console.log('Password: 123456');
        
        // Close the MongoDB connection
        mongoose.connection.close();
    } catch (error) {
        console.error('Error creating student:', error);
        mongoose.connection.close();
    }
}

// Run the function
createStudent();
