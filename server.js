const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// MongoDB connection options
const MONGODB_OPTIONS = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000
};

// Try to connect to MongoDB using a combined approach
function connectToMongoDB() {
    // Use environment variable if available (for Vercel), otherwise use hardcoded string
    const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://edu2:edu2@cluster0.ixai6mt.mongodb.net/edusquare?retryWrites=true&w=majority';
    
    mongoose.connect(MONGO_URI, MONGODB_OPTIONS)
        .then(() => {
            console.log('Connected to MongoDB Atlas successfully!');
        })
        .catch(err => {
            console.error('Failed to connect to MongoDB Atlas:', err.message);
            console.log('Please ensure your IP is whitelisted in MongoDB Atlas');
        });
}

// Connect to MongoDB
connectToMongoDB();

// Middleware for all routes
app.use(cors());
app.use(express.json());

// Request logger to help with debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// API Routes - these need to be defined BEFORE the static and catch-all routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/owner', require('./routes/owner'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/hod', require('./routes/hod'));
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/student', require('./routes/student'));

// Error handler for API routes
app.use('/api', (err, req, res, next) => {
    console.error('API Error:', err);
    res.status(500).json({
        error: 'Server error',
        message: err.message || 'An unexpected error occurred'
    });
});

// Serve static files after API routes
app.use(express.static(path.join(__dirname, 'public')));

// Serve the index.html for all routes that don't match API routes
// This allows client-side routing to work properly
app.get('*', (req, res, next) => {
    // Skip API routes and static files
    if (req.path.startsWith('/api/') || 
        req.path.startsWith('/static/') || 
        req.path.includes('.')) {
        return next();
    }
    
    // For all other routes, serve the index.html
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server if not in a serverless environment (like Vercel)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Access the application at: http://localhost:${PORT}`);
    });
}

// Export the Express app for serverless environments (Vercel)
module.exports = app;
