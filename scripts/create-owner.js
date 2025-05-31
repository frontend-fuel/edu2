const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
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

async function createOwner() {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGODB_ATLAS_URI, MONGODB_OPTIONS);
        console.log('Connected to MongoDB Atlas');

        // Drop the users collection if it exists
        try {
            await mongoose.connection.db.dropCollection('users');
            console.log('Dropped existing users collection');
        } catch (err) {
            console.log('No existing users collection to drop');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        // Create owner
        const owner = new User({
            name: 'System Owner',
            email: 'sasiedu@gmail.com',
            password: hashedPassword,
            role: 'owner'
        });

        await owner.save();
        console.log('Owner account created successfully');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

createOwner();
