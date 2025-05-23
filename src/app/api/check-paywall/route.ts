import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  /* ---------- anonymous visitor → always allow & short-circuit ---------- */
  if (!userId) {
    return NextResponse.json(
      { showPaywall: false, uniqueDays: 0, gateDays: 0 },
      { status: 200 },
    );
  }

  /* ---------- signed-in path ------------------------------------------- */
  const { data, error } = await supabase
    .from("user_sessions")
    .select("unique_days")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116: no rows found – treat like 0
    console.error("Supabase error in check-paywall:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const uniqueDays = data?.unique_days ?? 0;
  const gateDays   = Number(request.headers.get("x-paywall-gate") ?? "5");

  return NextResponse.json(
    { showPaywall: uniqueDays >= gateDays, uniqueDays, gateDays },
    { status: 200 },
  );
}