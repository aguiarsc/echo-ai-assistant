import jsPDF from 'jspdf';

/**
 * Options for PDF export
 */
export interface ExportPdfOptions {
  /** Filename for the exported PDF (without extension) */
  filename?: string;
  /** Paper format, defaults to A4 */
  format?: 'a4' | 'letter' | 'legal';
  /** Paper orientation, defaults to portrait */
  orientation?: 'portrait' | 'landscape';
  /** Custom margins in mm: [top, right, bottom, left] */
  margins?: [number, number, number, number];
  /** Custom header text */
  headerText?: string;
  /** Custom footer text */
  footerText?: string;
}

/**
 * Default export options
 */
const defaultOptions: ExportPdfOptions = {
  filename: 'document',
  format: 'a4',
  orientation: 'portrait',
  margins: [15, 15, 15, 15], // [top, right, bottom, left] in mm
};

// Define type for style properties to ensure consistent structure
type StyleProperties = {
  fontSize: number;
  marginBottom: number;
  marginTop?: number;
  bold?: boolean;
  fontFamily?: string;
  marginLeft?: number;
  italics?: boolean;
  strikethrough?: boolean;
};

// Basic styling for PDF content
const styles: Record<string, StyleProperties> = {
  h1: { fontSize: 24, bold: true, marginBottom: 10, marginTop: 5 },
  h2: { fontSize: 20, bold: true, marginBottom: 8, marginTop: 5 },
  h3: { fontSize: 16, bold: true, marginBottom: 5, marginTop: 5 },
  h4: { fontSize: 14, bold: true, marginBottom: 5, marginTop: 5 },
  h5: { fontSize: 12, bold: true, marginBottom: 5, marginTop: 5 },
  h6: { fontSize: 11, bold: true, marginBottom: 5, marginTop: 5 },
  p: { fontSize: 10, marginBottom: 5, marginTop: 0 },
  code: { fontSize: 9, marginBottom: 5, fontFamily: 'Courier', marginTop: 0 },
  li: { fontSize: 10, marginBottom: 2, marginTop: 0 },
  blockquote: { fontSize: 10, marginBottom: 5, marginLeft: 10, italics: true, marginTop: 0 }
};

/**
 * Export markdown content to PDF using jsPDF
 * 
 * @param markdownContent - Raw markdown content
 * @param options - PDF export options
 * @returns Promise that resolves when export is complete
 */
