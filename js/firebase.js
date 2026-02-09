// ==========================================
// Firebase Configuration and Initialization
// ==========================================

const FirebaseConfig = {
    apiKey: "AIzaSyCgpu1sk2rVUA7KcBQRSvrvV9djze6RiP4",
    authDomain: "budgetplanner-3e1dc.firebaseapp.com",
    databaseURL: "https://budgetplanner-3e1dc-default-rtdb.firebaseio.com",
    projectId: "budgetplanner-3e1dc",
    storageBucket: "budgetplanner-3e1dc.appspot.com",
    messagingSenderId: "",
    appId: ""
};

// Firebase Database Reference
let firebaseDB = null;
let currentUserRef = null;
let syncEnabled = false;
let currentUsername = null;

const FirebaseSync = {
    // Initialize Firebase
    init() {
        try {
            // Initialize Firebase app
            if (!firebase.apps.length) {
                firebase.initializeApp(FirebaseConfig);
            }
            firebaseDB = firebase.database();
            syncEnabled = true;
            console.log('Firebase initialized successfully');
            return true;
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            syncEnabled = false;
            return false;
        }
    },

    // Set current user for data sync
    setCurrentUser(username) {
        if (!syncEnabled || !firebaseDB) return;

        currentUsername = username;
        // Use the username as the user ID in the database
        currentUserRef = firebaseDB.ref('users/' + username.toLowerCase());
        console.log('Firebase user set:', username);

        // Set up real-time listener for this user's data
        this.setupRealtimeSync();
    },

    // Setup real-time data synchronization
    setupRealtimeSync() {
        if (!currentUserRef) return;

        currentUserRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data && !State._isLocalUpdate) {
                console.log('Received data from Firebase:', data);
                // Update local state with cloud data
                if (data.transactions) State.transactions = data.transactions;
                if (data.budgets) State.budgets = data.budgets;
                if (data.goals) State.goals = data.goals;
                if (data.debts) State.debts = data.debts;
                if (data.settings) State.settings = { ...State.settings, ...data.settings };

                // Notify UI to update
                State.notify();

                // Also save to localStorage as backup
                Storage.saveLocal();
            }
        }, (error) => {
            console.error('Firebase sync error:', error);
            UI.showToast('Sync error. Using local data.', 'warning');
        });
    },

    // Save data to Firebase
    save() {
        if (!syncEnabled || !currentUserRef) {
            return Promise.resolve(false);
        }

        const data = {
            transactions: State.transactions || [],
            budgets: State.budgets || {},
            goals: State.goals || [],
            debts: State.debts || [],
            settings: State.settings || {},
            lastUpdated: new Date().toISOString()
        };

        State._isLocalUpdate = true;

        return currentUserRef.set(data)
            .then(() => {
                console.log('Data saved to Firebase');
                State._isLocalUpdate = false;
                return true;
            })
            .catch((error) => {
                console.error('Firebase save error:', error);
                State._isLocalUpdate = false;
                return false;
            });
    },

    // Load data from Firebase (one-time fetch)
    async load() {
        if (!syncEnabled || !currentUserRef) {
            return null;
        }

        try {
            const snapshot = await currentUserRef.once('value');
            return snapshot.val();
        } catch (error) {
            console.error('Firebase load error:', error);
            return null;
        }
    },

    // Check if sync is active
    isActive() {
        return syncEnabled && currentUserRef !== null;
    },

    // Get current username
    getCurrentUser() {
        return currentUsername;
    },

    // Disconnect real-time listener
    disconnect() {
        if (currentUserRef) {
            currentUserRef.off();
            currentUserRef = null;
            currentUsername = null;
        }
    }
};
