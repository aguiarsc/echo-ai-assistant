/**
 * Utility module for cleaning AI-generated content from unwanted patterns
 */

/**
 * Common AI introduction patterns that should be removed from generated content
 */
export const AI_INTRO_PATTERNS: RegExp[] = [
  /^Here\s+(is|are)\s+.+?[.!:]\s*/i,
  /^I've\s+created\s+.+?[.!:]\s*/i,
  /^This\s+(is|contains)\s+.+?[.!:]\s*/i,
  /^Below\s+(is|are)\s+.+?[.!:]\s*/i,
  /^The\s+following\s+.+?[.!:]\s*/i,
  /^Let\s+me\s+.+?[.!:]\s*/i,
  /^I'll\s+.+?[.!:]\s*/i,
  /^.*ranging\s+from\s+.+?[.!:]\s*/i,
  /^.*few\s+.+?recipes?\s+.+?[.!:]\s*/i,
  /^Here\s+are\s+a\s+few\s+very\s+short\s+recipes\s+.+?[.!:]\s*/i,
  /^Here\s+are\s+some\s+.+?recipes\s+.+?[.!:]\s*/i,
  /^I've\s+prepared\s+.+?[.!:]\s*/i,
  /^I've\s+generated\s+.+?[.!:]\s*/i,
  /^.*ranging\s+from\s+a\s+.+?to\s+a\s+.+?[.!:]\s*/i
];

/**
 * Clean AI-generated content from unwanted introductions and meta-commentary
 * 
 * @param content - The raw AI-generated content
 * @returns Cleaned content without AI introduction patterns
 */
export function cleanAIContent(content: string): string {
  if (!content) return content;
  
  let cleanedContent = content;
  
  // Apply each pattern to remove introductions
  for (const pattern of AI_INTRO_PATTERNS) {
    cleanedContent = cleanedContent.replace(pattern, '');
  }
  
  // Remove any leading whitespace or newlines after cleaning
  cleanedContent = cleanedContent.replace(/^\s+/, '');
  
  // If we removed too much and the content is now empty or very short, return original
  if (cleanedContent.trim().length < 10) {
    return content;
  }
  
  return cleanedContent;
}

/**
 * Add a custom pattern to the cleaning list
 * @param pattern - A RegExp pattern to add
 */
export function addCleaningPattern(pattern: RegExp): void {
  AI_INTRO_PATTERNS.push(pattern);
}
