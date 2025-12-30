import { createGmailClient } from './client';
import { emailTemplates } from '../resend/templates';

const FROM_EMAIL = 'First Serve Seattle <ryan@firstserveseattle.com>';

export class GmailEmailService {
  static async sendWelcomeEmail(email: string, plan: 'monthly' | 'annual') {
    const gmail = createGmailClient();
    if (!gmail) {
      console.error('Gmail client not initialized - missing credentials');
      return { success: false, error: 'Gmail not configured' };
    }

    try {
      const template = emailTemplates.subscriptionWelcome(email, plan);

      const result = await gmail.sendEmail({
        from: FROM_EMAIL,
        to: email,
        subject: template.subject,
        html: template.html,
      });

      console.log('Welcome email sent successfully via Gmail to:', email);
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to send welcome email via Gmail:', error);
      return { success: false, error };
    }
  }

  static async sendPaymentSuccessEmail(email: string, amount: number, plan: string) {
    const gmail = createGmailClient();
    if (!gmail) {
      console.error('Gmail client not initialized - missing credentials');
      return { success: false, error: 'Gmail not configured' };
    }

    try {
      const template = emailTemplates.paymentSucceeded(email, amount, plan);

      const result = await gmail.sendEmail({
        from: FROM_EMAIL,
        to: email,
        subject: template.subject,
        html: template.html,
      });

      console.log('Payment success email sent via Gmail to:', email);
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to send payment success email via Gmail:', error);
      return { success: false, error };
    }
  }

  static async sendPaymentFailedEmail(email: string) {
    const gmail = createGmailClient();
    if (!gmail) {
      console.error('Gmail client not initialized - missing credentials');
      return { success: false, error: 'Gmail not configured' };
    }

    try {
      const retryUrl = 'https://firstserveseattle.com/billing';
      const template = emailTemplates.paymentFailed(email, retryUrl);

      const result = await gmail.sendEmail({
        from: FROM_EMAIL,
        to: email,
        subject: template.subject,
        html: template.html,
      });

      console.log('Payment failed email sent via Gmail to:', email);
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to send payment failed email via Gmail:', error);
      return { success: false, error };
    }
  }

  static async sendCancellationEmail(email: string) {
    const gmail = createGmailClient();
    if (!gmail) {
      console.error('Gmail client not initialized - missing credentials');
      return { success: false, error: 'Gmail not configured' };
    }

    try {
      const template = emailTemplates.subscriptionCancelled();

      const result = await gmail.sendEmail({
        from: FROM_EMAIL,
        to: email,
        subject: template.subject,
        html: template.html,
      });

      console.log('Cancellation email sent via Gmail to:', email);
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to send cancellation email via Gmail:', error);
      return { success: false, error };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Email Alert Methods
  // ─────────────────────────────────────────────────────────────────────────────

  static async sendAlertTrialWelcome(email: string, preferencesUrl: string, expiresAt: Date) {
    const gmail = createGmailClient();
    if (!gmail) {
      console.error('Gmail client not initialized - missing credentials');
      return { success: false, error: 'Gmail not configured' };
    }

    try {
      const template = emailTemplates.alertTrialWelcome(email, preferencesUrl, expiresAt);

      const result = await gmail.sendEmail({
        from: FROM_EMAIL,
        to: email,
        subject: template.subject,
        html: template.html,
      });

      console.log('Alert trial welcome email sent via Gmail to:', email);
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to send alert trial welcome email via Gmail:', error);
      return { success: false, error };
    }
  }

  static async sendDailyCourtAlert(
    email: string,
    courts: Array<{ title: string; address: string; slots: string[]; mapsUrl: string }>,
    daysRemaining: number,
    preferencesUrl: string,
    unsubscribeUrl: string
  ) {
    const gmail = createGmailClient();
    if (!gmail) {
      console.error('Gmail client not initialized - missing credentials');
      return { success: false, error: 'Gmail not configured' };
    }

    try {
      const template = emailTemplates.dailyCourtAlert(
        courts,
        daysRemaining,
        preferencesUrl,
        unsubscribeUrl
      );

      const result = await gmail.sendEmail({
        from: FROM_EMAIL,
        to: email,
        subject: template.subject,
        html: template.html,
      });

      console.log('Daily court alert sent via Gmail to:', email);
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to send daily court alert via Gmail:', error);
      return { success: false, error };
    }
  }

  static async sendAlertTrialExpiring(email: string, preferencesUrl: string) {
    const gmail = createGmailClient();
    if (!gmail) {
      console.error('Gmail client not initialized - missing credentials');
      return { success: false, error: 'Gmail not configured' };
    }

    try {
      const template = emailTemplates.alertTrialExpiring(preferencesUrl);

      const result = await gmail.sendEmail({
        from: FROM_EMAIL,
        to: email,
        subject: template.subject,
        html: template.html,
      });

      console.log('Alert trial expiring email sent via Gmail to:', email);
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to send alert trial expiring email via Gmail:', error);
      return { success: false, error };
    }
  }
}
