const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const { auth, authorize } = require('../middleware/auth');

// View Overall Attendance
router.get('/attendance', auth, authorize(['student']), async (req, res) => {
    try {
        const subjects = await Subject.find({
            year: req.user.year,
            department: req.user.department,
            section: req.user.section
        });

        const attendance = await Attendance.find({
            student: req.user._id
        });

        const subjectWiseAttendance = subjects.map(subject => {
            const totalClasses = attendance.filter(a => 
                a.subject.toString() === subject._id.toString()
            ).length;

            const presentClasses = attendance.filter(a => 
                a.subject.toString() === subject._id.toString() &&
                a.status === 'present'
            ).length;

            const percentage = totalClasses ? (presentClasses / totalClasses) * 100 : 0;

            return {
                subject: subject.name,
                totalClasses,
                presentClasses,
                percentage: Math.round(percentage)
            };
        });

        res.json(subjectWiseAttendance);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// View Marks
router.get('/marks', auth, authorize(['student']), async (req, res) => {
    try {
        const marks = await Marks.find({
            student: req.user._id
        }).populate('subject', 'name');

        // Group by subject
        const subjectWiseMarks = marks.reduce((acc, curr) => {
            if (!acc[curr.subject._id]) {
                acc[curr.subject._id] = {
                    subject: curr.subject.name,
                    exams: []
                };
            }

            acc[curr.subject._id].exams.push({
                type: curr.examType,
                marks: curr.marks,
                maxMarks: curr.maxMarks,
                percentage: Math.round((curr.marks / curr.maxMarks) * 100)
            });

            return acc;
        }, {});

        res.json(Object.values(subjectWiseMarks));
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// View Timetable
router.get('/timetable', auth, authorize(['student']), async (req, res) => {
    try {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const timetable = await Timetable.findOne({
            year: req.user.year,
            department: req.user.department,
            section: req.user.section,
            weekStartDate: {
                $lte: today,
                $gte: startOfWeek
            }
        }).populate('slots.subject slots.faculty', 'name');

        if (!timetable) {
            return res.json({ message: 'No timetable found for this week' });
        }

        res.json(timetable);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
