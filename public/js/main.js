document.addEventListener('DOMContentLoaded', async () => {
    // Handle "Get Started" button
    document.getElementById('get-started').addEventListener('click', () => {
        document.getElementById('intro-page').classList.remove('active');
        document.getElementById('login-page').classList.add('active');
    });

    // Check if user is already logged in
    const isAuthenticated = await authHandler.checkAuthStatus();
    if (isAuthenticated) {
        document.getElementById('intro-page').classList.remove('active');
        document.getElementById('dashboard').classList.add('active');
        dashboardHandler.initializeDashboard(authHandler.currentUser);
    }
});

// Handle page transitions
window.addEventListener('popstate', () => {
    const currentPage = document.querySelector('.page.active');
    if (currentPage) {
        currentPage.classList.remove('active');
    }
    document.getElementById('intro-page').classList.add('active');
});

// Global error handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (event.reason.message === 'Please authenticate.') {
        authHandler.handleLogout(new Event('click'));
    }
});
