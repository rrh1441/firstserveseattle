// src/app/api/check-paywall/route.ts
import { supabase } from "@/lib/supabaseClient"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("user_sessions")
    .select("views_count")
    .eq("user_id", userId)
    .single()

  if (error) {
    console.error("Supabase error in check-paywall:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const viewsCount = data?.views_count ?? 0
  
  return NextResponse.json({
    showPaywall: viewsCount > 3,
    viewsCount: viewsCount
  })
}