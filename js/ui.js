// ==========================================
// UI Rendering and Interactions
// ==========================================

const UI = {
    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('ar-DZ', {
            style: 'currency',
            currency: 'DZD',
            minimumFractionDigits: 2
        }).format(amount);
    },

    // Format date
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    },

    // Format relative date
    formatRelativeDate(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diff === 0) return 'Today';
        if (diff === 1) return 'Yesterday';
        if (diff < 7) return `${diff} days ago`;
        return this.formatDate(dateStr);
    },

    // Show toast notification
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>',
            warning: '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
            error: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
        };

        toast.innerHTML = `
            <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icons[type]}</svg>
            <span class="toast-message">${message}</span>
            <button class="toast-close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
        `;

        container.appendChild(toast);

        toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());

        setTimeout(() => {
            toast.style.animation = 'fadeIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    // Render dashboard summary
    renderDashboard() {
        const summary = State.getSummary();

        // Update summary cards
        document.getElementById('total-income').textContent = this.formatCurrency(summary.income);
        document.getElementById('total-expenses').textContent = this.formatCurrency(summary.expenses);
        document.getElementById('net-balance').textContent = this.formatCurrency(summary.balance);
        document.getElementById('savings-rate').textContent = `Savings rate: ${summary.savingsRate.toFixed(1)}%`;
        document.getElementById('budget-used').textContent = `${Math.min(100, summary.budgetUsed).toFixed(0)}%`;

        // Budget progress bar
        const budgetBar = document.getElementById('budget-progress');
        budgetBar.style.width = `${Math.min(100, summary.budgetUsed)}%`;

        // Apply color based on usage
        if (summary.budgetUsed > 100) {
            budgetBar.style.background = 'linear-gradient(90deg, var(--danger), #F87171)';
        } else if (summary.budgetUsed > 80) {
            budgetBar.style.background = 'linear-gradient(90deg, var(--warning), #FBBF24)';
        }

        // Render recent transactions
        this.renderRecentTransactions();
    },

    // Render recent transactions on dashboard
    renderRecentTransactions() {
        const container = document.getElementById('recent-transactions-list');
        const transactions = State.transactions.slice(0, 5);

        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                    <p>No transactions yet</p>
                    <span>Add your first transaction to get started</span>
                </div>
            `;
            return;
        }

        container.innerHTML = transactions.map(t => this.createTransactionItem(t)).join('');
    },

    // Create transaction item HTML
    createTransactionItem(transaction) {
        const category = State.getCategoryInfo(transaction.category);
        const amountClass = transaction.type === 'income' ? 'income' : 'expense';
        const amountPrefix = transaction.type === 'income' ? '+' : '-';

        return `
            <div class="transaction-item" data-id="${transaction.id}">
                <div class="transaction-icon cat-${transaction.category}">
                    ${category.icon}
                </div>
                <div class="transaction-details">
                    <div class="transaction-description">${transaction.description}</div>
                    <div class="transaction-meta">
                        <span>${category.name}</span>
                        <span>•</span>
                        <span>${this.formatRelativeDate(transaction.date)}</span>
                        ${transaction.recurring !== 'none' ? `<span>•</span><span>🔄 ${transaction.recurring}</span>` : ''}
                    </div>
                </div>
                <div class="transaction-amount ${amountClass}">
                    ${amountPrefix}${this.formatCurrency(transaction.amount)}
                </div>
                <div class="transaction-actions">
                    <button class="action-btn edit-transaction" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="action-btn delete delete-transaction" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    </button>
                </div>
            </div>
        `;
    },

    // Render transactions table
    renderTransactionsTable() {
        const transactions = State.getFilteredTransactions();
        const tbody = document.getElementById('transactions-table-body');
        const emptyState = document.getElementById('transactions-empty');
        const wrapper = document.querySelector('.transactions-table-wrapper');

        if (transactions.length === 0) {
            wrapper.style.display = 'none';
            emptyState.classList.add('show');
            return;
        }

        wrapper.style.display = 'block';
        emptyState.classList.remove('show');

        tbody.innerHTML = transactions.map(t => {
            const category = State.getCategoryInfo(t.category);
            const amountClass = t.type === 'income' ? 'income' : 'expense';
            const amountPrefix = t.type === 'income' ? '+' : '-';

            return `
                <tr data-id="${t.id}">
                    <td>${this.formatDate(t.date)}</td>
                    <td>${t.description}</td>
                    <td><span class="transaction-icon cat-${t.category}" style="padding: 4px 8px; border-radius: 4px; font-size: 0.875rem;">${category.icon} ${category.name}</span></td>
                    <td><span style="text-transform: capitalize;">${t.type}</span></td>
                    <td class="transaction-amount ${amountClass}">${amountPrefix}${this.formatCurrency(t.amount)}</td>
                    <td>
                        <div class="transaction-actions" style="opacity: 1;">
                            <button class="action-btn edit-transaction" title="Edit">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button class="action-btn delete delete-transaction" title="Delete">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Populate category filter
        const categoryFilter = document.getElementById('category-filter');
        const allCategories = [...State.categories.expense, ...State.categories.income];
        categoryFilter.innerHTML = '<option value="all">All Categories</option>' +
            allCategories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
    },

    // Render budget categories
    renderBudgets() {
        const container = document.getElementById('budget-categories');
        const summary = State.getSummary();

        // Update overview
        const totalBudget = Object.values(State.budgets).reduce((s, b) => s + b, 0);
        document.getElementById('total-budget').textContent = this.formatCurrency(totalBudget);
        document.getElementById('total-spent').textContent = this.formatCurrency(summary.expenses);
        document.getElementById('total-remaining').textContent = this.formatCurrency(totalBudget - summary.expenses);

        const overallBar = document.getElementById('overall-budget-bar');
        const percentage = totalBudget > 0 ? (summary.expenses / totalBudget) * 100 : 0;
        overallBar.style.width = `${Math.min(100, percentage)}%`;

        if (percentage > 100) {
            overallBar.style.background = 'linear-gradient(90deg, var(--danger), #F87171)';
        } else if (percentage > 80) {
            overallBar.style.background = 'linear-gradient(90deg, var(--warning), var(--danger))';
        }

        // Render category budgets
        container.innerHTML = State.categories.expense.map(cat => {
            const usage = State.getBudgetUsage(cat.id);
            let barClass = 'safe';
            if (usage.percentage > 100) barClass = 'danger';
            else if (usage.percentage > 80) barClass = 'warning';

            return `
                <div class="budget-category" data-category="${cat.id}">
                    <div class="budget-category-header">
                        <div class="budget-category-name">
                            <span class="budget-category-icon">${cat.icon}</span>
                            <span>${cat.name}</span>
                        </div>
                        <div class="budget-category-amounts">
                            <span class="budget-spent">${this.formatCurrency(usage.spent)}</span>
                            <span class="budget-limit"> / ${usage.limit > 0 ? this.formatCurrency(usage.limit) : 'No limit'}</span>
                        </div>
                    </div>
                    <div class="budget-progress">
                        <div class="budget-progress-bar ${barClass}" style="width: ${Math.min(100, usage.percentage)}%"></div>
                    </div>
                    <div class="budget-edit">
                        <input type="number" class="budget-input" value="${usage.limit}" placeholder="Set limit" min="0" step="10">
                        <button class="btn btn-ghost save-budget">Save</button>
                    </div>
                </div>
            `;
        }).join('');

        // Check for budget alerts
        State.categories.expense.forEach(cat => {
            const usage = State.getBudgetUsage(cat.id);
            if (usage.limit > 0 && usage.percentage >= 80 && usage.percentage < 100) {
                this.showToast(`⚠️ ${cat.name}: ${usage.percentage.toFixed(0)}% of budget used`, 'warning');
            } else if (usage.limit > 0 && usage.percentage >= 100) {
                this.showToast(`🚨 ${cat.name}: Budget exceeded!`, 'error');
            }
        });
    },

    // Render goals
    renderGoals() {
        const container = document.getElementById('goals-list');

        if (State.goals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                    <p>No goals set yet</p>
                    <span>Set your first financial goal to start tracking progress</span>
                </div>
            `;
            return;
        }

        container.innerHTML = State.goals.map(goal => {
            const percentage = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
            const deadlineText = goal.deadline ? `Target: ${this.formatDate(goal.deadline)}` : 'No deadline';

            return `
                <div class="goal-card" data-id="${goal.id}">
                    <div class="goal-header">
                        <div class="goal-info">
                            <span class="goal-icon">${goal.icon || '🎯'}</span>
                            <div>
                                <div class="goal-name">${goal.name}</div>
                                <div class="goal-deadline">${deadlineText}</div>
                            </div>
                        </div>
                        <div class="transaction-actions" style="opacity: 1;">
                            <button class="action-btn edit-goal" title="Edit">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button class="action-btn delete delete-goal" title="Delete">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                            </button>
                        </div>
                    </div>
                    <div class="goal-progress-section">
                        <div class="goal-amounts">
                            <span class="goal-current">${this.formatCurrency(goal.current)}</span>
                            <span class="goal-target">of ${this.formatCurrency(goal.target)}</span>
                        </div>
                        <div class="goal-progress">
                            <div class="goal-progress-bar" style="width: ${Math.min(100, percentage)}%"></div>
                        </div>
                        <div class="goal-percentage">${percentage.toFixed(1)}% complete</div>
                    </div>
                    <div class="goal-actions">
                        <button class="btn btn-outline add-to-goal">Add Funds</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    // Render debts
    renderDebts() {
        const container = document.getElementById('debts-list');

        if (State.debts.length === 0) {
            container.innerHTML = `
                <div class="empty-state small">
                    <p>No debts tracked</p>
                </div>
            `;
            return;
        }

        container.innerHTML = State.debts.map(debt => {
            const payoffMonths = State.calculateDebtPayoff(debt);
            const payoffText = payoffMonths
                ? `Payoff: ~${payoffMonths} months`
                : 'Set monthly payment to calculate';

            return `
                <div class="debt-card" data-id="${debt.id}">
                    <div class="debt-header">
                        <div class="debt-name">${debt.name}</div>
                        <div class="debt-rate">${debt.rate || 0}% APR</div>
                    </div>
                    <div class="debt-details">
                        <span class="debt-detail-label">Principal</span>
                        <span class="debt-detail-value">${this.formatCurrency(debt.principal)}</span>
                        <span class="debt-detail-label">Monthly Payment</span>
                        <span class="debt-detail-value">${debt.payment ? this.formatCurrency(debt.payment) : 'Not set'}</span>
                    </div>
                    <div class="debt-payoff">${payoffText}</div>
                    <div class="transaction-actions" style="opacity: 1; margin-top: 8px;">
                        <button class="action-btn edit-debt" title="Edit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="action-btn delete delete-debt" title="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    // Switch section
    switchSection(sectionId) {
        State.currentSection = sectionId;

        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === sectionId);
        });

        // Update sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.toggle('active', section.id === sectionId);
        });

        // Render section content
        this.renderAll();
    },

    // Render all sections
    renderAll() {
        this.renderDashboard();
        this.renderTransactionsTable();
        this.renderBudgets();
        this.renderGoals();
        this.renderDebts();
        Charts.updateAll();
    },

    // Open modal
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    },

    // Close modal
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('open');
        document.body.style.overflow = '';
    },

    // Open transaction modal for editing
    openEditTransaction(id) {
        const transaction = State.transactions.find(t => t.id === id);
        if (!transaction) return;

        document.getElementById('modal-title').textContent = 'Edit Transaction';
        document.getElementById('transaction-id').value = transaction.id;
        document.getElementById('transaction-amount').value = transaction.amount;
        document.getElementById('transaction-date').value = transaction.date;
        document.getElementById('transaction-category').value = transaction.category;
        document.getElementById('transaction-description').value = transaction.description;
        document.getElementById('transaction-recurring').value = transaction.recurring || 'none';

        // Set type toggle
        document.querySelectorAll('.toggle-btn[data-type]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === transaction.type);
        });

        this.openModal('transaction-modal');
    },

    // Open goal modal for editing
    openEditGoal(id) {
        const goal = State.goals.find(g => g.id === id);
        if (!goal) return;

        document.getElementById('goal-modal-title').textContent = 'Edit Goal';
        document.getElementById('goal-id').value = goal.id;
        document.getElementById('goal-name').value = goal.name;
        document.getElementById('goal-target').value = goal.target;
        document.getElementById('goal-current').value = goal.current || 0;
        document.getElementById('goal-deadline').value = goal.deadline || '';
        document.getElementById('goal-icon').value = goal.icon || '🎯';

        document.querySelectorAll('.icon-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.icon === (goal.icon || '🎯'));
        });

        this.openModal('goal-modal');
    },

    // Open debt modal for editing
    openEditDebt(id) {
        const debt = State.debts.find(d => d.id === id);
        if (!debt) return;

        document.getElementById('debt-id').value = debt.id;
        document.getElementById('debt-name').value = debt.name;
        document.getElementById('debt-principal').value = debt.principal;
        document.getElementById('debt-rate').value = debt.rate || '';
        document.getElementById('debt-payment').value = debt.payment || '';

        this.openModal('debt-modal');
    },

    // Reset transaction form
    resetTransactionForm() {
        document.getElementById('modal-title').textContent = 'Add Transaction';
        document.getElementById('transaction-form').reset();
        document.getElementById('transaction-id').value = '';
        document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
        document.querySelectorAll('.toggle-btn[data-type]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === 'expense');
        });
    },

    // Reset goal form
    resetGoalForm() {
        document.getElementById('goal-modal-title').textContent = 'Add Goal';
        document.getElementById('goal-form').reset();
        document.getElementById('goal-id').value = '';
        document.getElementById('goal-icon').value = '🎯';
        document.querySelectorAll('.icon-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.icon === '🎯');
        });
    },

    // Reset debt form
    resetDebtForm() {
        document.getElementById('debt-form').reset();
        document.getElementById('debt-id').value = '';
    },

    // Apply theme
    applyTheme(darkMode) {
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    }
};
