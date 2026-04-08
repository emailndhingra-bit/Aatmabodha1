
import JSZip from 'jszip';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Helper for PDF extraction (assumes pdfjsLib is global from CDN)
const extractTextFromPdf = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const pdfjsLib = (window as any).pdfjsLib;
    if (!pdfjsLib) {
        console.warn("PDF.js not loaded");
        return "";
    }
    try {
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += `\n--- Page ${i} ---\n${pageText}`;
        }
        return fullText;
    } catch (e) {
        console.error("PDF Extraction Failed", e);
        return "";
    }
};

export interface ProcessedFile {
    type: 'json' | 'kb' | 'unknown';
    content: any;
    filename: string;
}

export const processFileContent = async (file: File | { name: string, arrayBuffer: () => Promise<ArrayBuffer> }): Promise<ProcessedFile> => {
    const name = file.name.toLowerCase();
    const arrayBuffer = await (file instanceof File ? file.arrayBuffer() : file.arrayBuffer());
    
    // JSON (Chart Data)
    if (name.endsWith('.json')) {
        const text = new TextDecoder("utf-8").decode(arrayBuffer);
        try {
            return { type: 'json', content: JSON.parse(text), filename: file.name };
        } catch(e) { console.error("JSON Parse Error", e); }
    }
    
    // Knowledge Base Formats (PDF, DOCX, XLS)
    let text = "";
    if (name.endsWith('.pdf')) {
        text = await extractTextFromPdf(arrayBuffer);
    } else if (name.endsWith('.docx') || name.endsWith('.doc')) {
        try {
            const res = await mammoth.extractRawText({ arrayBuffer });
            text = res.value;
        } catch (e) { console.error("DOCX Extraction Failed", e); }
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        try {
            const workbook = XLSX.read(arrayBuffer);
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                text += `\n--- Sheet: ${sheetName} ---\n` + XLSX.utils.sheet_to_csv(sheet);
            });
        } catch (e) { console.error("XLS Extraction Failed", e); }
    } else if (name.endsWith('.txt') || name.endsWith('.md')) {
        text = new TextDecoder("utf-8").decode(arrayBuffer);
        
        // INTELLIGENT CHECK: Is this text file actually a JSON dump?
        try {
            const possibleJson = JSON.parse(text);
            // If it parses and is an object or array, treat as JSON data source
            if (typeof possibleJson === 'object' && possibleJson !== null) {
                return { type: 'json', content: possibleJson, filename: file.name };
            }
        } catch (e) {
            // Not JSON, proceed as text content for KB
        }
    }

    if (text) {
        return { type: 'kb', content: text, filename: file.name };
    }
    
    return { type: 'unknown', content: null, filename: file.name };
};

export const processZipFile = async (file: File): Promise<ProcessedFile[]> => {
    const zip = new JSZip();
    const results: ProcessedFile[] = [];
    
    try {
        const loadedZip = await zip.loadAsync(file);
        // Cast to any to avoid unknown type errors on strict TS settings
        const entries = Object.values(loadedZip.files).filter((f: any) => !f.dir && !f.name.startsWith('__MACOSX') && !f.name.startsWith('.'));
        
        for (const entry of entries) {
            const zipEntry = entry as any;
            const processed = await processFileContent({
                name: zipEntry.name,
                arrayBuffer: () => zipEntry.async('arraybuffer')
            });
            if (processed.type !== 'unknown') {
                results.push(processed);
            }
        }
    } catch (e) {
        console.error("ZIP Processing Failed", e);
        throw new Error("Invalid ZIP file");
    }
    return results;
};
