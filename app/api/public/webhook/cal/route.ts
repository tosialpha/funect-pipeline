import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getColorForPerson } from "@/lib/constants/person-colors";

// Service role client - bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Cal.com webhook payload types
interface CalBookingPayload {
  triggerEvent: string;
  createdAt: string;
  payload: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    organizer: {
      email: string;
      name: string;
      timeZone: string;
    };
    attendees: Array<{
      email: string;
      name: string;
      timeZone: string;
    }>;
    location?: string;
    meetingUrl?: string;
    metadata?: Record<string, unknown>;
    uid: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CalBookingPayload = await request.json();

    console.log("Cal.com webhook received:", JSON.stringify(body, null, 2));

    // Only process BOOKING_CREATED events
    if (body.triggerEvent !== "BOOKING_CREATED") {
      return NextResponse.json({ message: "Event ignored" }, { status: 200 });
    }

    const { payload } = body;
    const attendee = payload.attendees[0];

    if (!attendee) {
      return NextResponse.json({ error: "No attendee found" }, { status: 400 });
    }

    // 1. Find or create prospect
    const prospect = await findOrCreateProspect(attendee.email, attendee.name);

    // 2. Get a user ID for the event (first user in system)
    const { data: users } = await supabaseAdmin
      .from("users")
      .select("id")
      .limit(1)
      .single();

    if (!users) {
      throw new Error("No user found to assign the event");
    }

    // 3. Create calendar event
    const startTime = new Date(payload.startTime);
    const endTime = new Date(payload.endTime);

    const { data: event, error: eventError } = await supabaseAdmin
      .from("calendar_events")
      .insert({
        title: `Demo - ${attendee.name}`,
        description: `Cal.com booking\nEmail: ${attendee.email}\nMeeting URL: ${payload.meetingUrl || 'TBD'}\n\n${payload.description || ''}`,
        event_type: "demo",
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        all_day: false,
        prospect_id: prospect.id,
        user_id: users.id,
        assigned_to: "veeti",
        color: getColorForPerson("veeti"),
        location: payload.meetingUrl || payload.location || "Google Meet",
      })
      .select()
      .single();

    if (eventError) {
      console.error("Error creating calendar event:", eventError);
      throw eventError;
    }

    // 4. Update prospect with demo scheduled date
    await supabaseAdmin
      .from("prospects")
      .update({
        first_demo_scheduled_at: startTime.toISOString(),
        pipeline_stage: "first_demo",
      })
      .eq("id", prospect.id);

    console.log("Successfully created prospect and event:", {
      prospectId: prospect.id,
      eventId: event.id,
    });

    return NextResponse.json({
      success: true,
      prospectId: prospect.id,
      eventId: event.id,
    });
  } catch (error) {
    console.error("Cal.com webhook error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

async function findOrCreateProspect(email: string, name: string) {
  // Check if prospect exists by email
  const { data: existing } = await supabaseAdmin
    .from("prospects")
    .select("id")
    .eq("email", email.toLowerCase())
    .single();

  if (existing) {
    return existing;
  }

  // Create new prospect
  const { data: newProspect, error } = await supabaseAdmin
    .from("prospects")
    .insert({
      name: name,
      type: "Golf",
      country: "Finland",
      city: "Unknown",
      email: email.toLowerCase(),
      pipeline_stage: "not_contacted",
      priority: "medium",
      lead_source: "website",
      responsible_person: "veeti",
      notes: `Booked demo via Cal.com\nContact: ${name}`,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating prospect:", error);
    throw error;
  }

  return newProspect;
}

// Handle GET for verification (some webhook services ping with GET)
export async function GET() {
  return NextResponse.json({ status: "Webhook endpoint active" });
}
