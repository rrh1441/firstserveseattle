import { supabase } from "@/src/app/supabaseClient"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // 1. Extract the userId from query params
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    // If no userId provided, return error
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  // 2. Look up the user's session in Supabase
  const { data, error } = await supabase
    .from("user_sessions")
    .select("views_count")
    .eq("user_id", userId)
    .single()

  // 3. Handle errors from Supabase
  if (error) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 4. If no session or views_count <= 2, do NOT show paywall
  const showPaywall = data?.views_count > 2

  // 5. Return a JSON response indicating if paywall is needed
  return NextResponse.json({ showPaywall })
}

