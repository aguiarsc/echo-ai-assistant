import { create } from "zustand";
import { CalendarEvent, CalendarView, CalendarState, CalendarEventStore } from "./types";
import { nanoid } from "nanoid";
import { db } from "../dexie/db";

interface CalendarStore extends CalendarState {
  // Event management
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateEvent: (id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  loadEvents: () => Promise<void>;
  
  // View management
  setSelectedDate: (date: Date) => void;
  setView: (view: CalendarView) => void;
  
  // Helper methods
  getEventsForDate: (date: Date) => CalendarEvent[];
  getEventsForDateRange: (startDate: Date, endDate: Date) => CalendarEvent[];
}

// Helper functions to convert between Date and string for database storage
const eventToStore = (event: CalendarEvent): CalendarEventStore => ({
  ...event,
  startDate: event.startDate.toISOString(),
  endDate: event.endDate.toISOString(),
});

const eventFromStore = (stored: CalendarEventStore): CalendarEvent => ({
  ...stored,
  startDate: new Date(stored.startDate),
  endDate: new Date(stored.endDate),
});

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  // Initial state
  events: [],
  selectedDate: new Date(),
  view: 'month',

  // Event management
  addEvent: async (eventData) => {
    const id = nanoid();
    const now = Date.now();
    
    const event: CalendarEvent = {
      ...eventData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    try {
      // Save to database
      await db.calendarEvents.add(eventToStore(event));
      
      // Update store
      set(state => ({
        events: [...state.events, event].sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      }));
      
      return id;
    } catch (error) {
      console.error('Failed to add calendar event:', error);
      throw error;
    }
  },

  updateEvent: async (id, updates) => {
    const now = Date.now();
    
    try {
      // Prepare database updates with proper type conversion
      const { startDate, endDate, ...otherUpdates } = updates;
      const dbUpdates: Partial<CalendarEventStore> = {
        ...otherUpdates,
        updatedAt: now,
      };
      
      // Convert dates to strings if they exist
      if (startDate) {
        dbUpdates.startDate = startDate.toISOString();
      }
      if (endDate) {
        dbUpdates.endDate = endDate.toISOString();
      }
      
      // Update in database
      await db.calendarEvents.update(id, dbUpdates);
      
      // Update store
      set(state => ({
        events: state.events.map(event => 
          event.id === id 
            ? { ...event, ...updates, updatedAt: now }
            : event
        ).sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      }));
    } catch (error) {
      console.error('Failed to update calendar event:', error);
      throw error;
    }
  },

  deleteEvent: async (id) => {
    try {
      // Delete from database
      await db.calendarEvents.delete(id);
      
      // Update store
      set(state => ({
        events: state.events.filter(event => event.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      throw error;
    }
  },

  loadEvents: async () => {
    try {
      const storedEvents = await db.calendarEvents.toArray();
      const events = storedEvents.map(eventFromStore);
      
      set({
        events: events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      });
    } catch (error) {
      console.error('Failed to load calendar events:', error);
    }
  },

  // View management
  setSelectedDate: (date) => {
    set({ selectedDate: date });
  },

  setView: (view) => {
    set({ view });
  },

  // Helper methods
  getEventsForDate: (date) => {
    const { events } = get();
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    return events.filter(event => {
      const eventStart = new Date(event.startDate.getFullYear(), event.startDate.getMonth(), event.startDate.getDate());
      const eventEnd = new Date(event.endDate.getFullYear(), event.endDate.getMonth(), event.endDate.getDate());
      
      return targetDate >= eventStart && targetDate <= eventEnd;
    });
  },

  getEventsForDateRange: (startDate, endDate) => {
    const { events } = get();
    
    return events.filter(event => {
      return (
        (event.startDate >= startDate && event.startDate <= endDate) ||
        (event.endDate >= startDate && event.endDate <= endDate) ||
        (event.startDate <= startDate && event.endDate >= endDate)
      );
    });
  },
}));