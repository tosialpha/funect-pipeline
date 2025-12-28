import { createClient } from "@supabase/supabase-js";
import { getColorForPerson, AssignedPerson } from "@/lib/constants/person-colors";

// Service role client - bypasses RLS for public demo bookings
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface PublicDemoBookingInput {
  name: string;
  email: string;
  company: string;
  phone?: string;
  selectedSlot: {
    date: string; // ISO date: "2024-12-15"
    time: string; // Time: "09:00" or "10:00"
  };
}

export interface PublicDemoBookingResult {
  success: boolean;
  prospectId: string;
  eventId: string;
  scheduledTime: string;
}

export class PublicDemoService {
  /**
   * Book a demo from public form submission
   */
  async bookDemo(input: PublicDemoBookingInput): Promise<PublicDemoBookingResult> {
    // 1. Find or create prospect by email
    const prospect = await this.findOrCreateProspect(input);

    // 2. Calculate event times (1 hour demo)
    const startTime = new Date(`${input.selectedSlot.date}T${input.selectedSlot.time}:00`);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // +1 hour

    // 3. Create calendar event
    const event = await this.createDemoEvent(
      prospect.id,
      startTime,
      endTime,
      input.name,
      input.company
    );

    // 4. Update prospect with demo scheduled date
    await this.updateProspectDemoDate(prospect.id, startTime);

    return {
      success: true,
      prospectId: prospect.id,
      eventId: event.id,
      scheduledTime: startTime.toISOString(),
    };
  }

  private async findOrCreateProspect(
    input: PublicDemoBookingInput
  ): Promise<{ id: string }> {
    // Check if prospect exists by email
    const { data: existing } = await supabaseAdmin
      .from("prospects")
      .select("id")
      .eq("email", input.email.toLowerCase())
      .single();

    if (existing) {
      // Update existing prospect with new contact info if needed
      await supabaseAdmin
        .from("prospects")
        .update({
          phone: input.phone || undefined,
          notes: `Contact: ${input.name}\nUpdated via website demo booking.`,
        })
        .eq("id", existing.id);
      return existing;
    }

    // Create new prospect
    const { data: newProspect, error } = await supabaseAdmin
      .from("prospects")
      .insert({
        name: input.company,
        type: "Golf",
        country: "Finland",
        city: "Unknown",
        email: input.email.toLowerCase(),
        phone: input.phone || null,
        pipeline_stage: "not_contacted",
        priority: "medium",
        lead_source: "website",
        responsible_person: "veeti",
        notes: `Contact: ${input.name}\nBooked demo via website.`,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating prospect:", error);
      throw new Error(`Failed to create prospect: ${error.message}`);
    }

    return newProspect;
  }

  private async createDemoEvent(
    prospectId: string,
    startTime: Date,
    endTime: Date,
    contactName: string,
    companyName: string
  ): Promise<{ id: string }> {
    // Get the first authenticated user to use as the event creator
    // In a real scenario, you might want a specific system user
    const { data: users } = await supabaseAdmin
      .from("users")
      .select("id")
      .limit(1)
      .single();

    if (!users) {
      throw new Error("No user found to assign the event");
    }

    const assignedTo: AssignedPerson = "veeti";

    const { data: event, error } = await supabaseAdmin
      .from("calendar_events")
      .insert({
        title: `Demo - ${companyName}`,
        description: `Website demo booking\nContact: ${contactName}\nEmail: Sent via website`,
        event_type: "demo",
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        all_day: false,
        prospect_id: prospectId,
        user_id: users.id,
        assigned_to: assignedTo,
        color: getColorForPerson(assignedTo),
        location: "Google Meet / Teams",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating calendar event:", error);
      throw new Error(`Failed to create event: ${error.message}`);
    }

    return event;
  }

  private async updateProspectDemoDate(
    prospectId: string,
    demoTime: Date
  ): Promise<void> {
    // Check if prospect already has a first demo scheduled
    const { data: prospect } = await supabaseAdmin
      .from("prospects")
      .select("first_demo_scheduled_at")
      .eq("id", prospectId)
      .single();

    const dateField = prospect?.first_demo_scheduled_at
      ? "second_demo_scheduled_at"
      : "first_demo_scheduled_at";

    await supabaseAdmin
      .from("prospects")
      .update({
        [dateField]: demoTime.toISOString(),
        pipeline_stage: "first_demo", // Move to first demo stage
      })
      .eq("id", prospectId);
  }
}

export const publicDemoService = new PublicDemoService();
