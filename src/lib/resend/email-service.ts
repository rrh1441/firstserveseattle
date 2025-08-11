import { resend } from './client'
import { emailTemplates } from './templates'

const FROM_EMAIL = 'First Serve Seattle <support@firstserveseattle.com>'

export class EmailService {
  static async sendWelcomeEmail(email: string, plan: 'monthly' | 'annual') {
    if (!resend) {
      console.error('Resend client not initialized - missing API key')
      return
    }

    try {
      const template = emailTemplates.subscriptionWelcome(email, plan)
      
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: template.subject,
        html: template.html,
      })

      if (error) {
        console.error('Failed to send welcome email:', error)
        return { success: false, error }
      }

      console.log('Welcome email sent successfully to:', email)
      return { success: true, data }
    } catch (error) {
      console.error('Error sending welcome email:', error)
      return { success: false, error }
    }
  }

  static async sendPaymentSuccessEmail(email: string, amount: number, plan: string) {
    if (!resend) {
      console.error('Resend client not initialized - missing API key')
      return
    }

    try {
      const template = emailTemplates.paymentSucceeded(email, amount, plan)
      
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: template.subject,
        html: template.html,
      })

      if (error) {
        console.error('Failed to send payment success email:', error)
        return { success: false, error }
      }

      console.log('Payment success email sent to:', email)
      return { success: true, data }
    } catch (error) {
      console.error('Error sending payment success email:', error)
      return { success: false, error }
    }
  }

  static async sendPaymentFailedEmail(email: string) {
    if (!resend) {
      console.error('Resend client not initialized - missing API key')
      return
    }

    try {
      // Generate billing portal URL for retry
      const retryUrl = 'https://firstserveseattle.com/billing'
      const template = emailTemplates.paymentFailed(email, retryUrl)
      
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: template.subject,
        html: template.html,
      })

      if (error) {
        console.error('Failed to send payment failed email:', error)
        return { success: false, error }
      }

      console.log('Payment failed email sent to:', email)
      return { success: true, data }
    } catch (error) {
      console.error('Error sending payment failed email:', error)
      return { success: false, error }
    }
  }

  static async sendCancellationEmail(email: string) {
    if (!resend) {
      console.error('Resend client not initialized - missing API key')
      return
    }

    try {
      const template = emailTemplates.subscriptionCancelled()
      
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: template.subject,
        html: template.html,
      })

      if (error) {
        console.error('Failed to send cancellation email:', error)
        return { success: false, error }
      }

      console.log('Cancellation email sent to:', email)
      return { success: true, data }
    } catch (error) {
      console.error('Error sending cancellation email:', error)
      return { success: false, error }
    }
  }
}