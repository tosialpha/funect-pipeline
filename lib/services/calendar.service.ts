import { createClient } from "@/lib/supabase/client";
import { getColorForPerson, AssignedPerson } from "@/lib/constants/person-colors";

export type EventType = "task" | "demo" | "meeting" | "call" | "other";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_type: EventType;
  start_time: string;
  end_time: string;
  all_day: boolean;
  prospect_id?: string;
  user_id: string;
  location?: string;
  color: string;
  assigned_to: AssignedPerson;
  created_at: string;
  updated_at: string;
  // Relations
  prospect?: {
    id: string;
    name: string;
    company: string;
    pipeline_stage: string;
  };
}

export interface CreateEventInput {
  title: string;
  description?: string;
  event_type: EventType;
  start_time: Date | string;
  end_time: Date | string;
  all_day?: boolean;
  prospect_id?: string;
  location?: string;
  assigned_to?: AssignedPerson;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  id: string;
}

export class CalendarService {
  private supabase = createClient();

  /**
   * Get all events for a specific date range
   */
  async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    const { data, error } = await this.supabase
      .from("calendar_events")
      .select(
        `
        *,
        prospect:prospects(
          id,
          name,
          type,
          pipeline_stage
        )
      `
      )
      .gte("start_time", startDate.toISOString())
      .lte("start_time", endDate.toISOString())
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching events:", error);
      throw error;
    }

    return (data || []).map((event) => ({
      ...event,
      prospect: event.prospect
        ? {
            id: event.prospect.id,
            name: event.prospect.name,
            company: event.prospect.type,
            pipeline_stage: event.prospect.pipeline_stage,
          }
        : undefined,
    })) as CalendarEvent[];
  }

  /**
   * Get events for a specific month
   */
  async getMonthEvents(year: number, month: number): Promise<CalendarEvent[]> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);
    return this.getEvents(startDate, endDate);
  }

  /**
   * Get events for a specific day
   */
  async getDayEvents(date: Date): Promise<CalendarEvent[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getEvents(startOfDay, endOfDay);
  }

  /**
   * Create a new calendar event
   */
  async createEvent(input: CreateEventInput): Promise<CalendarEvent> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Derive color from assigned_to
    const assignedTo = input.assigned_to || "team";
    const color = getColorForPerson(assignedTo);

    const { data, error } = await this.supabase
      .from("calendar_events")
      .insert({
        title: input.title,
        description: input.description || null,
        event_type: input.event_type,
        start_time: new Date(input.start_time).toISOString(),
        end_time: new Date(input.end_time).toISOString(),
        all_day: input.all_day || false,
        prospect_id: input.prospect_id || null,
        location: input.location || null,
        assigned_to: assignedTo,
        color: color,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating event:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      throw new Error(`Failed to create event: ${error.message || 'Unknown error'}`);
    }

    return data as CalendarEvent;
  }

  /**
   * Update an existing event
   */
  async updateEvent(input: UpdateEventInput): Promise<CalendarEvent> {
    const { id, ...updates } = input;

    const updateData: any = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.event_type !== undefined)
      updateData.event_type = updates.event_type;
    if (updates.start_time !== undefined)
      updateData.start_time = new Date(updates.start_time).toISOString();
    if (updates.end_time !== undefined)
      updateData.end_time = new Date(updates.end_time).toISOString();
    if (updates.all_day !== undefined) updateData.all_day = updates.all_day;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.assigned_to !== undefined) {
      updateData.assigned_to = updates.assigned_to;
      updateData.color = getColorForPerson(updates.assigned_to);
    }

    const { data, error } = await this.supabase
      .from("calendar_events")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating event:", error);
      throw error;
    }

    return data as CalendarEvent;
  }

  /**
   * Delete an event
   */
  async deleteEvent(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("calendar_events")
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      console.error("Error deleting event:", error);
      throw error;
    }
  }

  /**
   * Create a demo event and update prospect's demo scheduled date
   */
  async createDemoEvent(
    prospectId: string,
    demoType: "first_demo" | "second_demo",
    startTime: Date,
    endTime: Date,
    prospectName: string,
    responsiblePerson?: string
  ): Promise<CalendarEvent> {
    // Determine assigned_to from responsible person or default to 'team'
    const assignedTo = (responsiblePerson?.toLowerCase() || "team") as AssignedPerson;

    // Create the calendar event
    const event = await this.createEvent({
      title: `${demoType === "first_demo" ? "First" : "Second"} Demo - ${prospectName}`,
      description: `Demo scheduled for ${prospectName}`,
      event_type: "demo",
      start_time: startTime,
      end_time: endTime,
      prospect_id: prospectId,
      assigned_to: assignedTo,
    });

    // Update the prospect with the scheduled date
    const dateField =
      demoType === "first_demo"
        ? "first_demo_scheduled_at"
        : "second_demo_scheduled_at";

    const { error: prospectError } = await this.supabase
      .from("prospects")
      .update({ [dateField]: startTime.toISOString() })
      .eq("id", prospectId);

    if (prospectError) {
      console.error("Error updating prospect demo date:", prospectError);
      // Don't throw - the event is already created
    }

    return event;
  }

  /**
   * Get all demo events for a prospect
   */
  async getProspectDemos(prospectId: string): Promise<CalendarEvent[]> {
    const { data, error } = await this.supabase
      .from("calendar_events")
      .select("*")
      .eq("prospect_id", prospectId)
      .eq("event_type", "demo")
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching prospect demos:", error);
      throw error;
    }

    return (data || []) as CalendarEvent[];
  }
}

export const calendarService = new CalendarService();
