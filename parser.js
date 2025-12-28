// DOU Parser - PDF and Text Extraction Logic

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/**
 * Parse a PDF file and extract text from all pages
 */
async function parsePDF(file, progressCallback) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    const pages = [];

    for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items.map(item => item.str).join(' ');

        pages.push({
            pageNumber: i,
            text: text
        });

        if (progressCallback) {
            progressCallback(i, totalPages);
        }
    }

    return pages;
}

/**
 * Check if a page is a summary page (Sumário)
 * A page is a summary if it has MORE THAN 3 lines with 10+ consecutive dots
 */
function isSummaryPage(text) {
    const lines = text.split('\n');
    let dotLineCount = 0;

    for (const line of lines) {
        if (/\.{10,}/.test(line)) {
            dotLineCount++;
        }
    }

    return dotLineCount > 3;
}

/**
 * Clean text by removing lines with 5+ consecutive dots
 */
function cleanText(text) {
    const lines = text.split('\n');
    const cleanedLines = lines.filter(line => !/\.{5,}/.test(line));
    return cleanedLines.join('\n');
}

/**
 * Detect ministry or organization from text
 */
function detectMinistry(text) {
    const ministryPatterns = [
        /MINISTÉRIO\s+DA\s+[A-ZÀÁÂÃÇÉÊÍÓÔÕÚ\s]+/i,
        /MINISTÉRIO\s+DO\s+[A-ZÀÁÂÃÇÉÊÍÓÔÕÚ\s]+/i,
        /MINISTÉRIO\s+DOS\s+[A-ZÀÁÂÃÇÉÊÍÓÔÕÚ\s]+/i,
        /MINISTÉRIO\s+DAS\s+[A-ZÀÁÂÃÇÉÊÍÓÔÕÚ\s]+/i,
        /PRESIDÊNCIA\s+DA\s+REPÚBLICA/i,
        /CASA\s+CIVIL/i,
        /ADVOCACIA-GERAL\s+DA\s+UNIÃO/i,
        /CONTROLADORIA-GERAL\s+DA\s+UNIÃO/i,
        /AGÊNCIA\s+[A-ZÀÁÂÃÇÉÊÍÓÔÕÚ\s]+/i,
        /INSTITUTO\s+[A-ZÀÁÂÃÇÉÊÍÓÔÕÚ\s]+/i,
        /CONSELHO\s+[A-ZÀÁÂÃÇÉÊÍÓÔÕÚ\s]+/i,
        /SECRETARIA\s+[A-ZÀÁÂÃÇÉÊÍÓÔÕÚ\s]+/i,
        /COMANDO\s+[A-ZÀÁÂÃÇÉÊÍÓÔÕÚ\s]+/i,
        /TRIBUNAL\s+[A-ZÀÁÂÃÇÉÊÍÓÔÕÚ\s]+/i
    ];

    for (const pattern of ministryPatterns) {
        const match = text.match(pattern);
        if (match) {
            // Clean up the match - remove extra spaces and normalize
            return match[0].trim().replace(/\s+/g, ' ').toUpperCase();
        }
    }

    return null;
}

/**
 * Detect document type and number
 */
function detectDocumentType(text) {
    const documentPatterns = [
        { type: 'PORTARIA', pattern: /PORTARIA\s*(?:Nº|N°|N\.º)?\s*(\d+(?:\.\d+)?)/i },
        { type: 'DECRETO', pattern: /DECRETO\s*(?:Nº|N°|N\.º)?\s*(\d+(?:\.\d+)?)/i },
        { type: 'RESOLUÇÃO', pattern: /RESOLUÇÃO\s*(?:Nº|N°|N\.º)?\s*(\d+(?:\.\d+)?)/i },
        { type: 'LEI', pattern: /LEI\s*(?:Nº|N°|N\.º)?\s*(\d+(?:\.\d+)?)/i },
        { type: 'EDITAL', pattern: /EDITAL\s*(?:Nº|N°|N\.º)?\s*(\d+(?:\.\d+)?)/i },
        { type: 'DESPACHO', pattern: /DESPACHO(?:\s*(?:Nº|N°|N\.º)?\s*(\d+(?:\.\d+)?))?/i },
        { type: 'INSTRUÇÃO NORMATIVA', pattern: /INSTRUÇÃO\s+NORMATIVA\s*(?:Nº|N°|N\.º)?\s*(\d+(?:\.\d+)?)/i },
        { type: 'MEDIDA PROVISÓRIA', pattern: /MEDIDA\s+PROVISÓRIA\s*(?:Nº|N°|N\.º)?\s*(\d+(?:\.\d+)?)/i },
        { type: 'ATO', pattern: /ATO\s*(?:Nº|N°|N\.º)?\s*(\d+(?:\.\d+)?)/i },
        { type: 'ORDEM', pattern: /ORDEM\s*(?:Nº|N°|N\.º)?\s*(\d+(?:\.\d+)?)/i }
    ];

    for (const { type, pattern } of documentPatterns) {
        const match = text.match(pattern);
        if (match) {
            return {
                type: type,
                number: match[1] || ''
            };
        }
    }

    return null;
}

/**
 * Extract date in Portuguese format
 */
