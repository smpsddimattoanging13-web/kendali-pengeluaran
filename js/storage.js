// LocalStorage handler
const Storage = {
    KEYS: {
        TRANSACTIONS: 'kendali_transactions',
        CATEGORIES: 'kendali_categories',
        BUDGET: 'kendali_budget'
    },

    // Default categories
    defaultCategories: [
        { id: 'cat_1', name: 'Makanan', type: 'expense', icon: '🍔' },
        { id: 'cat_2', name: 'Transportasi', type: 'expense', icon: '🚗' },
        { id: 'cat_3', name: 'Belanja', type: 'expense', icon: '🛍️' },
        { id: 'cat_4', name: 'Tagihan', type: 'expense', icon: '💡' },
        { id: 'cat_5', name: 'Hiburan', type: 'expense', icon: '🎮' },
        { id: 'cat_6', name: 'Kesehatan', type: 'expense', icon: '💊' },
        { id: 'cat_7', name: 'Pendidikan', type: 'expense', icon: '📚' },
        { id: 'cat_8', name: 'Lainnya', type: 'expense', icon: '📦' },
        { id: 'cat_9', name: 'Gaji', type: 'income', icon: '💼' },
        { id: 'cat_10', name: 'Bonus', type: 'income', icon: '🎁' },
        { id: 'cat_11', name: 'Investasi', type: 'income', icon: '📈' }
    ],

    init() {
        if (!localStorage.getItem(this.KEYS.CATEGORIES)) {
            localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(this.defaultCategories));
        }
        if (!localStorage.getItem(this.KEYS.TRANSACTIONS)) {
            localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify([]));
        }
    },

    // Transactions
    getTransactions() {
        return JSON.parse(localStorage.getItem(this.KEYS.TRANSACTIONS) || '[]');
    },

    saveTransaction(transaction) {
        const transactions = this.getTransactions();
        const existingIndex = transactions.findIndex(t => t.id === transaction.id);
        if (existingIndex >= 0) {
            transactions[existingIndex] = transaction;
        } else {
            transactions.push(transaction);
        }
        localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify(transactions));
    },

    deleteTransaction(id) {
        const transactions = this.getTransactions().filter(t => t.id !== id);
        localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify(transactions));
    },

    // Categories
    getCategories() {
        return JSON.parse(localStorage.getItem(this.KEYS.CATEGORIES) || '[]');
    },

    saveCategory(category) {
        const categories = this.getCategories();
        const existingIndex = categories.findIndex(c => c.id === category.id);
        if (existingIndex >= 0) {
            categories[existingIndex] = category;
        } else {
            categories.push(category);
        }
        localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(categories));
    },

    deleteCategory(id) {
        const categories = this.getCategories().filter(c => c.id !== id);
        localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(categories));
    },

    // Budget
    getBudget() {
        return Number(localStorage.getItem(this.KEYS.BUDGET) || 0);
    },

    setBudget(amount) {
        localStorage.setItem(this.KEYS.BUDGET, amount);
    },

    // Export/Import
    exportAll() {
        return {
            transactions: this.getTransactions(),
            categories: this.getCategories(),
            budget: this.getBudget(),
            exportDate: new Date().toISOString()
        };
    },

    importAll(data) {
        if (data.transactions) localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
        if (data.categories) localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(data.categories));
        if (data.budget !== undefined) localStorage.setItem(this.KEYS.BUDGET, data.budget);
    },

    resetAll() {
        localStorage.removeItem(this.KEYS.TRANSACTIONS);
        localStorage.removeItem(this.KEYS.CATEGORIES);
        localStorage.removeItem(this.KEYS.BUDGET);
        this.init();
    }
};

// Initialize on load
Storage.init();
