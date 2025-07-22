import { CalendarEvent } from "./types";
import { useCalendarStore } from "./store";

// Calendar function declarations for Gemini API
export const calendarFunctionDeclarations = [
  {
    name: 'create_calendar_event',
    description: 'Create a new calendar event with specified details',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The title of the event'
        },
        description: {
          type: 'string',
          description: 'Optional description of the event'
        },
        startDate: {
          type: 'string',
          description: 'Start date and time in ISO format (e.g., 2024-01-15T09:00:00)'
        },
        endDate: {
          type: 'string',
          description: 'End date and time in ISO format (e.g., 2024-01-15T10:00:00). If not provided, will default to 1 hour after start time'
        },
        allDay: {
          type: 'boolean',
          description: 'Whether this is an all-day event'
        },
        color: {
          type: 'string',
          description: 'Color for the event in hex format (e.g., #3b82f6)'
        }
      },
      required: ['title', 'startDate']
    }
  },
  {
    name: 'list_calendar_events',
    description: 'List and retrieve all calendar events within a specific date range. Use this function when user asks to "show", "list", "get", or "display" events for any time period (today, tomorrow, this week, this month, etc.). This is the primary function for viewing calendar events.',
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Start date for the range in ISO format'
        },
        endDate: {
          type: 'string',
          description: 'End date for the range in ISO format'
        }
      },
      required: ['startDate', 'endDate']
    }
  },
  {
    name: 'search_calendar_events',
    description: 'Search for calendar events by title or description',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query to match against event titles and descriptions'
        }
      },
      required: ['query']
    }
  }
];

// Calendar function implementations
export const calendarFunctions = {
  create_calendar_event: async (args: {
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    allDay?: boolean;
    color?: string;
  }) => {
    try {
      const startDateObj = new Date(args.startDate);
      
      // Auto-calculate endDate if not provided (1 hour after start)
      let endDateObj: Date;
      if (args.endDate) {
        endDateObj = new Date(args.endDate);
      } else {
        endDateObj = new Date(startDateObj.getTime() + (60 * 60 * 1000)); // Add 1 hour
      }
      
      if (isNaN(startDateObj.getTime())) {
        throw new Error('Invalid start date format. Please use ISO format (e.g., 2024-01-15T09:00:00)');
      }
      
      if (isNaN(endDateObj.getTime())) {
        throw new Error('Invalid end date format. Please use ISO format (e.g., 2024-01-15T09:00:00)');
      }
      
      if (startDateObj > endDateObj) {
        throw new Error('End date must be after start date');
      }
      
      const eventData = {
        title: args.title,
        description: args.description,
        startDate: startDateObj,
        endDate: endDateObj,
        allDay: args.allDay || false,
        color: args.color || '#3b82f6'
      };
      
      const eventId = await useCalendarStore.getState().addEvent(eventData);
      
      return {
        success: true,
        message: `Calendar event "${args.title}" created successfully`,
        eventId,
        event: {
          ...eventData,
          id: eventId
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to create calendar event: ${error.message}`
      };
    }
  },

  list_calendar_events: async (args: { startDate: string; endDate: string }) => {
    try {
      console.log('📅 Listing events from', args.startDate, 'to', args.endDate);
      const startDateObj = new Date(args.startDate);
      const endDateObj = new Date(args.endDate);
      
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        throw new Error('Invalid date format');
      }
      
      const events = useCalendarStore.getState().getEventsForDateRange(startDateObj, endDateObj);
    
    let message = '';
    if (events.length === 0) {
      message = 'No events found for the specified date range';
    } else if (events.length === 1) {
      const event = events[0];
      const timeStr = event.allDay ? 'All day' : `${event.startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
      const dateStr = event.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      message = `Found 1 event:\n\n• **${event.title}** - ${dateStr} at ${timeStr}`;
    } else {
      const eventList = events.map(event => {
        const timeStr = event.allDay ? 'All day' : `${event.startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        const dateStr = event.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `• **${event.title}** - ${dateStr} at ${timeStr}`;
      }).join('\n');
      message = `Found ${events.length} events:\n\n${eventList}`;
    }
    
    const eventData = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      allDay: event.allDay,
      color: event.color
    }));
  
    console.log('📊 List function returning event data:', eventData);
  
    return {
      success: true,
      message,
      events: eventData
    };
  } catch (error: any) {
      return {
        success: false,
        message: `Failed to list calendar events: ${error.message}`
      };
    }
  },

  search_calendar_events: async (args: { query: string }) => {
    try {
      const { events } = useCalendarStore.getState();
      const query = args.query.toLowerCase();
      
      // More flexible matching logic
      const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
      
      const matchingEvents = events.filter(event => {
        const eventTitle = event.title.toLowerCase();
        const eventDesc = event.description?.toLowerCase() || '';
        
        // Direct substring match
        if (eventTitle.includes(query) || eventDesc.includes(query)) {
          return true;
        }
        
        // Word-based matching - if most words match
        const titleWords = eventTitle.split(/\s+/);
        const matchingWords = queryWords.filter(qWord => 
          titleWords.some(tWord => tWord.includes(qWord) || qWord.includes(tWord))
        );
        
        if (matchingWords.length >= Math.min(2, queryWords.length)) {
          return true;
        }
        
        // Time-based matching for deletion
        if (query.includes('pm') || query.includes('am') || /\d{1,2}:\d{2}/.test(query)) {
          const eventTime = event.startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}).toLowerCase();
          const queryTime = query.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i)?.[0]?.toLowerCase();
          
          if (queryTime && eventTime.includes(queryTime.replace(/\s/g, ''))) {
            return true;
          }
        }
        
        return false;
      });
      
      return {
        success: true,
        message: `Found ${matchingEvents.length} events matching "${args.query}"`,
        events: matchingEvents.map(event => ({
          id: event.id,
          title: event.title,
          description: event.description,
          startDate: event.startDate.toISOString(),
          endDate: event.endDate.toISOString(),
          allDay: event.allDay,
          color: event.color
        }))
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to search calendar events: ${error.message}`
      };
    }
  }
};
