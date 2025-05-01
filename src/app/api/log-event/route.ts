// src/app/api/log-event/route.ts
import { supabase } from "@/app/supabaseClient";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { event, metadata, timestamp } = await req.json();

    const { error } = await supabase.from("event_logs").insert([
      {
        event,
        metadata,
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
