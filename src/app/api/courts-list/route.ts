import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Court {
  id: number;
  title: string;
  address: string | null;
}

// GET: Fetch list of all courts (for preferences selection)
export async function GET(): Promise<NextResponse> {
  try {
    const { data, error } = await supabase
      .from('tennis_courts')
      .select('id, title, address')
      .order('title', { ascending: true });

    if (error) {
      console.error('Error fetching courts:', error);
      return NextResponse.json(
        { courts: [], error: 'Failed to fetch courts' },
        { status: 500 }
      );
    }

    const courts: Court[] = (data || []).map(c => ({
      id: c.id,
      title: c.title || 'Unknown Court',
      address: c.address,
    }));

    return NextResponse.json({ courts });
  } catch (error) {
    console.error('Error in courts-list:', error);
    return NextResponse.json(
      { courts: [], error: 'Failed to fetch courts' },
      { status: 500 }
    );
  }
}
