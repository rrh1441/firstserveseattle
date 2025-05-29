import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json({ isMember: false, error: 'email missing' }, { status: 400 })
  }

  /* ----- service-role client (bypasses RLS) ----------------------------- */
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { data, error } = await supabase
    .from('subscribers')
    .select('status')
    .eq('email', email)
    .single()

  if (error) {
    // don't leak PostgREST codes to client
    return NextResponse.json({ isMember: false }, { status: 500 })
  }

  const isMember = data?.status === 'active' || data?.status === 'trialing' || data?.status === 'paid'
  return NextResponse.json({ isMember })
}