"use client"

import { useEffect, useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { useCalendarStore } from "@/lib/calendar/store"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Edit, Trash2, Clock, HelpCircle, Command, Calendar as CalendarIcon } from "lucide-react"
import { CalendarEvent } from "@/lib/calendar/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface CalendarTabProps {
  open: boolean
}

export function CalendarTab({ open }: CalendarTabProps) {
  const {
    events,
    selectedDate,
    setSelectedDate,
    addEvent,
    updateEvent,
    deleteEvent,
    loadEvents,
    getEventsForDate
  } = useCalendarStore()

  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [faqDialogOpen, setFaqDialogOpen] = useState(false)
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    allDay: false,
    color: "#3b82f6"
  })

  // Load events on mount
  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // Get events for selected date
  const dayEvents = getEventsForDate(selectedDate)

  const resetForm = () => {
    setEventForm({
      title: "",
      description: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      allDay: false,
      color: "#3b82f6"
    })
    setEditingEvent(null)
  }

  const openEventDialog = (event?: CalendarEvent) => {
    if (event) {
      setEditingEvent(event)
      setEventForm({
        title: event.title,
        description: event.description || "",
        startDate: event.startDate.toISOString().split('T')[0],
        startTime: event.allDay ? "" : event.startDate.toTimeString().slice(0, 5),
        endDate: event.endDate.toISOString().split('T')[0],
        endTime: event.allDay ? "" : event.endDate.toTimeString().slice(0, 5),
        allDay: event.allDay,
        color: event.color || "#3b82f6"
      })
    } else {
      resetForm()
      // Set default dates to selected date
      const dateStr = selectedDate.toISOString().split('T')[0]
      setEventForm(prev => ({
        ...prev,
        startDate: dateStr,
        endDate: dateStr,
        startTime: "09:00",
        endTime: "10:00"
      }))
    }
    setIsEventDialogOpen(true)
  }

  const handleSaveEvent = async () => {
    if (!eventForm.title.trim()) {
      toast.error("Please enter an event title")
      return
    }

    try {
      // Create start and end dates
      let startDate: Date
      let endDate: Date

      if (eventForm.allDay) {
        startDate = new Date(eventForm.startDate + 'T00:00:00')
        endDate = new Date(eventForm.endDate + 'T23:59:59')
      } else {
        startDate = new Date(eventForm.startDate + 'T' + eventForm.startTime + ':00')
        endDate = new Date(eventForm.endDate + 'T' + eventForm.endTime + ':00')
      }

      if (startDate >= endDate) {
        toast.error("End time must be after start time")
        return
      }

      const eventData = {
        title: eventForm.title.trim(),
        description: eventForm.description.trim() || undefined,
        startDate,
        endDate,
        allDay: eventForm.allDay,
        color: eventForm.color
      }

      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData)
        toast.success("Event updated successfully")
      } else {
        await addEvent(eventData)
        toast.success("Event created successfully")
      }

      setIsEventDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error("Failed to save event")
      console.error(error)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId)
      toast.success("Event deleted successfully")
      setIsEventDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error("Failed to delete event")
      console.error(error)
    }
  }

  const formatEventTime = (event: CalendarEvent) => {
    if (event.allDay) return "All day"
    
    const startTime = event.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const endTime = event.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    
    return `${startTime} - ${endTime}`
  }

  // Get events that have indicators on the calendar
  const getEventsForCalendarDate = (date: Date) => {
    return getEventsForDate(date)
  }

  // Get the color for the date marker based on events
  const getDateColor = (date: Date) => {
    const dateEvents = getEventsForCalendarDate(date)
    if (dateEvents.length === 0) return null
    return dateEvents[0].color || '#3b82f6'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Calendar Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFaqDialogOpen(true)}
              className="h-8"
            >
              <HelpCircle className="h-4 w-4" />
              {open && <span className="ml-1">Calendar FAQ</span>}
            </Button>
            <Button
              size="sm"
              onClick={() => openEventDialog()}
              className="h-8"
            >
              <Plus className="h-4 w-4" />
              {open && <span className="ml-1">Add Event</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Component */}
      <div className="p-4">
      <div className="calendar-wrapper">
          {/* Create hidden divs with custom CSS variables for each date that has events */}
          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
            // Create a date object for the current month/day
            const dateToCheck = new Date(selectedDate);
            dateToCheck.setDate(day);
            
            const color = getDateColor(dateToCheck);
            if (!color) return null;
            
            // Create unique CSS variable for this date
            const dayStr = dateToCheck.getDate().toString().padStart(2, '0');
            const monthStr = (dateToCheck.getMonth() + 1).toString().padStart(2, '0');
            const dateKey = `${monthStr}-${dayStr}`;
            
            return (
              <style key={dateKey}>{`
                .calendar-day-${dateKey} {
                  position: relative;
                  font-weight: 600;
                }
                .calendar-day-${dateKey}::after {
                  content: '';
                  position: absolute;
                  bottom: 0;
                  left: 50%;
                  transform: translateX(-50%);
                  width: 16px;
                  height: 2px;
                  background-color: ${color};
                  border-radius: 1px;
                }
              `}</style>
            );
          })}
          
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md border"
            modifiers={{
              hasEvents: (date) => {
                const events = getEventsForCalendarDate(date);
                return events.length > 0;
              },
              // Add dynamic class names for each day with events
              ...Array.from({ length: 31 }, (_, i) => i + 1).reduce((acc, day) => {
                const dateToCheck = new Date(selectedDate);
                dateToCheck.setDate(day);
                const events = getEventsForCalendarDate(dateToCheck);
                
                if (events.length > 0) {
                  const dayStr = dateToCheck.getDate().toString().padStart(2, '0');
                  const monthStr = (dateToCheck.getMonth() + 1).toString().padStart(2, '0');
                  const dateKey = `${monthStr}-${dayStr}`;
                  
                  acc[`calendar-day-${dateKey}`] = (modifierDate) => 
                    modifierDate.getDate() === dateToCheck.getDate() && 
                    modifierDate.getMonth() === dateToCheck.getMonth() &&
                    modifierDate.getFullYear() === dateToCheck.getFullYear();
                }
                
                return acc;
              }, {} as Record<string, (date: Date) => boolean>)
            }}
            modifiersClassNames={{
              // Apply the dynamic class names for each day with events
              ...Array.from({ length: 31 }, (_, i) => i + 1).reduce((acc, day) => {
                const dateToCheck = new Date(selectedDate);
                dateToCheck.setDate(day);
                const events = getEventsForCalendarDate(dateToCheck);
                
                if (events.length > 0) {
                  const dayStr = dateToCheck.getDate().toString().padStart(2, '0');
                  const monthStr = (dateToCheck.getMonth() + 1).toString().padStart(2, '0');
                  const dateKey = `${monthStr}-${dayStr}`;
                  
                  acc[`calendar-day-${dateKey}`] = `calendar-day-${dateKey}`;
                }
                
                return acc;
              }, {} as Record<string, string>)
            }}
          />
        </div>
      </div>

      {/* Events for Selected Date */}
      <div className="flex-1 overflow-hidden">
        <div className="p-4 border-t">
          <h3 className="text-sm font-medium mb-3">
            Events for {selectedDate.toLocaleDateString()}
          </h3>
          
          <ScrollArea className="h-[200px]">
            {dayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events for this day</p>
            ) : (
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-3 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                    style={{ border: `1px solid ${event.color || '#3b82f6'}` }}
                    onClick={() => openEventDialog(event)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{event.title}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {formatEventTime(event)}
                          </p>
                        </div>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Event Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Edit Event" : "Create Event"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={eventForm.title}
                onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Event title"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={eventForm.description}
                onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Event description (optional)"
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="allDay"
                checked={eventForm.allDay}
                onCheckedChange={(checked) => setEventForm(prev => ({ ...prev, allDay: checked }))}
              />
              <Label htmlFor="allDay">All day event</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={eventForm.startDate}
                  onChange={(e) => setEventForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              
              {!eventForm.allDay && (
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={eventForm.startTime}
                    onChange={(e) => setEventForm(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={eventForm.endDate}
                  onChange={(e) => setEventForm(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              
              {!eventForm.allDay && (
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={eventForm.endTime}
                    onChange={(e) => setEventForm(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                type="color"
                value={eventForm.color}
                onChange={(e) => setEventForm(prev => ({ ...prev, color: e.target.value }))}
                className="h-10 w-20"
              />
            </div>
            
            <div className="flex justify-between pt-4">
              {editingEvent && (
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteEvent(editingEvent.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              
              <div className="flex gap-2 ml-auto">
                <Button
                  variant="outline"
                  onClick={() => setIsEventDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveEvent}>
                  {editingEvent ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Calendar FAQ Dialog */}
      <Dialog open={faqDialogOpen} onOpenChange={setFaqDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl font-bold">
              <HelpCircle className="h-5 w-5 mr-2 text-primary" />
              Calendar Guide
            </DialogTitle>
            <DialogDescription>
              Learn how to manage your calendar using AI-powered natural language commands.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Calendar Commands</h3>
              <p className="text-muted-foreground text-sm">
                You can manage your calendar by typing natural language commands in the chat. Here are some examples:
              </p>
              
              <div className="bg-muted/50 rounded-md p-3 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center text-sm font-semibold">
                    <Command className="h-3 w-3 mr-1 text-primary" /> 
                    Creating Events
                  </div>
                  <code className="text-xs bg-muted rounded px-1 py-0.5 block">Schedule a meeting with the team tomorrow at 2 PM</code>
                  <code className="text-xs bg-muted rounded px-1 py-0.5 block mt-1">Add a dentist appointment on Friday at 10:30 AM</code>
                  <code className="text-xs bg-muted rounded px-1 py-0.5 block mt-1">Create an event for the project deadline on July 25th</code>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center text-sm font-semibold">
                    <Command className="h-3 w-3 mr-1 text-primary" /> 
                    Viewing Events
                  </div>
                  <code className="text-xs bg-muted rounded px-1 py-0.5 block">Show me my calendar for today</code>
                  <code className="text-xs bg-muted rounded px-1 py-0.5 block mt-1">What meetings do I have tomorrow?</code>
                  <code className="text-xs bg-muted rounded px-1 py-0.5 block mt-1">List all events for this week</code>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center text-sm font-semibold">
                    <Command className="h-3 w-3 mr-1 text-primary" /> 
                    Searching Events
                  </div>
                  <code className="text-xs bg-muted rounded px-1 py-0.5 block">Find all meetings with John</code>
                  <code className="text-xs bg-muted rounded px-1 py-0.5 block mt-1">Search for dentist appointments</code>
                  <code className="text-xs bg-muted rounded px-1 py-0.5 block mt-1">Look for project-related events</code>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center text-sm font-semibold">
                    <Command className="h-3 w-3 mr-1 text-primary" /> 
                    Managing Events
                  </div>
                  <code className="text-xs bg-muted rounded px-1 py-0.5 block">Cancel my 2 PM meeting today</code>
                  <code className="text-xs bg-muted rounded px-1 py-0.5 block mt-1">Reschedule the team standup to 10 AM</code>
                  <code className="text-xs bg-muted rounded px-1 py-0.5 block mt-1">Update the project deadline to next Friday</code>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Calendar Features</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded">
                  <Plus className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Create events</span>
                </div>
                <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded">
                  <CalendarIcon className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">View schedule</span>
                </div>
                <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded">
                  <Edit className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Update events</span>
                </div>
                <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded">
                  <Trash2 className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Delete events</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Pro Tips</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Be specific about dates and times (e.g., "tomorrow at 2 PM" vs "later")</li>
                <li>Include relevant details like participants or location in your request</li>
                <li>You can create all-day events by omitting specific times</li>
                <li>Use natural language - the AI understands various date formats</li>
                <li>Days with events are highlighted on the calendar with a colored background and dot</li>
                <li>Click on any calendar day to view events for that specific date</li>
                <li>Use the Calendar tab for manual event management with the visual interface</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}