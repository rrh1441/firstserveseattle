/* -------------------------------------------------------------------------- */
/*  Fail-safe update-and-check-session                                        */
/*  – Returns BOTH `viewsCount` and `uniqueDays` for legacy front-end         */
/*  – Never emits 500 to the browser; logs internal errors server-side        */
/* -------------------------------------------------------------------------- */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ---------- Environment -------------------------------------------------- */
const supabaseUrl         = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/* ---------- Utility to get a Supabase client or undefined --------------- */
const getSupabase = () => {
  if (!supabaseUrl || !supabaseServiceRole) return undefined;
  return createClient(supabaseUrl, supabaseServiceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

const PAYWALL_LIMIT = 3; // unique days

/* ------------------------------------------------------------------------ */
/*  POST handler                                                            */
/* ------------------------------------------------------------------------ */
export async function POST(request: Request) {
  let userId: string | undefined;

  try {
    /* ---------- Parse body -------------------------------------------- */
    const body = await request.json().catch(() => ({}));
    userId = body.userId as string | undefined;

    /* ---------- Anonymous users → allow ------------------------------- */
    if (!userId) {
      return NextResponse.json(
        { showPaywall: false, uniqueDays: 0, viewsCount: 0 },
        { status: 200 },
      );
    }

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const supabase = getSupabase();

    /* ---------- If Supabase unavailable, allow user ------------------- */
    if (!supabase) {
      console.error(
        "[update-and-check] Supabase env vars missing – falling back to allow",
      );
      return NextResponse.json(
        { showPaywall: false, uniqueDays: 0, viewsCount: 0 },
        { status: 200 },
      );
    }

    /* ---------- Fetch or create session row --------------------------- */
    const { data: row, error: selErr } = await supabase
      .from("user_sessions")
      .select("id, unique_days, last_view_date")
      .eq("user_id", userId)
      .maybeSingle();

    if (selErr) throw selErr;

    let uniqueDays = 1;

    if (row) {
      const newDay = row.last_view_date !== today;
      uniqueDays = newDay ? row.unique_days + 1 : row.unique_days;

      const { error: updErr } = await supabase
        .from("user_sessions")
        .update({
          unique_days: uniqueDays,
          last_view_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      if (updErr) throw updErr;
    } else {
      const { error: insErr } = await supabase.from("user_sessions").insert({
        user_id: userId,
        unique_days: 1,
        last_view_date: today,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (insErr) throw insErr;
    }

    const showPaywall = uniqueDays > PAYWALL_LIMIT;

    return NextResponse.json(
      { showPaywall, uniqueDays, viewsCount: uniqueDays },
      { status: 200 },
    );
  } catch (err) {
    /* ---------- Log and fail open ------------------------------------- */
    console.error("[update-and-check] internal error – allowing user:", err);
    return NextResponse.json(
      { showPaywall: false, uniqueDays: 0, viewsCount: 0 },
      { status: 200 },
    );
  }
}

/* ------------------------------------------------------------------------ */
/*  GET – still blocked                                                     */
/* ------------------------------------------------------------------------ */
export async function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed. Use POST." },
    { status: 405 },
  );
}