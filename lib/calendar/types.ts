export interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    allDay: boolean;
    color?: string;
    createdAt: number;
    updatedAt: number;
  }
  
  export interface CalendarEventStore extends Omit<CalendarEvent, 'startDate' | 'endDate'> {
    // For database storage, we'll store dates as ISO strings
    startDate: string;
    endDate: string;
  }
  
  export type CalendarView = 'month' | 'week' | 'day';
  
  export interface CalendarState {
    events: CalendarEvent[];
    selectedDate: Date;
    view: CalendarView;
  }