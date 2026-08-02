import * as pdfjsLib from 'pdfjs-dist';
import localforage from 'localforage';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Setup PDF.js worker from local node_modules (CDN doesn't have v5.x yet)
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

// Initialize localforage store for PDF text content
const pdfTextStore = localforage.createInstance({
  name: "EduWrap",
  storeName: "pdf_text_content"
});

/**
 * Clean extracted text — remove PDF artifacts, normalize whitespace,
 * merge broken lines, and strip garbage characters.
 */
function cleanExtractedText(raw) {
  if (!raw) return '';

  let text = raw
    // Remove null bytes and control characters (except newlines)
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize various dash/hyphen characters
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')
    // Normalize quotation marks
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    // Remove excessive whitespace but keep paragraph breaks
    .replace(/[ \t]+/g, ' ')
    // Merge lines that were broken mid-sentence (lowercase continuation)
    .replace(/([a-z,;])\s*\n\s*([a-z])/g, '$1 $2')
    // Collapse multiple newlines into double newlines (paragraph break)
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

/**
 * Render a PDF page to a canvas and run OCR via Tesseract.js.
 * Tesseract.js is optional — if not installed, OCR is silently skipped.
 */
async function ocrPage(page) {
  let Tesseract;
  try {
    // Dynamic import so Vite doesn't statically analyze this as a hard dependency.
    // Using a variable prevents Vite's import-analysis plugin from flagging it.
    const moduleName = 'tesseract.js';
    Tesseract = await import(/* @vite-ignore */ moduleName);
  } catch {
    // tesseract.js is not installed — skip OCR silently
    console.info('[EduWrap] tesseract.js not installed — OCR skipped. Install it with `npm i tesseract.js` if you need OCR for scanned PDFs.');
    return '';
  }

  try {
    // Render page to a canvas
    const scale = 1.5; // Balance between accuracy and speed
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    // PDF.js v5 render() returns a promise directly (not { promise })
    const renderTask = page.render({ canvasContext: ctx, viewport });
    if (renderTask.promise) {
      await renderTask.promise;
    } else {
      await renderTask;
    }

    // Convert canvas to blob for Tesseract (more reliable than passing canvas directly)
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) {
      canvas.width = 0;
      canvas.height = 0;
      return '';
    }

    // Run OCR
    const recognize = Tesseract.default?.recognize || Tesseract.recognize;
    const { data } = await recognize(blob, 'eng', {
      logger: () => {}, // Suppress progress logs
    });

    // Cleanup
    canvas.width = 0;
    canvas.height = 0;

    return data.text || '';
  } catch (err) {
    console.warn('OCR failed for page:', err.message || err);
    return '';
  }
}

/**
 * Extract text from a given PDF array buffer.
 * Falls back to OCR (Tesseract.js) for pages with no text layer.
 * @param {ArrayBuffer} data
 * @returns {Promise<string>} extracted text
 */
async function extractTextFromPDF(data) {
  try {
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;

    let fullText = '';
    const numPages = pdf.numPages;

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Build page text with proper spacing
      let pageText = '';
      let lastY = null;
      for (const item of textContent.items) {
        if (item.str.trim() === '') continue;
        // Detect line breaks by checking Y position changes
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
          pageText += '\n';
        } else if (pageText.length > 0) {
          pageText += ' ';
        }
        pageText += item.str;
        lastY = item.transform[5];
      }

      // If this page has almost no text, try OCR
      if (pageText.trim().length < 20) {
        console.log(`[EduWrap] Page ${i}/${numPages}: No text layer found, running OCR...`);
        const ocrText = await ocrPage(page);
        if (ocrText.trim().length > 20) {
          pageText = ocrText;
        }
      }

      if (pageText.trim().length > 0) {
        fullText += pageText + '\n\n';
      }
    }

    return cleanExtractedText(fullText);
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    throw error;
  }
}

/**
 * Fetch a PDF from a URL, extract text, and save to IndexedDB.
 * @param {string} id - The note ID to associate with the text
 * @param {string} url - The URL of the PDF (e.g. '/pdfs/file.pdf')
 */
export async function processPDFFromUrl(id, url) {
  // Check if we already extracted valid text
  const existing = await pdfTextStore.getItem(id);
  if (existing && existing.trim().length > 50) return existing;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    const buffer = await response.arrayBuffer();

    const text = await extractTextFromPDF(buffer);

    if (text.trim().length > 0) {
      await pdfTextStore.setItem(id, text);
    }
    return text;
  } catch (error) {
    console.error(`Failed to process PDF from URL ${url}:`, error);
    throw error;
  }
}

/**
 * Force re-process a PDF (clears cache first)
 */
export async function reprocessPDF(id, url) {
  await pdfTextStore.removeItem(id);
  return processPDFFromUrl(id, url);
}

/**
 * Extract text from a File object and save to IndexedDB
 * @param {string} id
 * @param {File} file
 */
export async function processPDFFromFile(id, file) {
  try {
    const buffer = await file.arrayBuffer();
    const text = await extractTextFromPDF(buffer);
    if (text.trim().length > 0) {
      await pdfTextStore.setItem(id, text);
    }
    return text;
  } catch (error) {
    console.error("Failed to process uploaded PDF:", error);
    throw error;
  }
}

/**
 * Get extracted text from IndexedDB
 * @param {string} id
 * @returns {Promise<string|null>}
 */
export async function getPDFText(id) {
  return await pdfTextStore.getItem(id);
}

/**
 * Clear all cached PDF text (forces full re-index on next load)
 */
export async function clearAllPDFText() {
  await pdfTextStore.clear();
}
