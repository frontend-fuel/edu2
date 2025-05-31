class AuthHandler {
    constructor() {
        this.currentUser = null;
        this.loginForm = document.getElementById('login-form');
        this.logoutButton = document.getElementById('logout');
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.loginForm.addEventListener('submit', this.handleLogin.bind(this));
        this.logoutButton.addEventListener('click', this.handleLogout.bind(this));
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        try {
            this.showLoading('Logging in...');
            const user = await api.login(email, password, role);
            this.currentUser = user;
            this.hideLoading();
            this.onLoginSuccess();
        } catch (error) {
            this.hideLoading();
            this.showError(error.message);
        }
    }

    handleLogout(event) {
        event.preventDefault();
        
        api.clearToken();
        this.currentUser = null;
        this.onLogoutSuccess();
    }

    async checkAuthStatus() {
        const token = localStorage.getItem('token');
        if (!token) {
            return false;
        }

        try {
            this.showLoading('Checking authentication...');
            const user = await api.getCurrentUser();
            this.currentUser = user;
            this.hideLoading();
            return true;
        } catch (error) {
            this.hideLoading();
            return false;
        }
    }

    showLoading(message) {
        const spinner = document.createElement('div');
        spinner.className = 'spinner-overlay';
        spinner.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <span class="loading-text">${message}</span>
        `;
        document.body.appendChild(spinner);
    }

    hideLoading() {
        const spinner = document.querySelector('.spinner-overlay');
        if (spinner) {
            spinner.remove();
        }
    }

    showError(message) {
        // You can implement a better error notification system
        alert(message);
    }

    onLoginSuccess() {
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('dashboard').classList.add('active');
        dashboardHandler.initializeDashboard(this.currentUser);
    }

    onLogoutSuccess() {
        document.getElementById('dashboard').classList.remove('active');
        document.getElementById('intro-page').classList.add('active');
        this.loginForm.reset();
    }
}

const authHandler = new AuthHandler();
