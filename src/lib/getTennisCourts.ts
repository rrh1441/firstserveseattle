import { supabase } from "@/app/supabaseClient" 
// or "@/src/app/supabaseClient" if that's where it lives

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

