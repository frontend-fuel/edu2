const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Class = require('../models/Class');
require('dotenv').config();

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
        console.log('Starting API tests...');
        
        // Get a HOD user
        const hodUser = await User.findOne({ role: 'hod' });
        if (!hodUser) {
            console.error('No HOD user found in the database!');
            process.exit(1);
        }
        
        console.log('Found HOD user:', {
            id: hodUser._id,
            name: hodUser.name,
            email: hodUser.email,
            department: hodUser.department,
            role: hodUser.role
        });
        
        // Create a JWT token
        const token = jwt.sign(
            { id: hodUser._id }, 
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );
        
        console.log('Generated test token (for use in browser console):', token);
        
        // Find classes in the database for this HOD
        const classes = await Class.find({ department: hodUser.department });
        console.log(`Found ${classes.length} classes for department ${hodUser.department}`);
        
        // Find all classes in the database (for comparison)
        const allClasses = await Class.find({});
        console.log(`Found ${allClasses.length} total classes in database`);
        
        // Display all departments in the database
        const departments = [...new Set(allClasses.map(c => c.department))];
        console.log('All departments in database:', departments);
        
        // Check if there's a case sensitivity issue
        if (hodUser.department) {
            const caseInsensitiveClasses = allClasses.filter(c => 
                c.department.toLowerCase() === hodUser.department.toLowerCase()
            );
            
            console.log(`Found ${caseInsensitiveClasses.length} classes with case-insensitive match for department "${hodUser.department}"`);
            
            if (caseInsensitiveClasses.length > 0) {
                console.log('Classes with case-insensitive match:', caseInsensitiveClasses.map(c => ({
                    id: c._id,
                    year: c.year,
                    department: c.department,
                    section: c.section
                })));
            }
        }
        
        console.log('Tests completed successfully');
    } catch (error) {
        console.error('Error during tests:', error);
    } finally {
        // Close the database connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}
