export const emailTemplates = {
  subscriptionWelcome: (email: string, plan: 'monthly' | 'annual') => ({
    subject: 'Welcome to First Serve Seattle! 🎾',
    html: `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Welcome to First Serve Seattle</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
          <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f8fafc">
            <tr>
              <td align="center" style="padding: 20px 0;">
                <table width="600" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="border: 1px solid #e5e7eb;">
                  
                  <!-- Header -->
                  <tr>
                    <td bgcolor="#0c372b" style="padding: 48px 32px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
                              First Serve Seattle
                            </h1>
                            <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px;">
                              Real-time Tennis Court Availability
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Success Status -->
                  <tr>
                    <td style="padding: 40px 32px 0 32px;">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td bgcolor="#d1fae5" style="padding: 12px 20px; border-radius: 25px;">
                            <table cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="color: #065f46; font-size: 16px; font-weight: bold;">✓</td>
                                <td style="color: #065f46; font-size: 15px; font-weight: bold; padding-left: 8px;">Subscription Activated</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Welcome Title -->
                  <tr>
                    <td style="padding: 24px 32px 0 32px;">
                      <h2 style="color: #111827; font-size: 28px; font-weight: bold; margin: 0;">
                        Welcome to First Serve Seattle!
                      </h2>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 32px;">
                      <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
                        Thank you for subscribing! You now have access to court availability information for tennis courts across Seattle.
                      </p>
                      
                      <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
                        <strong>What you get:</strong><br/>
                        • Daily updated court availability<br/>
                        • Information on 100+ Seattle courts<br/>
                        • Court details including lights, walls, and surfaces<br/>
                        • Save time finding available courts
                      </p>
                      
                      <!-- Account Details Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f9fafb" style="border: 1px solid #e5e7eb; margin-bottom: 32px;">
                        <tr>
                          <td style="padding: 32px;">
                            <h3 style="color: #374151; font-size: 18px; font-weight: bold; margin: 0 0 20px 0;">
                              Your Account Details
                            </h3>
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                  <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                      <td style="color: #6b7280; font-size: 15px;">Plan</td>
                                      <td align="right" style="color: #111827; font-size: 15px; font-weight: bold;">
                                        ${plan === 'monthly' ? 'Monthly ($4 first month, then $8/mo)' : 'Annual ($69.99/yr)'}
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                  <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                      <td style="color: #6b7280; font-size: 15px;">Email</td>
                                      <td align="right" style="color: #111827; font-size: 15px; font-weight: bold;">
                                        ${email}
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0;">
                                  <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                      <td style="color: #6b7280; font-size: 15px;">Status</td>
                                      <td align="right" style="color: #059669; font-size: 15px; font-weight: bold;">
                                        Active
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- CTA Buttons -->
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-right: 10px;">
                            <table cellpadding="0" cellspacing="0">
                              <tr>
                                <td bgcolor="#0c372b" style="border-radius: 8px;">
                                  <a href="https://firstserveseattle.com/login" style="display: block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                                    Login & View Courts
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td>
                            <table cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="border: 2px solid #0c372b; border-radius: 8px;">
                                  <a href="https://firstserveseattle.com/billing" style="display: block; padding: 14px 30px; color: #0c372b; text-decoration: none; font-weight: bold; font-size: 16px;">
                                    Manage Subscription
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Quick Access Reminder -->
                  <tr>
                    <td bgcolor="#fef3c7" style="padding: 32px; border-top: 1px solid #fde68a;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <h4 style="color: #92400e; font-size: 16px; font-weight: bold; margin: 0 0 12px 0;">
                              💡 Quick Access
                            </h4>
                            <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 20px;">
                              Bookmark <a href="https://firstserveseattle.com/login" style="color: #92400e;">firstserveseattle.com/login</a> for quick access to court availability. You can manage or cancel your subscription anytime from the billing portal.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td bgcolor="#111827" style="padding: 32px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom: 20px;">
                            <p style="color: #d1d5db; font-size: 16px; font-weight: bold; margin: 0 0 8px 0;">
                              Need help?
                            </p>
                            <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                              Email: <a href="mailto:support@firstserveseattle.com" style="color: #60a5fa; text-decoration: none;">
                                support@firstserveseattle.com
                              </a>
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="border-top: 1px solid #374151; padding-top: 20px;">
                            <p style="color: #6b7280; font-size: 12px; margin: 0;">
                              © ${new Date().getFullYear()} First Serve Seattle. All rights reserved.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
  }),

  paymentSucceeded: (email: string, amount: number, plan: string) => ({
    subject: 'Payment Received - First Serve Seattle',
    html: `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Payment Received</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
          <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f8fafc">
            <tr>
              <td align="center" style="padding: 20px 0;">
                <table width="600" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="border: 1px solid #e5e7eb;">
                  
                  <!-- Header -->
                  <tr>
                    <td bgcolor="#0c372b" style="padding: 48px 32px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
                              First Serve Seattle
                            </h1>
                            <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px;">
                              Payment Receipt
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Success Status -->
                  <tr>
                    <td style="padding: 40px 32px 0 32px;">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td bgcolor="#d1fae5" style="padding: 12px 20px; border-radius: 25px;">
                            <table cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="color: #065f46; font-size: 16px; font-weight: bold;">✓</td>
                                <td style="color: #065f46; font-size: 15px; font-weight: bold; padding-left: 8px;">Payment Successful</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Title -->
                  <tr>
                    <td style="padding: 24px 32px 0 32px;">
                      <h2 style="color: #111827; font-size: 28px; font-weight: bold; margin: 0;">
                        Thank You for Your Payment
                      </h2>
                    </td>
                  </tr>
                  
                  <!-- Payment Details -->
                  <tr>
                    <td style="padding: 32px;">
                      <!-- Payment Details Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f9fafb" style="border: 1px solid #e5e7eb; margin-bottom: 32px;">
                        <tr>
                          <td style="padding: 32px;">
                            <h3 style="color: #374151; font-size: 18px; font-weight: bold; margin: 0 0 20px 0;">
                              Payment Details
                            </h3>
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                  <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                      <td style="color: #6b7280; font-size: 15px;">Amount</td>
                                      <td align="right" style="color: #111827; font-size: 15px; font-weight: bold;">
                                        $${(amount / 100).toFixed(2)}
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                  <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                      <td style="color: #6b7280; font-size: 15px;">Plan</td>
                                      <td align="right" style="color: #111827; font-size: 15px; font-weight: bold;">
                                        ${plan === 'monthly' ? 'Monthly' : plan === 'annual' ? 'Annual' : plan}
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                  <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                      <td style="color: #6b7280; font-size: 15px;">Date</td>
                                      <td align="right" style="color: #111827; font-size: 15px; font-weight: bold;">
                                        ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0;">
                                  <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                      <td style="color: #6b7280; font-size: 15px;">Status</td>
                                      <td align="right" style="color: #059669; font-size: 15px; font-weight: bold;">
                                        Paid
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 32px 0;">
                        Your subscription is active and you have full access to all court availability features.
                      </p>
                      
                      <!-- CTA Button -->
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td bgcolor="#0c372b" style="border-radius: 8px;">
                            <a href="https://firstserveseattle.com/tennis-courts" style="display: block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                              Check Court Availability
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td bgcolor="#111827" style="padding: 32px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom: 20px;">
                            <p style="color: #d1d5db; font-size: 16px; font-weight: bold; margin: 0 0 8px 0;">
                              Need help? Contact us anytime!
                            </p>
                            <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                              <a href="mailto:support@firstserveseattle.com" style="color: #60a5fa; text-decoration: none;">
                                support@firstserveseattle.com
                              </a>
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="border-top: 1px solid #374151; padding-top: 20px;">
                            <p style="color: #6b7280; font-size: 12px; margin: 0;">
                              © ${new Date().getFullYear()} First Serve Seattle. All rights reserved.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
  }),

  paymentFailed: (email: string, retryUrl: string) => ({
    subject: 'Payment Failed - Action Required',
    html: `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Payment Failed</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
          <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f8fafc">
            <tr>
              <td align="center" style="padding: 20px 0;">
                <table width="600" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="border: 1px solid #e5e7eb;">
                  
                  <!-- Header -->
                  <tr>
                    <td bgcolor="#ef4444" style="padding: 48px 32px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
                              First Serve Seattle
                            </h1>
                            <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px;">
                              Payment Issue
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Warning Status -->
                  <tr>
                    <td style="padding: 40px 32px 0 32px;">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td bgcolor="#fee2e2" style="padding: 12px 20px; border-radius: 25px;">
                            <table cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="color: #991b1b; font-size: 16px; font-weight: bold;">⚠️</td>
                                <td style="color: #991b1b; font-size: 15px; font-weight: bold; padding-left: 8px;">Payment Failed</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Title -->
                  <tr>
                    <td style="padding: 24px 32px 0 32px;">
                      <h2 style="color: #111827; font-size: 28px; font-weight: bold; margin: 0;">
                        We Couldn't Process Your Payment
                      </h2>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 32px;">
                      <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
                        We were unable to process your recent payment. This might be due to:
                      </p>
                      
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-left: 24px;">
                            <p style="color: #6b7280; font-size: 15px; margin: 0; line-height: 28px;">
                              • Insufficient funds<br/>
                              • Card expiration<br/>
                              • Bank declining the transaction<br/>
                              • Incorrect card information
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Warning Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#fef3c7" style="border: 1px solid #fde68a; margin: 24px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="color: #92400e; font-size: 15px; font-weight: bold; margin: 0;">
                              ⏰ Important: Please update your payment method within 7 days to avoid service interruption.
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- CTA Button -->
                      <table cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                        <tr>
                          <td bgcolor="#ef4444" style="border-radius: 8px;">
                            <a href="${retryUrl}" style="display: block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                              Update Payment Method
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #6b7280; font-size: 14px; margin: 24px 0 0 0;">
                        You can also manage your subscription at any time from your billing portal.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td bgcolor="#111827" style="padding: 32px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom: 20px;">
                            <p style="color: #d1d5db; font-size: 16px; font-weight: bold; margin: 0 0 8px 0;">
                              Need help? Contact us immediately!
                            </p>
                            <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                              <a href="mailto:support@firstserveseattle.com" style="color: #60a5fa; text-decoration: none;">
                                support@firstserveseattle.com
                              </a>
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="border-top: 1px solid #374151; padding-top: 20px;">
                            <p style="color: #6b7280; font-size: 12px; margin: 0;">
                              © ${new Date().getFullYear()} First Serve Seattle. All rights reserved.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
  }),

  subscriptionCancelled: () => ({
    subject: 'Subscription Cancelled - First Serve Seattle',
    html: `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Subscription Cancelled</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
          <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f8fafc">
            <tr>
              <td align="center" style="padding: 20px 0;">
                <table width="600" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="border: 1px solid #e5e7eb;">
                  
                  <!-- Header -->
                  <tr>
                    <td bgcolor="#6b7280" style="padding: 48px 32px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
                              First Serve Seattle
                            </h1>
                            <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px;">
                              Subscription Update
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Cancelled Badge -->
                  <tr>
                    <td style="padding: 40px 32px 0 32px;">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td bgcolor="#f3f4f6" style="padding: 12px 20px; border-radius: 25px;">
                            <span style="color: #4b5563; font-size: 15px; font-weight: bold;">
                              Subscription Cancelled
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Title -->
                  <tr>
                    <td style="padding: 24px 32px 0 32px;">
                      <h2 style="color: #111827; font-size: 28px; font-weight: bold; margin: 0;">
                        We're Sorry to See You Go
                      </h2>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 32px;">
                      <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
                        Your subscription to First Serve Seattle has been cancelled. You'll continue to have access until the end of your current billing period.
                      </p>
                      
                      <!-- Info Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f9fafb" style="border: 1px solid #e5e7eb; margin: 24px 0;">
                        <tr>
                          <td style="padding: 24px;">
                            <p style="color: #374151; font-size: 15px; margin: 0; line-height: 28px;">
                              <strong style="color: #111827;">Access expires:</strong> End of current billing period<br/>
                              <strong style="color: #111827;">Status:</strong> Cancelled
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 24px 0;">
                        We'd love to hear your feedback! If there's anything we could have done better, please let us know.
                      </p>
                      
                      <!-- CTA Button -->
                      <table cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                        <tr>
                          <td bgcolor="#0c372b" style="border-radius: 8px;">
                            <a href="https://firstserveseattle.com/signup" style="display: block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                              Reactivate Subscription
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #6b7280; font-size: 14px; margin: 24px 0 0 0;">
                        You can reactivate your subscription anytime to regain instant access to court availability.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td bgcolor="#111827" style="padding: 32px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom: 20px;">
                            <p style="color: #d1d5db; font-size: 16px; font-weight: bold; margin: 0 0 8px 0;">
                              Thank you for being a member!
                            </p>
                            <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                              <a href="mailto:support@firstserveseattle.com" style="color: #60a5fa; text-decoration: none;">
                                support@firstserveseattle.com
                              </a>
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="border-top: 1px solid #374151; padding-top: 20px;">
                            <p style="color: #6b7280; font-size: 12px; margin: 0;">
                              © ${new Date().getFullYear()} First Serve Seattle. All rights reserved.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
  })
}