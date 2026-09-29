// Main application logic
const App = {
    currentPage: null,
    currentMonth: new Date(),

    init() {
        this.detectPage();
        this.renderCurrentDate();

        switch (this.currentPage) {
            case 'dashboard': this.renderDashboard(); break;
            case 'transaksi': this.renderTransaksi(); break;
            case 'rekap': this.renderRekap(); break;
            case 'kategori': this.renderKategori(); break;
            case 'pengaturan': this.renderPengaturan(); break;
        }
    },

    detectPage() {
        const path = window.location.pathname;
        if (path.endsWith('transaksi.html')) this.currentPage = 'transaksi';
        else if (path.endsWith('rekap.html')) this.currentPage = 'rekap';
        else if (path.endsWith('kategori.html')) this.currentPage = 'kategori';
        else if (path.endsWith('pengaturan.html')) this.currentPage = 'pengaturan';
        else this.currentPage = 'dashboard';
    },

    renderCurrentDate() {
        const el = document.getElementById('currentDate');
        if (el) {
            el.textContent = new Date().toLocaleDateString('id-ID', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            });
        }
    },

    // ========== DASHBOARD ==========
    renderDashboard() {
        const now = new Date();
        const monthKey = Utils.getMonthKey(now);
        const transactions = Storage.getTransactions();
        const monthTx = transactions.filter(t => t.date.startsWith(monthKey));

        const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

        document.getElementById('totalIncome').textContent = Utils.formatCurrency(income);
        document.getElementById('totalExpense').textContent = Utils.formatCurrency(expense);
        document.getElementById('totalBalance').textContent = Utils.formatCurrency(income - expense);

        const budget = Storage.getBudget();
        const remaining = budget > 0 ? budget - expense : 0;
        document.getElementById('remainingBudget').textContent = budget > 0 ? Utils.formatCurrency(remaining) : '-';

        // Recent transactions
        const recent = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        this.renderTransactionList('recentTransactions', recent, false);

        // Category chart
        const categories = Storage.getCategories();
        const categoryData = this.getCategoryData(monthTx, categories, 'expense');
        Chart.drawPie(document.getElementById('categoryChart'), categoryData);
    },

    // ========== TRANSAKSI ==========
    renderTransaksi() {
        this.populateCategorySelect();
        this.populateFilterMonth();
        this.setDefaultDate();

        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTransaction();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => this.resetForm());

        ['filterMonth', 'filterCategory', 'filterType'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.filterTransactions());
        });

        this.filterTransactions();
    },

    populateCategorySelect() {
        const categories = Storage.getCategories();
        const type = document.getElementById('type').value;
        const select = document.getElementById('category');
        const filterSelect = document.getElementById('filterCategory');

        select.innerHTML = '';
        categories.filter(c => c.type === type).forEach(c => {
            select.innerHTML += `<option value="${c.id}">${c.icon} ${Utils.escapeHtml(c.name)}</option>`;
        });

        // Filter select
        const currentVal = filterSelect.value;
        filterSelect.innerHTML = '<option value="">Semua Kategori</option>';
        categories.forEach(c => {
            filterSelect.innerHTML += `<option value="${c.id}">${c.icon} ${Utils.escapeHtml(c.name)}</option>`;
        });
        filterSelect.value = currentVal;
    },

    populateFilterMonth() {
        const transactions = Storage.getTransactions();
        const months = new Set();
        transactions.forEach(t => months.add(t.date.substr(0, 7)));
        const currentMonth = Utils.getMonthKey(new Date());
        months.add(currentMonth);

        const select = document.getElementById('filterMonth');
        select.innerHTML = '<option value="">Semua Bulan</option>';
        [...months].sort().reverse().forEach(m => {
            const [y, mo] = m.split('-');
            const d = new Date(y, mo - 1);
            select.innerHTML += `<option value="${m}">${Utils.formatMonthYear(d)}</option>`;
        });
    },

    setDefaultDate() {
        document.getElementById('date').value = Utils.getToday();
        document.getElementById('type').addEventListener('change', () => this.populateCategorySelect());
    },

    saveTransaction() {
        const id = document.getElementById('transactionId').value || Utils.generateId();
        const transaction = {
            id,
            type: document.getElementById('type').value,
            amount: Number(document.getElementById('amount').value),
            category: document.getElementById('category').value,
            date: document.getElementById('date').value,
            note: document.getElementById('note').value.trim()
        };
        Storage.saveTransaction(transaction);
        this.resetForm();
        this.filterTransactions();
        this.populateFilterMonth();
        alert('✅ Transaksi berhasil disimpan!');
    },

    resetForm() {
        document.getElementById('transactionForm').reset();
        document.getElementById('transactionId').value = '';
        document.getElementById('date').value = Utils.getToday();
        document.getElementById('formTitle').textContent = 'Tambah Transaksi';
        document.getElementById('cancelBtn').style.display = 'none';
        this.populateCategorySelect();
    },

    editTransaction(id) {
        const t = Storage.getTransactions().find(x => x.id === id);
        if (!t) return;
        document.getElementById('transactionId').value = t.id;
        document.getElementById('type').value = t.type;
        this.populateCategorySelect();
        document.getElementById('category').value = t.category;
        document.getElementById('amount').value = t.amount;
        document.getElementById('date').value = t.date;
        document.getElementById('note').value = t.note || '';
        document.getElementById('formTitle').textContent = 'Edit Transaksi';
        document.getElementById('cancelBtn').style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    deleteTransaction(id) {
        if (confirm('Yakin hapus transaksi ini?')) {
            Storage.deleteTransaction(id);
            this.filterTransactions();
        }
    },

    filterTransactions() {
        const month = document.getElementById('filterMonth').value;
        const category = document.getElementById('filterCategory').value;
        const type = document.getElementById('filterType').value;

        let transactions = Storage.getTransactions();
        if (month) transactions = transactions.filter(t => t.date.startsWith(month));
        if (category) transactions = transactions.filter(t => t.category === category);
        if (type) transactions = transactions.filter(t => t.type === type);

        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        this.renderTransactionList('transactionList', transactions, true);
    },

    renderTransactionList(containerId, transactions, showActions) {
        const container = document.getElementById(containerId);
        const categories = Storage.getCategories();

        if (transactions.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>📭 Belum ada transaksi</p></div>';
            return;
        }

        container.innerHTML = transactions.map(t => {
            const cat = categories.find(c => c.id === t.category) || { icon: '📦', name: 'Tidak diketahui' };
            return `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-icon">${cat.icon}</div>
                        <div class="transaction-details">
                            <h4>${Utils.escapeHtml(t.note || cat.name)}</h4>
                            <p>${cat.name} • ${Utils.formatDate(t.date)}</p>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;">
                        <div class="transaction-amount ${t.type}">
                            ${t.type === 'income' ? '+' : '-'} ${Utils.formatCurrency(t.amount)}
                        </div>
                        ${showActions ? `
                            <div class="transaction-actions">
                                <button onclick="App.editTransaction('${t.id}')" title="Edit">✏️</button>
                                <button onclick="App.deleteTransaction('${t.id}')" title="Hapus">🗑️</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    // ========== REKAP ==========
    renderRekap() {
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1);
            this.updateRekap();
        });
        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1);
            this.updateRekap();
        });
        this.updateRekap();
    },

    updateRekap() {
        const monthKey = Utils.getMonthKey(this.currentMonth);
        document.getElementById('selectedMonth').textContent = Utils.formatMonthYear(this.currentMonth);

        const transactions = Storage.getTransactions().filter(t => t.date.startsWith(monthKey));
        const categories = Storage.getCategories();

        const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

        document.getElementById('monthIncome').textContent = Utils.formatCurrency(income);
        document.getElementById('monthExpense').textContent = Utils.formatCurrency(expense);
        document.getElementById('monthBalance').textContent = Utils.formatCurrency(income - expense);

        // Daily chart
        const daysInMonth = Utils.daysInMonth(this.currentMonth);
        const dailyLabels = [];
        const dailyExpense = [];
        const dailyIncome = [];
        for (let d = 1; d <= daysInMonth; d++) {
            dailyLabels.push(d);
            const dayKey = `${monthKey}-${String(d).padStart(2, '0')}`;
            dailyExpense.push(transactions.filter(t => t.date === dayKey && t.type === 'expense').reduce((s, t) => s + t.amount, 0));
            dailyIncome.push(transactions.filter(t => t.date === dayKey && t.type === 'income').reduce((s, t) => s + t.amount, 0));
        }
        Chart.drawBar(document.getElementById('dailyChart'), dailyLabels, [
            { label: 'Pengeluaran', data: dailyExpense },
            { label: 'Pemasukan', data: dailyIncome }
        ]);

        // Category pie
        const categoryData = this.getCategoryData(transactions, categories, 'expense');
        Chart.drawPie(document.getElementById('monthlyCategoryChart'), categoryData);

        // Category table
        const totalExpense = categoryData.reduce((s, c) => s + c.value, 0);
        document.getElementById('categoryRecap').innerHTML = categoryData.length === 0
            ? '<tr><td colspan="4" style="text-align:center;color:#6b7280;padding:20px;">Belum ada data</td></tr>'
            : categoryData.map(c => `
                <tr>
                    <td>${c.icon} ${Utils.escapeHtml(c.label)}</td>
                    <td>${c.count}x</td>
                    <td>${Utils.formatCurrency(c.value)}</td>
                    <td>${totalExpense > 0 ? ((c.value / totalExpense) * 100).toFixed(1) : 0}%</td>
                </tr>
            `).join('');

        // Trend 6 months
        const trendLabels = [];
        const trendExpense = [];
        const trendIncome = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - i, 1);
            const mk = Utils.getMonthKey(d);
            trendLabels.push(d.toLocaleDateString('id-ID', { month: 'short' }));
            const mTx = Storage.getTransactions().filter(t => t.date.startsWith(mk));
            trendExpense.push(mTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
            trendIncome.push(mTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0));
        }
        Chart.drawBar(document.getElementById('trendChart'), trendLabels, [
            { label: 'Pengeluaran', data: trendExpense },
            { label: 'Pemasukan', data: trendIncome }
        ]);
    },

    getCategoryData(transactions, categories, type) {
        const map = {};
        transactions.filter(t => t.type === type).forEach(t => {
            if (!map[t.category]) map[t.category] = { value: 0, count: 0 };
            map[t.category].value += t.amount;
            map[t.category].count += 1;
        });
        return Object.keys(map).map(catId => {
            const cat = categories.find(c => c.id === catId) || { name: 'Lainnya', icon: '📦' };
            return {
                label: cat.name,
                icon: cat.icon,
                value: map[catId].value,
                count: map[catId].count
            };
        }).sort((a, b) => b.value - a.value);
    },

    // ========== KATEGORI ==========
    renderKategori() {
        document.getElementById('categoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCategory();
        });
        this.renderCategoryList();
    },

    saveCategory() {
        const category = {
            id: Utils.generateId(),
            name: document.getElementById('categoryName').value.trim(),
            type: document.getElementById('categoryType').value,
            icon: document.getElementById('categoryIcon').value.trim() || '📦'
        };
        Storage.saveCategory(category);
        document.getElementById('categoryForm').reset();
        this.renderCategoryList();
    },

    deleteCategory(id) {
        const transactions = Storage.getTransactions();
        const used = transactions.some(t => t.category === id);
        if (used) {
            alert('⚠️ Kategori ini masih digunakan oleh transaksi. Hapus transaksi terkait terlebih dahulu.');
            return;
        }
        if (confirm('Yakin hapus kategori ini?')) {
            Storage.deleteCategory(id);
            this.renderCategoryList();
        }
    },

    renderCategoryList() {
        const categories = Storage.getCategories();
        const container = document.getElementById('categoryList');
        container.innerHTML = categories.map(c => `
            <div class="category-item">
                <div class="category-item-info">
                    <span class="category-item-icon">${c.icon}</span>
                    <div>
                        <strong>${Utils.escapeHtml(c.name)}</strong>
                        <p style="font-size:0.75rem;color:#6b7280;">${c.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</p>
                    </div>
                </div>
                <div class="category-item-actions">
                    <button onclick="App.deleteCategory('${c.id}')" title="Hapus">🗑️</button>
                </div>
            </div>
        `).join('');
    },

    // ========== PENGATURAN ==========
    renderPengaturan() {
        document.getElementById('monthlyBudget').value = Storage.getBudget() || '';

        document.getElementById('saveBudget').addEventListener('click', () => {
            const val = Number(document.getElementById('monthlyBudget').value);
            Storage.setBudget(val);
            alert('✅ Budget berhasil disimpan!');
        });

        document.getElementById('exportJSON').addEventListener('click', () => this.exportJSON());
        document.getElementById('exportCSV').addEventListener('click', () => this.exportCSV());

        document.getElementById('importFile').addEventListener('change', (e) => this.importData(e));

        document.getElementById('resetData').addEventListener('click', () => {
            if (confirm('⚠️ PERINGATAN: Semua data akan dihapus permanen! Lanjutkan?')) {
                if (confirm('Benar-benar yakin? Ketik OK untuk konfirmasi.')) {
                    Storage.resetAll();
                    alert('✅ Semua data telah direset.');
                    location.reload();
                }
            }
        });
    },

    exportJSON() {
        const data = Storage.exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.downloadBlob(blob, `kendali-pengeluaran-${Utils.getToday()}.json`);
    },

    exportCSV() {
        const transactions = Storage.getTransactions();
        const categories = Storage.getCategories();
        const catMap = {};
        categories.forEach(c => catMap[c.id] = c.name);

        let csv = 'Tanggal,Tipe,Kategori,Jumlah,Catatan\n';
        transactions.forEach(t => {
            csv += `${t.date},${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'},"${catMap[t.category] || ''}",${t.amount},"${(t.note || '').replace(/"/g, '""')}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        this.downloadBlob(blob, `kendali-pengeluaran-${Utils.getToday()}.csv`);
    },

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },

    importData(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if (confirm('Import akan menimpa data saat ini. Lanjutkan?')) {
                    Storage.importAll(data);
                    alert('✅ Data berhasil diimport!');
                    location.reload();
                }
            } catch (err) {
                alert('❌ File tidak valid: ' + err.message);
            }
        };
        reader.readAsText(file);
    }
};

// Start app
document.addEventListener('DOMContentLoaded', () => App.init());
