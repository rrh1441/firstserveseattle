// src/app/api/update-and-check-session/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Ensure these environment variables are set in your Vercel deployment / .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    "ERROR: Missing Supabase URL or Service Role Key environment variables."
  );
  // Optionally throw an error during build/startup if config is missing
}

// Create Supabase Admin Client (uses Service Role Key for elevated privileges)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const PAYWALL_LIMIT = 3; // Define the view limit

export async function POST(request: Request) {
  let userId: string | undefined;

  try {
    const body = await request.json();
    userId = body.userId;

    if (!userId) {
      console.warn("[API update-and-check] Missing userId in request body");
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    console.log(`[API update-and-check] Processing request for userId: ${userId}`);

    // --- Upsert and Increment Logic ---
    let currentViews = 0;

    // 1. Check if user exists
    const { data: existingUser, error: selectError } = await supabaseAdmin
      .from("user_sessions")
      .select("views_count")
      .eq("user_id", userId)
      .maybeSingle(); // Use maybeSingle to handle null if not found

    if (selectError) {
      console.error(
        `[API update-and-check] Error selecting user ${userId}:`,
        selectError
      );
      // Don't expose detailed DB errors to client
      return NextResponse.json(
        { error: "Database error checking user session." },
        { status: 500 }
      );
    }

    // 2. Increment or Insert
    if (existingUser) {
      // User exists, increment count
      currentViews = (existingUser.views_count ?? 0) + 1;
      const { error: updateError } = await supabaseAdmin
        .from("user_sessions")
        .update({ views_count: currentViews, last_viewed_at: new Date().toISOString() }) // Also update last viewed time
        .eq("user_id", userId); // Match on user_id

      if (updateError) {
        console.error(
          `[API update-and-check] Error updating user ${userId}:`,
          updateError
        );
        return NextResponse.json(
          { error: "Database error updating user session." },
          { status: 500 }
        );
      }
      console.log(`[API update-and-check] Incremented views for ${userId} to ${currentViews}`);

    } else {
      // User does not exist, insert new record
      currentViews = 1; // First view
      const { error: insertError } = await supabaseAdmin
        .from("user_sessions")
        .insert({
           user_id: userId,
           views_count: currentViews,
           created_at: new Date().toISOString(),
           last_viewed_at: new Date().toISOString()
          });

      if (insertError) {
        console.error(
          `[API update-and-check] Error inserting user ${userId}:`,
          insertError
        );
        return NextResponse.json(
          { error: "Database error creating user session." },
          { status: 500 }
        );
      }
       console.log(`[API update-and-check] Inserted new session for ${userId} with ${currentViews} view`);
    }
    // --- End Upsert Logic ---

    // 3. Determine paywall status
    const showPaywall = currentViews > PAYWALL_LIMIT;
    console.log(`[API update-and-check] User ${userId}: Views=${currentViews}, ShowPaywall=${showPaywall}`);


    // 4. Return the result
    return NextResponse.json({
      showPaywall: showPaywall,
      viewsCount: currentViews,
    });

  } catch (error: unknown) {
     // Catch errors from JSON parsing or unexpected issues
    console.error("[API update-and-check] Unhandled error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
     // Log the userId if available even in case of error
    if (userId) {
        console.error(`[API update-and-check] Error occurred for userId: ${userId}`);
    }
    return NextResponse.json(
      { error: "Internal server error.", details: errorMessage }, // Keep details generic for client
      { status: 500 }
    );
  }
}

// Optional: Add a GET handler if needed for testing, but POST is primary
// Removed unused 'request' parameter to satisfy eslint (@typescript-eslint/no-unused-vars)
export async function GET() {
     return NextResponse.json({ error: "Method Not Allowed. Use POST." }, { status: 405 });
}