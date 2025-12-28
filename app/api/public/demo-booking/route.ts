import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { publicDemoService } from "@/lib/services/public-demo.service";

// Input validation schema
const DemoBookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  company: z.string().min(1, "Company name is required").max(200),
  phone: z.string().max(50).optional(),
  selectedSlot: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  }),
});

// Rate limiting - simple in-memory store
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // Max requests
const RATE_WINDOW = 60 * 1000; // Per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 60000); // Clean up every minute

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  "https://golfbooker.fi",
  "https://www.golfbooker.fi",
  process.env.NODE_ENV === "development" ? "http://localhost:5173" : null,
  process.env.NODE_ENV === "development" ? "http://localhost:3000" : null,
].filter(Boolean) as string[];

function getCorsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin");
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);

  return new NextResponse(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);

  // Rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: corsHeaders }
    );
  }

  try {
    const body = await request.json();

    // Validate input
    const validationResult = DemoBookingSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const input = validationResult.data;

    // Validate date is not in the past
    const selectedDate = new Date(
      `${input.selectedSlot.date}T${input.selectedSlot.time}:00`
    );
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today

    if (selectedDate < now) {
      return NextResponse.json(
        { error: "Cannot book a demo in the past" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate date is within reasonable range (max 60 days ahead)
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 60);
    if (selectedDate > maxDate) {
      return NextResponse.json(
        { error: "Cannot book more than 60 days in advance" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate time is within business hours (09:00 - 17:00)
    const hour = parseInt(input.selectedSlot.time.split(":")[0], 10);
    if (hour < 9 || hour >= 17) {
      return NextResponse.json(
        { error: "Please select a time between 09:00 and 17:00" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Book the demo
    const result = await publicDemoService.bookDemo(input);

    return NextResponse.json(result, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error("Demo booking error:", error);
    return NextResponse.json(
      { error: "Failed to book demo. Please try again." },
      { status: 500, headers: corsHeaders }
    );
  }
}
