class ZenPingerApp {
    constructor() {
        this.auth = auth;
        this.currentView = 'login';
        this.monitors = [];
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        
        if (this.auth.isAuthenticated()) {
            this.showDashboard();
        }
    }

    render() {
        const app = document.getElementById('app');
        
        if (!this.auth.isAuthenticated()) {
            app.innerHTML = this.getAuthView();
        } else {
            app.innerHTML = this.getDashboardView();
        }

        this.setupViewEventListeners();
    }

    getAuthView() {
        if (this.currentView === 'login') {
            return `
                <div class="min-h-screen flex">
                    <div class="hidden lg:flex lg:w-1/2 zen-gradient p-12 flex-col justify-between">
                        <!-- Left side branding (same as before) -->
                        ${this.getBrandingSection()}
                    </div>
                    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
                        ${this.getLoginForm()}
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="min-h-screen flex">
                    <div class="hidden lg:flex lg:w-1/2 zen-gradient p-12 flex-col justify-between">
                        <!-- Left side branding (same as before) -->
                        ${this.getBrandingSection()}
                    </div>
                    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
                        ${this.getRegisterForm()}
                    </div>
                </div>
            `;
        }
    }

    getLoginForm() {
        return `
            <div class="w-full max-w-md">
                <div class="lg:hidden flex items-center justify-center space-x-2 mb-8">
                    <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span class="text-white font-bold text-xl">Z</span>
                    </div>
                    <span class="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">ZenPinger</span>
                </div>

                <div class="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                    <h2 class="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
                    <p class="text-gray-600 mb-8">Sign in to access your dashboard</p>

                    <form id="loginForm" class="space-y-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <input type="email" id="loginEmail" required
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                                   placeholder="you@example.com">
                        </div>

                        <div>
                            <div class="flex justify-between items-center mb-2">
                                <label class="block text-sm font-medium text-gray-700">Password</label>
                                <a href="#" class="text-sm text-indigo-600 hover:text-indigo-700">Forgot password?</a>
                            </div>
                            <input type="password" id="loginPassword" required
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                                   placeholder="••••••••">
                        </div>

                        <div class="flex items-center">
                            <input type="checkbox" id="remember" class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                            <label for="remember" class="ml-2 text-sm text-gray-600">Keep me signed in</label>
                        </div>

                        <button type="submit" class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition transform hover:-translate-y-0.5 flex items-center justify-center">
                            <span id="loginBtnText">Sign In</span>
                            <div id="loginSpinner" class="loading-spinner ml-2 hidden"></div>
                        </button>
                    </form>

                    <div class="mt-8 text-center text-sm text-gray-600">
                        Don't have an account? 
                        <a href="#" id="showRegister" class="font-medium text-indigo-600 hover:text-indigo-700">Sign up for free</a>
                    </p>
                </div>
            </div>
        `;
    }

    getRegisterForm() {
        return `
            <div class="w-full max-w-md">
                <div class="lg:hidden flex items-center justify-center space-x-2 mb-8">
                    <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span class="text-white font-bold text-xl">Z</span>
                    </div>
                    <span class="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">ZenPinger</span>
                </div>

                <div class="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                    <h2 class="text-3xl font-bold text-gray-900 mb-2">Create your account</h2>
                    <p class="text-gray-600 mb-8">Start monitoring your websites for free</p>

                    <form id="registerForm" class="space-y-5">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input type="text" id="registerName" required
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                                   placeholder="John Doe">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <input type="email" id="registerEmail" required
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                                   placeholder="you@example.com">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <input type="password" id="registerPassword" required minlength="8"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                                   placeholder="••••••••">
                            <p class="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                            <input type="password" id="registerConfirmPassword" required
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                                   placeholder="••••••••">
                        </div>

                        <div class="flex items-start">
                            <input type="checkbox" id="terms" required class="w-4 h-4 mt-1 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                            <label for="terms" class="ml-2 text-sm text-gray-600">
                                I agree to the <a href="#" class="text-indigo-600 hover:text-indigo-700 font-medium">Terms of Service</a> and <a href="#" class="text-indigo-600 hover:text-indigo-700 font-medium">Privacy Policy</a>
                            </label>
                        </div>

                        <button type="submit" class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition transform hover:-translate-y-0.5 flex items-center justify-center">
                            <span id="registerBtnText">Create Account</span>
                            <div id="registerSpinner" class="loading-spinner ml-2 hidden"></div>
                        </button>
                    </form>

                    <div class="mt-8 text-center text-sm text-gray-600">
                        Already have an account? 
                        <a href="#" id="showLogin" class="font-medium text-indigo-600 hover:text-indigo-700">Sign in</a>
                    </p>
                </div>
            </div>
        `;
    }

