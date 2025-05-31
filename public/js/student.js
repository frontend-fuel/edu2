// DOM Elements
const dashboardPage = document.getElementById('dashboard-page');
const viewAttendancePage = document.getElementById('view-attendance-page');
const viewTimetablePage = document.getElementById('view-timetable-page');

const totalSubjects = document.getElementById('total-subjects');
const overallAttendance = document.getElementById('overall-attendance');
const classesToday = document.getElementById('classes-today');
const recentActivities = document.getElementById('recent-activities');
const attendanceChart = document.getElementById('attendance-chart');
const attendanceRecords = document.getElementById('attendance-records');
const timetableGrid = document.getElementById('timetable-grid');

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
    } else if (pageId === 'view-attendance') {
        loadAttendanceRecords();
    } else if (pageId === 'view-timetable') {
        loadTimetable();
    }
}

// Load Dashboard Stats
async function loadDashboardStats() {
    try {
        const stats = await api.getStudentStats();
        
        // Update stats cards
        totalSubjects.textContent = stats.totalSubjects;
        overallAttendance.textContent = `${stats.overallAttendance}%`;
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
                label: 'Attendance %',
                data: stats.map(s => s.percentage),
                backgroundColor: stats.map(s => s.percentage >= 75 ? 'rgba(75, 192, 192, 0.5)' : 'rgba(255, 99, 132, 0.5)'),
                borderColor: stats.map(s => s.percentage >= 75 ? 'rgb(75, 192, 192)' : 'rgb(255, 99, 132)'),
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

// Load Attendance Records
async function loadAttendanceRecords() {
    try {
        const records = await api.getStudentAttendance();
        attendanceRecords.innerHTML = records.map(record => `
            <tr>
                <td>${record.subject}</td>
                <td>${record.attended}</td>
                <td>${record.total}</td>
                <td>${record.percentage}%</td>
                <td>
                    <span class="badge ${record.percentage >= 75 ? 'bg-success' : 'bg-danger'}">
                        ${record.percentage >= 75 ? 'Good' : 'Low'}
                    </span>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading attendance records:', error);
    }
}

// Load Timetable
async function loadTimetable() {
    try {
        const timetable = await api.getStudentTimetable();
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
            <td>
                <span class="badge ${activity.status === 'Present' ? 'bg-success' : 'bg-danger'}">
                    ${activity.status}
                </span>
            </td>
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
