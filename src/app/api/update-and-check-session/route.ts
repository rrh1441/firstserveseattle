/* src/app/api/update-and-check-session/route.ts */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const DEFAULT_GATE = 5;             // if header missing
const TODAY = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

export async function POST(request: Request) {
  const { userId } =
    (await request.json().catch(() => ({}))) as { userId?: string };

  /* ---------- anonymous fallback ------------------------------------- */
  if (!userId)
    return NextResponse.json(
      { showPaywall: false, uniqueDays: 0 },
      { status: 200 },
    );

  /* ---------- read header from browser – cohort assignment ----------- */
  const gateHeader = request.headers.get("x-paywall-gate") ?? "";
  const gateDays = Number.isNaN(parseInt(gateHeader, 10)) || parseInt(gateHeader, 10) <= 0
    ? DEFAULT_GATE
    : parseInt(gateHeader, 10);

  try {
    const { data: row, error } = await supabase
      .from("user_sessions")
      .select("id, unique_days, last_view_date")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    let uniqueDays = 1;

    if (row) {
      const newDay = row.last_view_date !== TODAY;
      uniqueDays = newDay ? row.unique_days + 1 : row.unique_days;

      if (newDay) {
        await supabase
          .from("user_sessions")
          .update({
            unique_days: uniqueDays,
            last_view_date: TODAY,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
      }
    } else {
      await supabase.from("user_sessions").insert({
        user_id: userId,
        unique_days: 1,
        last_view_date: TODAY,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        showPaywall: uniqueDays >= gateDays,
        uniqueDays,
        gateDays,
      },
      { status: 200 },
    );
  } catch (e) {
    console.error("[update-and-check] DB failure:", e);
    /* fail open */
    return NextResponse.json(
      { showPaywall: false, uniqueDays: 0 },
      { status: 200 },
    );
  }
}

export function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405 },
  );
}
