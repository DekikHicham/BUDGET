// Access Gate Controller
// Manages the 6-character alphanumeric code access system with multi-user support

const AccessGate = {
    // User codes database - add/remove users here
    // Each user has a unique 6-character alphanumeric code (letters + numbers)
    USER_CODES: {
        'admin': 'Adm1n0',   // Example: Admin user
        'user1': 'Us3r01',   // Example: User 1
        'user2': 'C0de2X',   // Example: User 2
        // Add more users below:
        // 'username': 'CODE00',
    },

    // Session storage key
    SESSION_KEY: 'budgetplanner_authenticated',
    SESSION_USER_KEY: 'budgetplanner_user',

    init() {
        // Initialize Firebase first
        if (typeof FirebaseSync !== 'undefined') {
            FirebaseSync.init();
        }

        // Check if already authenticated in this session
        if (this.isAuthenticated()) {
            const username = this.getCurrentUser();
            if (username) {
                this.setupUserSync(username);
            }
            this.unlockApp(false);
            return true;
        }

        this.setupEventListeners();
        this.focusFirstInput();
        return false;
    },

    isAuthenticated() {
        return sessionStorage.getItem(this.SESSION_KEY) === 'true';
    },

    getCurrentUser() {
        return sessionStorage.getItem(this.SESSION_USER_KEY);
    },

    setAuthenticated(username) {
        sessionStorage.setItem(this.SESSION_KEY, 'true');
        sessionStorage.setItem(this.SESSION_USER_KEY, username);
    },

    // Setup Firebase sync for the authenticated user
    setupUserSync(username) {
        if (typeof FirebaseSync !== 'undefined') {
            FirebaseSync.setCurrentUser(username);
        }
    },

    setupEventListeners() {
        const inputs = document.querySelectorAll('.gate-digit-input');
        const form = document.getElementById('access-gate-form');

        // Handle character input (alphanumeric)
        inputs.forEach((input, index) => {
            // Allow alphanumeric characters only
            input.addEventListener('input', (e) => {
                let value = e.target.value;

                // Only keep last character if multiple entered
                if (value.length > 1) {
                    value = value.slice(-1);
                }

                // Remove non-alphanumeric characters
                value = value.replace(/[^a-zA-Z0-9]/g, '');

                // Convert to uppercase for consistency in display
                e.target.value = value.toUpperCase();

                // Auto-advance to next input
                if (e.target.value && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }

                // Check if all inputs are filled
                this.checkComplete();
            });

            // Handle backspace
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    inputs[index - 1].focus();
                }

                // Handle Enter key
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.validateCode();
                }
            });

            // Handle paste
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text')
                    .replace(/[^a-zA-Z0-9]/g, '')
                    .slice(0, 6)
                    .toUpperCase();

                if (pastedData.length === 6) {
                    inputs.forEach((inp, i) => {
                        inp.value = pastedData[i] || '';
                    });
                    inputs[5].focus();
                    this.checkComplete();
                }
            });
        });

        // Form submit
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.validateCode();
        });
    },

    focusFirstInput() {
        const firstInput = document.querySelector('.gate-digit-input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    },

    checkComplete() {
        const inputs = document.querySelectorAll('.gate-digit-input');
        const allFilled = Array.from(inputs).every(input => input.value.length === 1);
        const submitBtn = document.getElementById('gate-submit-btn');

        if (submitBtn) {
            submitBtn.disabled = !allFilled;
        }
    },

    getEnteredCode() {
        const inputs = document.querySelectorAll('.gate-digit-input');
        return Array.from(inputs).map(input => input.value).join('');
    },

    findUserByCode(code) {
        // Case-insensitive code matching
        const normalizedCode = code.toUpperCase();
        for (const [username, userCode] of Object.entries(this.USER_CODES)) {
            if (userCode.toUpperCase() === normalizedCode) {
                return username;
            }
        }
        return null;
    },

    validateCode() {
        const enteredCode = this.getEnteredCode();
        const errorEl = document.getElementById('gate-error');
        const gate = document.getElementById('access-gate');

        const matchedUser = this.findUserByCode(enteredCode);

        if (matchedUser) {
            // Success!
            this.setAuthenticated(matchedUser);
            this.setupUserSync(matchedUser);
            this.unlockApp(true);
        } else {
            // Wrong code
            errorEl.textContent = 'Invalid access code. Please try again.';
            errorEl.classList.add('visible');
            gate.classList.add('shake');

            // Clear inputs
            const inputs = document.querySelectorAll('.gate-digit-input');
            inputs.forEach(input => input.value = '');
            inputs[0].focus();

            // Remove shake animation
            setTimeout(() => {
                gate.classList.remove('shake');
            }, 500);

            // Hide error after delay
            setTimeout(() => {
                errorEl.classList.remove('visible');
            }, 3000);
        }
    },

    unlockApp(animate = true) {
        const gate = document.getElementById('access-gate');
        const lockIcon = document.querySelector('.gate-lock-icon');

        if (!gate) return;

        if (animate) {
            // Play unlock animation
            if (lockIcon) {
                lockIcon.classList.add('unlocked');
            }
            gate.classList.add('unlocking');

            setTimeout(() => {
                gate.classList.add('hidden');
                document.body.classList.remove('gate-active');
                // Initialize the main app after gate is hidden
                App.init();
            }, 600);
        } else {
            // Instant unlock (already authenticated)
            gate.classList.add('hidden');
            document.body.classList.remove('gate-active');
            App.init();
        }
    }
};

// Initialize gate when DOM is ready (instead of App.init directly)
document.addEventListener('DOMContentLoaded', () => {
    AccessGate.init();
});
