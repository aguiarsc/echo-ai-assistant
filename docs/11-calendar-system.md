# Calendar System Documentation

## Overview

The altIA Business Assistant includes a comprehensive calendar management system that allows users to create, update, view, and search calendar events through both natural language commands and a visual interface. This system is designed specifically for business productivity workflows.

## Features

### 🗓️ **Visual Calendar Interface**
- Interactive calendar component with month/day views
- Visual indicators for days with events (colored background + dot)
- Click-to-view events for specific dates
- Manual event creation, editing, and deletion through UI
- Professional business-focused design

### 🤖 **AI-Powered Natural Language Commands**
- Create events via chat: "Schedule a meeting with the team tomorrow at 2 PM"
- Update events: "Reschedule the team standup to 10 AM"
- View events: "Show me my calendar for today"
- Search events: "Find all meetings with John"
- **Safety Feature**: Event deletion is manual-only for data protection

### 💾 **Persistent Storage**
- Events stored in IndexedDB via Dexie
- Automatic synchronization between chat and calendar UI
- Reliable data persistence across sessions

## Architecture

### Core Components

#### 1. Calendar Tab (`components/calendar/calendar-tab.tsx`)
```typescript
// Main calendar interface component
- Interactive calendar with shadcn/ui components
- Event creation/editing dialogs
- Visual day indicators for events
- Calendar FAQ dialog
- Event list display
```

#### 2. Calendar Store (`lib/calendar/store.ts`)
```typescript
// Zustand store for calendar state management
interface CalendarStore {
  events: CalendarEvent[]
  selectedDate: Date
  view: 'month' | 'day'
  
  // Actions
  addEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<string>
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  loadEvents: () => Promise<void>
}
```

#### 3. Calendar Intent Detection (`lib/ai/calendar-intent.ts`)
```typescript
// Natural language processing for calendar commands
export interface CalendarIntentResult {
  action: 'create' | 'update' | 'list' | 'search'
  title?: string
  description?: string
  startDate?: string
  endDate?: string
  allDay?: boolean
  eventId?: string
  query?: string
}
```

#### 4. Calendar Functions (`lib/calendar/functions.ts`)
```typescript
// Gemini API function calling implementations
const calendarFunctions = {
  create_calendar_event: async (args) => { /* ... */ },
  update_calendar_event: async (args) => { /* ... */ },
  list_calendar_events: async (args) => { /* ... */ },
  search_calendar_events: async (args) => { /* ... */ }
}
```

### Data Models

#### CalendarEvent Interface
```typescript
interface CalendarEvent {
  id: string
  title: string
  description?: string
  startDate: Date
  endDate: Date
  allDay: boolean
  color?: string
  createdAt: Date
  updatedAt: Date
}
```

## Natural Language Commands

### Event Creation
```
"Schedule a meeting with the team tomorrow at 2 PM"
"Add a dentist appointment on Friday at 10:30 AM"
"Create an event for the project deadline on July 25th"
"Book a conference call for next Monday from 9 to 10 AM"
```

### Event Updates
```
"Reschedule the team standup to 10 AM"
"Update the project deadline to next Friday"
"Move my dentist appointment to 3 PM"
"Change the meeting time to 2:30 PM"
```

### Viewing Events
```
"Show me my calendar for today"
"What meetings do I have tomorrow?"
"List all events for this week"
"What's on my schedule for Friday?"
```

### Searching Events
```
"Find all meetings with John"
"Search for dentist appointments"
"Look for project-related events"
"Show me all events containing 'review'"
```

## Safety Features

### Manual-Only Deletion Policy
- **Rationale**: Event deletion is destructive and irreversible
- **Implementation**: AI cannot delete events via natural language
- **User Experience**: All deletions must be done through Calendar tab UI
- **Benefits**: Prevents accidental deletions from AI misunderstanding

### Robust Intent Detection
- Multiple regex patterns for flexible command recognition
- Date/time parsing for various formats (12-hour, 24-hour, relative dates)
- Error handling for invalid dates and malformed commands
- Fallback mechanisms for ambiguous requests

## Technical Implementation

### Chat Integration
```typescript
// In chat-input.tsx
const calendarIntent = detectCalendarIntent(messageToSend)
if (calendarIntent) {
  // Handle calendar action
  const result = await calendarFunctions[`${calendarIntent.action}_calendar_event`](args)
  // Update chat with calendar response
}
```

