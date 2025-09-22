class AnalysisBancario {
    constructor() {
        this.csvData = [];
        this.apiData = [];
        this.analysisResults = [];
        this.selectedFolderPath = '';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.setupFolderSelector();
        console.log('🏦 Análisis Bancario Pro iniciado');
    }

    setupEventListeners() {
        // CSV file selection
        document.getElementById('selectFileBtn').addEventListener('click', () => {
            document.getElementById('csvFile').click();
        });

        document.getElementById('csvFile').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });

        // Action buttons
        document.getElementById('loadSampleBtn').addEventListener('click', () => {
            this.loadSampleData();
        });

        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.executeAnalysis();
        });

        // Export functionality
        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.exportResults();
        });

        // Search filter
        document.getElementById('searchFilter')?.addEventListener('input', (e) => {
            this.filterResults(e.target.value);
        });

        // Modal functionality
        this.setupModal();
    }

    setupDragAndDrop() {
        const dropZone = document.getElementById('dropZone');

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('dragover');
            });
        });

        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });
    }

    setupFolderSelector() {
        const folderInput = document.getElementById('folderInput');
        const folderSelectBtn = document.getElementById('folderSelectBtn');
        const selectedPathDiv = document.getElementById('selectedPath');
        const pathTextSpan = document.getElementById('pathText');
        const clearPathBtn = document.getElementById('clearPath');

        // Cuando se hace clic en el botón, activar el input oculto
        folderSelectBtn.addEventListener('click', () => {
            folderInput.click();
        });

        // Cuando se selecciona una carpeta, extraer solo la ruta
        folderInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                // Extraer la ruta de la carpeta del primer archivo
                const firstFile = files[0];
                const fullPath = firstFile.webkitRelativePath;
                
                // Obtener solo el directorio base sin el archivo
                const pathParts = fullPath.split('/');
                pathParts.pop(); // Quitar el nombre del archivo
                let folderPath = pathParts.join('/');
                
                // Asegurar que termine en slash
                if (folderPath && !folderPath.endsWith('/')) {
                    folderPath += '/';
                }

                // En navegadores que soportan la API File System Access (Chrome)
                if (firstFile.webkitRelativePath) {
                    // Construir ruta completa aproximada
                    const approximatePath = this.constructApproximatePath(folderPath);
                    this.selectedFolderPath = approximatePath;
                    
                    // Mostrar la ruta seleccionada
                    pathTextSpan.textContent = this.selectedFolderPath;
                    selectedPathDiv.style.display = 'flex';
                    folderSelectBtn.style.display = 'none';
                    
                    // Actualizar estado del botón de análisis
                    this.updateAnalyzeButtonState();
                    
                    UIUtils.showNotification('Carpeta seleccionada correctamente', 'success');
                    console.log('📁 Ruta de carpeta seleccionada:', this.selectedFolderPath);
                }
            }
        });

        // Limpiar selección
        clearPathBtn.addEventListener('click', () => {
            this.clearFolderSelection();
        });
    }

    /**
     * Construye una ruta basada en la estructura relativa seleccionada por el usuario
     * Mantiene la ruta original sin agregar prefijos automáticos
     */
    constructApproximatePath(relativePath) {
        // Usar la ruta tal como la seleccionó el usuario
        // El navegador proporciona la estructura relativa real de la carpeta
        if (relativePath && relativePath !== '/' && relativePath !== '') {
            // Si es una ruta relativa, intentamos construir una ruta absoluta típica
            // Pero manteniendo la estructura original seleccionada
            return `D:/talentotechia/python/images/${relativePath}`;
        }
        
        // Si no hay ruta específica, usar ruta base genérica
        return 'D:/talentotechia/python/images/';
    }

    clearFolderSelection() {
        this.selectedFolderPath = '';
        document.getElementById('selectedPath').style.display = 'none';
        document.getElementById('folderSelectBtn').style.display = 'flex';
        document.getElementById('folderInput').value = '';
        this.updateAnalyzeButtonState();
        
        UIUtils.showNotification('Selección de carpeta eliminada', 'warning');
    }

    updateAnalyzeButtonState() {
        const analyzeBtn = document.getElementById('analyzeBtn');
        const hasCSV = this.csvData.length > 0;
        const hasFolder = this.selectedFolderPath !== '';
        
        analyzeBtn.disabled = !(hasCSV && hasFolder);
    }

    handleFileSelect(file) {
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.csv')) {
            UIUtils.showNotification('Por favor selecciona un archivo CSV válido', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csvContent = e.target.result;
                this.csvData = DataUtils.parseCSV(csvContent);
                
                this.displayFileInfo(file);
                this.renderCSVTable();
                this.updateAnalyzeButtonState();
                
                UIUtils.showNotification(`Archivo CSV cargado: ${this.csvData.length} registros`, 'success');
            } catch (error) {
                console.error('Error al procesar CSV:', error);
                UIUtils.showNotification('Error al procesar el archivo CSV', 'error');
            }
        };
        reader.readAsText(file);
    }

    displayFileInfo(file) {
        const fileInfo = document.getElementById('fileInfo');
        fileInfo.innerHTML = `
            <p><strong>Archivo:</strong> ${file.name}</p>
            <p><strong>Tamaño:</strong> ${Formatter.formatFileSize(file.size)}</p>
            <p><strong>Registros:</strong> ${this.csvData.length}</p>
        `;
        fileInfo.style.display = 'block';
    }

    loadSampleData() {
        // Datos CSV de muestra (formato actualizado con datos reales)
        this.csvData = [
            { fecha: '09/03/2025', descripcion: 'PAGO PSE', referencia: 'trzxfks2oeec', valor: 6000 },
            { fecha: '09/03/2025', descripcion: 'PAGO PSE', referencia: 'trwciqdnwaec', valor: 20000 },
            { fecha: '09/01/2025', descripcion: 'PAGO PSE', referencia: '0000099100', valor: 80000 },
            { fecha: '08/31/2025', descripcion: 'PAGO PSE', referencia: 'treqfukbj2ec', valor: 34000 },
            { fecha: '08/29/2025', descripcion: 'PAGO PSE', referencia: 'trrmcfgofrec', valor: 41000 }
        ];

        // Simular selección de carpeta (con ruta genérica)
        this.selectedFolderPath = 'D:/talentotechia/python/images/test/';
        document.getElementById('pathText').textContent = this.selectedFolderPath;
        document.getElementById('selectedPath').style.display = 'flex';
        document.getElementById('folderSelectBtn').style.display = 'none';

        this.renderCSVTable();
        this.simulateAPIResponse();
        this.updateAnalyzeButtonState();

        UIUtils.showNotification('Datos de prueba cargados exitosamente', 'success');
        console.log('🎲 Datos de prueba cargados');
    }

    simulateAPIResponse() {
        // Simular respuesta del API con la estructura real
        this.apiData = [
            {
                comprobante: "trzxfks2oeec",
                fecha: "2025-09-03 17:09",
                image: "D:/talentotechia/python/images/bancolombia/ban1.jpeg",
                producto_destino: {
                    cuenta: "655-141729-99",
                    nombre: "drogueria el carruse",
                    tipo: "ahorros"
                },
                producto_origen: {
                    cuenta: "",
                    tipo: "ahorros"
                },
                valor: 6000
            },
            {
                comprobante: "abc123def456",
                fecha: "2025-09-04 14:30", 
                image: "D:/talentotechia/python/images/bancolombia/ban2.jpeg",
                producto_destino: {
                    cuenta: "789-012345-67",
                    nombre: "supermercado san pedro",
                    tipo: "corriente"
                },
                producto_origen: {
                    cuenta: "123-456789-01",
                    tipo: "ahorros"
                },
                valor: 15000
            },
            {
                comprobante: "xyz789ghi012",
                fecha: "2025-09-05 10:15",
                image: "D:/talentotechia/python/images/bancolombia/ban3.jpeg", 
                producto_destino: {
                    cuenta: "234-567890-12",
                    nombre: "farmacia salud total",
                    tipo: "ahorros"
                },
                producto_origen: {
                    cuenta: "",
                    tipo: "efectivo"
                },
                valor: 25000
            },
            {
                comprobante: "mno345pqr678",
                fecha: "2025-09-06 16:45",
                image: "D:/talentotechia/python/images/bancolombia/ban4.jpeg",
                producto_destino: {
                    cuenta: "456-789012-34", 
                    nombre: "tienda la economica",
                    tipo: "corriente"
                },
                producto_origen: {
                    cuenta: "655-141729-99",
                    tipo: "ahorros"
                },
                valor: 8500
            },
            {
                comprobante: "stu901vwx234",
                fecha: "2025-09-07 09:20",
                image: "D:/talentotechia/python/images/bancolombia/ban5.jpeg",
                producto_destino: {
                    cuenta: "567-890123-45",
                    nombre: "juan carlos mendez",
                    tipo: "ahorros"
                },
                producto_origen: {
                    cuenta: "655-141729-99", 
                    tipo: "ahorros"
                },
                valor: 12000
            }
        ];

        this.renderAPITable();
    }

    renderCSVTable() {
        const tbody = document.querySelector('#csvPreviewTable tbody');
        tbody.innerHTML = '';

        this.csvData.slice(0, 10).forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.fecha}</td>
                <td>${row.descripcion}</td>
                <td>${row.referencia}</td>
                <td>${Formatter.formatCurrency(row.valor)}</td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelector('.preview-section').style.display = 'block';
    }

    renderAPITable() {
        const tbody = document.querySelector('#apiPreviewTable tbody');
        tbody.innerHTML = '';

        console.log('Rendering API table. apiData is array:', Array.isArray(this.apiData));
        console.log('apiData length:', this.apiData.length);

        this.apiData.slice(0, 10).forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.comprobante}</td>
                <td>${row.fecha}</td>
                <td>${Formatter.formatCurrency(row.valor)}</td>
                <td>${row.producto_destino?.cuenta || 'N/A'}</td>
                <td>${row.producto_destino?.nombre || 'N/A'}</td>
                <td>
                    ${row.image ? 
                        `<button class="view-image-btn" onclick="window.bankingAnalyzer.openImageModal('${row.comprobante}', '${row.fecha}', ${row.valor}, '${row.image}')">
                            👁️ Ver Imagen
                        </button>` 
                        : 'Sin imagen'
                    }
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelector('.preview-section').style.display = 'block';
    }

    async executeAnalysis() {
        if (this.csvData.length === 0) {
            UIUtils.showNotification('Por favor carga un archivo CSV primero', 'error');
            return;
        }

        if (!this.selectedFolderPath) {
            UIUtils.showNotification('Por favor selecciona una carpeta de imágenes', 'error');
            return;
        }

        try {

             const btn = document.getElementById('analyzeBtn');

            // Deshabilitar y cambiar texto
            btn.disabled = true;
            btn.textContent = '🔍 Espere mientras se ejecuta el análisis';


            UIUtils.showNotification('Ejecutando análisis...', 'info');

            // Enviar datos al API simulado
            console.log('📤 Enviando ruta de carpeta al API:', this.selectedFolderPath);
            const apiResponse = await this.callAnalysisAPI(this.selectedFolderPath);
            
            // Análisis invertido: API como base, buscar en CSV
            this.analysisResults = MatchingEngine.analyzeTransactions(apiResponse, this.csvData);

            this.displayResults();
            UIUtils.showNotification('Análisis completado exitosamente', 'success');

            // Deshabilitar y cambiar texto
            btn.disabled = true;
            btn.textContent = '🔍 Ejecutar Análisis';

        } catch (error) {
            console.error('Error en análisis:', error);
            UIUtils.showNotification('Error durante el análisis', 'error');
        }
    }

    async callAnalysisAPI(folderPath) {
        // Llamada real al API
        console.log('🔗 Llamando al API con carpeta:', folderPath);
        
        return await fetch('http://localhost:5000/process_path', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                path: folderPath 
            })
        }).then(response => response.json());

        // Para esta demostración, retornamos los datos simulados
        // return this.apiData;
    }

    displayResults() {
        const stats = StatsUtils.calculateStats(this.analysisResults);
        
        // Actualizar tarjetas de estadísticas
        document.getElementById('totalMatches').textContent = stats.exactMatches;
        document.getElementById('partialMatches').textContent = stats.partialMatches;
        document.getElementById('noMatches').textContent = stats.noMatches;

        // Generar gráficos
        ChartManager.createDistributionChart(stats);

        // Renderizar tabla de resultados
        this.renderResultsTable();

        // Mostrar sección de resultados
        document.querySelector('.results-section').style.display = 'block';
        
        // Scroll suave a resultados
        document.querySelector('.results-section').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }

    renderResultsTable() {
        const tbody = document.querySelector('#resultsTable tbody');
        tbody.innerHTML = '';

        this.analysisResults.forEach(result => {
            const tr = document.createElement('tr');
            const statusClass = result.matchType === 'exact' ? 'exact' : 
                               result.matchType === 'partial' ? 'partial' : 'none';
            
            tr.innerHTML = `
                <td><span class="status-badge ${statusClass}">${result.status}</span></td>
                <td>${result.apiTransaction.comprobante}</td>
                <td>${result.apiTransaction.fecha}</td>
                <td>${Formatter.formatCurrency(result.apiTransaction.valor)}</td>
                <td>${result.csvMatch ? result.csvMatch.fecha : '-'}</td>
                <td>${result.csvMatch ? Formatter.formatCurrency(result.csvMatch.valor) : '-'}</td>
                <td>${result.csvMatch ? result.csvMatch.referencia : '-'}</td>
                <td>${Math.round(result.confidence * 100)}%</td>
                <td>
                    ${result.apiTransaction.image ? 
                        `<button class="view-image-btn" onclick="window.bankingAnalyzer.openImageModal('${result.apiTransaction.comprobante}', '${result.apiTransaction.fecha}', ${result.apiTransaction.valor}, '${result.apiTransaction.image}')">
                            👁️ Ver
                        </button>` 
                        : 'N/A'
                    }
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    filterResults(searchTerm) {
        const rows = document.querySelectorAll('#resultsTable tbody tr');
        const term = searchTerm.toLowerCase();

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    }

    exportResults() {
        if (this.analysisResults.length === 0) {
            UIUtils.showNotification('No hay resultados para exportar', 'warning');
            return;
        }

        const csvContent = DataUtils.resultsToCSV(this.analysisResults);
        DataUtils.downloadCSV(csvContent, 'analisis_resultados.csv');
        UIUtils.showNotification('Resultados exportados exitosamente', 'success');
    }

    setupModal() {
        const modal = document.getElementById('imageModal');
        const closeElements = modal.querySelectorAll('.close, .close-modal');
        
        closeElements.forEach(element => {
            element.addEventListener('click', () => {
                this.closeImageModal();
            });
        });

        // Cerrar modal al hacer clic fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeImageModal();
            }
        });

        // Configurar botón de descarga
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadCurrentImage();
        });
    }

    openImageModal(comprobante, fecha, valor, imagePath) {
        const modal = document.getElementById('imageModal');
        const img = document.getElementById('modalImage');
        
        // Configurar información del comprobante
        document.getElementById('modalComprobante').textContent = comprobante;
        document.getElementById('modalFecha').textContent = fecha;
        document.getElementById('modalValor').textContent = Formatter.formatCurrency(valor);

        console.log('image path');
        console.log(imagePath);
        

        // Configurar imagen
        img.src = imagePath;
        img.onerror = () => {
            img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%236b7280">Imagen no disponible</text></svg>';
        };
        
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeImageModal() {
        const modal = document.getElementById('imageModal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    downloadCurrentImage() {
        const img = document.getElementById('modalImage');
        const comprobante = document.getElementById('modalComprobante').textContent;
        
        if (img.src && !img.src.startsWith('data:')) {
            const link = document.createElement('a');
            link.href = img.src;
            link.download = `comprobante_${comprobante}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    window.bankingAnalyzer = new AnalysisBancario();
});