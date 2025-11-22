import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if user exists in our database
      const { data: existingUsers } = await supabase
        .from("users")
        .select("*")
        .eq("google_id", data.user.id);

      if (!existingUsers || existingUsers.length === 0) {
        // Create new user in our database
        await supabase.from("users").insert({
          email: data.user.email!,
          name: data.user.user_metadata.full_name || data.user.email!,
          avatar_url: data.user.user_metadata.avatar_url,
          google_id: data.user.id,
          role: "salesperson", // Default role, admin can change later
        });
      }
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
