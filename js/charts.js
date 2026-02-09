// Charts Module
const Charts = {
    spendingChart: null,
    trendChart: null,

    defaultOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
    },

    getColors() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return {
            text: isDark ? '#F1F5F9' : '#111827',
            textSecondary: isDark ? '#94A3B8' : '#6B7280',
            grid: isDark ? '#334155' : '#E5E7EB',
            background: isDark ? '#1E293B' : '#FFFFFF'
        };
    },

    categoryColors: {
        'housing': '#8B5CF6', 'food': '#F59E0B', 'transportation': '#3B82F6',
        'utilities': '#10B981', 'entertainment': '#EC4899', 'healthcare': '#EF4444',
        'shopping': '#F97316', 'personal': '#6366F1', 'education': '#14B8A6',
        'other-expense': '#6B7280'
    },

    init() {
        this.initSpendingChart();
        this.initTrendChart();
    },

    initSpendingChart() {
        const ctx = document.getElementById('spending-chart');
        if (!ctx) return;
        const colors = this.getColors();
        this.spendingChart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: [], datasets: [{ data: [], backgroundColor: [], borderWidth: 0, hoverOffset: 10 }] },
            options: {
                ...this.defaultOptions, cutout: '70%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: colors.background, titleColor: colors.text,
                        bodyColor: colors.textSecondary, borderColor: colors.grid, borderWidth: 1, padding: 12,
                        callbacks: { label: (ctx) => ` ${UI.formatCurrency(ctx.raw)} (${((ctx.raw / ctx.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%)` }
                    }
                }
            }
        });
    },

    initTrendChart() {
        const ctx = document.getElementById('trend-chart');
        if (!ctx) return;
        const colors = this.getColors();
        this.trendChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    { label: 'Income', data: [], backgroundColor: 'rgba(16, 185, 129, 0.8)', borderRadius: 4, barPercentage: 0.6 },
                    { label: 'Expenses', data: [], backgroundColor: 'rgba(239, 68, 68, 0.8)', borderRadius: 4, barPercentage: 0.6 }
                ]
            },
            options: {
                ...this.defaultOptions,
                plugins: {
                    legend: { display: true, position: 'top', align: 'end', labels: { boxWidth: 12, padding: 16, color: colors.textSecondary } },
                    tooltip: { backgroundColor: colors.background, titleColor: colors.text, bodyColor: colors.textSecondary, borderColor: colors.grid, borderWidth: 1, padding: 12, callbacks: { label: (c) => ` ${c.dataset.label}: ${UI.formatCurrency(c.raw)}` } }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { color: colors.textSecondary } },
                    y: { beginAtZero: true, grid: { color: colors.grid }, ticks: { color: colors.textSecondary, callback: (v) => UI.formatCurrency(v) } }
                }
            }
        });
    },

    updateAll() { this.updateSpendingChart(); this.updateTrendChart(); },

    updateSpendingChart() {
        if (!this.spendingChart) return;
        const summary = State.getSummary();
        const labels = [], data = [], colors = [];
        Object.entries(summary.categories).sort((a, b) => b[1] - a[1]).forEach(([cat, amt]) => {
            const info = State.getCategoryInfo(cat);
            labels.push(info.name); data.push(amt); colors.push(this.categoryColors[cat] || '#6B7280');
        });
        this.spendingChart.data.labels = labels;
        this.spendingChart.data.datasets[0].data = data;
        this.spendingChart.data.datasets[0].backgroundColor = colors;
        this.spendingChart.update('none');
        this.renderSpendingLegend(labels, colors, data);
    },

    renderSpendingLegend(labels, colors, data) {
        const container = document.getElementById('spending-legend');
        if (!container) return;
        const total = data.reduce((a, b) => a + b, 0);
        container.innerHTML = labels.map((l, i) => `<div class="legend-item"><span class="legend-color" style="background:${colors[i]}"></span><span>${l} (${total > 0 ? ((data[i] / total) * 100).toFixed(0) : 0}%)</span></div>`).join('');
    },

    updateTrendChart() {
        if (!this.trendChart) return;
        const trend = State.getMonthlyTrend();
        const colors = this.getColors();
        this.trendChart.data.labels = trend.map(t => t.month);
        this.trendChart.data.datasets[0].data = trend.map(t => t.income);
        this.trendChart.data.datasets[1].data = trend.map(t => t.expenses);
        this.trendChart.options.scales.x.ticks.color = colors.textSecondary;
        this.trendChart.options.scales.y.ticks.color = colors.textSecondary;
        this.trendChart.options.scales.y.grid.color = colors.grid;
        this.trendChart.update('none');
    },

    refresh() {
        if (this.spendingChart) { this.spendingChart.destroy(); this.initSpendingChart(); this.updateSpendingChart(); }
        if (this.trendChart) { this.trendChart.destroy(); this.initTrendChart(); this.updateTrendChart(); }
    }
};
