// Gestor de gráficos usando Chart.js - Solo gráfico circular
class ChartManager {
    static charts = {};

    /**
     * Crea el gráfico circular de distribución de equivalencias
     */
    static createDistributionChart(stats) {
        const ctx = document.getElementById('distributionChart');
        if (!ctx) {
            console.error('Canvas distributionChart no encontrado');
            return;
        }

        // Destruir gráfico existente si existe
        if (this.charts.distribution) {
            this.charts.distribution.destroy();
        }

        const data = {
            labels: ['Equivalencias Exactas', 'Equivalencias Parciales', 'Sin Equivalencia'],
            datasets: [{
                data: [stats.exactMatches, stats.partialMatches, stats.noMatches],
                backgroundColor: [
                    '#10b981', // Verde para exactas
                    '#f59e0b', // Amarillo para parciales
                    '#ef4444'  // Rojo para sin equivalencia
                ],
                borderColor: [
                    '#059669',
                    '#d97706', 
                    '#dc2626'
                ],
                borderWidth: 2,
                hoverOffset: 10
            }]
        };

        const config = {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 13,
                                family: 'Inter'
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#2563eb',
                        borderWidth: 1
                    }
                },
                cutout: '60%',
                animation: {
                    animateRotate: true,
                    duration: 1000
                }
            },
            plugins: [{
                id: 'centerText',
                beforeDraw: function(chart) {
                    const ctx = chart.ctx;
                    ctx.save();
                    
                    const centerX = chart.chartArea.left + (chart.chartArea.right - chart.chartArea.left) / 2;
                    const centerY = chart.chartArea.top + (chart.chartArea.bottom - chart.chartArea.top) / 2;
                    
                    // Texto principal - total
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.font = 'bold 28px Inter';
                    ctx.fillStyle = '#2563eb';
                    ctx.fillText(stats.exactMatches + stats.partialMatches + stats.noMatches, centerX, centerY - 10);
                    
                    // Texto secundario
                    ctx.font = '14px Inter';
                    ctx.fillStyle = '#64748b';
                    ctx.fillText('Transacciones', centerX, centerY + 15);
                    
                    ctx.restore();
                }
            }]
        };

        this.charts.distribution = new Chart(ctx, config);
        
        console.log('📊 Gráfico circular de distribución creado exitosamente');
    }

    /**
     * Actualiza el gráfico de distribución con nuevos datos
     */
    static updateDistributionChart(stats) {
        if (!this.charts.distribution) {
            this.createDistributionChart(stats);
            return;
        }

        const chart = this.charts.distribution;
        chart.data.datasets[0].data = [stats.exactMatches, stats.partialMatches, stats.noMatches];
        chart.update('active');
    }

    /**
     * Exporta el gráfico como imagen
     */
    static exportChart(chartId, filename = 'grafico.png') {
        const chart = this.charts[chartId];
        if (!chart) {
            console.error(`Gráfico ${chartId} no encontrado`);
            return;
        }

        const url = chart.toBase64Image();
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Destruye todos los gráficos
     */
    static destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    /**
     * Redimensiona todos los gráficos
     */
    static resizeAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }

    /**
     * Configuración de colores del tema
     */
    static getThemeColors() {
        return {
            primary: '#2563eb',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            gray: '#64748b',
            light: '#f1f5f9'
        };
    }
}

// Configuración global de Chart.js
Chart.defaults.font.family = 'Inter';
Chart.defaults.color = '#64748b';
Chart.defaults.plugins.legend.labels.usePointStyle = true;

// Auto-resize en cambio de tamaño de ventana
window.addEventListener('resize', () => {
    ChartManager.resizeAllCharts();
});

// Limpiar gráficos al salir de la página
window.addEventListener('beforeunload', () => {
    ChartManager.destroyAllCharts();
});