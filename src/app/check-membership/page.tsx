import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function CheckMembershipPage() {
  const supabase = createServerComponentClient({ cookies })
  
  // Get current user
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user?.email) {
    // No user, redirect to login
    redirect('/login')
  }

  console.log('🔍 Checking membership for:', user.email)

  try {
    // Call your existing API
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/member-status?email=${encodeURIComponent(user.email)}`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      console.error('Member status API failed:', response.status)
      redirect('/signup')
    }

    const { isMember } = await response.json()
    
    console.log('📊 Member status result:', isMember)

    if (isMember) {
      console.log('✅ Is member, redirecting to /members')
      redirect('/members')
    } else {
      console.log('❌ Not a member, redirecting to signup')
      redirect('/signup')
    }

  } catch (error) {
    console.error('Membership check error:', error)
    redirect('/signup')
  }
}
