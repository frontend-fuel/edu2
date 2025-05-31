const mongoose = require('mongoose');
const Class = require('../models/Class');

// Connect to MongoDB Atlas - using proper connection string format
const MONGODB_URI = 'mongodb+srv://edu2:edu2@cluster0.ixai6mt.mongodb.net/edusquare?retryWrites=true&w=majority&appName=Cluster0';

// Attempt to connect to MongoDB Atlas only (no local fallback)
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 30000, // Increased timeout to 30 seconds
    socketTimeoutMS: 45000, // Socket timeout
    family: 4 // Force IPv4
}).then(() => {
    console.log('MongoDB Atlas Connected Successfully');
    runTests();
}).catch(err => {
    console.error('MongoDB Connection Error:', err);
    console.log('Please ensure your IP address is whitelisted in MongoDB Atlas settings');
    console.log('Go to: https://cloud.mongodb.com → Security → Network Access → Add IP Address');
    process.exit(1);
});

async function runTests() {
    try {
        console.log('Starting database tests...');
        
        // Check if classes collection exists and count documents
        const classCount = await Class.countDocuments();
        console.log(`Found ${classCount} classes in database`);
        
        // Create a test class
        const testClass = new Class({
            year: '1st',
            department: 'TEST',
            section: 'Z',
            createdBy: new mongoose.Types.ObjectId()  // Generate a random ObjectId
        });
        
        // Save the test class
        const savedClass = await testClass.save();
        console.log('Test class created successfully:', savedClass);
        
        // Find all classes
        const allClasses = await Class.find({});
        console.log('All classes in database:', allClasses.map(c => ({
            id: c._id,
            year: c.year,
            department: c.department,
            section: c.section
        })));
        
        console.log('Tests completed successfully');
    } catch (error) {
        console.error('Error during tests:', error);
    } finally {
        // Close the database connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}
