class AdminDashboard {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.departmentStatsChart = null;
        this.loadInitialPage();
    }

    initializeElements() {
        // Pages
        this.pages = {
            dashboard: document.getElementById('dashboard-page'),
            addHod: document.getElementById('add-hod-page'),
            addFaculty: document.getElementById('add-faculty-page'),
            viewStaff: document.getElementById('view-staff-page')
        };

        // Forms
        this.forms = {
            addHod: document.getElementById('add-hod-form'),
            addFaculty: document.getElementById('add-faculty-form')
        };

        // Stats Elements
        this.stats = {
            totalHods: document.getElementById('total-hods'),
            totalFaculty: document.getElementById('total-faculty'),
            totalStudents: document.getElementById('total-students'),
            departmentStats: document.getElementById('department-stats')
        };

        // Other Elements
        this.staffList = document.getElementById('staff-list');
        this.departmentFilter = document.getElementById('department-filter');
        this.logoutButton = document.getElementById('logout');
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.closest('.nav-link').dataset.page;
                if (page) this.showPage(page);
            });
        });

        // Forms
        this.forms.addHod.addEventListener('submit', (e) => this.handleAddHod(e));
        this.forms.addFaculty.addEventListener('submit', (e) => this.handleAddFaculty(e));

        // Department Filter
        this.departmentFilter.addEventListener('change', () => this.loadStaffList());

        // Logout
        this.logoutButton.addEventListener('click', (e) => this.handleLogout(e));
    }

    loadInitialPage() {
        // Check authentication
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        // Load dashboard by default
        this.showPage('dashboard');
    }

    async showPage(pageId) {
        // Hide all pages
        Object.values(this.pages).forEach(page => {
            page.classList.remove('active');
        });

        // Map page IDs to their corresponding elements
        const pageMapping = {
            'dashboard': 'dashboard',
            'add-hod': 'addHod',
            'add-faculty': 'addFaculty',
            'view-staff': 'viewStaff'
        };

        // Show selected page
        const mappedPageId = pageMapping[pageId] || pageId;
        if (this.pages[mappedPageId]) {
            this.pages[mappedPageId].classList.add('active');
        }

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === pageId) {
                link.classList.add('active');
            }
        });

        // Load page data
        switch (pageId) {
            case 'dashboard':
                await this.loadDashboardStats();
                break;
            case 'view-staff':
                await this.loadStaffList();
                break;
        }
    }

    async loadDashboardStats() {
        try {
            const stats = await api.getAdminDashboardStats();
            
            // Update stats cards
            this.stats.totalHods.textContent = stats.hodCount;
            this.stats.totalFaculty.textContent = stats.facultyCount;
            this.stats.totalStudents.textContent = stats.studentCount;

            // Update department filter
            if (stats.departments && stats.departments.length > 0) {
                this.departmentFilter.innerHTML = `
                    <option value="">All Departments</option>
                    ${stats.departments.map(dept => 
                        `<option value="${dept.name}">${dept.name}</option>`
                    ).join('')}
                `;
            }

            // Update chart
            this.updateDepartmentChart(stats);

        } catch (error) {
            this.showError('Failed to load dashboard statistics');
            console.error(error);
        }
    }

    async loadStaffList() {
        try {
            const filters = {};
            if (this.departmentFilter.value) {
                filters.department = this.departmentFilter.value;
            }

            const staff = await api.getStaff(filters);
            this.renderStaffList(staff);

        } catch (error) {
            this.showError('Failed to load staff list');
            console.error(error);
        }
    }

    renderStaffList(staff) {
        this.staffList.innerHTML = staff.map(member => `
            <tr>
                <td>${member.name}</td>
                <td>${member.email}</td>
                <td>${member.role.toUpperCase()}</td>
                <td>${member.department}</td>
                <td>${member.subjects ? member.subjects.join(', ') : '-'}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteStaffMember('${member._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async handleAddHod(event) {
        event.preventDefault();
        await this.handleStaffAddition(event.target, 'hod');
    }

    async handleAddFaculty(event) {
        event.preventDefault();
        await this.handleStaffAddition(event.target, 'faculty');
    }

    async handleStaffAddition(form, role) {
        try {
            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password'),
                department: formData.get('department'),
                role: role
            };

            if (role === 'faculty') {
                data.subjects = formData.get('subjects')
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s);
            }

            const result = role === 'hod' ? 
                await api.addHod(data) : 
                await api.addFaculty(data);

            this.showSuccess(`${role.toUpperCase()} added successfully`);
            form.reset();
            await this.loadDashboardStats();
            this.showPage('viewStaff');

        } catch (error) {
            this.showError(error.message);
            console.error(error);
        }
    }

    async deleteStaffMember(id) {
        if (!confirm('Are you sure you want to delete this staff member?')) return;

        try {
            await api.deleteStaff(id);
            this.showSuccess('Staff member deleted successfully');
            await this.loadDashboardStats();
            await this.loadStaffList();
        } catch (error) {
            this.showError(error.message);
            console.error(error);
        }
    }

    updateDepartmentChart(stats) {
        if (this.departmentStatsChart) {
            this.departmentStatsChart.destroy();
        }

        const ctx = this.stats.departmentStats.getContext('2d');
        this.departmentStatsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['HODs', 'Faculty', 'Students'],
                datasets: [{
                    label: 'Count',
                    data: [stats.hodCount, stats.facultyCount, stats.studentCount],
                    backgroundColor: [
                        'rgba(67, 97, 238, 0.6)',
                        'rgba(72, 149, 239, 0.6)',
                        'rgba(76, 201, 240, 0.6)'
                    ],
                    borderColor: [
                        'rgb(67, 97, 238)',
                        'rgb(72, 149, 239)',
                        'rgb(76, 201, 240)'
                    ],
                    borderWidth: 2,
                    borderRadius: 6,
                    maxBarThickness: 80
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 20,
                        bottom: 20,
                        left: 20,
                        right: 20
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            stepSize: 1,
                            font: {
                                family: "'Poppins', sans-serif",
                                size: 12
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                family: "'Poppins', sans-serif",
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: {
                            family: "'Poppins', sans-serif",
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            family: "'Poppins', sans-serif",
                            size: 13
                        },
                        padding: 12,
                        cornerRadius: 8
                    }
                }
            }
        });
    }

    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'toast align-items-center text-white bg-danger border-0';
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        this.showToast(toast);
    }

    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'toast align-items-center text-white bg-success border-0';
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        this.showToast(toast);
    }

    showToast(toast) {
        const container = document.getElementById('toast-container') || (() => {
            const div = document.createElement('div');
            div.id = 'toast-container';
            div.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(div);
            return div;
        })();

        container.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    handleLogout(event) {
        event.preventDefault();
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    }
}

// Initialize the dashboard
const adminDashboard = new AdminDashboard();
