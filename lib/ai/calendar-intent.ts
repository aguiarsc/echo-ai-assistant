// calendar-intent.ts
// Utility for detecting calendar management intent in user prompts

export interface CalendarIntentResult {
  action: 'create' | 'update' | 'delete' | 'list' | 'search';
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  allDay?: boolean;
  eventId?: string;
  query?: string;
  dateRange?: { start: string; end: string };
}

/**
 * Detects if the user prompt requests calendar management actions
 * Returns action details if detected, or null otherwise.
 */
export function detectCalendarIntent(prompt: string): CalendarIntentResult | null {
  const lowerPrompt = prompt.toLowerCase();

  // Create event patterns - improved to capture time expressions better
  const createPatterns = [
    // "Schedule a meeting with the team tomorrow at 2 PM"
    /(?:schedule|add|create|book)\s+(?:a|an)?\s*(meeting|appointment|event|call)\s+(?:with|for)\s+([^,]+?)\s+(?:tomorrow|today|on\s+\w+|for\s+\w+)(?:\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?))?/i,
    // "Add a dentist appointment on Friday at 10:30 AM"
    /(?:add|create|schedule|book)\s+(?:a|an)?\s*([^\s]+)\s+(appointment|meeting|event)\s+(?:on|for)\s+(\w+)(?:\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?))?/i,
    // "Create an event for the project deadline on July 25th"
    /(?:create|add|schedule)\s+(?:a|an)?\s*(?:event|appointment|meeting)\s+(?:for|about)\s+([^,]+?)\s+(?:on|for)\s+([^,]+?)(?:\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?))?/i
  ];

  // Update event patterns
  const updatePatterns = [
    /(?:update|modify|change|edit|reschedule)\s+(?:the\s+)?(?:event|appointment|meeting)(?:\s+(?:called|named|titled)\s+["']?([^"']+)["']?)?/i,
    /(?:move|reschedule)\s+(?:the\s+)?(?:event|appointment|meeting)(?:\s+(?:called|named|titled)\s+["']?([^"']+)["']?)?(?:\s+to\s+([^,]+))?/i
  ];

  // Delete event patterns
  const deletePatterns = [
    /(?:delete|remove|cancel|clear)\s+(?:the\s+)?(?:event|appointment|meeting)(?:\s+(?:called|named|titled)\s+["']?([^"']+)["']?)?/i,
    /(?:cancel|remove)\s+(?:my\s+)?(?:appointment|meeting|event)(?:\s+(?:on|for|at)\s+([^,]+))?/i
  ];

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

  // Helper function to parse date/time from text
  const parseDateTime = (dateText: string, timeText?: string): string | undefined => {
    if (!dateText) return undefined;
    
    const cleaned = dateText.trim().toLowerCase();
    let baseDate = new Date();
    
    // Handle relative dates
    if (cleaned.includes('today')) {
      baseDate = new Date();
    } else if (cleaned.includes('tomorrow')) {
      baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 1);
    } else if (cleaned.includes('friday')) {
      baseDate = new Date();
      const daysUntilFriday = (5 - baseDate.getDay() + 7) % 7 || 7;
      baseDate.setDate(baseDate.getDate() + daysUntilFriday);
    } else if (cleaned.includes('next week')) {
      baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 7);
    } else {
      // Try to parse as date
      try {
        const parsed = new Date(dateText);
        if (!isNaN(parsed.getTime())) {
          baseDate = parsed;
        }
      } catch (e) {
        // Use today as fallback
      }
    }
    
    // Parse time if provided
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
      }
      
      // Extract date from the original prompt if not captured
      if (dateText === 'today') {
        if (prompt.toLowerCase().includes('tomorrow')) {
          dateText = 'tomorrow';
        } else if (prompt.toLowerCase().includes('friday')) {
          dateText = 'friday';
        }
      }
      
      const startDate = parseDateTime(dateText, timeText);
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

  // Check delete patterns
  for (const pattern of deletePatterns) {
    const match = prompt.match(pattern);
    if (match) {
      const title = match[1]?.trim();
      const dateText = match[2]?.trim();
      
      return {
        action: 'delete',
        title,
        startDate: parseDateTime(dateText)
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