function extractDate(text) {
    const months = {
        'JANEIRO': '01',
        'FEVEREIRO': '02',
        'MARÇO': '03',
        'ABRIL': '04',
        'MAIO': '05',
        'JUNHO': '06',
        'JULHO': '07',
        'AGOSTO': '08',
        'SETEMBRO': '09',
        'OUTUBRO': '10',
        'NOVEMBRO': '11',
        'DEZEMBRO': '12'
    };

    const datePattern = /(\d{1,2})\s+DE\s+([A-ZÇÃÕ]+)\s+DE\s+(\d{4})/i;
    const match = text.match(datePattern);

    if (match) {
        const day = match[1].padStart(2, '0');
        const month = months[match[2].toUpperCase()];
        const year = match[3];

        if (month) {
            return `${day}/${month}/${year}`;
        }
    }

    return '';
}

/**
 * Extract signatory (usually ALL CAPS name at the end)
 */
function extractSignatory(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Look for ALL CAPS lines that are short (likely names)
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 10); i--) {
        const line = lines[i];

        // Check if line is mostly uppercase and reasonable length for a name
        if (line.length > 5 && line.length < 100) {
            const uppercaseRatio = (line.match(/[A-ZÀÁÂÃÇÉÊÍÓÔÕÚ]/g) || []).length / line.replace(/\s/g, '').length;

            // If >80% uppercase and contains at least one space (likely a full name)
            if (uppercaseRatio > 0.8 && line.includes(' ')) {
                // Exclude lines that look like document headers or common footer text
                const excludePatterns = [
                    /PORTARIA/i,
                    /DECRETO/i,
                    /RESOLUÇÃO/i,
                    /MINISTÉRIO/i,
                    /DIÁRIO\s+OFICIAL/i,
                    /PODER\s+EXECUTIVO/i,
                    /REPÚBLICA/i,
                    /SEÇÃO/i
                ];

                const isExcluded = excludePatterns.some(pattern => pattern.test(line));
                if (!isExcluded) {
                    return line;
                }
            }
        }
    }

    return '';
}

/**
 * Extract content preview (first 150 characters of meaningful content)
 */
function extractPreview(text) {
    // Remove common headers and get actual content
    let content = text;

    // Remove the document type header
    content = content.replace(/^(PORTARIA|DECRETO|RESOLUÇÃO|LEI|EDITAL|DESPACHO|INSTRUÇÃO NORMATIVA).*?\n/i, '');

    // Get first meaningful text
    const preview = content.trim().substring(0, 200).replace(/\s+/g, ' ');

    return preview.length < content.length ? preview + '...' : preview;
}

/**
 * Split text into document sections
 */
function splitIntoDocuments(text) {
    // Split on document type headers
    const splitPattern = /(PORTARIA|DECRETO|RESOLUÇÃO|LEI|EDITAL|DESPACHO|INSTRUÇÃO\s+NORMATIVA|MEDIDA\s+PROVISÓRIA|ATO|ORDEM)\s*(?:Nº|N°|N\.º)?\s*\d+/gi;

    const parts = [];
    let lastIndex = 0;
    let match;

    const regex = new RegExp(splitPattern);

    while ((match = regex.exec(text)) !== null) {
        if (lastIndex > 0) {
            parts.push(text.substring(lastIndex, match.index));
        }
        lastIndex = match.index;
    }

    // Add the last part
    if (lastIndex > 0) {
        parts.push(text.substring(lastIndex));
    }

    // If no splits found, check for DESPACHO without number
    if (parts.length === 0) {
        const despachoPattern = /DESPACHO(?!\s*(?:Nº|N°|N\.º))/gi;
        lastIndex = 0;
        const despachoRegex = new RegExp(despachoPattern);

        while ((match = despachoRegex.exec(text)) !== null) {
            if (lastIndex > 0) {
                parts.push(text.substring(lastIndex, match.index));
            }
            lastIndex = match.index;
        }

        if (lastIndex > 0) {
            parts.push(text.substring(lastIndex));
        }
    }

    return parts.length > 0 ? parts : [text];
}

/**
 * Parse DOU pages and extract documents
 */
function parseDOUDocuments(pages) {
    const documents = [];
    let currentMinistry = '';

    for (const page of pages) {
        // Skip summary pages
        if (isSummaryPage(page.text)) {
            console.log(`Skipping summary page ${page.pageNumber}`);
            continue;
        }

        // Clean the text
        let cleanedText = cleanText(page.text);

        // Detect ministry for this page
        const ministry = detectMinistry(cleanedText);
        if (ministry) {
            currentMinistry = ministry;
        }

        // Split into potential documents
        const documentSections = splitIntoDocuments(cleanedText);

        for (const section of documentSections) {
            const docInfo = detectDocumentType(section);

            if (docInfo) {
                const date = extractDate(section);
                const signatory = extractSignatory(section);
                const preview = extractPreview(section);

                documents.push({
                    tipo: docInfo.type,
                    numero: docInfo.number,
                    data: date,
                    ministerio: currentMinistry || 'Não identificado',
                    pagina: page.pageNumber,
                    previa: preview,
                    signatario: signatory,
                    conteudo: section.trim()
                });
            }
        }
    }

    return documents;
}

/**
 * Main function to process a PDF file
 */
async function processPDFFile(file, progressCallback) {
    try {
        // Extract text from PDF
        const pages = await parsePDF(file, progressCallback);

        // Parse DOU documents
        const documents = parseDOUDocuments(pages);

        return documents;
    } catch (error) {
        console.error('Error processing PDF:', error);
        throw error;
    }
}
