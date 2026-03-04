#!/usr/bin/env npx ts-node
/**
 * Dry-run test for stale courts - checks ActiveNet API without writing to DB.
 * Usage: npx ts-node scripts/testStaleCourts.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Known stale court IDs from health check
const STALE_COURT_IDS = [
  1319,  // Beacon Hill Playfield Tennis Court 01
  283,   // AYTC Outdoor Tennis Court 05
  281,   // AYTC Outdoor Tennis Court 03
  279,   // AYTC Outdoor Tennis Court 01
  282,   // AYTC Outdoor Tennis Court 04
  1316,  // Bitter Lake Playfield Tennis Court 02
  1147,  // Alki Playfield Tennis Court 02
  1146,  // Alki Playfield Tennis Court 01
  1332,  // David Rodgers Park Tennis Court 03
  1336,  // Delridge Playfield Tennis Court 02
];

let csrfToken = '';
let cookies: string[] = [];

async function fetchWithCookies(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if (cookies.length > 0) {
    headers.set('Cookie', cookies.join('; '));
  }

  const resp = await fetch(url, { ...options, headers });

  // Collect cookies from response
  const setCookies = resp.headers.getSetCookie?.() || [];
  for (const cookie of setCookies) {
    const cookieName = cookie.split('=')[0];
    // Replace existing cookie or add new one
    cookies = cookies.filter(c => !c.startsWith(cookieName + '='));
    cookies.push(cookie.split(';')[0]);
  }

  return resp;
}

async function getCsrfToken(): Promise<string> {
  const url = 'https://anc.apm.activecommunities.com/seattle/myaccount?onlineSiteId=0&from_original_cui=true&online=true&locale=en-US';
  const resp = await fetchWithCookies(url, {
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  const text = await resp.text();
  const match = text.match(/window\.__csrfToken = "(.*)";/);
  if (!match) throw new Error('Could not find CSRF token');
  return match[1];
}

async function login(csrf: string): Promise<boolean> {
  const url = 'https://anc.apm.activecommunities.com/seattle/rest/user/signin?locale=en-US';
  const resp = await fetchWithCookies(url, {
    method: 'POST',
    headers: {
      'Accept': '*/*',
      'Content-Type': 'application/json;charset=utf-8',
      'Origin': 'https://anc.apm.activecommunities.com',
      'X-CSRF-Token': csrf,
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify({
      login_name: 'Seattletennisguy@gmail.com',
      password: 'ThisIsMyPassword44',
      recaptcha_response: '',
      signin_source_app: '0',
      custom_amount: 'False',
      from_original_cui: 'true',
      onlineSiteId: '0',
      override_partial_error: 'False',
      params: 'aHR0cHM6Ly9hcG0uYWN0aXZlY29tbXVuaXRpZXMuY29tL3NlYXR0bGUvQWN0aXZlTmV0X0hvbWU/RmlsZU5hbWU9YWNjb3VudG9wdGlvbnMuc2RpJmZyb21Mb2dpblBhZ2U9dHJ1ZQ==',
      ak_properties: null,
    }),
  });

  return resp.ok;
}

interface CourtItem {
  id: number;
  name: string;
}

async function getFacilityListing(csrf: string): Promise<{ total: number; items: CourtItem[] }> {
  const url = 'https://anc.apm.activecommunities.com/seattle/rest/reservation/resource?locale=en-US';
  const resp = await fetchWithCookies(url, {
    method: 'POST',
    headers: {
      'Accept': '*/*',
      'Content-Type': 'application/json;charset=utf-8',
      'X-CSRF-Token': csrf,
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify({
      name: '',
      attendee: 0,
      date_times: [],
      event_type_ids: [],
      facility_type_ids: [39, 115],
      reservation_group_ids: [],
      amenity_ids: [],
      facility_id: 0,
      equipment_id: 0,
      center_id: 0,
      resource_type: 0,
      client_coordinate: '',
      order_by_field: 'name',
      order_direction: 'asc',
      page_size: 200,
      start_index: 0,
      search_client_id: '',
      date_time_length: null,
      full_day_booking: false,
      center_ids: [],
    }),
  });

  const data = await resp.json();
  const body = data.body || {};
  return {
    total: body.total || 0,
    items: body.items || [],
  };
}

async function checkCourtAvailability(courtId: number): Promise<{ status: string; slots: string[]; error?: string }> {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const dateStr = tomorrow.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

  const url = `https://anc.apm.activecommunities.com/seattle/rest/reservation/resource/availability/daily/${courtId}?start_date=${dateStr}&end_date=${dateStr}&customer_id=0&company_id=0&event_type_id=-1&attendee=1`;

  try {
    const resp = await fetchWithCookies(url, {
      headers: {
        'Accept': '*/*',
        'User-Agent': 'Mozilla/5.0',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    const data = await resp.json();
    const dailyDetails = data.body?.details?.daily_details || [];

    const slots: string[] = [];
    for (const day of dailyDetails) {
      const date = day.date;
      for (const slot of day.times || []) {
        if (slot.available) {
          slots.push(`${date} ${slot.start_time}-${slot.end_time}`);
        }
      }
    }

    return { status: 'ok', slots };
  } catch (e) {
    return { status: 'error', slots: [], error: String(e) };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('STALE COURTS TEST - DRY RUN (no DB writes)');
  console.log('='.repeat(60));
  console.log();

  // Step 1: Get CSRF
  console.log('1. Fetching CSRF token...');
  csrfToken = await getCsrfToken();
  console.log(`   ✓ Got CSRF: ${csrfToken.slice(0, 20)}...`);

  // Step 2: Login
  console.log('\n2. Logging in to ActiveNet...');
  if (await login(csrfToken)) {
    console.log('   ✓ Login successful');
  } else {
    console.log('   ✗ Login failed!');
    return;
  }

  // Step 3: Check listing
  console.log('\n3. Fetching facility listing...');
  const listing = await getFacilityListing(csrfToken);
  console.log(`   Total courts in API: ${listing.total}`);

  const foundIds = new Set(listing.items.map(i => i.id));

  // Check which stale courts are in listing
  console.log('\n4. Checking if stale courts appear in listing:');
  const missingFromListing: number[] = [];
  for (const courtId of STALE_COURT_IDS) {
    if (foundIds.has(courtId)) {
      console.log(`   ✓ Court ${courtId} IS in listing`);
    } else {
      console.log(`   ✗ Court ${courtId} NOT in listing!`);
      missingFromListing.push(courtId);
    }
  }

  // Step 4: Check availability for each stale court
  console.log('\n5. Checking availability for stale courts:');
  for (const courtId of STALE_COURT_IDS) {
    const courtInfo = listing.items.find(c => c.id === courtId);
    const courtName = courtInfo?.name || `ID ${courtId}`;

    const result = await checkCourtAvailability(courtId);
    if (result.status === 'ok') {
      if (result.slots.length > 0) {
        console.log(`   ✓ ${courtName}: ${result.slots.length} available slots`);
      } else {
        console.log(`   ○ ${courtName}: No available slots (fully booked or closed)`);
      }
    } else {
      console.log(`   ✗ ${courtName}: ERROR - ${result.error}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  if (missingFromListing.length > 0) {
    console.log(`⚠️  ${missingFromListing.length} courts missing from API listing!`);
    console.log(`   IDs: ${missingFromListing.join(', ')}`);
    console.log('   These courts may have been removed from the reservation system.');
  } else {
    console.log('✓ All stale courts still appear in ActiveNet listing');
    console.log('  The scraper may have failed/timed out on these during last run.');
  }
}

main().catch(console.error);
