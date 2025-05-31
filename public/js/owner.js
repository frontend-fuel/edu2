// DOM Elements
const dashboardPage = document.getElementById('dashboard-page');
const addAdminPage = document.getElementById('add-admin-page');
const viewAdminsPage = document.getElementById('view-admins-page');
const addAdminForm = document.getElementById('add-admin-form');
const adminsList = document.getElementById('admins-list');
const totalAdmins = document.getElementById('total-admins');
const totalHods = document.getElementById('total-hods');
const totalFaculty = document.getElementById('total-faculty');
const totalStudents = document.getElementById('total-students');
const recentActivities = document.getElementById('recent-activities');

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
    } else if (pageId === 'view-admins') {
        loadAdmins();
    }
}

// Add Admin Form Handler
addAdminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(addAdminForm);
    const adminData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        department: formData.get('department')
    };

    try {
        await api.addAdmin(adminData);
        alert('Admin added successfully');
        addAdminForm.reset();
        showPage('view-admins');
    } catch (error) {
        alert(error.message || 'Error adding admin');
        console.error('Error:', error);
    }
});

// Load Dashboard Stats
async function loadDashboardStats() {
    try {
        const stats = await api.getAdminStats();
        
        if (stats.length === 0) {
            console.log('No admin stats returned');
            return;
        }
        
        // Get the total counts from the first admin stats object
        // These totals are the same in each admin's stats
        const firstAdminStats = stats[0].stats;
        const totalHodCount = firstAdminStats.totalHodCount || 0;
        const totalFacultyCount = firstAdminStats.totalFacultyCount || 0;
        const totalStudentCount = firstAdminStats.totalStudentCount || 0;
        
        // Display total counts
        totalAdmins.textContent = stats.length;
        totalHods.textContent = totalHodCount;
        totalFaculty.textContent = totalFacultyCount;
        totalStudents.textContent = totalStudentCount;
        
        // Log the total counts to console for reference
        console.log('System Statistics:');
        console.log('Total Admins:', stats.length);
        console.log('Total HODs:', totalHodCount);
        console.log('Total Faculty:', totalFacultyCount);
        console.log('Total Students:', totalStudentCount);

        // Update recent activities
        updateRecentActivities(stats);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load Admins List
async function loadAdmins() {
    try {
        const admins = await api.getAllAdmins();
        adminsList.innerHTML = admins.map(admin => `
            <tr>
                <td>${admin.name}</td>
                <td>${admin.email}</td>
                <td>${admin.department}</td>
                <td>${new Date(admin.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="removeAdmin('${admin._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading admins:', error);
    }
}

// Remove Admin - Make it globally accessible by attaching to window
window.removeAdmin = async function(adminId) {
    if (!confirm('Are you sure you want to remove this admin?')) {
        return;
    }

    try {
        await api.removeAdmin(adminId);
        alert('Admin removed successfully');
        loadAdmins();
        loadDashboardStats();
    } catch (error) {
        alert(error.message || 'Error removing admin');
        console.error('Error:', error);
    }
}

// Update Recent Activities
function updateRecentActivities(stats) {
    const activities = stats.map(stat => ({
        date: new Date().toLocaleDateString(),
        admin: stat.admin.name,
        department: stat.admin.department
    }));

    recentActivities.innerHTML = activities.map(activity => `
        <tr>
            <td>${activity.date}</td>
            <td>${activity.admin}</td>
            <td>${activity.department}</td>
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
