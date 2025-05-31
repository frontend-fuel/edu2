const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const User = require('../models/User');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');
const { auth, authorize } = require('../middleware/auth');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Add Class
router.post('/add-class', auth, authorize(['hod']), async (req, res) => {
    try {
        console.log('POST /add-class request received:', req.body);
        
        const { year, section } = req.body;
        
        // Validate input
        if (!year || !section) {
            console.log('Validation failed: Missing required fields');
            return res.status(400).json({ error: 'Please provide year and section' });
        }
        
        // Use HOD's department from profile
        const hodDepartment = req.user.department;
        if (!hodDepartment) {
            console.log('Error: HOD has no department set in profile');
            return res.status(400).json({ error: 'Your profile does not have a department set. Please contact the administrator.' });
        }
        
        // Get existing classes to determine correct case for department
        const existingClasses = await Class.find({});
        const existingDepartments = existingClasses.map(c => c.department);
        
        // Find existing department with same case-insensitive value as HOD department
        const matchingDept = existingDepartments.find(
            d => d.toLowerCase() === hodDepartment.toLowerCase()
        );
        
        // Use existing case if found, otherwise use HOD's department as-is
        const departmentToUse = matchingDept || hodDepartment;
        console.log(`Using department: ${departmentToUse} (original: ${hodDepartment})`);
        
        // Check if class already exists (case-insensitive check)
        const existingClass = await Class.findOne({
            year, 
            section,
            department: { $regex: new RegExp(`^${hodDepartment}$`, 'i') }
        });
        
        if (existingClass) {
            console.log('Class already exists');
            return res.status(400).json({ error: 'Class already exists' });
        }
        
        // Create new class
        const newClass = new Class({
            year,
            department: departmentToUse, // Use consistent department case
            section,
            createdBy: req.user._id
        });
        
        await newClass.save();
        console.log('New class created:', newClass);
        
        res.status(201).json(newClass);
    } catch (error) {
        console.error('Error creating class:', error);
        res.status(500).json({ error: 'Server error' });
        if (error.name === 'ValidationError') {
            // Mongoose validation error
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                error: 'Validation Error', 
                details: errors.join(', ') 
            });
        }
        res.status(500).json({ 
            error: 'Server error',
            message: error.message || 'Unknown server error'
        });
    }
});