    getDashboardView() {
        return `
            <div class="flex h-screen overflow-hidden">
                <!-- Sidebar -->
                <aside id="sidebar" class="sidebar-transition w-64 bg-white border-r border-gray-200 flex flex-col fixed lg:relative h-full z-30 transform -translate-x-full lg:translate-x-0">
                    ${this.getSidebarContent()}
                </aside>

                <!-- Main Content -->
                <div class="flex-1 flex flex-col overflow-hidden">
                    <!-- Top Bar -->
                    <header class="bg-white border-b border-gray-200 px-6 py-4">
                        ${this.getHeaderContent()}
                    </header>

                    <!-- Dashboard Content -->
                    <main class="flex-1 overflow-y-auto p-6">
                        ${this.getDashboardContent()}
                    </main>
                </div>
            </div>

            <!-- Add Monitor Modal -->
            ${this.getAddMonitorModal()}
        `;
    }

    // ... (Include all the dashboard HTML from previous examples, but with dynamic data)

    async showDashboard() {
        await this.loadMonitors();
        this.render();
        this.setupDashboardEventListeners();
    }

    async loadMonitors() {
        try {
            const response = await fetch('/api/monitors', {
                headers: this.auth.getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Failed to load monitors');
            
            this.monitors = await response.json();
        } catch (error) {
            console.error('Error loading monitors:', error);
            this.showNotification('Error loading monitors', 'error');
        }
    }

    async addMonitor(monitorData) {
        try {
            const response = await fetch('/api/monitors', {
                method: 'POST',
                headers: this.auth.getAuthHeaders(),
                body: JSON.stringify(monitorData)
            });

            if (!response.ok) throw new Error('Failed to add monitor');

            const newMonitor = await response.json();
            this.monitors.unshift(newMonitor);
            this.renderMonitorsList();
            this.closeAddMonitorModal();
            this.showNotification('Monitor added successfully!', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    setupEventListeners() {
        // Global event listeners
        document.addEventListener('click', (e) => {
            if (e.target.id === 'showRegister') {
                e.preventDefault();
                this.currentView = 'register';
                this.render();
            } else if (e.target.id === 'showLogin') {
                e.preventDefault();
                this.currentView = 'login';
                this.render();
            }
        });
    }

    setupViewEventListeners() {
        if (this.currentView === 'login') {
            this.setupLoginForm();
        } else if (this.currentView === 'register') {
            this.setupRegisterForm();
        }
    }

    setupLoginForm() {
        const form = document.getElementById('loginForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                const btnText = document.getElementById('loginBtnText');
                const spinner = document.getElementById('loginSpinner');

                btnText.textContent = 'Signing In...';
                spinner.classList.remove('hidden');

                try {
                    await this.auth.login(email, password);
                    this.showDashboard();
                } catch (error) {
                    this.showNotification(error.message, 'error');
                } finally {
                    btnText.textContent = 'Sign In';
                    spinner.classList.add('hidden');
                }
            });
        }
    }

    setupRegisterForm() {
        const form = document.getElementById('registerForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const name = document.getElementById('registerName').value;
                const email = document.getElementById('registerEmail').value;
                const password = document.getElementById('registerPassword').value;
                const confirmPassword = document.getElementById('registerConfirmPassword').value;
                const btnText = document.getElementById('registerBtnText');
                const spinner = document.getElementById('registerSpinner');

                if (password !== confirmPassword) {
                    this.showNotification('Passwords do not match!', 'error');
                    return;
                }

                btnText.textContent = 'Creating Account...';
                spinner.classList.remove('hidden');

                try {
                    await this.auth.register(name, email, password);
                    this.showDashboard();
                } catch (error) {
                    this.showNotification(error.message, 'error');
                } finally {
                    btnText.textContent = 'Create Account';
                    spinner.classList.add('hidden');
                }
            });
        }
    }

    showNotification(message, type = 'info') {
        // Create and show notification
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 fade-in ${
            type === 'error' ? 'bg-red-500 text-white' :
            type === 'success' ? 'bg-green-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // ... (Include all other methods for dashboard functionality)
}

// Initialize the app
const app = new ZenPingerApp();
