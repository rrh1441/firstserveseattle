import { NextResponse } from 'next/server';
import { getMemberStatus } from '@/lib/getMemberStatus';

export const runtime = 'edge';

export async function GET() {
  const isMember = await getMemberStatus();
  return NextResponse.json({ isMember });
}