// Get All Classes
router.get('/classes', auth, authorize(['hod']), async (req, res) => {
    try {
        const userDepartment = req.user.department;
        
        if (!userDepartment) {
            return res.status(400).json({ error: 'User department not set' });
        }
        
        console.log(`Fetching classes for department: ${userDepartment}`);
        
        // Create case-insensitive query for department
        const departmentRegex = new RegExp(`^${userDepartment}$`, 'i');
        
        // Get classes for the HOD's department using case-insensitive regex query
        const classes = await Class.find({ department: { $regex: departmentRegex } })
            .populate('createdBy', 'name')
            .sort({ year: 1, section: 1 });
        
        console.log(`Found ${classes.length} classes for department ${userDepartment}`);
        
        // Get the student counts for each class
        const User = require('../models/User');
        const classesWithCounts = await Promise.all(classes.map(async (classItem) => {
            const studentCount = await User.countDocuments({
                role: 'student',
                year: classItem.year,
                department: { $regex: new RegExp(`^${classItem.department}$`, 'i') },
                section: classItem.section
            });
            
            // Convert mongoose document to plain object to add a property
            const classObj = classItem.toObject();
            classObj.studentCount = studentCount;
            
            // Log the counts
            console.log(`Class ${classItem.year} - ${classItem.department} - Section ${classItem.section}: ${classItem.subjects ? classItem.subjects.length : 0} subjects, ${studentCount} students`);
            
            return classObj;
        }));
        
        res.json(classesWithCounts);
    } catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get a specific class by ID
router.get('/classes/:id', auth, authorize(['hod']), async (req, res) => {
    try {
        const classId = req.params.id;
        const userDepartment = req.user.department;
        
        console.log(`Fetching class with ID: ${classId} for HOD of ${userDepartment}`);
        
        // Find the class by ID (with proper error handling)
        if (!mongoose.Types.ObjectId.isValid(classId)) {
            console.log(`Invalid class ID format: ${classId}`);
            return res.status(400).json({ error: 'Invalid class ID format' });
        }
        
        // Find the class by ID with proper population for all required relationships
        const classDetails = await Class.findById(classId)
            .populate('createdBy', 'name')
            .populate({
                path: 'subjects',
                populate: {
                    path: 'faculty',
                    select: 'name email' // Only select name and email from faculty
                }
            });
            
        if (!classDetails) {
            console.log(`Class with ID ${classId} not found`);
            return res.status(404).json({ error: 'Class not found' });
        }
        
        // Case-insensitive check to ensure this HOD has access to this class
        if (classDetails.department.toLowerCase() !== userDepartment.toLowerCase()) {
            console.log(`Department mismatch: class department is ${classDetails.department}, HOD department is ${userDepartment}`);
            return res.status(403).json({ error: 'You do not have permission to access this class' });
        }
        
        // Count students for this class
        const User = require('../models/User');
        const studentCount = await User.countDocuments({
            role: 'student',
            year: classDetails.year,
            department: { $regex: new RegExp(`^${classDetails.department}$`, 'i') },
            section: classDetails.section
        });
        
        // Add the student count to the response
        const responseData = classDetails.toJSON();
        responseData.studentCount = studentCount;
        
        console.log(`Class details for ${classId} retrieved successfully with ${responseData.subjects ? responseData.subjects.length : 0} subjects and ${studentCount} students`);
        res.json(responseData);
    } catch (error) {
        console.error(`Error fetching class ${req.params.id}:`, error.message);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Simple subject addition endpoint
router.post('/add-subject', auth, authorize(['hod']), async (req, res) => {
    try {
        console.log('Add subject request received:', req.body);
        const { name, code, type, department } = req.body;
        
        // Validate required fields
        if (!name) {
            return res.status(400).json({ error: 'Subject name is required' });
        }
        
        // Use the HOD's department if not specified
        const subjectDepartment = department || req.user.department;
        if (!subjectDepartment) {
            return res.status(400).json({ error: 'Department is required' });
        }
        
        // Generate code if not provided, with fallback for missing name
        const subjectCode = code || (name ? name.substring(0, 4).toUpperCase() : 'SUBJ' + Math.floor(Math.random() * 1000));
        
        // Create and save the subject
        const Subject = require('../models/Subject');
        const newSubject = new Subject({
            name: name,
            code: subjectCode,
            type: type || 'Theory',
            department: subjectDepartment,
            createdBy: req.user._id
        });
        
        const savedSubject = await newSubject.save();
        console.log('Subject added successfully:', savedSubject);
        
        return res.status(201).json(savedSubject);
    } catch (error) {
        console.error('Error adding subject:', error);
        return res.status(500).json({ error: error.message || 'Server error' });
    }
});

// Get all subjects for the HOD's department
router.get('/subjects', auth, authorize(['hod']), async (req, res) => {
    try {
        const userDepartment = req.user.department;
        
        if (!userDepartment) {
            return res.status(400).json({ error: 'User department not set' });
        }
        
        // Find all subjects for this department (case-insensitive)
        const subjects = await Subject.find({
            department: { $regex: new RegExp(`^${userDepartment}$`, 'i') }
        }).populate('createdBy', 'name');
        
        res.json(subjects);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Original subjects endpoint (keeping for compatibility)
router.post('/subjects', auth, authorize(['hod']), async (req, res) => {
    try {
        const { name, code, type, department } = req.body;
        
        console.log('Subject creation request received:', req.body);
        
        // Validate required fields
        if (!name || !code) {
            console.log('Validation failed: Missing name or code');
            return res.status(400).json({ error: 'Subject name and code are required' });
        }
        
        // Get HOD's department if not provided
        const subjectDepartment = department || req.user.department;
        if (!subjectDepartment) {
            console.log('Validation failed: No department provided and HOD has no department');
            return res.status(400).json({ error: 'Department is required' });
        }
        
        // Use the Subject model - we know it exists because we've modified it
        const Subject = require('../models/Subject');
        
        // Check if subject already exists
        const existingSubject = await Subject.findOne({ 
            code: code,
            department: { $regex: new RegExp(`^${subjectDepartment}$`, 'i') } 
        });
        
        if (existingSubject) {
            console.log('Subject already exists:', existingSubject);
            return res.status(400).json({ error: 'Subject with this code already exists for this department' });
        }
        
        // Create new subject
        const subject = new Subject({
            name: name,
            code: code,
            type: type || 'Theory',
            department: subjectDepartment,
            createdBy: req.user._id
        });
        
        const savedSubject = await subject.save();
        console.log('Subject created successfully:', savedSubject);
        
        res.status(201).json(savedSubject);
    } catch (error) {
        console.error('Error creating subject:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Add Subject to Class
router.post('/classes/:classId/subjects', auth, authorize(['hod']), async (req, res) => {
    console.log('------------------------------');
    console.log('Adding subject to class...');
    console.log('Request body:', req.body);
    console.log('Class ID:', req.params.classId);
    try {
        let { name, code, type, facultyId } = req.body;
        const classId = req.params.classId;
        
        // Validate inputs
        if (!name || name.trim() === '' || name === 'Unnamed Subject') {
            return res.status(400).json({ error: 'Please provide a valid subject name' });
        }
        
        if (!code || code.trim() === '' || code === 'SUBJ') {
            return res.status(400).json({ error: 'Please provide a valid subject code' });
        }
        
        if (!type || !['Theory', 'Lab'].includes(type)) {
            return res.status(400).json({ error: 'Subject type must be either "Theory" or "Lab"' });
        }
        
        if (!facultyId || !mongoose.Types.ObjectId.isValid(facultyId)) {
            return res.status(400).json({ error: 'Please select a valid faculty member' });
        }

        // Format inputs
        name = name.trim();
        code = code.trim().toUpperCase(); // Standardize subject codes as uppercase
        
        const targetClass = await Class.findById(classId);
        if (!targetClass) {
            return res.status(404).json({ error: 'Class not found' });
        }

        // Check if subject already exists
        if (targetClass.subjects.some(s => 
            s.name.toLowerCase() === name.toLowerCase() || 
            (code && s.code.toLowerCase() === code.toLowerCase()))) {
            return res.status(400).json({ error: 'Subject already exists in this class' });
        }

        console.log('Adding subject to class:', {
            name,
            code,
            type,
            faculty: facultyId
        });
        
        // Add subject
        targetClass.subjects.push({
            name,
            code,
            type,
            faculty: facultyId
        });

        console.log('Saving class with new subject...');
        await targetClass.save();
        console.log('Class saved. Total subjects now:', targetClass.subjects.length);
        
        // Verify subject was added by retrieving from DB again
        const updatedClass = await Class.findById(classId).populate({
            path: 'subjects.faculty',
            select: 'name email'
        });
        
        console.log('Subjects in class after save:', updatedClass.subjects.length);
        console.log('Last added subject:', updatedClass.subjects[updatedClass.subjects.length - 1]);
        
        res.json({ message: 'Subject added successfully', class: updatedClass });
    } catch (error) {
        console.error('Error adding subject:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Edit Subject
router.put('/classes/:classId/subjects/:subjectId', auth, authorize(['hod']), async (req, res) => {
    try {
        console.log('------------------------------');
        console.log('Editing subject in class...');
        console.log('Request body:', req.body);
        console.log('Class ID:', req.params.classId);
        console.log('Subject ID:', req.params.subjectId);
        
        let { name, code, type, facultyId } = req.body;
        const { classId, subjectId } = req.params;
        
        // Validate inputs
        if (!name || name.trim() === '' || name === 'Unnamed Subject') {
            return res.status(400).json({ error: 'Please provide a valid subject name' });
        }
        
        if (!code || code.trim() === '' || code === 'SUBJ') {
            return res.status(400).json({ error: 'Please provide a valid subject code' });
        }
        
        if (!type || !['Theory', 'Lab'].includes(type)) {
            return res.status(400).json({ error: 'Subject type must be either "Theory" or "Lab"' });
        }
        
        if (!facultyId || !mongoose.Types.ObjectId.isValid(facultyId)) {
            return res.status(400).json({ error: 'Please select a valid faculty member' });
        }

        // Format inputs
        name = name.trim();
        code = code.trim().toUpperCase(); // Standardize subject codes as uppercase
        
        // Find class and update subject
        const targetClass = await Class.findById(classId);
        if (!targetClass) {
            return res.status(404).json({ error: 'Class not found' });
        }
        
        // Find the subject in the class
        const subjectIndex = targetClass.subjects.findIndex(s => s._id.toString() === subjectId);
        if (subjectIndex === -1) {
            return res.status(404).json({ error: 'Subject not found in this class' });
        }
        
        // Check if updated subject would conflict with another
        const hasConflict = targetClass.subjects.some((s, index) => {
            // Skip checking against itself
            if (index === subjectIndex) return false;
            
            // Check for name or code conflict
            return s.name.toLowerCase() === name.toLowerCase() || 
                   s.code.toLowerCase() === code.toLowerCase();
        });
        
        if (hasConflict) {
            return res.status(400).json({ error: 'Another subject with this name or code already exists' });
        }
        
        // Update the subject
        targetClass.subjects[subjectIndex] = {
            ...targetClass.subjects[subjectIndex].toObject(),
            name,
            code,
            type,
            faculty: facultyId
        };
        
        console.log('Saving class with updated subject...');
        await targetClass.save();
        
        // Get updated class with populated data
        const updatedClass = await Class.findById(classId).populate({
            path: 'subjects.faculty',
            select: 'name email'
        });
        
        console.log('Subject updated successfully');
        res.json({ message: 'Subject updated successfully', class: updatedClass });
        
    } catch (error) {
        console.error('Error editing subject:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete Subject
router.delete('/classes/:classId/subjects/:subjectId', auth, authorize(['hod']), async (req, res) => {
    try {
        console.log('------------------------------');
        console.log('Deleting subject from class...');
        console.log('Class ID:', req.params.classId);
        console.log('Subject ID:', req.params.subjectId);
        
        const { classId, subjectId } = req.params;
        
        // Find the class
        const targetClass = await Class.findById(classId);
        if (!targetClass) {
            return res.status(404).json({ error: 'Class not found' });
        }
        
        // Check if the subject exists
        const subjectIndex = targetClass.subjects.findIndex(s => s._id.toString() === subjectId);
        if (subjectIndex === -1) {
            return res.status(404).json({ error: 'Subject not found in this class' });
        }
        
        // Remove the subject
        console.log('Removing subject from class...');
        targetClass.subjects.splice(subjectIndex, 1);
        
        console.log('Saving class...');
        await targetClass.save();
        
        console.log('Subject deleted successfully');
        res.json({ message: 'Subject deleted successfully', class: targetClass });
        
    } catch (error) {
        console.error('Error deleting subject:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Upload Students
router.post('/classes/:classId/upload-students', auth, authorize(['hod']), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const classId = req.params.classId;
        const targetClass = await Class.findById(classId);
        if (!targetClass) {
            return res.status(404).json({ error: 'Class not found' });
        }

        const results = [];
        const errors = [];

        // Read CSV file
        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', async (data) => {
                try {
                    // Check if student already exists
                    const existingStudent = await User.findOne({
                        $or: [{ email: data.email }, { rollNumber: data.rollNumber }]
                    });

                    if (existingStudent) {
                        errors.push(`Student ${data.name} (${data.rollNumber}) already exists`);
                        return;
                    }

                    // Create student
                    const hashedPassword = await bcrypt.hash(data.rollNumber, 10);
                    const student = new User({
                        name: data.name,
                        email: data.email,
                        password: hashedPassword,
                        role: 'student',
                        rollNumber: data.rollNumber,
                        year: targetClass.year,
                        section: targetClass.section,
                        department: targetClass.department,
                        createdAt: new Date()
                    });

                    await student.save();
                    results.push(`Student ${data.name} added successfully`);
                } catch (error) {
                    errors.push(`Error adding student ${data.name}: ${error.message}`);
                }
            })
            .on('end', () => {
                // Delete uploaded file
                fs.unlinkSync(req.file.path);
                res.json({
                    message: 'File processed',
                    successes: results,
                    errors: errors
                });
            });
    } catch (error) {
        console.error('Error uploading students:', error);
        // Clean up file if exists
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Department Stats
router.get('/stats', auth, authorize(['hod']), async (req, res) => {
    try {
        // Get logged in HOD's department
        const hod = await User.findById(req.user._id).select('department');
        if (!hod) {
            return res.status(404).json({ error: 'HOD not found' });
        }

        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get basic counts
        // Create case-insensitive query for department
        const departmentRegex = new RegExp(`^${hod.department}$`, 'i');
        
        const [facultyCount, studentCount, subjectCount, classesToday] = await Promise.all([
            User.countDocuments({ role: 'faculty', department: { $regex: departmentRegex } }),
            User.countDocuments({ role: 'student', department: { $regex: departmentRegex } }),
            Subject.countDocuments({ department: { $regex: departmentRegex } }),
            Timetable.countDocuments({
                department: { $regex: departmentRegex },
                date: { $gte: today, $lt: tomorrow }
            })
        ]);
        
        console.log('Stats retrieved:', { facultyCount, studentCount, subjectCount, classesToday });

        // Return stats
        res.json({
            facultyCount,
            studentCount,
            subjectCount,
            classesToday,
            attendanceStats: [],
            recentActivities: []
        });
    } catch (error) {
        console.error('Error getting department stats:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add Student
router.post('/add-student', auth, authorize(['hod']), async (req, res) => {
    try {
        const { name, email, rollNumber, year, section } = req.body;

        // Get HOD's department
        const hod = await User.findById(req.user._id);
        if (!hod) {
            return res.status(404).json({ error: 'HOD not found' });
        }

        // Check for duplicate email, roll number, or same class student
        const existingStudent = await User.findOne({
            $or: [
                { email },
                { rollNumber },
                {
                    role: 'student',
                    department: hod.department,
                    year,
                    section,
                    rollNumber
                }
            ]
        });

        if (existingStudent) {
            let errorMessage = '';
            if (existingStudent.email === email) {
                errorMessage = 'Student with this email already exists';
            } else if (existingStudent.rollNumber === rollNumber) {
                errorMessage = 'Student with this roll number already exists';
            } else {
                errorMessage = 'Student with this roll number already exists in the same class';
            }
            return res.status(400).json({ error: errorMessage });
        }

        // Check if another student exists in same class with same roll number pattern
        const sameClassStudent = await User.findOne({
            role: 'student',
            department: hod.department,
            year,
            section,
            rollNumber: { $regex: rollNumber.slice(0, -2) } // Check roll number pattern excluding last 2 digits
        });

        if (sameClassStudent) {
            return res.status(400).json({
                error: 'Another student with similar roll number exists in the same class'
            });
        }

        // Use roll number as password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rollNumber, salt);

        // Create student
        const student = new User({
            name,
            email,
            password: hashedPassword,
            role: 'student',
            rollNumber,
            year,
            section,
            department: hod.department,
            createdAt: new Date()
        });

        await student.save();

        res.json({ 
            message: 'Student added successfully',
            note: 'Student can login using their roll number as password'
        });
    } catch (error) {
        console.error('Error adding student:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// View Faculty
router.get('/faculty', auth, authorize(['hod']), async (req, res) => {
    try {
        const faculty = await User.find({ role: 'faculty' })
            .select('-password')
            .sort({ createdAt: -1 });
        res.json(faculty);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Add Subjects
router.post('/add-subjects', auth, authorize(['hod']), async (req, res) => {
    try {
        const { year, department, section, subjects } = req.body;

        // Validate input
        if (!year || !department || !section || !subjects || !Array.isArray(subjects)) {
            return res.status(400).json({ error: 'Invalid input' });
        }

        // Process each subject
        const subjectDocs = [];
        for (const subject of subjects) {
            const { name, code, type } = subject;
            if (!name || !type || !['Theory', 'Lab'].includes(type)) {
                return res.status(400).json({ error: 'Invalid subject data' });
            }

            // Check if subject already exists
            const existingSubject = await Subject.findOne({
                name,
                year,
                department,
                section
            });

            if (!existingSubject) {
                subjectDocs.push({
                    name,
                    code: code || '',
                    type,
                    year,
                    department,
                    section,
                    addedBy: req.user._id
                });
            }
        }

        if (subjectDocs.length > 0) {
            await Subject.insertMany(subjectDocs);
        }

        res.json({ message: 'Subjects added successfully' });
    } catch (error) {
        console.error('Error adding subjects:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add Timetable
router.post('/add-timetable', auth, authorize(['hod']), async (req, res) => {
    try {
        const { year, department, section, weekSchedule } = req.body;

        // Validate input
        if (!year || !department || !section || !weekSchedule || !Array.isArray(weekSchedule)) {
            return res.status(400).json({ error: 'Invalid input' });
        }

        // Validate each slot in week schedule
        for (const slot of weekSchedule) {
            const { day, startTime, endTime, subjectId, facultyId } = slot;
            if (!day || !startTime || !endTime || !subjectId || !facultyId) {
                return res.status(400).json({ error: 'Invalid slot data' });
            }
        }

        // Generate dates for next 4 weeks
        const currentDate = new Date();
        const weeks = [];
        for (let i = 0; i < 4; i++) {
            const weekStart = new Date(currentDate);
            weekStart.setDate(currentDate.getDate() + (i * 7));
            
            // Generate timetable entries for each day in the week
            const weekTimetable = weekSchedule.map(slot => {
                const slotDate = new Date(weekStart);
                const dayDiff = getDayDifference(weekStart.getDay(), slot.day);
                slotDate.setDate(weekStart.getDate() + dayDiff);

                return {
                    date: slotDate,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    subject: slot.subjectId,
                    faculty: slot.facultyId,
                    year,
                    department,
                    section,
                    createdBy: req.user._id
                };
            });
            weeks.push(...weekTimetable);
        }

        // Save all timetable entries
        await Timetable.insertMany(weeks);

        res.json({ message: 'Timetable created successfully for 4 weeks' });
    } catch (error) {
        console.error('Error creating timetable:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Helper function to get day difference
function getDayDifference(startDay, targetDay) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetIndex = days.indexOf(targetDay.toLowerCase());
    let diff = targetIndex - startDay;
    if (diff < 0) diff += 7;
    return diff;
}

// Add Subject (standalone)
router.post('/add-subject', auth, authorize(['hod']), async (req, res) => {
    try {
        const { name, code, type, department } = req.body;
        
        // Input validation
        if (!name) {
            return res.status(400).json({ error: 'Subject name is required' });
        }

        // Use provided department or default to HOD's department
        const subjectDepartment = department || req.user.department;
        
        // Generate a code if not provided
        const subjectCode = code || 
            (name ? name.substring(0, 4).toUpperCase() : 'SUBJ');
        
        // Create new subject
        const newSubject = new Subject({
            name,
            code: subjectCode,
            type: type || 'Theory',
            department: subjectDepartment,
            createdBy: req.user._id
        });

        // Save to database
        const savedSubject = await newSubject.save();
        
        console.log('New subject created:', savedSubject);
        res.status(201).json(savedSubject);
        
    } catch (error) {
        console.error('Error creating subject:', error);
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ 
                error: 'A subject with this name or code already exists',
                details: error.message 
            });
        }
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                error: 'Validation Error',
                details: errors.join(', ') 
            });
        }
        
        // General error
        res.status(500).json({ 
            error: 'Server error',
            message: error.message || 'Failed to create subject' 
        });
    }
});

// Get Subjects
router.get('/subjects', auth, authorize(['hod']), async (req, res) => {
    try {
        const { year, department, section } = req.query;
        const subjects = await Subject.find({ year, department, section })
            .sort({ name: 1 });
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Add Students
router.post('/add-students', auth, authorize(['hod']), async (req, res) => {
    try {
        const { year, department, section, students } = req.body;

        if (!Array.isArray(students)) {
            return res.status(400).json({ error: 'Invalid students data' });
        }

        const createdStudents = [];
        const errors = [];

        for (const studentData of students) {
            try {
                const { name, rollNumber, email } = studentData;

                // Check if student already exists
                const existingStudent = await User.findOne({ 
                    $or: [
                        { email, role: 'student' },
                        { rollNumber, role: 'student' }
                    ]
                });

                if (existingStudent) {
                    errors.push(`Student with email ${email} or roll number ${rollNumber} already exists`);
                    continue;
                }

                // Generate random password
                const password = Math.random().toString(36).slice(-8);
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                // Create student
                const student = new User({
                    name,
                    email,
                    password: hashedPassword,
                    role: 'student',
                    rollNumber,
                    year,
                    department,
                    section,
                    createdAt: new Date()
                });

                await student.save();
                
                // Add to created students list without password
                const studentInfo = student.toObject();
                delete studentInfo.password;
                createdStudents.push({
                    ...studentInfo,
                    temporaryPassword: password
                });
            } catch (error) {
                console.error('Error creating student:', error);
                errors.push(`Error creating student ${studentData.email}: ${error.message}`);
            }
        }

        res.json({ 
            message: `Created ${createdStudents.length} students successfully`,
            data: createdStudents,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Add Subjects
router.post('/add-subjects', auth, authorize(['hod']), async (req, res) => {
    try {
        const { year, department, section, subjects } = req.body;

        const subjectDocs = subjects.map(subject => ({
            ...subject,
            year,
            department,
            section,
            createdBy: req.user._id
        }));

        await Subject.insertMany(subjectDocs);
        res.json({ message: 'Subjects added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Add Timetable
router.post('/add-timetable', auth, authorize(['hod']), async (req, res) => {
    try {
        const { year, department, section, slots, weekStartDate } = req.body;

        // Create timetable for current week
        const timetable = new Timetable({
            year,
            department,
            section,
            weekStartDate,
            slots,
            createdBy: req.user._id
        });

        await timetable.save();

        // Auto-generate next 4 weeks
        const nextWeeks = [];
        for (let i = 1; i <= 4; i++) {
            const nextWeekDate = new Date(weekStartDate);
            nextWeekDate.setDate(nextWeekDate.getDate() + (i * 7));
            
            nextWeeks.push({
                year,
                department,
                section,
                weekStartDate: nextWeekDate,
                slots,
                createdBy: req.user._id
            });
        }

        await Timetable.insertMany(nextWeeks);
        res.json({ message: 'Timetable created successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// View Student Attendance
router.get('/student-attendance', auth, authorize(['hod']), async (req, res) => {
    try {
        const { year, department, section } = req.query;

        const students = await User.find({
            role: 'student',
            year,
            department,
            section
        }).select('-password');

        const subjects = await Subject.find({
            year,
            department,
            section
        });

        const attendance = await Attendance.find({
            year,
            department,
            section
        });

        // Calculate attendance percentage for each student
        const studentAttendance = students.map(student => {
            const subjectWiseAttendance = subjects.map(subject => {
                const totalClasses = attendance.filter(a => 
                    a.subject.toString() === subject._id.toString() &&
                    a.student.toString() === student._id.toString()
                ).length;

                const presentClasses = attendance.filter(a => 
                    a.subject.toString() === subject._id.toString() &&
                    a.student.toString() === student._id.toString() &&
                    a.status === 'present'
                ).length;

                const percentage = totalClasses ? (presentClasses / totalClasses) * 100 : 0;

                return {
                    subject: subject.name,
                    percentage: Math.round(percentage)
                };
            });

            return {
                student: {
                    name: student.name,
                    rollNumber: student.rollNumber
                },
                attendance: subjectWiseAttendance
            };
        });

        res.json(studentAttendance);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
