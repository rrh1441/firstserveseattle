// Email Alert Subscriber Types

export interface EmailAlertSubscriber {
  id: string;
  email: string;
  name: string | null;

  // Trial tracking
  extension_granted_at: string;
  extension_expires_at: string;
  converted_to_paid: boolean;
  converted_at: string | null;

  // Court preferences (array of court IDs from tennis_courts)
  selected_courts: number[];

  // Day preferences (0=Sun, 1=Mon, ..., 6=Sat)
  selected_days: number[];

  // Time preferences (24h format)
  preferred_start_hour: number;
  preferred_end_hour: number;

  // Alert delivery time (PT timezone)
  alert_hour: number;

  // Status
  alerts_enabled: boolean;
  unsubscribe_token: string;
  unsubscribed_at: string | null;

  // Stats
  emails_sent: number;
  last_email_sent_at: string | null;

  // Analytics
  source: string;
  ab_group: string | null;

  created_at: string;
  updated_at: string;
}

export interface EmailAlertLog {
  id: string;
  subscriber_id: string;
  email: string;
  sent_at: string;
  courts_included: number[];
  slots_included: number;
  email_type: 'daily_alert' | 'welcome' | 'expiration_reminder';
  resend_message_id: string | null;
  opened_at: string | null;
  clicked_at: string | null;
}

// API Request/Response types

export interface SubscribeRequest {
  email: string;
  name?: string;
  abGroup?: string;
}

export interface SubscribeResponse {
  success: boolean;
  extensionExpiresAt?: string;
  preferencesUrl?: string;
  unsubscribeToken?: string;
  error?: string;
}

export interface PreferencesRequest {
  token: string;
  selectedCourts?: number[];
  selectedDays?: number[];
  preferredStartHour?: number;
  preferredEndHour?: number;
  alertHour?: number;
}

export interface PreferencesResponse {
  success: boolean;
  data?: Partial<EmailAlertSubscriber>;
  error?: string;
}

// Court availability for alerts
export interface CourtAvailability {
  id: number;
  title: string;
  address: string | null;
  mapsUrl: string | null;
  slots: string[];  // Array of time slots like "9:00 AM - 10:30 AM"
}

// localStorage extension data
export interface EmailExtensionData {
  email: string;
  expiresAt: string;
  grantedAt: string;
  token: string;
}
