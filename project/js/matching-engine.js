// Motor de matching inteligente para análisis de transacciones bancarias
// ANÁLISIS INVERTIDO: Cada transacción del API busca equivalencias en el CSV

class MatchingEngine {
    static THRESHOLDS = {
        EXACT_MATCH: 0.95,
        PARTIAL_MATCH: 0.7,
        DATE_TOLERANCE_DAYS: 3,
        VALUE_TOLERANCE_PERCENT: 0.05
    };

    /**
     * Analiza transacciones del API buscando equivalencias en datos CSV
     * @param {Array} apiData - Array de transacciones del API (base del análisis)
     * @param {Array} csvData - Array de datos CSV (donde buscar equivalencias)
     * @returns {Array} Array de resultados de matching
     */
    static analyzeTransactions(apiData, csvData) {
        if (!Array.isArray(apiData)) {
            throw new Error('Los datos del API deben ser un array de transacciones');
        }
        
        if (!Array.isArray(csvData) || csvData.length === 0) {
            throw new Error('Los datos CSV son requeridos para el análisis');
        }

        console.log(`🔍 Iniciando análisis invertido: ${apiData.length} transacciones API vs ${csvData.length} registros CSV`);

        const results = [];
        
        // Para cada transacción del API, buscar la mejor coincidencia en el CSV
        apiData.forEach((apiTransaction, index) => {
            console.log(`📊 Analizando transacción API ${index + 1}/${apiData.length}: ${apiTransaction.comprobante}`);
            
            const matchResult = this.findBestMatch(apiTransaction, csvData);
            results.push(matchResult);
        });

        console.log(`✅ Análisis completado. ${results.length} resultados generados`);
        return results;
    }

    /**
     * Encuentra la mejor coincidencia para una transacción del API en los datos CSV
     * @param {Object} apiTransaction - Transacción del API
     * @param {Array} csvData - Array de datos CSV
     * @returns {Object} Resultado de matching
     */
    static findBestMatch(apiTransaction, csvData) {
        let bestMatch = null;
        let bestConfidence = 0;
        let bestMatchType = 'none';

        // Evaluar cada registro CSV
        csvData.forEach(csvRecord => {
            const matchResult = this.evaluateMatch(apiTransaction, csvRecord);
            
            if (matchResult.confidence > bestConfidence) {
                bestConfidence = matchResult.confidence;
                bestMatch = csvRecord;
                bestMatchType = matchResult.matchType;
            }
        });

        // Determinar el estado final
        let status = 'Sin equivalencia';
        if (bestConfidence >= this.THRESHOLDS.EXACT_MATCH) {
            status = 'Equivalencia exacta';
        } else if (bestConfidence >= this.THRESHOLDS.PARTIAL_MATCH) {
            status = 'Equivalencia parcial';
        }

        return {
            apiTransaction,
            csvMatch: bestMatch,
            confidence: bestConfidence,
            matchType: bestMatchType,
            status: status,
            details: this.getMatchDetails(apiTransaction, bestMatch, bestConfidence)
        };
    }

    /**
     * Evalúa la coincidencia entre una transacción del API y un registro CSV
     * @param {Object} apiTransaction - Transacción del API
     * @param {Object} csvRecord - Registro CSV
     * @returns {Object} Resultado de evaluación
     */
    static evaluateMatch(apiTransaction, csvRecord) {
        const criteria = {
            value: this.evaluateValueMatch(apiTransaction.valor, csvRecord.valor),
            date: this.evaluateDateMatch(apiTransaction.fecha, csvRecord.fecha),
            reference: this.evaluateReferenceMatch(apiTransaction, csvRecord)
        };

        // Calcular confianza ponderada
        const weights = { value: 0.4, date: 0.3, reference: 0.3 };
        const confidence = (
            criteria.value.score * weights.value +
            criteria.date.score * weights.date +
            criteria.reference.score * weights.reference
        );

        // Determinar tipo de coincidencia
        let matchType = 'none';
        if (confidence >= this.THRESHOLDS.EXACT_MATCH) {
            matchType = 'exact';
        } else if (confidence >= this.THRESHOLDS.PARTIAL_MATCH) {
            matchType = 'partial';
        }

        return {
            confidence,
            matchType,
            criteria
        };
    }

    /**
     * Evalúa coincidencia de valores monetarios
     */
    static evaluateValueMatch(apiValue, csvValue) {
        if (typeof apiValue !== 'number' || typeof csvValue !== 'number') {
            return { score: 0, details: 'Valores no numéricos' };
        }

        // Comparar valores absolutos (el CSV puede tener signos opuestos)
        const absApiValue = Math.abs(apiValue);
        const absCsvValue = Math.abs(csvValue);
        
        if (absApiValue === absCsvValue) {
            return { score: 1.0, details: 'Valor exacto' };
        }

        // Calcular tolerancia porcentual
        const difference = Math.abs(absApiValue - absCsvValue);
        const tolerance = Math.max(absApiValue, absCsvValue) * this.THRESHOLDS.VALUE_TOLERANCE_PERCENT;

        if (difference <= tolerance) {
            const score = 1 - (difference / Math.max(absApiValue, absCsvValue));
            return { score: Math.max(0.8, score), details: `Valor similar (diferencia: ${difference})` };
        }

        // Coincidencia parcial por proximidad
        const maxDifference = Math.max(absApiValue, absCsvValue) * 0.2; // 20% de diferencia máxima
        if (difference <= maxDifference) {
            const score = 1 - (difference / maxDifference);
            return { score: score * 0.6, details: `Valor aproximado (diferencia: ${difference})` };
        }

        return { score: 0, details: `Valores muy diferentes (${absApiValue} vs ${absCsvValue})` };
    }

