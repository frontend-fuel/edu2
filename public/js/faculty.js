// DOM Elements
const dashboardPage = document.getElementById('dashboard-page');
const takeAttendancePage = document.getElementById('take-attendance-page');
const viewAttendancePage = document.getElementById('view-attendance-page');
const viewTimetablePage = document.getElementById('view-timetable-page');

const attendanceForm = document.getElementById('attendance-form');
const studentsList = document.getElementById('students-list');
const attendanceRecords = document.getElementById('attendance-records');
const timetableGrid = document.getElementById('timetable-grid');

const totalStudents = document.getElementById('total-students');
const totalSubjects = document.getElementById('total-subjects');
const classesToday = document.getElementById('classes-today');
const recentActivities = document.getElementById('recent-activities');
const attendanceChart = document.getElementById('attendance-chart');

let attendanceStatsChart = null;

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = e.target.closest('.nav-link').dataset.page;
        showPage(page);
    });
});

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    document.getElementById(`${pageId}-page`).classList.add('active');

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageId) {
            link.classList.add('active');
        }
    });

    // Load page-specific data
    if (pageId === 'dashboard') {
        loadDashboardStats();
    } else if (pageId === 'view-timetable') {
        loadTimetable();
    }
}

// Load Dashboard Stats
async function loadDashboardStats() {
    try {
        const stats = await api.getFacultyStats();
        
        // Update stats cards
        totalStudents.textContent = stats.totalStudents;
        totalSubjects.textContent = stats.totalSubjects;
        classesToday.textContent = stats.classesToday;

        // Update attendance chart
        updateAttendanceChart(stats.attendanceStats);

        // Update recent activities
        updateRecentActivities(stats.recentActivities);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Update Attendance Chart
function updateAttendanceChart(stats) {
    const ctx = attendanceChart.getContext('2d');
    
    if (attendanceStatsChart) {
        attendanceStatsChart.destroy();
    }

    attendanceStatsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: stats.map(s => s.subject),
            datasets: [{
                label: 'Average Attendance %',
                data: stats.map(s => s.percentage),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Load Students for Attendance
async function loadStudentsForAttendance() {
    const year = document.getElementById('attendance-year').value;
    const department = document.getElementById('attendance-department').value;
    const section = document.getElementById('attendance-section').value;
    const subject = document.getElementById('attendance-subject').value;

    if (!year || !department || !section || !subject) {
        return;
    }

    try {
        const students = await api.getStudentsForAttendance({ year, department, section });
        studentsList.innerHTML = students.map(student => `
            <tr>
                <td>${student.rollNumber}</td>
                <td>${student.name}</td>
                <td>
                    <select class="form-select" name="attendance[${student._id}]" required>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                    </select>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

// Load Faculty's Subjects
async function loadFacultySubjects(selectId) {
    try {
        const subjects = await api.getFacultySubjects();
        document.getElementById(selectId).innerHTML = `
            <option value="">Select Subject</option>
            ${subjects.map(subject => `
                <option value="${subject._id}">${subject.name}</option>
            `).join('')}
        `;
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

// Attendance Form Handlers
['attendance-year', 'attendance-department', 'attendance-section', 'attendance-subject'].forEach(id => {
    document.getElementById(id).addEventListener('change', loadStudentsForAttendance);
});

// Submit Attendance Form
attendanceForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const year = document.getElementById('attendance-year').value;
    const department = document.getElementById('attendance-department').value;
    const section = document.getElementById('attendance-section').value;
    const subject = document.getElementById('attendance-subject').value;

    const formData = new FormData(attendanceForm);
    const attendance = {};
    for (const [key, value] of formData.entries()) {
        if (key.startsWith('attendance[')) {
            const studentId = key.match(/\\[(.*?)\\]/)[1];
            attendance[studentId] = value;
        }
    }

    try {
        await api.submitAttendance({
            year,
            department,
            section,
            subject,
            attendance,
            date: new Date().toISOString()
        });
        alert('Attendance submitted successfully');
        showPage('dashboard');
    } catch (error) {
        alert(error.message || 'Error submitting attendance');
        console.error('Error:', error);
    }
});

// View Attendance Handlers
['view-year', 'view-department', 'view-section', 'view-subject'].forEach(id => {
    document.getElementById(id).addEventListener('change', loadAttendanceRecords);
});

// Load Attendance Records
async function loadAttendanceRecords() {
    const year = document.getElementById('view-year').value;
    const department = document.getElementById('view-department').value;
    const section = document.getElementById('view-section').value;
    const subject = document.getElementById('view-subject').value;

    if (!year || !department || !section || !subject) {
        return;
    }

    try {
        const records = await api.getAttendanceRecords({ year, department, section, subject });
        attendanceRecords.innerHTML = records.map(record => `
            <tr>
                <td>${record.rollNumber}</td>
                <td>${record.name}</td>
                <td>${record.attended}</td>
                <td>${record.total}</td>
                <td>${((record.attended / record.total) * 100).toFixed(2)}%</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading attendance records:', error);
    }
}

// Load Timetable
async function loadTimetable() {
    try {
        const timetable = await api.getFacultyTimetable();
        timetableGrid.innerHTML = timetable.slots.map(slot => `
            <tr>
                <td>${slot.time}</td>
                ${slot.subjects.map(subject => `
                    <td>${subject || '-'}</td>
                `).join('')}
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading timetable:', error);
    }
}

// Update Recent Activities
function updateRecentActivities(activities) {
    recentActivities.innerHTML = activities.map(activity => `
        <tr>
            <td>${new Date(activity.date).toLocaleDateString()}</td>
            <td>${activity.subject}</td>
            <td>${activity.action}</td>
        </tr>
    `).join('');
}

// Logout Handler
document.getElementById('logout').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    window.location.href = '/login.html';
});

// Initial load
loadDashboardStats();
loadFacultySubjects('attendance-subject');
loadFacultySubjects('view-subject');
