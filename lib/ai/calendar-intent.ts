// calendar-intent.ts
// Utility for detecting calendar management intent in user prompts
import * as chrono from 'chrono-node';

export interface CalendarIntentResult {
  action: 'create' | 'update' | 'list' | 'search';
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  allDay?: boolean;
  eventId?: string;
  query?: string;
  timeText?: string;
  dateRange?: { start: string; end: string };
}

/**
 * Detects if the user prompt requests calendar management actions
 * Returns action details if detected, or null otherwise.
 */
export function detectCalendarIntent(prompt: string): CalendarIntentResult | null {
  const lowerPrompt = prompt.toLowerCase();

  // Create event patterns - improved to capture diverse date/time expressions better
  const createPatterns = [
    // "Schedule a meeting with the team tomorrow at 2 PM"
    /(?:schedule|add|create|book)\s+(?:a|an)?\s*(meeting|appointment|event|call)\s+(?:with|for)\s+([^,]+?)\s+(?:tomorrow|today|on\s+[\w\s]+|for\s+[\w\s]+)(?:\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?))?/i,
    
    // "Add a dentist appointment on Friday at 10:30 AM"
    /(?:schedule|add|create|book)\s+(?:a|an)?\s*([\w\s]+)\s+(meeting|appointment|event|call)\s+(?:on|for)\s+([\w\s]+)(?:\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?))?/i,
    
    // "Create an event for the project deadline on July 25th"
    /(?:schedule|add|create|book)\s+(?:a|an)?\s*(?:event|meeting|appointment|reminder)\s+(?:for|about)\s+([^,]+?)\s+(?:on|for)\s+([\w\s,.]+?)(?:\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?))?/i,
    
    // More flexible pattern - "Schedule something tomorrow at 2 PM"
    /(?:schedule|add|create|book)\s+(?:a|an)?\s*([^,]+?)\s+(?:tomorrow|today|on\s+[\w\s,.]+|for\s+[\w\s,.]+)(?:\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?))?/i,
    
    // Pattern for explicit date mentions - "Create a budget review for July 25th at 3pm"
    /(?:schedule|add|create|book)\s+(?:a|an)?\s*([^,]+?)\s+(?:on|for)\s+([\w\s,.]+?)(?:\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?))?/i,
  ];

  // Update event patterns
  const updatePatterns = [
    /(?:update|modify|change|edit|reschedule)\s+(?:the\s+)?(?:event|appointment|meeting)(?:\s+(?:called|named|titled)\s+["']?([^"']+)["']?)?/i,
    /(?:move|reschedule)\s+(?:the\s+)?(?:event|appointment|meeting)(?:\s+(?:called|named|titled)\s+["']?([^"']+)["']?)?(?:\s+to\s+([^,]+))?/i
  ];

  // Note: Delete operations are disabled for safety - users must delete events manually from the Calendar tab

  // List events patterns
  const listPatterns = [
    /(?:show|list|display|what are|what's)\s+(?:my\s+)?(?:events|appointments|meetings|schedule)(?:\s+(?:for|on|in)\s+([^,]+))?/i,
    /(?:what do I have|what's on my schedule|what's planned)(?:\s+(?:for|on|in)\s+([^,]+))?/i,
    /(?:my\s+)?(?:calendar|schedule|agenda)(?:\s+(?:for|on|in)\s+([^,]+))?/i
  ];

  // Search events patterns
  const searchPatterns = [
    /(?:find|search|look for)\s+(?:events?|appointments?|meetings?)(?:\s+(?:about|containing|with|related to)\s+([^,]+))?/i,
    /(?:do I have|is there)\s+(?:any\s+)?(?:events?|appointments?|meetings?)(?:\s+(?:about|containing|with|related to)\s+([^,]+))?/i
  ];

  // Enhanced helper function to parse date/time from natural language text using chrono-node
  const parseDateTime = (dateText: string, timeText?: string, originalPrompt?: string): string | undefined => {
    if (!dateText && !timeText && !originalPrompt) return undefined;
    
    // First attempt: Parse the combined date and time directly from the full prompt if available
    // This gives the best context for chrono to understand complex date expressions
    if (originalPrompt) {
      // Handle ambiguous day references like "the 23rd" by providing context
      let textToProcess = originalPrompt;
      
      // If we're dealing with "the Nth" pattern without month reference, add month context
      const dayNumberMatch = originalPrompt.match(/the\s+(\d+)(?:st|nd|rd|th)/i);
      if (dayNumberMatch && !originalPrompt.match(/jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i)) {
        const dayNum = parseInt(dayNumberMatch[1]);
        const today = new Date();
        const currentDay = today.getDate();
        
        // If the day number is in the past this month, assume next month
        if (dayNum < currentDay) {
          const nextMonth = new Date(today);
          nextMonth.setMonth(today.getMonth() + 1);
          const monthName = nextMonth.toLocaleString('default', { month: 'long' });
          textToProcess = originalPrompt.replace(/the\s+(\d+)(?:st|nd|rd|th)/i, `the $1${dayNumberMatch[0].slice(-2)} of ${monthName}`);
        }
      }
      
      const results = chrono.parse(textToProcess);
      if (results.length > 0) {
        return results[0].start.date().toISOString();
      }
    }
    
    // Second attempt: Parse from specific date and time text if provided
    let textToParse = dateText || '';
    if (timeText) {
      // Combine date and time for better parsing
      textToParse += ' ' + timeText;
    }
    
    const results = chrono.parse(textToParse);
    if (results.length > 0) {
      return results[0].start.date().toISOString();
    }
    
    // Third attempt: Handle specific relative dates as fallback
    const cleaned = (dateText || '').trim().toLowerCase();
    let baseDate = new Date();
    
    // Handle relative dates
    if (cleaned.includes('today')) {
      baseDate = new Date();
    } else if (cleaned.includes('tomorrow')) {
      baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 1);
    } else if (cleaned.match(/next\s+(mon|tues|wednes|thurs|fri|satur|sun)day/i)) {
      const dayMatch = cleaned.match(/next\s+(mon|tues|wednes|thurs|fri|satur|sun)day/i);
      const dayMap: {[key: string]: number} = {
        'mon': 1, 'tues': 2, 'wednes': 3, 'thurs': 4, 'fri': 5, 'satur': 6, 'sun': 0
      };
      
      if (dayMatch && dayMatch[1]) {
        const targetDay = dayMap[dayMatch[1].toLowerCase()];
        baseDate = new Date();
        const currentDay = baseDate.getDay();
        const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
        baseDate.setDate(baseDate.getDate() + daysUntil);
      }
    } else if (cleaned.match(/this\s+(mon|tues|wednes|thurs|fri|satur|sun)day/i)) {
      const dayMatch = cleaned.match(/this\s+(mon|tues|wednes|thurs|fri|satur|sun)day/i);
      const dayMap: {[key: string]: number} = {
        'mon': 1, 'tues': 2, 'wednes': 3, 'thurs': 4, 'fri': 5, 'satur': 6, 'sun': 0
      };
      
      if (dayMatch && dayMatch[1]) {
        const targetDay = dayMap[dayMatch[1].toLowerCase()];
        baseDate = new Date();
        const currentDay = baseDate.getDay();
        let daysUntil = targetDay - currentDay;
        if (daysUntil < 0) daysUntil += 7;
        baseDate.setDate(baseDate.getDate() + daysUntil);
      }
    } else if (cleaned.includes('next week')) {
      baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 7);
    }
    
    // Parse time if provided as a separate parameter
    if (timeText) {
      const timeMatch = timeText.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?/);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2] || '0');
        const ampm = timeMatch[3]?.toLowerCase();
        
        if (ampm === 'pm' && hours !== 12) {
          hours += 12;
        } else if (ampm === 'am' && hours === 12) {
          hours = 0;
        }
        
        baseDate.setHours(hours, minutes, 0, 0);
      }
    }
    
    return baseDate.toISOString();
  };

  // Check create patterns
  for (let i = 0; i < createPatterns.length; i++) {
    const pattern = createPatterns[i];
    const match = prompt.match(pattern);
    if (match) {
      let title = '';
      let timeText = '';
      let dateText = 'today';
      let fullPrompt: string | undefined;
      
      // Handle different pattern structures
      if (i === 0) {
        // "Schedule a meeting with the team tomorrow at 2 PM"
        const eventType = match[1]; // meeting, appointment, etc.
        const subject = match[2]; // the team
        timeText = match[3]; // 2 PM
        title = `${eventType} with ${subject}`;
      } else if (i === 1) {
        // "Add a dentist appointment on Friday at 10:30 AM"
        const descriptor = match[1]; // dentist
        const eventType = match[2]; // appointment
        const day = match[3]; // Friday
        timeText = match[4]; // 10:30 AM
        title = `${descriptor} ${eventType}`;
        dateText = day;
      } else if (i === 2) {
        // "Create an event for the project deadline on July 25th"
        const subject = match[1]; // the project deadline
        const dateStr = match[2]; // July 25th
        timeText = match[3]; // time if any
        title = subject;
        dateText = dateStr;
        // Capture the full original prompt for better context-aware parsing
        fullPrompt = prompt;
      } else if (i === 3) {
        // "Schedule something tomorrow at 2 PM" - flexible pattern
        const subject = match[1]; // something
        timeText = match[2]; // 2 PM
        title = subject;
      } else if (i === 4) {
        // "Create a budget review for July 25th at 3pm"
        const subject = match[1]; // budget review
        const dateStr = match[2]; // July 25th
        timeText = match[3]; // 3pm
        title = subject;
        dateText = dateStr;
        // Capture the full original prompt for better context-aware parsing
        fullPrompt = prompt;
      }
      
      // Make sure we're using the full prompt for better context-aware parsing
      if (!fullPrompt) {
        fullPrompt = prompt;
      }
      
      const startDate = parseDateTime(dateText, timeText, fullPrompt);
      let endDate = startDate;
      
      // If we have a time, default to 1 hour duration
      if (timeText && startDate) {
        const endDateTime = new Date(startDate);
        endDateTime.setHours(endDateTime.getHours() + 1);
        endDate = endDateTime.toISOString();
      }
      
      return {
        action: 'create',
        title: title || 'New Event',
        startDate,
        endDate,
        allDay: !timeText
      };
    }
  }

  // Check update patterns
  for (const pattern of updatePatterns) {
    const match = prompt.match(pattern);
    if (match) {
      const title = match[1]?.trim();
      const newDate = match[2]?.trim();
      
      return {
        action: 'update',
        title,
        startDate: parseDateTime(newDate)
      };
    }
  }

  // Check list patterns
  for (const pattern of listPatterns) {
    const match = prompt.match(pattern);
    if (match) {
      const dateText = match[1]?.trim();
      const startDate = parseDateTime(dateText) || new Date().toISOString();
      
      // Default to showing events for the specified day or today
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      
      return {
        action: 'list',
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString()
        }
      };
    }
  }

  // Check search patterns
  for (const pattern of searchPatterns) {
    const match = prompt.match(pattern);
    if (match) {
      const query = match[1]?.trim();
      
      return {
        action: 'search',
        query: query || prompt
      };
    }
  }

  return null;
}
