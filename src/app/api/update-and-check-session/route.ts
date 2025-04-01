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

// Define the view limit before paywall
const PAYWALL_LIMIT = 3;

export async function POST(request: Request) {
  let userId: string | undefined;

  try {
    const body = await request.json();
    userId = body.userId;

    // Validate userId presence
    if (!userId) {
      console.warn("[API update-and-check] Missing userId in request body");
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    console.log(`[API update-and-check] Processing request for userId: ${userId}`);

    // --- Upsert and Increment Logic ---
    let currentViews = 0;

    // 1. Check if user session exists
    const { data: existingUser, error: selectError } = await supabaseAdmin
      .from("user_sessions")
      .select("id, views_count") // Select primary key 'id' and 'views_count'
      .eq("user_id", userId)
      .maybeSingle(); // Handles case where user doesn't exist yet (returns null)

    // Handle database errors during select
    if (selectError) {
      console.error(
        `[API update-and-check] Error selecting user ${userId}:`,
        selectError
      );
      return NextResponse.json(
        { error: "Database error checking user session." },
        { status: 500 }
      );
    }

    // 2. Increment existing session or Insert new session
    if (existingUser) {
      // User exists: Increment view count and update timestamp
      currentViews = (existingUser.views_count ?? 0) + 1;
      const { error: updateError } = await supabaseAdmin
        .from("user_sessions")
        .update({
           views_count: currentViews,
           updated_at: new Date().toISOString() // Use correct column name 'updated_at'
          })
        .eq("id", existingUser.id); // Match on the primary key 'id'

      // Handle database errors during update
      if (updateError) {
        console.error(
          `[API update-and-check] Error updating user ${userId} (ID: ${existingUser.id}):`,
          updateError
        );
        return NextResponse.json(
          { error: "Database error updating user session." },
          { status: 500 }
        );
      }
      console.log(`[API update-and-check] Incremented views for ${userId} to ${currentViews}`);

    } else {
      // User does not exist: Insert new record with view count 1
      currentViews = 1;
      const { error: insertError } = await supabaseAdmin
        .from("user_sessions")
        .insert({
            user_id: userId,
            views_count: currentViews,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString() // Use correct column name 'updated_at'
          });

      // Handle database errors during insert
      if (insertError) {
        // Log the specific error from Supabase that was causing the 400/500
        console.error(
          `[API update-and-check] Error inserting user ${userId}:`,
          insertError
        );
        return NextResponse.json(
          // Return the consistent error message
          { error: "Database error creating user session." },
          { status: 500 }
        );
      }
       console.log(`[API update-and-check] Inserted new session for ${userId} with ${currentViews} view`);
    }
    // --- End Upsert Logic ---

    // 3. Determine if paywall should be shown
    const showPaywall = currentViews > PAYWALL_LIMIT;
    console.log(`[API update-and-check] User ${userId}: Views=${currentViews}, ShowPaywall=${showPaywall}`);

    // 4. Return the result to the client
    return NextResponse.json({
      showPaywall: showPaywall,
      viewsCount: currentViews, // Return the current (potentially incremented) view count
    });

  } catch (error: unknown) {
     // Catch errors from JSON parsing or other unexpected issues
    console.error("[API update-and-check] Unhandled error in POST handler:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
     // Log the userId if available even in case of error
    if (userId) {
        console.error(`[API update-and-check] Error occurred processing userId: ${userId}`);
    }
    // Return a generic server error response
    return NextResponse.json(
      { error: "Internal server error.", details: errorMessage },
      { status: 500 }
    );
  }
}

// GET handler (optional, returns 405 Method Not Allowed)
export async function GET() {
     console.log("[API update-and-check] Received GET request (Not Allowed)");
     return NextResponse.json({ error: "Method Not Allowed. Use POST." }, { status: 405 });
}