class LoginHandler {
    constructor() {
        // Initialize form elements
        this.form = document.getElementById('login-form');
        this.email = document.getElementById('email');
        this.password = document.getElementById('password');
        this.role = document.getElementById('role');
        this.rememberMe = document.getElementById('remember-me');
        this.loginButton = document.getElementById('login-button');
        this.errorMessage = document.getElementById('error-message');
        this.togglePasswordBtn = document.getElementById('toggle-password');

        // Bind methods
        this.handleSubmit = this.handleSubmit.bind(this);
        this.togglePasswordVisibility = this.togglePasswordVisibility.bind(this);
        this.validateForm = this.validateForm.bind(this);

        // Setup event listeners
        this.setupEventListeners();

        // Load saved credentials if any
        this.loadSavedCredentials();

        // Check if user is already logged in
        this.checkAuthStatus();
    }

    setupEventListeners() {
        this.form.addEventListener('submit', this.handleSubmit);
        this.togglePasswordBtn.addEventListener('click', this.togglePasswordVisibility);
        this.email.addEventListener('input', this.validateForm);
        this.password.addEventListener('input', this.validateForm);
        this.role.addEventListener('change', this.validateForm);
    }

    validateForm() {
        const isValid = this.email.value && this.password.value && this.role.value;
        this.loginButton.disabled = !isValid;
    }

    togglePasswordVisibility() {
        const isPassword = this.password.type === 'password';
        this.password.type = isPassword ? 'text' : 'password';
        this.togglePasswordBtn.innerHTML = `<i class="fas fa-${isPassword ? 'eye-slash' : 'eye'}"></i>`;
    }

    showLoading(show) {
        this.loginButton.classList.toggle('loading', show);
        this.loginButton.disabled = show;
        this.email.disabled = show;
        this.password.disabled = show;
        this.role.disabled = show;
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        setTimeout(() => {
            this.errorMessage.style.display = 'none';
        }, 5000);
    }

    loadSavedCredentials() {
        const email = localStorage.getItem('userEmail');
        const role = localStorage.getItem('userRole');

        if (email && role) {
            this.email.value = email;
            this.role.value = role;
            this.rememberMe.checked = true;
            this.validateForm();
        }
    }

    saveCredentials() {
        if (this.rememberMe.checked) {
            localStorage.setItem('userEmail', this.email.value);
            localStorage.setItem('userRole', this.role.value);
        } else {
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userRole');
        }
    }

    async checkAuthStatus() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.redirectToDashboard(data.user.role);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('token');
        }
    }

    redirectToDashboard(role) {
        const dashboards = {
            owner: 'pages/owner-dashboard.html',
            admin: 'pages/admin-dashboard.html',
            hod: 'pages/hod-dashboard.html',
            faculty: 'pages/faculty-dashboard.html',
            student: 'pages/student-dashboard.html'
        };

        window.location.href = dashboards[role] || '/';
    }

    async handleSubmit(event) {
        event.preventDefault();

        try {
            this.showLoading(true);
            this.errorMessage.style.display = 'none';

            console.log('Logging in with:', {
                email: this.email.value,
                role: this.role.value,
                passwordLength: this.password.value.length
            });

            // First try with the serverless endpoint
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: this.email.value,
                        password: this.password.value,
                        role: this.role.value
                    })
                });

                // Even if we get a non-OK response, try to read the response body
                let responseText;
                try {
                    responseText = await response.text();
                    console.log('Response status:', response.status);
                    console.log('Response text:', responseText);
                    
                    // Try to parse as JSON if possible
                    let data;
                    try {
                        data = JSON.parse(responseText);
                        
                        if (response.ok) {
                            // Success! Save credentials if remember me is checked
                            this.saveCredentials();
                            
                            // Save token
                            localStorage.setItem('token', data.token);
                            
                            // Redirect to appropriate dashboard
                            this.redirectToDashboard(data.user.role);
                            return;
                        } else {
                            throw new Error(data.error || 'Login failed');
                        }
                    } catch (parseError) {
                        console.error('Error parsing response as JSON:', parseError);
                        throw new Error(`Server error: ${responseText || 'Unknown error'}`); 
                    }
                } catch (textError) {
                    console.error('Could not read response text:', textError);
                    throw new Error('Could not read server response');
                }
            } catch (serverlessError) {
                console.error('Serverless endpoint error:', serverlessError);
                this.showError(serverlessError.message || 'Login failed - please try again');
            }

        } catch (error) {
            this.showError(error.message);
            this.showLoading(false);
        }
    }
}

// Initialize login handler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoginHandler();
});
