// ==========================================
// Storage - Local + Cloud Sync (User-Specific)
// ==========================================

const Storage = {
    VERSION: 1,

    // Get storage key for current user
    getStorageKey() {
        const username = sessionStorage.getItem('budgetplanner_user');
        return username ? `budgetPlannerData_${username.toLowerCase()}` : 'budgetPlannerData';
    },

    // Main save function - saves to both local and cloud
    save() {
        // Always save locally first
        this.saveLocal();

        // Then sync to Firebase if available
        if (typeof FirebaseSync !== 'undefined' && FirebaseSync.isActive()) {
            FirebaseSync.save().catch(err => {
                console.error('Cloud sync failed:', err);
            });
        }
    },

    // Save to localStorage for current user
    saveLocal() {
        try {
            const data = {
                version: this.VERSION,
                transactions: State.transactions,
                budgets: State.budgets,
                goals: State.goals,
                debts: State.debts,
                settings: State.settings,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem(this.getStorageKey(), JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save local data:', e);
        }
    },

    // Load from localStorage for current user
    load() {
        try {
            const stored = localStorage.getItem(this.getStorageKey());
            if (stored) {
                const data = JSON.parse(stored);
                return data;
            }
        } catch (e) {
            console.error('Failed to load data:', e);
        }
        return null;
    },

    // Load from cloud and merge with local
    async loadWithSync(username) {
        // Try to load from cloud first
        if (typeof FirebaseSync !== 'undefined' && FirebaseSync.isActive()) {
            const cloudData = await FirebaseSync.load();

            if (cloudData) {
                // Cloud data exists - use it as source of truth
                console.log('Using cloud data for user:', username);
                // Also save to local for offline access
                this.saveLocal();
                return cloudData;
            }
        }

        // No cloud data - load user's local data (if any)
        const localData = this.load();
        if (localData) {
            console.log('Using local data for user:', username);
            return localData;
        }

        // New user - return null (empty state)
        console.log('New user, starting with empty data:', username);
        return null;
    },

    clear() {
        try {
            localStorage.removeItem(this.getStorageKey());
            return true;
        } catch (e) {
            console.error('Failed to clear data:', e);
            return false;
        }
    },

    // Export all data as JSON
    exportJSON() {
        const data = {
            transactions: State.transactions,
            budgets: State.budgets,
            goals: State.goals,
            debts: State.debts,
            exportedAt: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    },

    // Import data from JSON
    importJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.transactions) State.transactions = data.transactions;
            if (data.budgets) State.budgets = data.budgets;
            if (data.goals) State.goals = data.goals;
            if (data.debts) State.debts = data.debts;
            State.notify();
            this.save();
            return true;
        } catch (e) {
            console.error('Failed to import data:', e);
            return false;
        }
    }
};