export async function exportMarkdownToPdf(
  markdownContent: string,
  options: ExportPdfOptions = {}
): Promise<void> {
  try {
    console.log('Starting PDF export...');
    const mergedOptions = { ...defaultOptions, ...options };
    const { filename, format, orientation, margins } = mergedOptions;

    const pdf = new jsPDF({
      orientation: orientation || 'portrait',
      unit: 'mm',
      format: format || 'a4',
    });

    const [top, right, bottom, left] = margins || defaultOptions.margins!;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - left - right;

    pdf.setFont('helvetica');

    let y = top;
    let currentPage = 1;

    const addNewPageIfNeeded = (height: number) => {
      if (y + height > pageHeight - bottom) {
        if (mergedOptions.footerText) {
          pdf.setFontSize(8);
          pdf.text(`${mergedOptions.footerText} | Page ${currentPage}`, pageWidth / 2, pageHeight - bottom / 2, { align: 'center' });
        }
        pdf.addPage();
        currentPage++;
        y = top;
        if (mergedOptions.headerText) {
          pdf.setFontSize(10);
          pdf.text(mergedOptions.headerText, pageWidth / 2, top / 2, { align: 'center' });
        }
      }
    };

    if (mergedOptions.headerText) {
      pdf.setFontSize(10);
      pdf.text(mergedOptions.headerText, pageWidth / 2, top / 2, { align: 'center' });
    }

    const lines = markdownContent.split('\n');
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      if (!line.trim()) {
        y += 5; // Space for empty lines
        i++;
        continue;
      }

      if (line.startsWith('#')) {
        const level = line.match(/^#+/)?.[0].length || 1;
        const text = line.replace(/^#+\s+/, '');
        const style = styles[`h${level}`] || styles.p;
        addNewPageIfNeeded(style.fontSize + style.marginBottom + (style.marginTop || 0));
        y = renderText(pdf, text, left, y + (style.marginTop || 0), style, contentWidth);
        y += style.marginBottom;
        i++;
      } else if (line.startsWith('```')) {
        let codeContent = '';
        let j = i + 1;
        while (j < lines.length && !lines[j].startsWith('```')) {
          codeContent += lines[j] + '\n';
          j++;
        }
        const style = styles.code;
        const codeLines = codeContent.split('\n').length;
        addNewPageIfNeeded(style.fontSize * codeLines + style.marginBottom);
        pdf.setFillColor(240, 240, 240);
        pdf.rect(left, y, contentWidth, style.fontSize * 0.5 * codeLines + 4, 'F');
        y += 2;
        pdf.setFont('courier', 'normal');
        pdf.setFontSize(style.fontSize);
        pdf.text(codeContent, left + 2, y);
        y += style.fontSize * 0.5 * codeLines;
        y += style.marginBottom + 2;
        i = j + 1;
      } else if (line.startsWith('>')) {
        const text = line.replace(/^>\s+/, '');
        const style = styles.blockquote;
        addNewPageIfNeeded(style.fontSize + style.marginBottom);
        const blockquoteX = left + (style.marginLeft || 0);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(left, y, left, y + style.fontSize * 1.2);
        y = renderText(pdf, text, blockquoteX, y, style, contentWidth - (style.marginLeft || 0));
        y += style.marginBottom;
        i++;
      } else if (line.match(/^(---|\*\*\*|___)\s*$/)) {
        addNewPageIfNeeded(5);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(left, y + 2, contentWidth + left, y + 2);
        y += 5;
        i++;
      } else if (line.match(/^(\s*)(\*|-|\+|\d+\.)\s+/)) {
        const listMatch = line.match(/^(\s*)(\*|-|\+|\d+\.)\s+(.*)/)!;
        const style = styles.li;
        const indent = listMatch[1].length * 2;
        const bullet = '\u2022'; // Use a consistent bullet character
        const text = listMatch[3];
        addNewPageIfNeeded(style.fontSize + style.marginBottom);
        const bulletX = left + indent;
        const textX = bulletX + 5;
        pdf.text(bullet, bulletX, y);
        y = renderText(pdf, text, textX, y, style, contentWidth - (textX - left));
        y += style.marginBottom;
        i++;
      } else {
        const style = styles.p;
        addNewPageIfNeeded(style.fontSize + style.marginBottom);
        y = renderText(pdf, line, left, y, style, contentWidth);
        y += style.marginBottom;
        i++;
      }
    }

    if (mergedOptions.footerText) {
      pdf.setFontSize(8);
      pdf.text(`${mergedOptions.footerText} | Page ${currentPage}`, pageWidth / 2, pageHeight - bottom / 2, { align: 'center' });
    }

    console.log(`Saving PDF as ${filename}.pdf`);
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error("PDF export failed:", error);
    throw new Error("Failed to generate PDF. Please check the content and try again.");
  }
}

/**
 * Renders a line of text with inline markdown styling (bold, italic, code, strikethrough).
 * Handles text wrapping within the specified max width.
 * 
 * @param pdf - The jsPDF instance
 * @param text - The line of text to render
 * @param x - The starting x position
 * @param y - The starting y position
 * @param style - The base style for the text
 * @param maxWidth - The maximum width for text wrapping
 * @returns The new y position after rendering the text
 */
function renderText(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  style: StyleProperties,
  maxWidth: number
): number {
  const regex = /(\*\*\*|\*\*|\*|`|~~)(.*?)\1|\[([^\]]+)\]\(([^\)]+)\)/g;
  let lastIndex = 0;
  let currentX = x;

  // Set base font style
  pdf.setFontSize(style.fontSize);
  pdf.setFont('helvetica', style.italics ? 'italic' : 'normal');

  // Split text into lines to handle wrapping manually for styled segments
  const lines = pdf.splitTextToSize(text, maxWidth);

  for (const line of lines) {
    let match;
    lastIndex = 0;
    currentX = x;

    while ((match = regex.exec(line)) !== null) {
      // Render text before the match
      const precedingText = line.substring(lastIndex, match.index);
      if (precedingText) {
        pdf.text(precedingText, currentX, y);
        currentX += pdf.getStringUnitWidth(precedingText) * style.fontSize / pdf.internal.scaleFactor;
      }

      const delimiter = match[1];
      const content = match[2];
      const linkText = match[3];
      const linkUrl = match[4];

      if (linkText && linkUrl) {
        // It's a link
        const originalColor = pdf.getTextColor();
        pdf.setTextColor('#0000EE'); // Blue color for links
        pdf.textWithLink(linkText, currentX, y, { url: linkUrl });
        const textWidth = pdf.getStringUnitWidth(linkText) * style.fontSize / pdf.internal.scaleFactor;
        pdf.setDrawColor('#0000EE');
        pdf.line(currentX, y + 1, currentX + textWidth, y + 1); // Underline
        currentX += textWidth;
        pdf.setTextColor(originalColor);
      } else {
        // It's a styled segment (bold, italic, etc.)
        let fontStyle = style.italics ? 'italic' : 'normal';
        let isBold = style.bold || false;

        if (delimiter === '***') {
          isBold = true;
          fontStyle = 'italic';
        } else if (delimiter === '**') {
          isBold = true;
        } else if (delimiter === '*') {
          fontStyle = 'italic';
        }

        if (delimiter === '`') {
          pdf.setFont('courier', 'normal');
        } else if (isBold && fontStyle === 'italic') {
          pdf.setFont('helvetica', 'bolditalic');
        } else if (isBold) {
          pdf.setFont('helvetica', 'bold');
        } else {
          pdf.setFont('helvetica', fontStyle);
        }

        const textWidth = pdf.getStringUnitWidth(content) * style.fontSize / pdf.internal.scaleFactor;
        pdf.text(content, currentX, y, { 
          charSpace: delimiter === '`' ? 0.5 : 0
        });

        if (delimiter === '~~') {
          const lineY = y - style.fontSize / 3.5;
          pdf.line(currentX, lineY, currentX + textWidth, lineY);
        }
        
        currentX += textWidth;
      }

      // Reset to base style
      pdf.setFont('helvetica', style.italics ? 'italic' : 'normal');
      lastIndex = match.index + match[0].length;
    }

    // Render remaining text
    if (lastIndex < line.length) {
      const remainingText = line.substring(lastIndex);
      pdf.text(remainingText, currentX, y);
    }
    
    y += style.fontSize * 0.5; // Move to the next line
  }

  return y;
}

