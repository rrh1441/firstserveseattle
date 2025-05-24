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

    // First, let's see ALL records for debugging
    const { data: allData, error: allError } = await supabase
      .from('subscribers')
      .select('*');
    
    console.log('🗃️ ALL SUBSCRIBERS IN TABLE:', allData);

    // Query subscribers table directly
    const { data, error } = await supabase
      .from('subscribers')
      .select('*')  // Get ALL columns to see what's there
      .eq('email', email)
      .single();

    if (error) {
      console.error('❌ Subscribers query error:', error);
      console.log('🔍 Error details:', error.message, error.code);
      return NextResponse.json({ 
        isMember: false, 
        error: error.message,
        debug: { email, allRecords: allData?.length || 0 }
      });
    }

    console.log('📊 Subscriber data for', email, ':', data);
    
    const isMember = data?.status === 'active' || data?.status === 'trialing';
    console.log('🎯 Final result:', { 
      email,
      status: data?.status, 
      isMember,
      allStatuses: allData?.map(r => ({ email: r.email, status: r.status }))
    });
    
    return NextResponse.json({ 
      isMember,
      debug: {
        foundRecord: !!data,
        status: data?.status,
        allRecords: allData?.length || 0
      }
    });
    
  } catch (error) {
    console.error('💥 Member status API error:', error);
    return NextResponse.json({ isMember: false }, { status: 500 });
  }
}