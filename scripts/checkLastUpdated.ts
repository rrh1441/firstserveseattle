import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkLastUpdated() {
  const { data, error } = await supabase
    .from("tennis_courts")
    .select("title, last_updated")
    .order("last_updated", { ascending: false })
    .limit(5)

  if (error) {
    console.error("Error:", error)
    return
  }

  console.log("Last 5 updated courts:")
  console.log("=".repeat(60))

  data?.forEach((court) => {
    const utcDate = new Date(court.last_updated)
    const pstTime = utcDate.toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      dateStyle: "full",
      timeStyle: "long"
    })
    console.log(`${court.title}`)
    console.log(`  Last Updated (PST): ${pstTime}`)
    console.log(`  Last Updated (UTC): ${court.last_updated}`)
    console.log("")
  })
}

checkLastUpdated()
