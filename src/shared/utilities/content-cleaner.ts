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

export function cleanAIContent(content: string): string {
  if (!content) return content;
  
  let cleanedContent = content;
  
  for (const pattern of AI_INTRO_PATTERNS) {
    cleanedContent = cleanedContent.replace(pattern, '');
  }
  
  cleanedContent = cleanedContent.replace(/^\s+/, '');
  
  if (cleanedContent.trim().length < 10) {
    return content;
  }
  
  return cleanedContent;
}

export function addCleaningPattern(pattern: RegExp): void {
  AI_INTRO_PATTERNS.push(pattern);
}
