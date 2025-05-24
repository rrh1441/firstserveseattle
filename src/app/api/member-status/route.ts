import { NextResponse } from 'next/server';
import { getMemberStatus } from '@/lib/getMemberStatus';

export async function GET() {
  try {
    const isMember = await getMemberStatus();
    return NextResponse.json({ isMember });
  } catch (error) {
    console.error('Member status API error:', error);
    return NextResponse.json({ isMember: false }, { status: 500 });
  }
}