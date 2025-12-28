// DOU Parser - Main Application Logic

let allDocuments = [];
let filteredDocuments = [];
let currentSort = { column: null, direction: 'asc' };

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const filePickerBtn = document.getElementById('file-picker-btn');
const progressContainer = document.getElementById('progress-container');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const statsSection = document.getElementById('stats-section');
const filtersSection = document.getElementById('filters-section');
const tableSection = document.getElementById('table-section');
const tableBody = document.getElementById('table-body');
const searchInput = document.getElementById('search-input');
const typeFilter = document.getElementById('type-filter');
const ministryFilter = document.getElementById('ministry-filter');
const exportBtn = document.getElementById('export-btn');
const noResults = document.getElementById('no-results');
const modal = document.getElementById('detail-modal');
const modalClose = document.getElementById('modal-close');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    // File upload
    filePickerBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);

    // Filters
    searchInput.addEventListener('input', applyFilters);
    typeFilter.addEventListener('change', applyFilters);
    ministryFilter.addEventListener('change', applyFilters);

    // Export
    exportBtn.addEventListener('click', exportToCSV);

    // Modal
    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Table sorting
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => handleSort(th.dataset.sort));
    });
}

// File Upload Handlers
function handleDragOver(e) {
    e.preventDefault();
    dropZone.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
        processFile(files[0]);
    } else {
        alert('Por favor, selecione um arquivo PDF válido.');
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
        processFile(file);
    } else {
        alert('Por favor, selecione um arquivo PDF válido.');
    }
}

// Process PDF File
async function processFile(file) {
    try {
        // Show progress
        progressContainer.classList.remove('hidden');
        progressFill.style.width = '0%';
        progressText.textContent = 'Processando PDF...';

        // Process the PDF
        const documents = await processPDFFile(file, (current, total) => {
            const percent = (current / total) * 100;
            progressFill.style.width = `${percent}%`;
            progressText.textContent = `Processando página ${current} de ${total}...`;
        });

        // Store documents
        allDocuments = documents;
        filteredDocuments = documents;

        // Hide progress
        progressContainer.classList.add('hidden');

        // Update UI
        updateStatistics();
        populateFilters();
        renderTable();

        // Show results
        statsSection.classList.remove('hidden');
        filtersSection.classList.remove('hidden');
        tableSection.classList.remove('hidden');

        console.log(`Extracted ${documents.length} documents`);

    } catch (error) {
        console.error('Error processing file:', error);
        alert('Erro ao processar o arquivo PDF. Verifique o console para mais detalhes.');
        progressContainer.classList.add('hidden');
    }
}

// Statistics
function updateStatistics() {
    const total = allDocuments.length;
    const portarias = allDocuments.filter(d => d.tipo === 'PORTARIA').length;
    const decretos = allDocuments.filter(d => d.tipo === 'DECRETO').length;
    const outros = total - portarias - decretos;

    document.getElementById('total-docs').textContent = total;
    document.getElementById('total-portarias').textContent = portarias;
    document.getElementById('total-decretos').textContent = decretos;
    document.getElementById('total-outros').textContent = outros;
}

// Populate filter dropdowns
function populateFilters() {
    // Get unique types
    const types = [...new Set(allDocuments.map(d => d.tipo))].sort();
    typeFilter.innerHTML = '<option value="">Todos os Tipos</option>';
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeFilter.appendChild(option);
    });

    // Get unique ministries
    const ministries = [...new Set(allDocuments.map(d => d.ministerio))].sort();
    ministryFilter.innerHTML = '<option value="">Todos os Ministérios</option>';
    ministries.forEach(ministry => {
        const option = document.createElement('option');
        option.value = ministry;
        option.textContent = ministry;
        ministryFilter.appendChild(option);
    });
}

// Apply filters
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedType = typeFilter.value;
    const selectedMinistry = ministryFilter.value;

    filteredDocuments = allDocuments.filter(doc => {
        // Search filter (searches all fields)
        const matchesSearch = !searchTerm ||
            doc.tipo.toLowerCase().includes(searchTerm) ||
            doc.numero.toLowerCase().includes(searchTerm) ||
            doc.data.toLowerCase().includes(searchTerm) ||
            doc.ministerio.toLowerCase().includes(searchTerm) ||
            doc.previa.toLowerCase().includes(searchTerm) ||
            doc.signatario.toLowerCase().includes(searchTerm) ||
            doc.pagina.toString().includes(searchTerm);

        // Type filter
        const matchesType = !selectedType || doc.tipo === selectedType;

        // Ministry filter
        const matchesMinistry = !selectedMinistry || doc.ministerio === selectedMinistry;

        return matchesSearch && matchesType && matchesMinistry;
    });

    renderTable();
}

// Render table
function renderTable() {
    tableBody.innerHTML = '';

    if (filteredDocuments.length === 0) {
        noResults.classList.remove('hidden');
        document.querySelector('.table-container').classList.add('hidden');
        return;
    }

    noResults.classList.add('hidden');
    document.querySelector('.table-container').classList.remove('hidden');

    filteredDocuments.forEach((doc, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${doc.tipo}</td>
            <td>${doc.numero}</td>
            <td>${doc.data}</td>
            <td>${doc.ministerio}</td>
            <td>${doc.pagina}</td>
            <td>${doc.previa}</td>
            <td>${doc.signatario}</td>
        `;
        row.addEventListener('click', () => showDocumentDetail(doc));
        tableBody.appendChild(row);
    });
}

// Sorting
function handleSort(column) {
    const th = document.querySelector(`th[data-sort="${column}"]`);

    // Remove sort classes from all headers
    document.querySelectorAll('th[data-sort]').forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
    });

    // Determine sort direction
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }

    // Apply sort class
    th.classList.add(`sort-${currentSort.direction}`);

    // Sort documents
    filteredDocuments.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];

        // Handle numeric sorting for page numbers
        if (column === 'pagina') {
            aVal = parseInt(aVal) || 0;
            bVal = parseInt(bVal) || 0;
        } else {
            aVal = String(aVal).toLowerCase();
            bVal = String(bVal).toLowerCase();
        }

        if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    renderTable();
}

// Export to CSV
function exportToCSV() {
    if (filteredDocuments.length === 0) {
        alert('Nenhum documento para exportar.');
        return;
    }

    const headers = ['Tipo', 'Número', 'Data', 'Ministério', 'Página', 'Prévia', 'Signatário'];
    const rows = filteredDocuments.map(doc => [
        doc.tipo,
        doc.numero,
        doc.data,
        doc.ministerio,
        doc.pagina,
        doc.previa,
        doc.signatario
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        const escapedRow = row.map(cell => {
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            const cellStr = String(cell).replace(/"/g, '""');
            return /[",\n]/.test(cellStr) ? `"${cellStr}"` : cellStr;
        });
        csv += escapedRow.join(',') + '\n';
    });

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `dou_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Document Detail Modal
function showDocumentDetail(doc) {
    document.getElementById('detail-tipo').textContent = doc.tipo;
    document.getElementById('detail-numero').textContent = doc.numero || '-';
    document.getElementById('detail-data').textContent = doc.data || '-';
    document.getElementById('detail-ministerio').textContent = doc.ministerio;
    document.getElementById('detail-pagina').textContent = doc.pagina;
    document.getElementById('detail-signatario').textContent = doc.signatario || '-';
    document.getElementById('detail-conteudo').textContent = doc.conteudo;

    modal.classList.remove('hidden');
}

function closeModal() {
    modal.classList.add('hidden');
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Close modal with Escape key
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeModal();
    }
});
