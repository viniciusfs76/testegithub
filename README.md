# DOU Parser - Extrator do Diário Oficial da União

A client-side web application that parses PDF files from the Brazilian Official Gazette (Diário Oficial da União - DOU) and extracts legal acts into a structured, searchable table.

## Features

- **Client-side PDF Processing**: All parsing happens in the browser using pdfjs-dist
- **Smart Document Detection**: Automatically identifies different types of legal acts (Portarias, Decretos, etc.)
- **Ministry/Organization Tracking**: Associates documents with their issuing ministry or organization
- **Advanced Filtering**: Search across all fields, filter by document type or ministry
- **Sortable Table**: Click column headers to sort documents
- **CSV Export**: Export filtered results to CSV format
- **Detail Modal**: View full document content with a single click
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Brazilian Government Aesthetic**: Clean, professional UI with government color scheme

## How It Works

### PDF Upload
1. Drag and drop a DOU PDF file onto the upload zone, or click to select a file
2. The application will process the PDF and extract all text
3. Progress indicator shows processing status

### Intelligent Parsing

#### Sumário Detection
The first pages of DOU PDFs contain a table of contents (Sumário). The parser:
- Detects pages with more than 3 lines containing 10+ consecutive dots
- Automatically skips these summary pages
- Removes any lines with 5+ consecutive dots from content

#### Document Type Detection
Recognizes the following document types:
- PORTARIA (Nº XXX)
- DECRETO (Nº XXX)
- RESOLUÇÃO (Nº XXX)
- LEI (Nº XXX)
- EDITAL (Nº XXX)
- DESPACHO
- INSTRUÇÃO NORMATIVA (Nº XXX)
- MEDIDA PROVISÓRIA (Nº XXX)
- ATO (Nº XXX)
- ORDEM (Nº XXX)

#### Ministry/Organization Detection
Automatically identifies and tracks:
- MINISTÉRIO DA/DO [NAME]
- PRESIDÊNCIA DA REPÚBLICA
- CASA CIVIL
- ADVOCACIA-GERAL DA UNIÃO
- CONTROLADORIA-GERAL DA UNIÃO
- AGÊNCIA [NAME]
- INSTITUTO [NAME]
- CONSELHO [NAME]
- SECRETARIA [NAME]
- TRIBUNAL [NAME]
- COMANDO [NAME]

#### Date Extraction
Extracts dates in Portuguese format: "DD DE [MONTH] DE YYYY"
- Example: "19 DE DEZEMBRO DE 2025" → "19/12/2025"

#### Signatory Detection
Identifies signatories by:
- Looking for ALL CAPS names
- Checking the last ~10 lines of each document
- Filtering out common headers and footer text
- Requiring reasonable name length (5-100 characters)

## Usage

### Opening the Application
Simply open `index.html` in a modern web browser. No server or installation required.

### Processing a PDF
1. Upload a DOU PDF file
2. Wait for processing (progress bar will show status)
3. View extracted documents in the table

### Filtering Results
- **Search**: Type in the search box to filter across all fields
- **Type Filter**: Select a specific document type from the dropdown
- **Ministry Filter**: Select a specific ministry/organization

### Sorting
Click any column header to sort by that column. Click again to reverse sort direction.

### Exporting Data
Click the "Exportar CSV" button to download filtered results as a CSV file.

### Viewing Full Documents
Click any row in the table to open a modal with the complete document content.

## Technical Details

### Technology Stack
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with flexbox and grid
- **Vanilla JavaScript**: No framework dependencies
- **pdfjs-dist**: PDF text extraction library (loaded from CDN)

### File Structure
```
dou-parser/
├── index.html      # Main HTML structure
├── styles.css      # All styling and responsive design
├── app.js          # UI logic, filtering, sorting, export
├── parser.js       # PDF parsing and document extraction
└── README.md       # This file
```

### Browser Compatibility
Works in all modern browsers that support:
- ES6+ JavaScript
- CSS Grid and Flexbox
- Fetch API
- File API

Tested in:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Color Scheme

The application uses the Brazilian government color scheme:
- **Primary (Navy Blue)**: `#003366` - Headers, buttons
- **Accent (Yellow)**: `#FFCC00` - Export button, highlights
- **Background**: `#f5f5f5` - Page background
- **Text**: `#333` - Main text color
- **White**: `#ffffff` - Cards, table background

## Success Criteria Checklist

- ✅ Correctly skips Sumário pages (detects dots pattern)
- ✅ Extracts documents from content pages only
- ✅ Associates correct ministry with each document
- ✅ Clean data without dots artifacts
- ✅ Functional search and filters
- ✅ Working CSV export
- ✅ Professional, clean UI
- ✅ Sortable table columns
- ✅ Document detail modal
- ✅ Responsive design
- ✅ Progress indicator

## Example Output

For a document like:
```
CASA CIVIL

PORTARIAS DE 19 DE DEZEMBRO DE 2025

O MINISTRO DE ESTADO DA CASA CIVIL...

Nº 1.431 - NOMEAR
ALLAN DE ALCÂNTARA, para exercer o cargo...

FLAVIO JOSÉ ROMAN
```

The parser extracts:
| Tipo | Número | Data | Ministério | Página | Prévia | Signatário |
|------|--------|------|------------|--------|--------|------------|
| PORTARIA | 1.431 | 19/12/2025 | CASA CIVIL | 2 | NOMEAR ALLAN DE ALCÂNTARA... | FLAVIO JOSÉ ROMAN |

## Development Notes

### Parsing Challenges
1. **Inconsistent Formatting**: DOU PDFs have varying formats across different sections
2. **Text Extraction**: PDF.js provides basic text extraction; line breaks aren't always reliable
3. **Ministry Tracking**: Ministries are declared at section headers and apply to subsequent documents
4. **Signatory Detection**: Heuristic-based approach looking for ALL CAPS names at document end

### Future Improvements
- Support for batch PDF processing
- More document types
- Better handling of multi-page documents
- Export to other formats (JSON, Excel)
- Document content search highlighting
- Save/load filtered results
- API integration for automated processing

## License

This is a demonstration project created for parsing DOU documents. Use at your own discretion.

## Support

For issues or questions, please check the console for error messages and verify that you're using a valid DOU PDF file.
