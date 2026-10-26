import pdfjsLib from "./pdfjs.js";

export const MAX_FILE_MB = 20;
export const MAX_PAGES = 300;

// Pauses briefly so the screen can update between pages (keeps the app responsive)
const pause = () => new Promise((resolve) => setTimeout(resolve, 0));

function cleanText(text) {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractPdfText(file, onProgress) {
  if (file.size === 0) {
    throw new Error("This file is empty.");
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    throw new Error(`This file is larger than ${MAX_FILE_MB} MB. Try a smaller PDF.`);
  }

  const buffer = await file.arrayBuffer();

  // Real PDFs always start with "%PDF-". This catches renamed or fake files.
  const header = new TextDecoder().decode(new Uint8Array(buffer.slice(0, 5)));
  if (header !== "%PDF-") {
    throw new Error("This file isn't a valid PDF.");
  }

  const loadingTask = pdfjsLib.getDocument({ data: buffer });

  try {
    let pdf;
    try {
      pdf = await loadingTask.promise;
    } catch (err) {
      if (err && err.name === "PasswordException") {
        throw new Error("This PDF is password protected. Remove the password and try again.");
      }
      throw new Error("This PDF couldn't be opened. It may be damaged or invalid.");
    }

    if (pdf.numPages > MAX_PAGES) {
      throw new Error(
        `This PDF has ${pdf.numPages} pages. The limit is ${MAX_PAGES}. Try splitting it into smaller files.`
      );
    }

    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      let text = "";
      for (const item of content.items) {
        if (!("str" in item)) continue;
        text += item.str;
        text += item.hasEOL ? "\n" : " ";
      }

      pages.push(cleanText(text));
      page.cleanup();
      if (onProgress) onProgress(i, pdf.numPages);
      await pause();
    }

    const charCount = pages.reduce((sum, p) => sum + p.length, 0);
    if (charCount < 20) {
      throw new Error(
        "No selectable text was found. This looks like a scanned or image-based PDF. Reading it needs OCR (text recognition), which isn't built in yet. A PDF exported from Word, Google Docs or PowerPoint will work."
      );
    }

    return { pages, numPages: pdf.numPages, charCount };
  } finally {
    // Cleanup should never make a good upload fail
    try {
      await loadingTask.destroy();
    } catch {
      // Ignore cleanup problems
    }
  }
}