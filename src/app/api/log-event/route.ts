// src/app/api/log-event/route.ts
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // The payload structure should match what logEvent sends
    const { event, metadata, timestamp } = await req.json();

    // Add validation if necessary, though Supabase schema validation is often sufficient
    if (!event || !timestamp) {
      return NextResponse.json({ error: "Missing event or timestamp" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("event_logs").insert([
      {
        event,
        metadata: metadata || {}, // Ensure metadata is at least an empty object
        timestamp,
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("API handler error:", err);
    return NextResponse.json({ error: "Failed to log event" }, { status: 500 });
  }
}