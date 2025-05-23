/* -------------------------------------------------------------------------- */
/*  src/app/api/update-and-check-session/route.ts                             */
/* -------------------------------------------------------------------------- */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/* ---------- Supabase admin client (service role) ------------------------- */
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/* ---------- Free limit before paywall ----------------------------------- */
const PAYWALL_LIMIT = 3; // unique *days* not views

/* ---------------------------------------------------------------------- */
/*  POST /api/update-and-check-session                                    */
/* ---------------------------------------------------------------------- */
export async function POST(request: Request) {
  let userId: string | undefined;

  try {
    /* ---------- read body --------------------------------------------- */
    const body = await request.json();
    userId = body.userId;

    if (!userId) {
      // anonymous users: always allow
      return NextResponse.json(
        { showPaywall: false, uniqueDays: 0 },
        { status: 200 },
      );
    }

    /* ---------- today’s date (UTC) ------------------------------------ */
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    /* ---------- fetch existing row ------------------------------------ */
    const { data: row, error: selErr } = await supabase
      .from("user_sessions")
      .select("id, unique_days, last_view_date")
      .eq("user_id", userId)
      .maybeSingle();

    if (selErr) {
      console.error("[update-and-check] select error:", selErr);
      return NextResponse.json(
        { error: "Database error selecting session." },
        { status: 500 },
      );
    }

    let uniqueDays = 1;

    if (row) {
      /* --- row exists -------------------------------------------------- */
      const isNewDay = row.last_view_date !== today;
      uniqueDays = isNewDay ? row.unique_days + 1 : row.unique_days;

      const { error: updErr } = await supabase
        .from("user_sessions")
        .update({
          unique_days: uniqueDays,
          last_view_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      if (updErr) {
        console.error("[update-and-check] update error:", updErr);
        return NextResponse.json(
          { error: "Database error updating session." },
          { status: 500 },
        );
      }
    } else {
      /* --- first record ------------------------------------------------ */
      const { error: insErr } = await supabase.from("user_sessions").insert({
        user_id: userId,
        unique_days: 1,
        last_view_date: today,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (insErr) {
        console.error("[update-and-check] insert error:", insErr);
        return NextResponse.json(
          { error: "Database error inserting session." },
          { status: 500 },
        );
      }
    }

    /* ---------- paywall decision -------------------------------------- */
    const showPaywall = uniqueDays > PAYWALL_LIMIT;

    return NextResponse.json(
      { showPaywall, uniqueDays },
      { status: 200 },
    );
  } catch (err) {
    console.error("[update-and-check] unhandled:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

/* ---------------------------------------------------------------------- */
/*  GET – not allowed                                                     */
/* ---------------------------------------------------------------------- */
export async function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed. Use POST." },
    { status: 405 },
  );
}