    /**
     * Evalúa coincidencia de fechas
     */
    static evaluateDateMatch(apiDate, csvDate) {
        try {
            const date1 = new Date(apiDate);
            const date2 = new Date(csvDate);

            if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
                return { score: 0, details: 'Fechas inválidas' };
            }

            // Extraer solo las fechas (sin horas)
            const apiDateOnly = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
            const csvDateOnly = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());

            const diffTime = Math.abs(apiDateOnly - csvDateOnly);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                return { score: 1.0, details: 'Fecha exacta' };
            } else if (diffDays <= this.THRESHOLDS.DATE_TOLERANCE_DAYS) {
                const score = 1 - (diffDays / this.THRESHOLDS.DATE_TOLERANCE_DAYS) * 0.2;
                return { score: Math.max(0.7, score), details: `Diferencia: ${diffDays} día(s)` };
            } else if (diffDays <= 7) {
                const score = 1 - (diffDays / 7) * 0.5;
                return { score: score * 0.4, details: `Diferencia: ${diffDays} día(s)` };
            }

            return { score: 0, details: `Fechas muy diferentes (${diffDays} días)` };

        } catch (error) {
            return { score: 0, details: 'Error al procesar fechas' };
        }
    }

    /**
     * Evalúa coincidencia de referencias y descripciones
     */
    static evaluateReferenceMatch(apiTransaction, csvRecord) {
        const comprobante = apiTransaction.comprobante || '';
        const referencia = csvRecord.referencia || '';
        const descripcion = csvRecord.descripcion || '';
        
        // Extraer números de las referencias
        const comprobanteNumbers = DataUtils.extractNumbers(comprobante);
        const referenciaNumbers = DataUtils.extractNumbers(referencia);
        
        // Coincidencia exacta de números
        if (comprobanteNumbers && referenciaNumbers && comprobanteNumbers === referenciaNumbers) {
            return { score: 1.0, details: 'Números de referencia coinciden exactamente' };
        }

        // Coincidencia parcial de números
        if (comprobanteNumbers && referenciaNumbers) {
            const similarity = DataUtils.similarity(comprobanteNumbers, referenciaNumbers);
            if (similarity > 0.8) {
                return { score: similarity * 0.9, details: `Números similares (${Math.round(similarity * 100)}%)` };
            }
        }

        // Similitud textual del comprobante con referencia
        const refSimilarity = DataUtils.similarity(comprobante, referencia);
        if (refSimilarity > 0.7) {
            return { score: refSimilarity * 0.8, details: `Referencias similares (${Math.round(refSimilarity * 100)}%)` };
        }

        // Similitud con descripción (menor peso)
        const descSimilarity = DataUtils.similarity(comprobante, descripcion);
        if (descSimilarity > 0.6) {
            return { score: descSimilarity * 0.5, details: `Similar a descripción (${Math.round(descSimilarity * 100)}%)` };
        }

        // Buscar coincidencias parciales en nombres de destino
        if (apiTransaction.producto_destino?.nombre) {
            const nombreSimilarity = DataUtils.similarity(
                apiTransaction.producto_destino.nombre, 
                descripcion
            );
            if (nombreSimilarity > 0.5) {
                return { score: nombreSimilarity * 0.6, details: `Nombre destino similar (${Math.round(nombreSimilarity * 100)}%)` };
            }
        }

        return { score: 0, details: 'Sin similitud en referencias' };
    }

    /**
     * Genera detalles del matching para debugging
     */
    static getMatchDetails(apiTransaction, csvMatch, confidence) {
        if (!csvMatch) {
            return 'No se encontró coincidencia';
        }

        const details = [];
        
        details.push(`API: ${apiTransaction.comprobante} - $${apiTransaction.valor} (${apiTransaction.fecha})`);
        details.push(`CSV: ${csvMatch.referencia} - $${csvMatch.valor} (${csvMatch.fecha})`);
        details.push(`Confianza: ${Math.round(confidence * 100)}%`);

        if (apiTransaction.producto_destino?.nombre) {
            details.push(`Destino: ${apiTransaction.producto_destino.nombre}`);
        }

        return details.join(' | ');
    }

    /**
     * Obtiene estadísticas del análisis
     */
    static getAnalysisStats(results) {
        const stats = {
            total: results.length,
            exactMatches: results.filter(r => r.matchType === 'exact').length,
            partialMatches: results.filter(r => r.matchType === 'partial').length,
            noMatches: results.filter(r => r.matchType === 'none').length
        };

        stats.matchPercentage = stats.total > 0 ? 
            ((stats.exactMatches + stats.partialMatches) / stats.total) * 100 : 0;

        return stats;
    }
}