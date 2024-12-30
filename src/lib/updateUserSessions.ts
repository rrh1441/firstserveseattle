import { supabase } from "@/src/app/supabaseClient"

export async function updateUserSession(userId: string) {
  // 1. Check if user_session exists
  const { data: existing, error: selectError } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .single()

  // If there's an error other than row not found, log it
  if (selectError && selectError.code !== 'PGRST116') {
    console.error(selectError)
    return
  }

  // 2. If no session exists, create one
  if (!existing) {
    const { error: insertError } = await supabase
      .from('user_sessions')
      .insert([{ user_id: userId, views_count: 1 }])
    if (insertError) {
      console.error(insertError)
    }
    return
  }

  // 3. If session exists, increment
  const newViewsCount = (existing.views_count || 0) + 1
  const { error: updateError } = await supabase
    .from('user_sessions')
    .update({ views_count: newViewsCount, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  if (updateError) {
    console.error(updateError)
  }
}