### Visual Day Indicators
```typescript
// In calendar-tab.tsx
const modifiers = {
  hasEvents: daysWithEvents
}

const modifiersClassNames = {
  hasEvents: 'bg-primary/10 text-primary font-semibold relative after:absolute after:bottom-1 after:left-1/2 after:transform after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full'
}
```

### Database Schema
```typescript
// In lib/dexie/db.ts
calendarEvents: '++id, title, startDate, endDate, createdAt, updatedAt'
```

## User Interface Features

### Calendar FAQ Dialog
- Comprehensive guide for natural language commands
- Example commands for each operation type
- Pro tips for effective calendar management
- Clear explanation of safety policies

### Event Management
- **Create**: Click "Add Event" button or use natural language
- **Edit**: Click on existing events in calendar or event list
- **Delete**: Manual deletion through event context menu (safety feature)
- **View**: Click on calendar days or use list commands

### Visual Enhancements
- Days with events show colored background and dot indicator
- Responsive design for different screen sizes
- Professional business theme integration
- Clear event time and title display

## Best Practices

### For Users
1. **Be Specific**: Use exact dates and times ("tomorrow at 2 PM" vs "later")
2. **Include Details**: Add participants, location, or description in requests
3. **Use Natural Language**: The AI understands various date formats
4. **Manual Deletion**: Always delete events manually for safety
5. **Check Results**: Verify created/updated events in Calendar tab

### For Developers
1. **Error Handling**: Always wrap calendar operations in try-catch blocks
2. **Date Validation**: Validate all date inputs before processing
3. **State Sync**: Ensure calendar store stays synchronized with database
4. **Intent Detection**: Test regex patterns thoroughly for edge cases
5. **Safety First**: Never implement automatic deletion features

## Future Enhancements

### Potential Features
- **Recurring Events**: Support for daily/weekly/monthly repeating events
- **Event Reminders**: Notification system for upcoming events
- **Calendar Sync**: Integration with external calendar services (Google, Outlook)
- **Team Calendars**: Shared calendar functionality for teams
- **Event Categories**: Color-coded event types and filtering
- **Time Zone Support**: Multi-timezone event management

### Technical Improvements
- **Performance**: Optimize large event set handling
- **Search**: Enhanced search with filters and date ranges
- **Export**: Calendar export functionality (ICS format)
- **Import**: Bulk event import capabilities
- **Analytics**: Calendar usage statistics and insights

## Troubleshooting

### Common Issues

#### Events Not Appearing
- Check if events are within the current calendar view date range
- Verify events were successfully saved to database
- Refresh calendar by switching tabs or reloading

#### Natural Language Not Working
- Ensure commands are specific and include dates/times
- Check console for intent detection debugging
- Try alternative phrasings for the same request

#### Date/Time Parsing Issues
- Use clear date formats ("July 25th" vs "25/7")
- Include AM/PM for 12-hour time format
- Avoid ambiguous relative dates

## API Reference

### Calendar Functions
```typescript
// Create event
create_calendar_event({
  title: string,
  description?: string,
  startDate: string,
  endDate: string,
  allDay?: boolean,
  color?: string
})

// Update event
update_calendar_event({
  eventId: string,
  title?: string,
  description?: string,
  startDate?: string,
  endDate?: string,
  allDay?: boolean,
  color?: string
})

// List events
list_calendar_events({
  startDate: string,
  endDate: string
})

// Search events
search_calendar_events({
  query: string
})
```

### Store Methods
```typescript
// Add event
const eventId = await useCalendarStore.getState().addEvent(eventData)

// Update event
await useCalendarStore.getState().updateEvent(id, updates)

// Delete event
await useCalendarStore.getState().deleteEvent(id)

// Load events
await useCalendarStore.getState().loadEvents()
```

## Conclusion

The Calendar System transforms altIA from a document assistant into a comprehensive business productivity tool. By combining natural language processing with a robust visual interface, it provides users with flexible, safe, and efficient calendar management capabilities that integrate seamlessly with the existing chat-based workflow.

The system's emphasis on safety (manual-only deletion), comprehensive intent detection, and professional UI design makes it suitable for business environments where data integrity and user control are paramount.
