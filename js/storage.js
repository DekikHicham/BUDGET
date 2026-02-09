// ==========================================
// Storage - Local + Cloud Sync
// ==========================================

const Storage = {
    STORAGE_KEY: 'budgetPlannerData',
    VERSION: 1,

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

    // Save to localStorage only
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
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save local data:', e);
        }
    },

    // Load from localStorage
    load() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
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
        // First load local data
        const localData = this.load();

        // Try to load from cloud
        if (typeof FirebaseSync !== 'undefined' && FirebaseSync.isActive()) {
            const cloudData = await FirebaseSync.load();

            if (cloudData) {
                // Cloud data exists - use it (it's the source of truth)
                console.log('Using cloud data for user:', username);
                return cloudData;
            } else if (localData) {
                // No cloud data but have local - upload local to cloud
                console.log('No cloud data, uploading local data');
                // Will be synced on next save
                return localData;
            }
        }

        return localData;
    },

    clear() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
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
