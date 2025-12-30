import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { PreferencesRequest, PreferencesResponse, EmailAlertSubscriber } from '@/lib/emailAlerts/types';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Fetch current preferences by token
export async function GET(request: Request): Promise<NextResponse<PreferencesResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    const { data: subscriber, error } = await supabaseAdmin
      .from('email_alert_subscribers')
      .select('*')
      .eq('unsubscribe_token', token)
      .single();

    if (error || !subscriber) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 404 }
      );
    }

    // Return subscriber data (without sensitive fields)
    const safeData: Partial<EmailAlertSubscriber> = {
      id: subscriber.id,
      email: subscriber.email,
      name: subscriber.name,
      selected_courts: subscriber.selected_courts || [],
      selected_days: subscriber.selected_days || [1, 2, 3, 4, 5],
      preferred_start_hour: subscriber.preferred_start_hour ?? 6,
      preferred_end_hour: subscriber.preferred_end_hour ?? 21,
      alert_hour: subscriber.alert_hour ?? 7,
      alerts_enabled: subscriber.alerts_enabled,
      extension_expires_at: subscriber.extension_expires_at,
    };

    return NextResponse.json({ success: true, data: safeData });

  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// PUT: Update preferences
export async function PUT(request: Request): Promise<NextResponse<PreferencesResponse>> {
  try {
    const body: PreferencesRequest = await request.json();
    const { token, selectedCourts, selectedDays, preferredStartHour, preferredEndHour, alertHour } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Validate the token exists
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('email_alert_subscribers')
      .select('id')
      .eq('unsubscribe_token', token)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 404 }
      );
    }

    // Build update object (only include fields that were provided)
    const updateData: Record<string, unknown> = {};

    if (selectedCourts !== undefined) {
      // Validate court IDs are numbers
      if (!Array.isArray(selectedCourts) || !selectedCourts.every(id => typeof id === 'number')) {
        return NextResponse.json(
          { success: false, error: 'selectedCourts must be an array of numbers' },
          { status: 400 }
        );
      }
      updateData.selected_courts = selectedCourts;
    }

    if (selectedDays !== undefined) {
      // Validate days are 0-6
      if (!Array.isArray(selectedDays) || !selectedDays.every(d => typeof d === 'number' && d >= 0 && d <= 6)) {
        return NextResponse.json(
          { success: false, error: 'selectedDays must be an array of numbers 0-6' },
          { status: 400 }
        );
      }
      updateData.selected_days = selectedDays;
    }

    if (preferredStartHour !== undefined) {
      if (typeof preferredStartHour !== 'number' || preferredStartHour < 0 || preferredStartHour > 23) {
        return NextResponse.json(
          { success: false, error: 'preferredStartHour must be 0-23' },
          { status: 400 }
        );
      }
      updateData.preferred_start_hour = preferredStartHour;
    }

    if (preferredEndHour !== undefined) {
      if (typeof preferredEndHour !== 'number' || preferredEndHour < 0 || preferredEndHour > 23) {
        return NextResponse.json(
          { success: false, error: 'preferredEndHour must be 0-23' },
          { status: 400 }
        );
      }
      updateData.preferred_end_hour = preferredEndHour;
    }

    if (alertHour !== undefined) {
      if (typeof alertHour !== 'number' || alertHour < 0 || alertHour > 23) {
        return NextResponse.json(
          { success: false, error: 'alertHour must be 0-23' },
          { status: 400 }
        );
      }
      updateData.alert_hour = alertHour;
    }

    // Update if there's anything to update
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('email_alert_subscribers')
        .update(updateData)
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error updating preferences:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update preferences' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
