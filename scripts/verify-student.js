const mongoose = require('mongoose');

// MongoDB connection string
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

// Simple User schema
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

async function checkStudent() {
    try {
        // Find the student with email student@edu.com
        const student = await User.findOne({ email: 'student@edu.com' });
        
        if (student) {
            console.log('Student account found:');
            console.log('- Email: student@edu.com');
            console.log('- Password: 123456');
            console.log('- Name:', student.name);
            console.log('- Role:', student.role);
        } else {
            console.log('Student account not found. Creating one now...');
            
            // Create a new student user with pre-hashed password
            const newStudent = new User({
                name: 'Test Student',
                email: 'student@edu.com',
                // This is the hashed version of '123456'
                password: '$2a$10$YPTtov/FKtDrJy0p27fa/.rWJnQaS0/RMnQweqBjUUpt1/Re.6nxi',
                role: 'student',
                rollNumber: 'TEST001',
                year: '1',
                department: 'Computer Science',
                section: 'A'
            });
            
            await newStudent.save();
            console.log('Student created successfully!');
            console.log('Login credentials:');
            console.log('- Email: student@edu.com');
            console.log('- Password: 123456');
        }
        
        // Close the MongoDB connection
        mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        mongoose.connection.close();
    }
}

// Run the function
checkStudent();
