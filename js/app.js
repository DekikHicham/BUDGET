// Main Application Controller
const App = {
    async init() {
        // Get current user from session
        const currentUser = sessionStorage.getItem('budgetplanner_user');

        // Load data - try cloud first, fallback to local
        let savedData;
        if (currentUser && typeof FirebaseSync !== 'undefined' && FirebaseSync.isActive()) {
            // Load from cloud with sync
            savedData = await Storage.loadWithSync(currentUser);
            console.log('Loaded data for user:', currentUser);
        } else {
            // Load from local storage
            savedData = Storage.load();
        }

        State.init(savedData);

        // Apply theme
        UI.applyTheme(State.settings.darkMode);

        // Set default date for transaction form
        document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];

        // Initialize charts
        Charts.init();

        // Subscribe to state changes
        State.subscribe(() => UI.renderAll());

        // Initial render
        UI.renderAll();

        // Setup event listeners
        this.setupEventListeners();

        // Show sync status
        this.showSyncStatus(currentUser);
    },

    showSyncStatus(username) {
        // Add sync indicator to header
        const headerActions = document.querySelector('.header-actions');
        if (headerActions && username) {
            const syncIndicator = document.createElement('div');
            syncIndicator.className = 'sync-indicator';
            syncIndicator.innerHTML = `
                <svg class="sync-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9"/>
                </svg>
                <span class="sync-user">${username}</span>
            `;
            headerActions.insertBefore(syncIndicator, headerActions.firstChild);
        }
    },


    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => UI.switchSection(btn.dataset.section));
        });

        document.querySelectorAll('[data-section]').forEach(btn => {
            btn.addEventListener('click', () => UI.switchSection(btn.dataset.section));
        });

        // Period selector
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                State.currentPeriod = btn.dataset.period;
                UI.renderAll();
            });
        });

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            State.toggleDarkMode();
            UI.applyTheme(State.settings.darkMode);
            Charts.refresh();
        });

        // Quick add button
        document.getElementById('quick-add-btn').addEventListener('click', () => {
            UI.resetTransactionForm();
            UI.openModal('transaction-modal');
        });

        // Transaction form toggle buttons
        document.querySelectorAll('.toggle-btn[data-type]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.toggle-btn[data-type]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Transaction form submit
        document.getElementById('transaction-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('transaction-id').value;
            const type = document.querySelector('.toggle-btn[data-type].active').dataset.type;
            const data = {
                type,
                amount: parseFloat(document.getElementById('transaction-amount').value),
                date: document.getElementById('transaction-date').value,
                category: document.getElementById('transaction-category').value,
                description: document.getElementById('transaction-description').value,
                recurring: document.getElementById('transaction-recurring').value
            };

            if (id) {
                State.updateTransaction(id, data);
                UI.showToast('Transaction updated', 'success');
            } else {
                State.addTransaction(data);
                UI.showToast('Transaction added', 'success');
            }

            UI.closeModal('transaction-modal');
        });

        // Close modals
        document.getElementById('close-modal').addEventListener('click', () => UI.closeModal('transaction-modal'));
        document.getElementById('cancel-transaction').addEventListener('click', () => UI.closeModal('transaction-modal'));
        document.getElementById('close-goal-modal').addEventListener('click', () => UI.closeModal('goal-modal'));
        document.getElementById('cancel-goal').addEventListener('click', () => UI.closeModal('goal-modal'));
        document.getElementById('close-debt-modal').addEventListener('click', () => UI.closeModal('debt-modal'));
        document.getElementById('cancel-debt').addEventListener('click', () => UI.closeModal('debt-modal'));
        document.getElementById('close-export-modal').addEventListener('click', () => UI.closeModal('export-modal'));

        // Close modal on backdrop click
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', () => {
                backdrop.closest('.modal').classList.remove('open');
                document.body.style.overflow = '';
            });
        });

        // Goal form
        document.getElementById('add-goal-btn').addEventListener('click', () => {
            UI.resetGoalForm();
            UI.openModal('goal-modal');
        });

        document.querySelectorAll('.icon-option').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.icon-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('goal-icon').value = btn.dataset.icon;
            });
        });

        document.getElementById('goal-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('goal-id').value;
            const data = {
                name: document.getElementById('goal-name').value,
                target: parseFloat(document.getElementById('goal-target').value),
                current: parseFloat(document.getElementById('goal-current').value) || 0,
                deadline: document.getElementById('goal-deadline').value || null,
                icon: document.getElementById('goal-icon').value
            };

            if (id) { State.updateGoal(id, data); UI.showToast('Goal updated', 'success'); }
            else { State.addGoal(data); UI.showToast('Goal added', 'success'); }
            UI.closeModal('goal-modal');
        });

        // Debt form
        document.getElementById('add-debt-btn').addEventListener('click', () => {
            UI.resetDebtForm();
            UI.openModal('debt-modal');
        });

        document.getElementById('debt-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('debt-id').value;
            const data = {
                name: document.getElementById('debt-name').value,
                principal: parseFloat(document.getElementById('debt-principal').value),
                rate: parseFloat(document.getElementById('debt-rate').value) || 0,
                payment: parseFloat(document.getElementById('debt-payment').value) || 0
            };

            if (id) { State.updateDebt(id, data); UI.showToast('Debt updated', 'success'); }
            else { State.addDebt(data); UI.showToast('Debt added', 'success'); }
            UI.closeModal('debt-modal');
        });

        // Search and filters
        document.getElementById('search-input').addEventListener('input', (e) => {
            State.filters.search = e.target.value;
            UI.renderTransactionsTable();
        });

        document.getElementById('type-filter').addEventListener('change', (e) => {
            State.filters.type = e.target.value;
            UI.renderTransactionsTable();
        });

        document.getElementById('category-filter').addEventListener('change', (e) => {
            State.filters.category = e.target.value;
            UI.renderTransactionsTable();
        });

        // Export
        document.getElementById('export-btn').addEventListener('click', () => UI.openModal('export-modal'));
        document.getElementById('export-csv').addEventListener('click', () => { Export.generateCSV(); UI.closeModal('export-modal'); });
        document.getElementById('export-print').addEventListener('click', () => { Export.printReport(); UI.closeModal('export-modal'); });

        // Budget template
        document.getElementById('budget-template').addEventListener('change', (e) => {
            if (e.target.value !== 'custom') {
                State.applyBudgetTemplate(e.target.value);
                UI.showToast('Budget template applied', 'success');
            }
        });

        // Event delegation for dynamic elements
        document.addEventListener('click', (e) => {
            const editTrans = e.target.closest('.edit-transaction');
            const deleteTrans = e.target.closest('.delete-transaction');
            const editGoal = e.target.closest('.edit-goal');
            const deleteGoal = e.target.closest('.delete-goal');
            const addToGoal = e.target.closest('.add-to-goal');
            const editDebt = e.target.closest('.edit-debt');
            const deleteDebt = e.target.closest('.delete-debt');
            const saveBudget = e.target.closest('.save-budget');

            if (editTrans) {
                const id = editTrans.closest('[data-id]').dataset.id;
                UI.openEditTransaction(id);
            }
            if (deleteTrans) {
                const id = deleteTrans.closest('[data-id]').dataset.id;
                if (confirm('Delete this transaction?')) {
                    State.deleteTransaction(id);
                    UI.showToast('Transaction deleted', 'success');
                }
            }
            if (editGoal) {
                const id = editGoal.closest('[data-id]').dataset.id;
                UI.openEditGoal(id);
            }
            if (deleteGoal) {
                const id = deleteGoal.closest('[data-id]').dataset.id;
                if (confirm('Delete this goal?')) {
                    State.deleteGoal(id);
                    UI.showToast('Goal deleted', 'success');
                }
            }
            if (addToGoal) {
                const id = addToGoal.closest('[data-id]').dataset.id;
                const goal = State.goals.find(g => g.id === id);
                const amount = prompt('Add amount:', '100');
                if (amount && !isNaN(parseFloat(amount))) {
                    State.updateGoal(id, { current: goal.current + parseFloat(amount) });
                    UI.showToast('Funds added to goal', 'success');
                }
            }
            if (editDebt) {
                const id = editDebt.closest('[data-id]').dataset.id;
                UI.openEditDebt(id);
            }
            if (deleteDebt) {
                const id = deleteDebt.closest('[data-id]').dataset.id;
                if (confirm('Delete this debt?')) {
                    State.deleteDebt(id);
                    UI.showToast('Debt deleted', 'success');
                }
            }
            if (saveBudget) {
                const card = saveBudget.closest('.budget-category');
                const category = card.dataset.category;
                const input = card.querySelector('.budget-input');
                const amount = parseFloat(input.value) || 0;
                State.setBudget(category, amount);
                UI.showToast('Budget saved', 'success');
            }
        });

        // Adkar functionality
        this.setupAdkar();
    },

    setupAdkar() {
        // Load saved adkar state
        const savedAdkar = JSON.parse(localStorage.getItem('adkar') || '{}');
        const today = new Date().toDateString();

        // Reset if it's a new day
        if (savedAdkar.date !== today) {
            localStorage.setItem('adkar', JSON.stringify({ date: today, morning: [], evening: [] }));
        } else {
            // Restore checkmarks
            (savedAdkar.morning || []).forEach(id => {
                const item = document.querySelector(`#morning-adkar [data-id="${id}"]`);
                if (item) {
                    item.classList.add('completed');
                    item.querySelector('input[type="checkbox"]').checked = true;
                }
            });
            (savedAdkar.evening || []).forEach(id => {
                const item = document.querySelector(`#evening-adkar [data-id="${id}"]`);
                if (item) {
                    item.classList.add('completed');
                    item.querySelector('input[type="checkbox"]').checked = true;
                }
            });
        }

        this.updateAdkarProgress();

        // Checkbox change handlers
        document.querySelectorAll('.adkar-item input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const item = e.target.closest('.adkar-item');
                const list = e.target.closest('.adkar-list');
                const type = list.id === 'morning-adkar' ? 'morning' : 'evening';
                const id = item.dataset.id;

                if (e.target.checked) {
                    item.classList.add('completed');
                } else {
                    item.classList.remove('completed');
                }

                this.saveAdkarState();
                this.updateAdkarProgress();
            });
        });

        // Reset button
        document.getElementById('reset-adkar-btn').addEventListener('click', () => {
            document.querySelectorAll('.adkar-item').forEach(item => {
                item.classList.remove('completed');
                item.querySelector('input[type="checkbox"]').checked = false;
            });
            this.saveAdkarState();
            this.updateAdkarProgress();
            UI.showToast('تم إعادة تعيين الأذكار', 'success');
        });
    },

    saveAdkarState() {
        const today = new Date().toDateString();
        const morning = [];
        const evening = [];

        document.querySelectorAll('#morning-adkar .adkar-item.completed').forEach(item => {
            morning.push(item.dataset.id);
        });
        document.querySelectorAll('#evening-adkar .adkar-item.completed').forEach(item => {
            evening.push(item.dataset.id);
        });

        localStorage.setItem('adkar', JSON.stringify({ date: today, morning, evening }));
    },

    updateAdkarProgress() {
        // Morning progress
        const morningTotal = document.querySelectorAll('#morning-adkar .adkar-item').length;
        const morningCompleted = document.querySelectorAll('#morning-adkar .adkar-item.completed').length;
        const morningPercent = morningTotal > 0 ? (morningCompleted / morningTotal) * 100 : 0;

        document.getElementById('morning-completed').textContent = morningCompleted;
        document.getElementById('morning-total').textContent = morningTotal;
        document.getElementById('morning-progress').style.width = morningPercent + '%';

        // Evening progress
        const eveningTotal = document.querySelectorAll('#evening-adkar .adkar-item').length;
        const eveningCompleted = document.querySelectorAll('#evening-adkar .adkar-item.completed').length;
        const eveningPercent = eveningTotal > 0 ? (eveningCompleted / eveningTotal) * 100 : 0;

        document.getElementById('evening-completed').textContent = eveningCompleted;
        document.getElementById('evening-total').textContent = eveningTotal;
        document.getElementById('evening-progress').style.width = eveningPercent + '%';
    }
};

// App.init() is now called by AccessGate after successful authentication

