// Export Module
const Export = {
    generateCSV() {
        const transactions = State.transactions;
        if (transactions.length === 0) { UI.showToast('No transactions to export', 'warning'); return; }

        const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Recurring'];
        const rows = transactions.map(t => {
            const cat = State.getCategoryInfo(t.category);
            return [t.date, t.type, cat.name, `"${t.description}"`, t.amount, t.recurring || 'none'];
        });

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        this.downloadFile(csv, 'budget-planner-transactions.csv', 'text/csv');
        UI.showToast('CSV exported successfully', 'success');
    },

    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    printReport() {
        window.print();
        UI.showToast('Print dialog opened', 'success');
    }
};
