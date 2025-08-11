export const emailTemplates = {
  subscriptionWelcome: (email: string, plan: 'monthly' | 'annual') => ({
    subject: 'Welcome to First Serve Seattle! 🎾',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to First Serve Seattle</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0c372b 0%, #0a2e24 100%); padding: 48px 32px; text-align: left;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.025em;">
                First Serve Seattle
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px; font-weight: 400;">
                Real-time Tennis Court Availability
              </p>
            </div>
            
            <!-- Success Status -->
            <div style="padding: 40px 32px 0; text-align: left;">
              <div style="display: inline-flex; align-items: center; background-color: #d1fae5; color: #065f46; padding: 12px 20px; border-radius: 50px; font-size: 15px; font-weight: 600; margin-bottom: 24px;">
                <span style="margin-right: 8px; font-size: 16px;">✓</span>
                Subscription Activated
              </div>
              <h2 style="color: #111827; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.025em;">
                Welcome to First Serve Seattle!
              </h2>
            </div>
            
            <!-- Subscription Details -->
            <div style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Thank you for joining! Your ${plan} subscription is now active. You can start checking real-time court availability immediately.
              </p>
              
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 32px; margin-bottom: 32px; border: 1px solid #e5e7eb;">
                <h3 style="color: #374151; font-size: 18px; font-weight: 600; margin: 0 0 20px 0;">
                  Your Subscription Details
                </h3>
                <div style="space-y: 12px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 15px;">Plan</span>
                    <span style="color: #111827; font-size: 15px; font-weight: 600;">${plan === 'monthly' ? 'Monthly' : 'Annual'}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 15px;">Email</span>
                    <span style="color: #111827; font-size: 15px; font-weight: 600;">${email}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                    <span style="color: #6b7280; font-size: 15px;">Status</span>
                    <span style="color: #059669; font-size: 15px; font-weight: 600;">Active</span>
                  </div>
                </div>
              </div>
              
              <!-- CTA Buttons -->
              <div style="text-align: left; margin: 40px 0;">
                <a href="https://firstserveseattle.com/tennis-courts" 
                   style="display: inline-block; background-color: #0c372b; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.2s; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin: 0 8px 8px 0;">
                  Check Court Availability
                </a>
                <a href="https://firstserveseattle.com/billing" 
                   style="display: inline-block; background-color: #ffffff; color: #0c372b; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; border: 2px solid #0c372b; margin: 0 8px 8px 0;">
                  Manage Subscription
                </a>
              </div>
            </div>
            
            <!-- Pro Tips Section -->
            <div style="padding: 32px; background-color: #fef3c7; border-top: 1px solid #fde68a;">
              <div style="text-align: left; max-width: 500px;">
                <h4 style="color: #92400e; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">
                  💡 Pro Tips
                </h4>
                <ul style="color: #92400e; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li>Bookmark the court availability page for quick access</li>
                  <li>Check courts early morning for best availability</li>
                  <li>You can manage or cancel your subscription anytime</li>
                </ul>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #111827; padding: 32px; text-align: left;">
              <div style="margin-bottom: 20px;">
                <p style="color: #d1d5db; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
                  Questions? We're here to help!
                </p>
                <div style="color: #9ca3af; font-size: 14px;">
                  <div style="margin-bottom: 4px;">
                    <a href="mailto:support@firstserveseattle.com" style="color: #60a5fa; text-decoration: none;">
                      support@firstserveseattle.com
                    </a>
                  </div>
                </div>
              </div>
              <div style="border-top: 1px solid #374151; padding-top: 20px;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} First Serve Seattle. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  paymentSucceeded: (email: string, amount: number, plan: string) => ({
    subject: 'Payment Received - First Serve Seattle',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Received</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0c372b 0%, #0a2e24 100%); padding: 48px 32px; text-align: left;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.025em;">
                First Serve Seattle
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px; font-weight: 400;">
                Payment Receipt
              </p>
            </div>
            
            <!-- Success Status -->
            <div style="padding: 40px 32px 0; text-align: left;">
              <div style="display: inline-flex; align-items: center; background-color: #d1fae5; color: #065f46; padding: 12px 20px; border-radius: 50px; font-size: 15px; font-weight: 600; margin-bottom: 24px;">
                <span style="margin-right: 8px; font-size: 16px;">✓</span>
                Payment Successful
              </div>
              <h2 style="color: #111827; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.025em;">
                Thank You for Your Payment
              </h2>
            </div>
            
            <!-- Payment Details -->
            <div style="padding: 32px;">
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 32px; margin-bottom: 32px; border: 1px solid #e5e7eb;">
                <h3 style="color: #374151; font-size: 18px; font-weight: 600; margin: 0 0 20px 0;">
                  Payment Details
                </h3>
                <div style="space-y: 12px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 15px;">Amount</span>
                    <span style="color: #111827; font-size: 15px; font-weight: 600;">$${(amount / 100).toFixed(2)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 15px;">Plan</span>
                    <span style="color: #111827; font-size: 15px; font-weight: 600;">${plan === 'monthly' ? 'Monthly' : plan === 'annual' ? 'Annual' : plan}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 15px;">Date</span>
                    <span style="color: #111827; font-size: 15px; font-weight: 600;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                    <span style="color: #6b7280; font-size: 15px;">Status</span>
                    <span style="color: #059669; font-size: 15px; font-weight: 600;">Paid</span>
                  </div>
                </div>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                Your subscription is active and you have full access to all court availability features.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: left; margin: 40px 0;">
                <a href="https://firstserveseattle.com/tennis-courts" 
                   style="display: inline-block; background-color: #0c372b; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.2s; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  Check Court Availability
                </a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #111827; padding: 32px; text-align: left;">
              <div style="margin-bottom: 20px;">
                <p style="color: #d1d5db; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
                  Need help? Contact us anytime!
                </p>
                <div style="color: #9ca3af; font-size: 14px;">
                  <div style="margin-bottom: 4px;">
                    <a href="mailto:support@firstserveseattle.com" style="color: #60a5fa; text-decoration: none;">
                      support@firstserveseattle.com
                    </a>
                  </div>
                </div>
              </div>
              <div style="border-top: 1px solid #374151; padding-top: 20px;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} First Serve Seattle. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  paymentFailed: (email: string, retryUrl: string) => ({
    subject: 'Payment Failed - Action Required',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Failed</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 48px 32px; text-align: left;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.025em;">
                First Serve Seattle
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px; font-weight: 400;">
                Payment Issue
              </p>
            </div>
            
            <!-- Warning Status -->
            <div style="padding: 40px 32px 0; text-align: left;">
              <div style="display: inline-flex; align-items: center; background-color: #fee2e2; color: #991b1b; padding: 12px 20px; border-radius: 50px; font-size: 15px; font-weight: 600; margin-bottom: 24px;">
                <span style="margin-right: 8px; font-size: 16px;">⚠️</span>
                Payment Failed
              </div>
              <h2 style="color: #111827; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.025em;">
                We Couldn't Process Your Payment
              </h2>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                We were unable to process your recent payment. This might be due to:
              </p>
              
              <ul style="color: #6b7280; font-size: 15px; margin: 0 0 24px 0; padding-left: 24px; line-height: 1.8;">
                <li>Insufficient funds</li>
                <li>Card expiration</li>
                <li>Bank declining the transaction</li>
                <li>Incorrect card information</li>
              </ul>
              
              <div style="background-color: #fef3c7; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #fde68a;">
                <p style="color: #92400e; font-size: 15px; font-weight: 600; margin: 0;">
                  ⏰ Important: Please update your payment method within 7 days to avoid service interruption.
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: left; margin: 32px 0;">
                <a href="${retryUrl}" 
                   style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  Update Payment Method
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin: 24px 0 0 0;">
                You can also manage your subscription at any time from your billing portal.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #111827; padding: 32px; text-align: left;">
              <div style="margin-bottom: 20px;">
                <p style="color: #d1d5db; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
                  Need help? Contact us immediately!
                </p>
                <div style="color: #9ca3af; font-size: 14px;">
                  <div style="margin-bottom: 4px;">
                    <a href="mailto:support@firstserveseattle.com" style="color: #60a5fa; text-decoration: none;">
                      support@firstserveseattle.com
                    </a>
                  </div>
                </div>
              </div>
              <div style="border-top: 1px solid #374151; padding-top: 20px;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} First Serve Seattle. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  subscriptionCancelled: () => ({
    subject: 'Subscription Cancelled - First Serve Seattle',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Subscription Cancelled</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 48px 32px; text-align: left;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.025em;">
                First Serve Seattle
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px; font-weight: 400;">
                Subscription Update
              </p>
            </div>
            
            <!-- Cancelled Badge -->
            <div style="padding: 40px 32px 0; text-align: left;">
              <div style="display: inline-flex; align-items: center; background-color: #f3f4f6; color: #4b5563; padding: 12px 20px; border-radius: 50px; font-size: 15px; font-weight: 600; margin-bottom: 24px;">
                Subscription Cancelled
              </div>
              <h2 style="color: #111827; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.025em;">
                We're Sorry to See You Go
              </h2>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Your subscription to First Serve Seattle has been cancelled. You'll continue to have access until the end of your current billing period.
              </p>
              
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #e5e7eb;">
                <p style="color: #374151; font-size: 15px; margin: 0; line-height: 1.8;">
                  <strong style="color: #111827;">Access expires:</strong> End of current billing period<br>
                  <strong style="color: #111827;">Status:</strong> Cancelled
                </p>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 24px 0;">
                We'd love to hear your feedback! If there's anything we could have done better, please let us know.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: left; margin: 32px 0;">
                <a href="https://firstserveseattle.com/signup" 
                   style="display: inline-block; background-color: #0c372b; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  Reactivate Subscription
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin: 24px 0 0 0;">
                You can reactivate your subscription anytime to regain instant access to court availability.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #111827; padding: 32px; text-align: left;">
              <div style="margin-bottom: 20px;">
                <p style="color: #d1d5db; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
                  Thank you for being a member!
                </p>
                <div style="color: #9ca3af; font-size: 14px;">
                  <div style="margin-bottom: 4px;">
                    <a href="mailto:support@firstserveseattle.com" style="color: #60a5fa; text-decoration: none;">
                      support@firstserveseattle.com
                    </a>
                  </div>
                </div>
              </div>
              <div style="border-top: 1px solid #374151; padding-top: 20px;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} First Serve Seattle. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  })
}