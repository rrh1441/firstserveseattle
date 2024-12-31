// src/lib/updateUserSessions.ts

import { supabase } from "@/app/supabaseClient"

export async function updateUserSession(userId: string) {
  try {
    // Attempt to find an existing row
    const { data: existing, error: selectError } = await supabase
      .from("user_sessions")
      .select("id, views_count")
      .eq("user_id", userId)
      .maybeSingle()

    if (selectError) {
      console.error("[updateUserSession] selectError:", selectError)
      return
    }

    if (!existing) {
      // no row => insert
      const { error: insertError } = await supabase
        .from("user_sessions")
        .insert([{ user_id: userId, views_count: 1 }])

      if (insertError) {
        console.error("[updateUserSession] insertError:", insertError)
      } else {
        console.log(`[updateUserSession] inserted new row for user_id=${userId}`)
      }
      return
    }

    // else we increment
    const newViews = (existing.views_count ?? 0) + 1
    const { error: updateError } = await supabase
      .from("user_sessions")
      .update({ views_count: newViews })
      .eq("id", existing.id)

    if (updateError) {
      console.error("[updateUserSession] updateError:", updateError)
    } else {
      console.log(`[updateUserSession] updated user_id=${userId} to views_count=${newViews}`)
    }
  } catch (err) {
    console.error("[updateUserSession] unhandled exception:", err)
  }
}
