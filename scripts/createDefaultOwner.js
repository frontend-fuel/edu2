const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/edusquare', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB Connected');
    createDefaultOwner();
}).catch(err => {
    console.error('MongoDB Connection Error:', err);
});

async function createDefaultOwner() {
    try {
        // Check if owner already exists
        const existingOwner = await User.findOne({ role: 'owner' });
        
        if (existingOwner) {
            console.log('Owner account already exists');
            process.exit(0);
        }

        // Create default owner
        const hashedPassword = await bcrypt.hash('123456', 10);
        const owner = new User({
            name: 'System Owner',
            email: 'owner@edusquare.com',
            password: hashedPassword,
            role: 'owner'
        });

        await owner.save();
        console.log('Default owner account created successfully');
        console.log('Email: owner@edusquare.com');
        console.log('Password: 123456');
        process.exit(0);
    } catch (error) {
        console.error('Error creating default owner:', error);
        process.exit(1);
    }
}
