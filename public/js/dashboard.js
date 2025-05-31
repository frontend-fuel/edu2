class DashboardHandler {
    constructor() {
        this.currentUser = null;
        this.navItems = document.getElementById('nav-items');
        this.content = document.getElementById('dashboard-content');
    }

    initializeDashboard(user) {
        this.currentUser = user;
        this.setupNavigation();
        this.loadDefaultContent();
    }

    setupNavigation() {
        this.navItems.innerHTML = '';
        const navLinks = this.getNavigationLinks();
        
        navLinks.forEach(link => {
            const li = document.createElement('li');
            li.className = 'nav-item';
            li.innerHTML = `
                <a class="nav-link" href="#" data-page="${link.id}">
                    <i class="fas ${link.icon}"></i> ${link.text}
                </a>
            `;
            li.querySelector('a').addEventListener('click', () => this.loadContent(link.id));
            this.navItems.appendChild(li);
        });
    }

    getNavigationLinks() {
        const links = {
            owner: [
                { id: 'add-admin', text: 'Add Admin', icon: 'fa-user-plus' },
                { id: 'admin-stats', text: 'Admin Stats', icon: 'fa-chart-bar' },
                { id: 'view-admins', text: 'View Admins', icon: 'fa-users' }
            ],
            admin: [
                { id: 'add-hod', text: 'Add HOD', icon: 'fa-user-plus' },
                { id: 'add-faculty', text: 'Add Faculty', icon: 'fa-chalkboard-teacher' },
                { id: 'view-staff', text: 'View Staff', icon: 'fa-users' },
                { id: 'admin-dashboard', text: 'Dashboard', icon: 'fa-tachometer-alt' }
            ],
            hod: [
                { id: 'view-faculty', text: 'View Faculty', icon: 'fa-chalkboard-teacher' },
                { id: 'add-students', text: 'Add Students', icon: 'fa-user-plus' },
                { id: 'add-subjects', text: 'Add Subjects', icon: 'fa-book' },
                { id: 'add-timetable', text: 'Add Timetable', icon: 'fa-calendar-alt' },
                { id: 'view-attendance', text: 'View Attendance', icon: 'fa-clipboard-check' }
            ],
            faculty: [
                { id: 'mark-attendance', text: 'Mark Attendance', icon: 'fa-clipboard-check' },
                { id: 'add-marks', text: 'Add Marks', icon: 'fa-pen' },
                { id: 'view-timetable', text: 'View Timetable', icon: 'fa-calendar-alt' },
                { id: 'download-reports', text: 'Download Reports', icon: 'fa-download' }
            ],
            student: [
                { id: 'view-my-attendance', text: 'My Attendance', icon: 'fa-clipboard-check' },
                { id: 'view-my-marks', text: 'My Marks', icon: 'fa-graduation-cap' },
                { id: 'view-my-timetable', text: 'My Timetable', icon: 'fa-calendar-alt' }
            ]
        };

        return links[this.currentUser.role] || [];
    }

    loadDefaultContent() {
        const defaultPages = {
            owner: 'admin-stats',
            admin: 'admin-dashboard',
            hod: 'view-faculty',
            faculty: 'view-timetable',
            student: 'view-my-attendance'
        };

        const defaultPage = defaultPages[this.currentUser.role];
        if (defaultPage) {
            this.loadContent(defaultPage);
        }
    }

    async loadContent(pageId) {
        this.content.innerHTML = '';
        this.showLoading();

        try {
            switch (pageId) {
                // Owner pages
                case 'add-admin':
                    await this.loadAddAdminPage();
                    break;
                case 'admin-stats':
                    await this.loadAdminStatsPage();
                    break;
                case 'view-admins':
                    await this.loadViewAdminsPage();
                    break;

                // Admin pages
                case 'add-hod':
                    await this.loadAddHodPage();
                    break;
                case 'add-faculty':
                    await this.loadAddFacultyPage();
                    break;
                case 'view-staff':
                    await this.loadViewStaffPage();
                    break;
                case 'admin-dashboard':
                    await this.loadAdminDashboardPage();
                    break;

                // HOD pages
                case 'view-faculty':
                    await this.loadViewFacultyPage();
                    break;
                case 'add-students':
                    await this.loadAddStudentsPage();
                    break;
                case 'add-subjects':
                    await this.loadAddSubjectsPage();
                    break;
                case 'add-timetable':
                    await this.loadAddTimetablePage();
                    break;
                case 'view-attendance':
                    await this.loadViewAttendancePage();
                    break;

                // Faculty pages
                case 'mark-attendance':
                    await this.loadMarkAttendancePage();
                    break;
                case 'add-marks':
                    await this.loadAddMarksPage();
                    break;
                case 'view-timetable':
                    await this.loadViewTimetablePage();
                    break;
                case 'download-reports':
                    await this.loadDownloadReportsPage();
                    break;

                // Student pages
                case 'view-my-attendance':
                    await this.loadMyAttendancePage();
                    break;
                case 'view-my-marks':
                    await this.loadMyMarksPage();
                    break;
                case 'view-my-timetable':
                    await this.loadMyTimetablePage();
                    break;
            }
        } catch (error) {
            this.showError(error.message);
        }

        this.hideLoading();
    }

    // Page loading methods
    async loadAddAdminPage() {
        this.content.innerHTML = `
            <div class="dashboard-card">
                <h2 class="mb-4">Add New Admin</h2>
                <form id="add-admin-form">
                    <div class="mb-3">
                        <input type="text" class="form-control" name="name" placeholder="Name" required>
                    </div>
                    <div class="mb-3">
                        <input type="email" class="form-control" name="email" placeholder="Email" required>
                    </div>
                    <div class="mb-3">
                        <input type="password" class="form-control" name="password" placeholder="Password" required>
                    </div>
                    <div class="mb-3">
                        <input type="text" class="form-control" name="department" placeholder="Department" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Add Admin</button>
                </form>
            </div>
        `;

        document.getElementById('add-admin-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            try {
                await api.addAdmin(Object.fromEntries(formData));
                this.showSuccess('Admin added successfully');
                e.target.reset();
            } catch (error) {
                this.showError(error.message);
            }
        });
    }

    // Add other page loading methods here...

    showLoading() {
        const spinner = document.createElement('div');
        spinner.className = 'spinner-border text-primary';
        spinner.setAttribute('role', 'status');
        spinner.innerHTML = '<span class="visually-hidden">Loading...</span>';
        this.content.appendChild(spinner);
    }

    hideLoading() {
        const spinner = this.content.querySelector('.spinner-border');
        if (spinner) {
            spinner.remove();
        }
    }

    showError(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        this.content.insertBefore(alert, this.content.firstChild);
    }

    showSuccess(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success alert-dismissible fade show';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        this.content.insertBefore(alert, this.content.firstChild);
    }
}

const dashboardHandler = new DashboardHandler();
