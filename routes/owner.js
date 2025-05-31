const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

// Add Admin
router.post('/add-admin', auth, authorize(['owner']), async (req, res) => {
    try {
        const { name, email, password, department } = req.body;

        // Check if admin already exists
        let admin = await User.findOne({ email, role: 'admin' });
        if (admin) {
            return res.status(400).json({ error: 'Admin already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create admin
        admin = new User({
            name,
            email,
            password: hashedPassword,
            role: 'admin',
            department
        });

        await admin.save();
        res.json({ message: 'Admin created successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Admin Stats
router.get('/admin-stats', auth, authorize(['owner']), async (req, res) => {
    try {
        // Get counts by department for each admin
        const admins = await User.find({ role: 'admin' });
        const stats = [];

        // Get total counts across all departments
        const totalHodCount = await User.countDocuments({ role: 'hod' });
        const totalFacultyCount = await User.countDocuments({ role: 'faculty' });
        const totalStudentCount = await User.countDocuments({ role: 'student' });
        
        console.log('Total counts:', {
            admins: admins.length,
            hods: totalHodCount,
            faculty: totalFacultyCount,
            students: totalStudentCount
        });

        for (let admin of admins) {
            // Get counts for this admin's department
            const hodCount = await User.countDocuments({ 
                role: 'hod', 
                department: admin.department 
            });
            
            const facultyCount = await User.countDocuments({ 
                role: 'faculty', 
                department: admin.department 
            });
            
            const studentCount = await User.countDocuments({ 
                role: 'student', 
                department: admin.department 
            });

            stats.push({
                admin: {
                    id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    department: admin.department
                },
                stats: {
                    hodCount,
                    facultyCount,
                    studentCount,
                    // Include total counts in each admin's stats
                    totalHodCount,
                    totalFacultyCount,
                    totalStudentCount
                }
            });
        }

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get All Admins
router.get('/admins', auth, authorize(['owner']), async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' })
            .select('-password')
            .sort({ createdAt: -1 });
        res.json(admins);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete Admin
router.delete('/admins/:id', auth, authorize(['owner']), async (req, res) => {
    try {
        const admin = await User.findOne({ _id: req.params.id, role: 'admin' });
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        await User.deleteOne({ _id: req.params.id });
        res.json({ message: 'Admin removed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
