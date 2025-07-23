// calendar-intent.ts
// AI-powered calendar intent detection and event extraction

import { generateGeminiResponse } from "@/lib/gemini/api";
import { CalendarEvent } from "@/lib/calendar/types";

export interface CalendarIntentResult {
  hasCalendarIntent: boolean;
  intentType: 'create_single' | 'create_multiple' | 'none';
  events: CalendarEventData[];
  confidence: number;
}

export interface CalendarEventData {
  title: string;
  description?: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  allDay: boolean;
  color?: string;
}

// Default values for calendar events
export const CALENDAR_DEFAULTS = {
  color: "#3b82f6", // Blue
  duration: 60, // 60 minutes default duration
  startTime: "09:00",
  endTime: "10:00"
};

// Available calendar colors
export const CALENDAR_COLORS = [
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#10b981", // Green
  "#f59e0b", // Yellow
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#84cc16", // Lime
  "#ec4899", // Pink
  "#6b7280"  // Gray
];

/**
 * Detects calendar intent in user messages using AI
 */
export async function detectCalendarIntent(
  message: string,
  apiKey: string,
  fileContext?: string
): Promise<CalendarIntentResult> {
  const systemPrompt = `You are a calendar intent detection system. Analyze the user's message and determine if they want to create calendar events.

TASK: Analyze the message and extract calendar event information.

RULES:
1. Only detect calendar intent if the user explicitly mentions calendar, events, appointments, meetings, or scheduling
2. Extract all event details mentioned (title, date, time, description, etc.)
3. For missing information, use smart defaults:
   - Default duration: 1 hour
   - Default start time: 09:00 if no time specified
   - Default color: #3b82f6 (blue)
   - Default date: today if no date specified
4. Support various date formats (natural language, ISO, relative dates)
5. Support time ranges and all-day events
6. If file context is provided and user asks to extract events from context, analyze the context for event information

CURRENT DATE/TIME: ${new Date().toISOString()}

AVAILABLE COLORS: ${CALENDAR_COLORS.join(', ')}

RESPONSE FORMAT (JSON only):
{
  "hasCalendarIntent": boolean,
  "intentType": "create_single" | "create_multiple" | "none",
  "events": [
    {
      "title": "string",
      "description": "string (optional)",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD", 
      "startTime": "HH:MM (optional for all-day)",
      "endTime": "HH:MM (optional for all-day)",
      "allDay": boolean,
      "color": "hex color"
    }
  ],
  "confidence": number (0-1)
}

${fileContext ? `\nFILE CONTEXT:\n${fileContext}` : ''}

USER MESSAGE: ${message}`;

  try {
    const response = await generateGeminiResponse({
      apiKey,
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: systemPrompt, id: "intent-detection", timestamp: Date.now() }],
      params: {
        temperature: 0.1, // Low temperature for consistent parsing
        maxOutputTokens: 2048,
        thinkingEnabled: false
      }
    });

    // Extract JSON from response
    const responseText = typeof response === 'string' ? response : response.text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { hasCalendarIntent: false, intentType: 'none', events: [], confidence: 0 };
    }

    const result = JSON.parse(jsonMatch[0]) as CalendarIntentResult;
    
    // Validate and sanitize the result
    return validateCalendarIntent(result);
    
  } catch (error) {
    console.error('Calendar intent detection failed:', error);
    return { hasCalendarIntent: false, intentType: 'none', events: [], confidence: 0 };
  }
}

/**
 * Validates and sanitizes calendar intent results
 */
function validateCalendarIntent(result: CalendarIntentResult): CalendarIntentResult {
  // Ensure we have valid structure
  if (!result || typeof result.hasCalendarIntent !== 'boolean') {
    return { hasCalendarIntent: false, intentType: 'none', events: [], confidence: 0 };
  }

  // Validate events
  const validatedEvents = result.events?.map(event => validateEventData(event)).filter((event): event is CalendarEventData => event !== null) || [];

  return {
    hasCalendarIntent: result.hasCalendarIntent && validatedEvents.length > 0,
    intentType: validatedEvents.length > 1 ? 'create_multiple' : validatedEvents.length === 1 ? 'create_single' : 'none',
    events: validatedEvents,
    confidence: Math.min(Math.max(result.confidence || 0, 0), 1)
  };
}

/**
 * Validates and sanitizes individual event data
 */
function validateEventData(event: CalendarEventData): CalendarEventData | null {
  if (!event || !event.title || !event.startDate) {
    return null;
  }

  // Validate dates
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate || event.startDate);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return null;
  }

  // Ensure end date is not before start date
  if (endDate < startDate) {
    endDate.setTime(startDate.getTime());
  }

  // Validate color
  const color = CALENDAR_COLORS.includes(event.color || '') ? event.color : CALENDAR_DEFAULTS.color;

  // Handle time validation
  let startTime = event.startTime;
  let endTime = event.endTime;
  let allDay = event.allDay;

  if (!allDay && (!startTime || !endTime)) {
    startTime = CALENDAR_DEFAULTS.startTime;
    endTime = CALENDAR_DEFAULTS.endTime;
  }

  if (!allDay && startTime && endTime) {
    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      startTime = CALENDAR_DEFAULTS.startTime;
      endTime = CALENDAR_DEFAULTS.endTime;
    }
  }

  return {
    title: event.title.trim(),
    description: event.description?.trim(),
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    startTime: allDay ? undefined : startTime,
    endTime: allDay ? undefined : endTime,
    allDay: Boolean(allDay),
    color
  };
}

/**
 * Converts CalendarEventData to CalendarEvent for the store
 */
export function convertToCalendarEvent(eventData: CalendarEventData): Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'> {
  let startDate: Date;
  let endDate: Date;

  if (eventData.allDay) {
    startDate = new Date(eventData.startDate + 'T00:00:00');
    endDate = new Date(eventData.endDate + 'T23:59:59');
  } else {
    startDate = new Date(eventData.startDate + 'T' + (eventData.startTime || CALENDAR_DEFAULTS.startTime) + ':00');
    endDate = new Date(eventData.endDate + 'T' + (eventData.endTime || CALENDAR_DEFAULTS.endTime) + ':00');
  }

  return {
    title: eventData.title,
    description: eventData.description,
    startDate,
    endDate,
    allDay: eventData.allDay,
    color: eventData.color || CALENDAR_DEFAULTS.color
  };
}
