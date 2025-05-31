const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

// Add HOD
router.post('/add-hod', auth, authorize(['admin']), async (req, res) => {
    try {
        const { name, email, password, department } = req.body;

        // Validate input
        if (!name || !email || !password || !department) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if HOD already exists
        let hod = await User.findOne({ $or: [{ email }, { department, role: 'hod' }] });
        if (hod) {
            return res.status(400).json({ 
                error: hod.email === email ? 'Email already exists' : 'Department already has an HOD' 
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create HOD
        hod = new User({
            name,
            email,
            password: hashedPassword,
            role: 'hod',
            department,
            createdAt: new Date()
        });

        await hod.save();
        
        // Return HOD data without password
        const hodData = hod.toObject();
        delete hodData.password;
        res.json({ message: 'HOD created successfully', data: hodData });

    } catch (error) {
        console.error('Error adding HOD:', error);
        res.status(500).json({ error: 'Failed to add HOD' });
    }
});

// Add Faculty
router.post('/add-faculty', auth, authorize(['admin']), async (req, res) => {
    try {
        const { name, email, password, department, subjects } = req.body;

        // Validate input
        if (!name || !email || !password || !department || !subjects) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if faculty already exists
        let faculty = await User.findOne({ email });
        if (faculty) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create faculty
        faculty = new User({
            name,
            email,
            password: hashedPassword,
            role: 'faculty',
            department,
            subjects,
            createdAt: new Date()
        });

        await faculty.save();

        // Return faculty data without password
        const facultyData = faculty.toObject();
        delete facultyData.password;
        res.json({ message: 'Faculty created successfully', data: facultyData });

    } catch (error) {
        console.error('Error adding faculty:', error);
        res.status(500).json({ error: 'Failed to add faculty' });
    }
});

// Get Staff List
router.get('/staff', auth, authorize(['admin']), async (req, res) => {
    try {
        const { department, role } = req.query;
        const query = { role: { $in: ['hod', 'faculty'] } };
        
        if (department) query.department = department;
        if (role) query.role = role;

        const staff = await User.find(query)
            .select('-password')
            .sort({ role: 1, name: 1 })
            .lean();
            
        res.json(staff);
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({ error: 'Failed to fetch staff list' });
    }
});

// Delete Staff Member
router.delete('/staff/:id', auth, authorize(['admin']), async (req, res) => {
    try {
        const staff = await User.findById(req.params.id);
        
        if (!staff) {
            return res.status(404).json({ error: 'Staff member not found' });
        }

        if (staff.role === 'admin') {
            return res.status(403).json({ error: 'Cannot delete admin users' });
        }

        await staff.remove();
        res.json({ message: 'Staff member deleted successfully' });

    } catch (error) {
        console.error('Error deleting staff:', error);
        res.status(500).json({ error: 'Failed to delete staff member' });
    }
});

// Get Department Stats
router.get('/stats', auth, authorize(['admin']), async (req, res) => {
    try {
        // Get counts for each role
        const hodCount = await User.countDocuments({ role: 'hod' });
        const facultyCount = await User.countDocuments({ role: 'faculty' });
        const studentCount = await User.countDocuments({ role: 'student' });

        // Get department-wise stats
        const departments = await User.aggregate([
            {
                $group: {
                    _id: '$department',
                    hodCount: {
                        $sum: { $cond: [{ $eq: ['$role', 'hod'] }, 1, 0] }
                    },
                    facultyCount: {
                        $sum: { $cond: [{ $eq: ['$role', 'faculty'] }, 1, 0] }
                    },
                    studentCount: {
                        $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: '$_id',
                    hodCount: 1,
                    facultyCount: 1,
                    studentCount: 1
                }
            }
        ]);

        // Get recent activities
        const recentActivities = await User.find()
            .select('name role department createdAt')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        res.json({
            hodCount,
            facultyCount,
            studentCount,
            departments,
            recentActivities
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

module.exports = router;
