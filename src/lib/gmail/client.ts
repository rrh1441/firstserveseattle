/**
 * Gmail API Client
 *
 * Wrapper around Google Gmail API with OAuth token management.
 */

import { google, gmail_v1, Auth } from 'googleapis';

export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken?: string;
}

export class GmailClient {
  private oauth2Client: Auth.OAuth2Client;
  private gmail: gmail_v1.Gmail;

  constructor(config: GmailConfig) {
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );

    if (config.refreshToken) {
      this.oauth2Client.setCredentials({
        refresh_token: config.refreshToken
      });
    }

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Generate OAuth URL for authorization
   */
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly'
      ]
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string): Promise<{ refreshToken: string; accessToken: string }> {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    return {
      refreshToken: tokens.refresh_token || '',
      accessToken: tokens.access_token || ''
    };
  }

  /**
   * Get authenticated email address
   */
  async getProfile(): Promise<gmail_v1.Schema$Profile> {
    const response = await this.gmail.users.getProfile({ userId: 'me' });
    return response.data;
  }

  /**
   * Send an email
   */
  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
    replyTo?: string;
  }): Promise<gmail_v1.Schema$Message> {
    const { to, subject, html, text, from, replyTo } = options;

    // Build MIME message
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36)}`;

    const messageParts = [
      `From: ${from || 'me'}`,
      `To: ${to}`,
      `Subject: ${subject}`,
    ];

    if (replyTo) {
      messageParts.push(`Reply-To: ${replyTo}`);
    }

    messageParts.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    messageParts.push('');

    // Text part
    if (text) {
      messageParts.push(`--${boundary}`);
      messageParts.push('Content-Type: text/plain; charset=UTF-8');
      messageParts.push('');
      messageParts.push(text);
      messageParts.push('');
    }

    // HTML part
    messageParts.push(`--${boundary}`);
    messageParts.push('Content-Type: text/html; charset=UTF-8');
    messageParts.push('');
    messageParts.push(html);
    messageParts.push('');
    messageParts.push(`--${boundary}--`);

    const rawMessage = messageParts.join('\r\n');
    const encodedMessage = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await this.gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    return response.data;
  }

  /**
   * Search for bounce/failed delivery emails
   */
  async getBounces(maxResults = 50): Promise<Array<{
    id: string;
    date: string;
    subject: string;
    snippet: string;
    failedRecipient?: string;
  }>> {
    // Search for common bounce email patterns
    const query = 'from:(mailer-daemon OR postmaster) OR subject:(delivery failed OR undeliverable OR returned mail OR failure notice)';

    const response = await this.gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults
    });

    const messages = response.data.messages || [];
    const bounces = [];

    for (const msg of messages) {
      const detail = await this.gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'metadata',
        metadataHeaders: ['Subject', 'Date', 'From']
      });

      const headers = detail.data.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const date = headers.find(h => h.name === 'Date')?.value || '';
      const snippet = detail.data.snippet || '';

      // Try to extract failed recipient from snippet
      const emailMatch = snippet.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);

      bounces.push({
        id: msg.id!,
        date,
        subject,
        snippet,
        failedRecipient: emailMatch?.[1]
      });
    }

    return bounces;
  }
}

/**
 * Create Gmail client from environment variables
 */
export function createGmailClient(): GmailClient | null {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret) {
    console.error('Gmail client not configured - missing GMAIL_CLIENT_ID or GMAIL_CLIENT_SECRET');
    return null;
  }

  return new GmailClient({
    clientId,
    clientSecret,
    redirectUri: process.env.GMAIL_REDIRECT_URI || 'http://localhost:3333/api/auth/gmail/callback',
    refreshToken
  });
}
