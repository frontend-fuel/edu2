const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const { auth, authorize } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const json2csv = require('json2csv').parse;

// Add Attendance
router.post('/add-attendance', auth, authorize(['faculty']), async (req, res) => {
    try {
        const { date, subjectId, attendance, year, department, section } = req.body;

        const attendanceDocs = attendance.map(a => ({
            date,
            subject: subjectId,
            student: a.studentId,
            status: a.status,
            markedBy: req.user._id,
            year,
            department,
            section
        }));

        await Attendance.insertMany(attendanceDocs);
        res.json({ message: 'Attendance marked successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Download Attendance Report
router.get('/download-attendance-report', auth, authorize(['faculty']), async (req, res) => {
    try {
        const { subjectId, year, department, section, format } = req.query;

        // Get subject details
        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        // Get all students in the class
        const students = await User.find({
            role: 'student',
            year,
            department,
            section
        }).sort({ rollNumber: 1 });

        // Get attendance records
        const attendance = await Attendance.find({
            subject: subjectId,
            year,
            department,
            section
        }).populate('student', 'name rollNumber');

        // Calculate attendance statistics
        const attendanceStats = students.map(student => {
            const studentAttendance = attendance.filter(a => 
                a.student._id.toString() === student._id.toString()
            );
            const totalClasses = studentAttendance.length;
            const presentClasses = studentAttendance.filter(a => a.status === 'present').length;
            const percentage = totalClasses ? (presentClasses / totalClasses) * 100 : 0;

            return {
                'Roll Number': student.rollNumber,
                'Student Name': student.name,
                'Total Classes': totalClasses,
                'Classes Attended': presentClasses,
                'Attendance %': Math.round(percentage)
            };
        });

        if (format === 'csv') {
            const csv = json2csv(attendanceStats);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=attendance-${subject.name}.csv`);
            return res.send(csv);
        } else {
            // Generate PDF
            const doc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=attendance-${subject.name}.pdf`);
            doc.pipe(res);

            // Add title
            doc.fontSize(16).text(`Attendance Report - ${subject.name}`, { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Class: ${year} ${department} ${section}`, { align: 'center' });
            doc.moveDown();

            // Add table headers
            const headers = ['Roll No', 'Name', 'Total', 'Attended', '%'];
            let y = doc.y;
            headers.forEach((header, i) => {
                doc.text(header, 50 + (i * 100), y);
            });

            // Add data rows
            attendanceStats.forEach((stat, index) => {
                y = doc.y + 20;
                doc.text(stat['Roll Number'], 50, y);
                doc.text(stat['Student Name'], 150, y);
                doc.text(stat['Total Classes'].toString(), 250, y);
                doc.text(stat['Classes Attended'].toString(), 350, y);
                doc.text(stat['Attendance %'].toString() + '%', 450, y);
            });

            doc.end();
        }
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Download Marks Report
router.get('/download-marks-report', auth, authorize(['faculty']), async (req, res) => {
    try {
        const { subjectId, examType, year, department, section, format } = req.query;

        // Get subject details
        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        // Get marks records
        const marks = await Marks.find({
            subject: subjectId,
            examType,
            year,
            department,
            section
        }).populate('student', 'name rollNumber');

        const marksData = marks.map(mark => ({
            'Roll Number': mark.student.rollNumber,
            'Student Name': mark.student.name,
            'Marks': mark.marks,
            'Max Marks': mark.maxMarks,
            'Percentage': Math.round((mark.marks / mark.maxMarks) * 100)
        }));

        if (format === 'csv') {
            const csv = json2csv(marksData);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=marks-${subject.name}-${examType}.csv`);
            return res.send(csv);
        } else {
            // Generate PDF
            const doc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=marks-${subject.name}-${examType}.pdf`);
            doc.pipe(res);

            // Add title
            doc.fontSize(16).text(`Marks Report - ${subject.name}`, { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Class: ${year} ${department} ${section}`, { align: 'center' });
            doc.fontSize(12).text(`Exam: ${examType}`, { align: 'center' });
            doc.moveDown();

            // Add table headers
            const headers = ['Roll No', 'Name', 'Marks', 'Max Marks', '%'];
            let y = doc.y;
            headers.forEach((header, i) => {
                doc.text(header, 50 + (i * 100), y);
            });

            // Add data rows
            marksData.forEach((data, index) => {
                y = doc.y + 20;
                doc.text(data['Roll Number'], 50, y);
                doc.text(data['Student Name'], 150, y);
                doc.text(data['Marks'].toString(), 250, y);
                doc.text(data['Max Marks'].toString(), 350, y);
                doc.text(data['Percentage'].toString() + '%', 450, y);
            });

            doc.end();
        }
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add Marks
router.post('/add-marks', auth, authorize(['faculty']), async (req, res) => {
    try {
        const { subjectId, examType, marks, year, department, section } = req.body;

        const marksDocs = marks.map(m => ({
            student: m.studentId,
            subject: subjectId,
            examType,
            marks: m.marks,
            maxMarks: m.maxMarks,
            year,
            department,
            section,
            addedBy: req.user._id
        }));

        await Marks.insertMany(marksDocs);
        res.json({ message: 'Marks added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// View Timetable
router.get('/timetable', auth, authorize(['faculty']), async (req, res) => {
    try {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const timetable = await Timetable.findOne({
            weekStartDate: {
                $lte: today,
                $gte: startOfWeek
            },
            'slots.faculty': req.user._id
        }).populate('slots.subject');

        if (!timetable) {
            return res.json({ message: 'No timetable found for this week' });
        }

        res.json(timetable);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Download Reports
router.get('/reports', auth, authorize(['faculty']), async (req, res) => {
    try {
        const { type, subjectId, year, department, section } = req.query;

        if (type === 'attendance') {
            const attendance = await Attendance.find({
                subject: subjectId,
                year,
                department,
                section
            }).populate('student', 'name rollNumber');

            // Group by student
            const report = attendance.reduce((acc, curr) => {
                if (!acc[curr.student._id]) {
                    acc[curr.student._id] = {
                        name: curr.student.name,
                        rollNumber: curr.student.rollNumber,
                        totalClasses: 0,
                        presentClasses: 0
                    };
                }

                acc[curr.student._id].totalClasses++;
                if (curr.status === 'present') {
                    acc[curr.student._id].presentClasses++;
                }

                return acc;
            }, {});

            // Convert to array and calculate percentage
            const reportArray = Object.values(report).map(r => ({
                ...r,
                percentage: Math.round((r.presentClasses / r.totalClasses) * 100)
            }));

            res.json(reportArray);
        } else if (type === 'marks') {
            const marks = await Marks.find({
                subject: subjectId,
                year,
                department,
                section
            }).populate('student', 'name rollNumber');

            // Group by exam type
            const report = marks.reduce((acc, curr) => {
                if (!acc[curr.examType]) {
                    acc[curr.examType] = [];
                }

                acc[curr.examType].push({
                    name: curr.student.name,
                    rollNumber: curr.student.rollNumber,
                    marks: curr.marks,
                    maxMarks: curr.maxMarks,
                    percentage: Math.round((curr.marks / curr.maxMarks) * 100)
                });

                return acc;
            }, {});

            res.json(report);
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
