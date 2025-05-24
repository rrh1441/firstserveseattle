import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    // Get email from query params
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ isMember: false, error: 'Email required' }, { status: 400 });
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('🔍 Checking membership for email:', email);

    // Query subscribers table directly
    const { data, error } = await supabase
      .from('subscribers')
      .select('status')
      .eq('email', email)
      .single();

    if (error) {
      console.error('❌ Subscribers query error:', error);
      return NextResponse.json({ isMember: false });
    }

    console.log('📊 Subscriber data:', data);
    
    const isMember = data?.status === 'active' || data?.status === 'trialing';
    console.log('🎯 Final result:', { 
      email,
      status: data?.status, 
      isMember 
    });
    
    return NextResponse.json({ isMember });
    
  } catch (error) {
    console.error('💥 Member status API error:', error);
    return NextResponse.json({ isMember: false }, { status: 500 });
  }
}