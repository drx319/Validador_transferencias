// Utilidades para UI y interfaz de usuario
class UIUtils {
    static showNotification(message, type = 'info', duration = 3000) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, duration);
        
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
    }
    
    static createElement(tag, className, content) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (content) element.textContent = content;
        return element;
    }
    
    static formatTableCell(value, type = 'text') {
        const cell = document.createElement('td');
        
        switch (type) {
            case 'currency':
                cell.textContent = Formatter.formatCurrency(value);
                cell.className = value < 0 ? 'negative' : 'positive';
                break;
            case 'date':
                cell.textContent = Formatter.formatDate(value);
                break;
            case 'percentage':
                cell.textContent = `${Math.round(value * 100)}%`;
                break;
            default:
                cell.textContent = value || '-';
        }
        
        return cell;
    }
}

// Validador de datos
class Validator {
    static isValidCSV(content) {
        if (!content || typeof content !== 'string') return false;
        
        const lines = content.trim().split('\n');
        if (lines.length < 2) return false; // Al menos header + 1 fila
        
        // Verificar que cada línea tenga el formato esperado (ahora con comas)
        return lines.every(line => {
            const fields = line.split(',');
            return fields.length === 4; // Fecha,Descripción,Referencia,Valor
        });
    }
    
    static isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }
    
    static isValidAmount(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }
    
    static validateAPIResponse(data) {
        if (!Array.isArray(data)) return false;
        
        return data.every(item => 
            item.comprobante && 
            item.fecha && 
            typeof item.valor === 'number' &&
            item.producto_destino
        );
    }
}

// Formateador de datos
class Formatter {
    static formatCurrency(amount) {
        if (typeof amount !== 'number') {
            amount = parseFloat(amount) || 0;
        }
        
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Math.abs(amount));
    }
    
    static formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-CO', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    }
    
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    static formatPercentage(value, decimals = 1) {
        return `${(value * 100).toFixed(decimals)}%`;
    }
}

// Utilidades para manipulación de datos
class DataUtils {
    static parseCSV(content) {
        if (!Validator.isValidCSV(content)) {
            throw new Error('Formato de CSV inválido');
        }
        
        const lines = content.trim().split('\n');
        const data = [];
        
        // Saltar la primera línea (header)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const fields = line.split(',');
            if (fields.length === 4) {
                data.push({
                    fecha: fields[0].trim(),
                    descripcion: fields[1].trim(),
                    referencia: fields[2].trim(),
                    valor: parseFloat(fields[3].trim()) || 0
                });
            }
        }
        
        return data;
    }
    
    static resultsToCSV(results) {
        const headers = [
            'Estado', 'Comprobante API', 'Fecha API', 'Valor API',
            'Fecha CSV', 'Valor CSV', 'Referencia CSV', 'Confianza'
        ];
        
        let csvContent = headers.join(',') + '\n';
        
        results.forEach(result => {
            const row = [
                result.status,
                result.apiTransaction.comprobante,
                result.apiTransaction.fecha,
                result.apiTransaction.valor,
                result.csvMatch ? result.csvMatch.fecha : '',
                result.csvMatch ? result.csvMatch.valor : '',
                result.csvMatch ? result.csvMatch.referencia : '',
                Math.round(result.confidence * 100) + '%'
            ];
            
            csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
        });
        
        return csvContent;
    }
    
    static downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    }
    
    static normalizeString(str) {
        return str.toLowerCase()
                 .normalize('NFD')
                 .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
                 .replace(/[^\w\s]/gi, '') // Quitar caracteres especiales
                 .trim();
    }
    
    static extractNumbers(str) {
        const matches = str.match(/\d+/g);
        return matches ? matches.join('') : '';
    }
    
    static similarity(str1, str2) {
        const s1 = DataUtils.normalizeString(str1);
        const s2 = DataUtils.normalizeString(str2);
        
        if (s1 === s2) return 1.0;
        
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = DataUtils.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }
    
    static levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
        
        for (let i = 0; i <= str1.length; i += 1) {
            matrix[0][i] = i;
        }
        
        for (let j = 0; j <= str2.length; j += 1) {
            matrix[j][0] = j;
        }
        
        for (let j = 1; j <= str2.length; j += 1) {
            for (let i = 1; i <= str1.length; i += 1) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + indicator,
                );
            }
        }
        
        return matrix[str2.length][str1.length];
    }
}

// Utilidades estadísticas
class StatsUtils {
    static calculateStats(results) {
        const stats = {
            total: results.length,
            exactMatches: 0,
            partialMatches: 0,
            noMatches: 0,
            averageConfidence: 0,
            totalConfidence: 0
        };
        
        results.forEach(result => {
            stats.totalConfidence += result.confidence;
            
            switch (result.matchType) {
                case 'exact':
                    stats.exactMatches++;
                    break;
                case 'partial':
                    stats.partialMatches++;
                    break;
                default:
                    stats.noMatches++;
            }
        });
        
        stats.averageConfidence = stats.total > 0 ? stats.totalConfidence / stats.total : 0;
        
        return stats;
    }
    
    static getDistributionData(stats) {
        return {
            labels: ['Exactas', 'Parciales', 'Sin Equivalencia'],
            data: [stats.exactMatches, stats.partialMatches, stats.noMatches],
            colors: ['#10b981', '#f59e0b', '#ef4444']
        };
    }
    
    static getValueAnalysis(results) {
        const ranges = {
            'Menos de $10K': 0,
            '$10K - $50K': 0,
            '$50K - $100K': 0,
            'Más de $100K': 0
        };
        
        results.forEach(result => {
            const value = Math.abs(result.apiTransaction.valor);
            
            if (value < 10000) {
                ranges['Menos de $10K']++;
            } else if (value < 50000) {
                ranges['$10K - $50K']++;
            } else if (value < 100000) {
                ranges['$50K - $100K']++;
            } else {
                ranges['Más de $100K']++;
            }
        });
        
        return {
            labels: Object.keys(ranges),
            data: Object.values(ranges),
            colors: ['#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b']
        };
    }
}