/**
 * Simple function to export markdown as text file
 * 
 * @param content - Content to save
 * @param filename - Filename to use
 */
export function exportAsText(content: string, filename: string): void {
  try {
    console.log('Exporting as text file...');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Append to body, click and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('Error exporting text file:', error);
    throw new Error('Failed to export text file');
  }
}

/**
 * Export markdown as plain text with markdown formatting stripped
 * 
 * @param content - Markdown content to convert
 * @param filename - Filename to save as
 */
export function exportMarkdownAsPlainText(content: string, filename: string): void {
  // Remove markdown syntax
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/`{1,3}[^`]*`{1,3}/g, (match) => match.replace(/`/g, '')) // Remove code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
    .replace(/^[-*+]\s+/gm, '• ') // Convert list items to bullets
    .replace(/^\d+\.\s+/gm, (match, offset, string) => {
      const lineStart = string.lastIndexOf('\n', offset) + 1
      const lineNumber = string.substring(lineStart, offset).match(/^\d+/)?.[0] || '1'
      return `${lineNumber}. `
    })
    .replace(/^>\s+/gm, '') // Remove blockquotes
  
  exportAsText(plainText, filename)
}

/**
 * Convert markdown to HTML with basic styling
 */
export function convertMarkdownToHtml(content: string, title: string): string {
  // Basic markdown to HTML conversion
  let html = content
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    // Lists (basic)
    .replace(/^[-*+]\s+(.*)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')
    // Blockquotes
    .replace(/^>\s+(.*)$/gm, '<blockquote>$1</blockquote>')
  
  // Wrap in paragraphs
  html = '<p>' + html + '</p>'
  
  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '')
  
  // Full HTML document
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1, h2, h3 {
      color: #2c3e50;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    h1 { font-size: 2.2em; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    h2 { font-size: 1.8em; }
    h3 { font-size: 1.4em; }
    p { margin-bottom: 15px; }
    code {
      background-color: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    pre {
      background-color: #f8f8f8;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 15px;
      overflow-x: auto;
    }
    pre code {
      background: none;
      padding: 0;
    }
    blockquote {
      border-left: 4px solid #3498db;
      margin: 20px 0;
      padding-left: 20px;
      color: #666;
      font-style: italic;
    }
    ul, ol {
      margin-bottom: 15px;
      padding-left: 30px;
    }
    li {
      margin-bottom: 5px;
    }
    a {
      color: #3498db;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .export-info {
      background-color: #ecf0f1;
      border-radius: 5px;
      padding: 10px;
      margin-bottom: 20px;
      font-size: 0.9em;
      color: #7f8c8d;
    }
  </style>
</head>
<body>
  <div class="export-info">
    Exported from Echo Novel Assistant on ${new Date().toLocaleString()}
  </div>
  ${html}
</body>
</html>`
}