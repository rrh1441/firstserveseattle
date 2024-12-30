import { supabase } from "@/app/supabaseClient"

export async function getTennisCourts() {
  const { data, error } = await supabase
    .from('tennis_courts')
    .select('*')
    // .order('title', { ascending: true })

  if (error) {
    console.error(error)
    return []
  }
  return data || []
}

