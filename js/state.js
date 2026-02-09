// ==========================================
// State Management
// ==========================================

const State = {
    // Core data
    transactions: [],
    budgets: {},
    goals: [],
    debts: [],

    // Settings
    settings: {
        darkMode: false,
        defaultView: 'month',
        currency: 'DZD'
    },

    // UI state
    currentSection: 'dashboard',
    currentPeriod: 'month',
    filters: {
        search: '',
        type: 'all',
        category: 'all'
    },

    // Subscribers for reactive updates
    subscribers: [],

    // Categories
    categories: {
        expense: [
            { id: 'housing', name: 'Housing', icon: '🏠', color: '#8B5CF6' },
            { id: 'food', name: 'Food & Dining', icon: '🍔', color: '#F59E0B' },
            { id: 'transportation', name: 'Transportation', icon: '🚗', color: '#3B82F6' },
            { id: 'utilities', name: 'Utilities', icon: '💡', color: '#10B981' },
            { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#EC4899' },
            { id: 'healthcare', name: 'Healthcare', icon: '🏥', color: '#EF4444' },
            { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#F97316' },
            { id: 'personal', name: 'Personal', icon: '👤', color: '#6366F1' },
            { id: 'education', name: 'Education', icon: '📚', color: '#14B8A6' },
            { id: 'other-expense', name: 'Other', icon: '📦', color: '#6B7280' }
        ],
        income: [
            { id: 'salary', name: 'Salary', icon: '💼', color: '#10B981' },
            { id: 'freelance', name: 'Freelance', icon: '💻', color: '#8B5CF6' },
            { id: 'investments', name: 'Investments', icon: '📈', color: '#3B82F6' },
            { id: 'rental', name: 'Rental Income', icon: '🏘️', color: '#F59E0B' },
            { id: 'gifts', name: 'Gifts', icon: '🎁', color: '#EC4899' },
            { id: 'other-income', name: 'Other Income', icon: '💰', color: '#10B981' }
        ]
    },

    // Initialize state
    init(savedData = null) {
        if (savedData) {
            this.transactions = savedData.transactions || [];
            this.budgets = savedData.budgets || {};
            this.goals = savedData.goals || [];
            this.debts = savedData.debts || [];
            this.settings = { ...this.settings, ...savedData.settings };
        }
        this.notify();
    },

    // Subscribe to state changes
    subscribe(callback) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(sub => sub !== callback);
        };
    },

    // Notify all subscribers
    notify() {
        this.subscribers.forEach(callback => callback(this));
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Transaction methods
    addTransaction(transaction) {
        const newTransaction = {
            id: this.generateId(),
            ...transaction,
            createdAt: new Date().toISOString()
        };
        this.transactions.unshift(newTransaction);
        this.notify();
        Storage.save();
        return newTransaction;
    },

    updateTransaction(id, updates) {
        const index = this.transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            this.transactions[index] = { ...this.transactions[index], ...updates };
            this.notify();
            Storage.save();
            return this.transactions[index];
        }
        return null;
    },

    deleteTransaction(id) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.notify();
        Storage.save();
    },

    getFilteredTransactions() {
        let filtered = [...this.transactions];

        // Apply search filter
        if (this.filters.search) {
            const search = this.filters.search.toLowerCase();
            filtered = filtered.filter(t =>
                t.description.toLowerCase().includes(search) ||
                t.category.toLowerCase().includes(search)
            );
        }

        // Apply type filter
        if (this.filters.type !== 'all') {
            filtered = filtered.filter(t => t.type === this.filters.type);
        }

        // Apply category filter
        if (this.filters.category !== 'all') {
            filtered = filtered.filter(t => t.category === this.filters.category);
        }

        // Apply period filter
        const now = new Date();
        const startDate = this.getStartDateForPeriod(now, this.currentPeriod);
        filtered = filtered.filter(t => new Date(t.date) >= startDate);

        return filtered;
    },

    getStartDateForPeriod(date, period) {
        const d = new Date(date);
        switch (period) {
            case 'week':
                d.setDate(d.getDate() - 7);
                break;
            case 'month':
                d.setMonth(d.getMonth() - 1);
                break;
            case 'year':
                d.setFullYear(d.getFullYear() - 1);
                break;
        }
        return d;
    },

    // Budget methods
    setBudget(category, amount) {
        this.budgets[category] = amount;
        this.notify();
        Storage.save();
    },

    getBudgetUsage(category) {
        const limit = this.budgets[category] || 0;
        const spent = this.transactions
            .filter(t => t.type === 'expense' && t.category === category)
            .filter(t => {
                const transDate = new Date(t.date);
                const now = new Date();
                return transDate.getMonth() === now.getMonth() &&
                    transDate.getFullYear() === now.getFullYear();
            })
            .reduce((sum, t) => sum + t.amount, 0);

        return { limit, spent, remaining: limit - spent, percentage: limit > 0 ? (spent / limit) * 100 : 0 };
    },

    applyBudgetTemplate(template) {
        const totalIncome = this.getMonthlyIncome();

        switch (template) {
            case '50-30-20':
                // 50% needs, 30% wants, 20% savings
                const needs = totalIncome * 0.5;
                const wants = totalIncome * 0.3;
                const savings = totalIncome * 0.2;

                // Distribute needs
                this.budgets = {
                    'housing': needs * 0.5,
                    'utilities': needs * 0.15,
                    'food': needs * 0.25,
                    'transportation': needs * 0.1,
                    'entertainment': wants * 0.4,
                    'shopping': wants * 0.3,
                    'personal': wants * 0.3,
                    'healthcare': savings * 0.25,
                    'education': savings * 0.25,
                    'other-expense': savings * 0.5
                };
                break;

            case 'zero-based':
                // 100% of income allocated
                this.budgets = {
                    'housing': totalIncome * 0.30,
                    'utilities': totalIncome * 0.08,
                    'food': totalIncome * 0.12,
                    'transportation': totalIncome * 0.10,
                    'entertainment': totalIncome * 0.05,
                    'shopping': totalIncome * 0.08,
                    'personal': totalIncome * 0.05,
                    'healthcare': totalIncome * 0.07,
                    'education': totalIncome * 0.05,
                    'other-expense': totalIncome * 0.10
                };
                break;
        }

        this.notify();
        Storage.save();
    },

    getMonthlyIncome() {
        const now = new Date();
        return this.transactions
            .filter(t => t.type === 'income')
            .filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            })
            .reduce((sum, t) => sum + t.amount, 0);
    },

    // Goal methods
    addGoal(goal) {
        const newGoal = {
            id: this.generateId(),
            ...goal,
            current: goal.current || 0,
            createdAt: new Date().toISOString()
        };
        this.goals.push(newGoal);
        this.notify();
        Storage.save();
        return newGoal;
    },

    updateGoal(id, updates) {
        const index = this.goals.findIndex(g => g.id === id);
        if (index !== -1) {
            this.goals[index] = { ...this.goals[index], ...updates };
            this.notify();
            Storage.save();
            return this.goals[index];
        }
        return null;
    },

    deleteGoal(id) {
        this.goals = this.goals.filter(g => g.id !== id);
        this.notify();
        Storage.save();
    },

    // Debt methods
    addDebt(debt) {
        const newDebt = {
            id: this.generateId(),
            ...debt,
            createdAt: new Date().toISOString()
        };
        this.debts.push(newDebt);
        this.notify();
        Storage.save();
        return newDebt;
    },

    updateDebt(id, updates) {
        const index = this.debts.findIndex(d => d.id === id);
        if (index !== -1) {
            this.debts[index] = { ...this.debts[index], ...updates };
            this.notify();
            Storage.save();
            return this.debts[index];
        }
        return null;
    },

    deleteDebt(id) {
        this.debts = this.debts.filter(d => d.id !== id);
        this.notify();
        Storage.save();
    },

    calculateDebtPayoff(debt) {
        if (!debt.payment || debt.payment <= 0) return null;

        const principal = debt.principal;
        const monthlyRate = (debt.rate || 0) / 100 / 12;
        const payment = debt.payment;

        if (monthlyRate === 0) {
            return Math.ceil(principal / payment);
        }

        const months = -Math.log(1 - (monthlyRate * principal) / payment) / Math.log(1 + monthlyRate);
        return Math.ceil(months);
    },

    // Settings methods
    toggleDarkMode() {
        this.settings.darkMode = !this.settings.darkMode;
        this.notify();
        Storage.save();
    },

    // Summary calculations
    getSummary() {
        const now = new Date();
        const transactions = this.transactions.filter(t => {
            const d = new Date(t.date);
            if (this.currentPeriod === 'week') {
                const weekAgo = new Date(now);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return d >= weekAgo;
            } else if (this.currentPeriod === 'month') {
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            } else {
                return d.getFullYear() === now.getFullYear();
            }
        });

        const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const balance = income - expenses;
        const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

        // Calculate total budget and usage
        const totalBudget = Object.values(this.budgets).reduce((s, b) => s + b, 0);
        const budgetUsed = totalBudget > 0 ? (expenses / totalBudget) * 100 : 0;

        // Spending by category
        const categories = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            categories[t.category] = (categories[t.category] || 0) + t.amount;
        });

        return {
            income, expenses, balance, savingsRate, totalBudget, budgetUsed, categories,
            transactionCount: transactions.length
        };
    },

    getMonthlyTrend() {
        const months = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = d.toLocaleDateString('en-US', { month: 'short' });

            const monthTransactions = this.transactions.filter(t => {
                const td = new Date(t.date);
                return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
            });

            const income = monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
            const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

            months.push({ month: monthName, income, expenses });
        }

        return months;
    },

    getCategoryInfo(categoryId) {
        const allCategories = [...this.categories.expense, ...this.categories.income];
        return allCategories.find(c => c.id === categoryId) || { name: categoryId, icon: '📦', color: '#6B7280' };
    }
};
