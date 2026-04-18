export const emailTemplates = {
  subscriptionWelcome: (email: string, plan: 'monthly' | 'annual') => ({
    subject: 'Welcome to First Serve Seattle!',
    html: `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <meta name="color-scheme" content="light only" />
          <meta name="supported-color-schemes" content="light only" />
          <title>Welcome to First Serve Seattle</title>
          <style>
            :root { color-scheme: light only; }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc; color: #111827; -webkit-text-size-adjust: 100%;">
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
                            <h1 style="color: #ffffff !important; margin: 0; font-size: 32px; font-weight: bold;">
                              First Serve Seattle
                            </h1>
                            <p style="color: #ffffff !important; margin: 8px 0 0 0; font-size: 16px;">
                              Find Today's Open Courts
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
                                <td style="color: #065f46; font-size: 17px; font-weight: bold; padding-left: 8px;">Subscription Activated</td>
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
                      <p style="color: #374151; font-size: 18px; line-height: 28px; margin: 0 0 24px 0;">
                        Thank you for subscribing! You now have access to court availability information for tennis courts across Seattle.
                      </p>
                      
                      <p style="color: #374151; font-size: 18px; line-height: 28px; margin: 0 0 24px 0;">
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
                                      <td style="color: #6b7280; font-size: 17px;">Plan</td>
                                      <td align="right" style="color: #111827; font-size: 17px; font-weight: bold;">
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
                                      <td style="color: #6b7280; font-size: 17px;">Email</td>
                                      <td align="right" style="color: #111827; font-size: 17px; font-weight: bold;">
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
                                      <td style="color: #6b7280; font-size: 17px;">Status</td>
                                      <td align="right" style="color: #059669; font-size: 17px; font-weight: bold;">
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
                                  <a href="https://firstserveseattle.com/login" style="display: block; padding: 16px 32px; color: #ffffff !important; text-decoration: none; font-weight: bold; font-size: 16px;">
                                    Login & View Courts
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td>
                            <table cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="border: 2px solid #0c372b; border-radius: 8px; background-color: #ffffff;">
                                  <a href="https://firstserveseattle.com/billing" style="display: block; padding: 14px 30px; color: #0c372b !important; text-decoration: none; font-weight: bold; font-size: 16px;">
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
                  
                  <!-- Footer -->
                  <tr>
                    <td bgcolor="#111827" style="padding: 32px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom: 20px;">
                            <p style="color: #d1d5db !important; font-size: 16px; font-weight: bold; margin: 0 0 8px 0;">
                              Need help?
                            </p>
                            <p style="color: #9ca3af !important; font-size: 16px; margin: 0;">
                              Email: <a href="mailto:support@firstserveseattle.com" style="color: #86efac !important; text-decoration: none;">
                                support@firstserveseattle.com
                              </a>
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="border-top: 1px solid #374151; padding-top: 20px;">
                            <p style="color: #9ca3af !important; font-size: 14px; margin: 0;">
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
          <meta name="color-scheme" content="light only" />
          <meta name="supported-color-schemes" content="light only" />
          <title>Payment Received</title>
          <style>
            :root { color-scheme: light only; }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc; color: #111827; -webkit-text-size-adjust: 100%;">
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
                            <h1 style="color: #ffffff !important; margin: 0; font-size: 32px; font-weight: bold;">
                              First Serve Seattle
                            </h1>
                            <p style="color: #ffffff !important; margin: 8px 0 0 0; font-size: 16px;">
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
                                <td style="color: #065f46; font-size: 17px; font-weight: bold; padding-left: 8px;">Payment Successful</td>
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
                                      <td style="color: #6b7280; font-size: 17px;">Amount</td>
                                      <td align="right" style="color: #111827; font-size: 17px; font-weight: bold;">
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
                                      <td style="color: #6b7280; font-size: 17px;">Plan</td>
                                      <td align="right" style="color: #111827; font-size: 17px; font-weight: bold;">
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
                                      <td style="color: #6b7280; font-size: 17px;">Date</td>
                                      <td align="right" style="color: #111827; font-size: 17px; font-weight: bold;">
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
                                      <td style="color: #6b7280; font-size: 17px;">Status</td>
                                      <td align="right" style="color: #059669; font-size: 17px; font-weight: bold;">
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
                      
                      <p style="color: #374151; font-size: 18px; line-height: 28px; margin: 0 0 32px 0;">
                        Your subscription is active and you have full access to all court availability features.
                      </p>
                      
                      <!-- CTA Buttons -->
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-right: 10px;">
                            <table cellpadding="0" cellspacing="0">
                              <tr>
                                <td bgcolor="#0c372b" style="border-radius: 8px;">
                                  <a href="https://firstserveseattle.com/courts" style="display: block; padding: 16px 32px; color: #ffffff !important; text-decoration: none; font-weight: bold; font-size: 16px;">
                                    View Courts
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td>
                            <table cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="border: 2px solid #0c372b; border-radius: 8px; background-color: #ffffff;">
                                  <a href="https://firstserveseattle.com/billing" style="display: block; padding: 14px 30px; color: #0c372b !important; text-decoration: none; font-weight: bold; font-size: 16px;">
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

                  <!-- Footer -->
                  <tr>
                    <td bgcolor="#111827" style="padding: 32px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom: 20px;">
                            <p style="color: #d1d5db !important; font-size: 16px; font-weight: bold; margin: 0 0 8px 0;">
                              Need help? Contact us anytime!
                            </p>
                            <p style="color: #9ca3af !important; font-size: 16px; margin: 0;">
                              <a href="mailto:support@firstserveseattle.com" style="color: #86efac !important; text-decoration: none;">
                                support@firstserveseattle.com
                              </a>
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="border-top: 1px solid #374151; padding-top: 20px;">
                            <p style="color: #9ca3af !important; font-size: 14px; margin: 0;">
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
          <meta name="color-scheme" content="light only" />
          <meta name="supported-color-schemes" content="light only" />
          <title>Payment Failed</title>
          <style>
            :root { color-scheme: light only; }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc; color: #111827; -webkit-text-size-adjust: 100%;">
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
                            <h1 style="color: #ffffff !important; margin: 0; font-size: 32px; font-weight: bold;">
                              First Serve Seattle
                            </h1>
                            <p style="color: #ffffff !important; margin: 8px 0 0 0; font-size: 16px;">
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
                                <td style="color: #991b1b; font-size: 17px; font-weight: bold; padding-left: 8px;">Payment Failed</td>
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
                      <p style="color: #374151; font-size: 18px; line-height: 28px; margin: 0 0 24px 0;">
                        We were unable to process your recent payment. This might be due to:
                      </p>
                      
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-left: 24px;">
                            <p style="color: #6b7280; font-size: 17px; margin: 0; line-height: 28px;">
                              • Insufficient funds<br/>
                              • Card expiration<br/>
                              • Bank declining the transaction<br/>
                              • Incorrect card information
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Warning Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#fee2e2" style="border: 1px solid #fecaca; margin: 24px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="color: #991b1b; font-size: 17px; font-weight: bold; margin: 0;">
                              ⏰ Important: Please update your payment method within 7 days to avoid service interruption.
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- CTA Buttons -->
                      <table cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                        <tr>
                          <td style="padding-right: 10px;">
                            <table cellpadding="0" cellspacing="0">
                              <tr>
                                <td bgcolor="#ef4444" style="border-radius: 8px;">
                                  <a href="${retryUrl}" style="display: block; padding: 16px 32px; color: #ffffff !important; text-decoration: none; font-weight: bold; font-size: 16px;">
                                    Update Payment Method
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td>
                            <table cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="border: 2px solid #0c372b; border-radius: 8px; background-color: #ffffff;">
                                  <a href="https://firstserveseattle.com/billing" style="display: block; padding: 14px 30px; color: #0c372b !important; text-decoration: none; font-weight: bold; font-size: 16px;">
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

                  <!-- Footer -->
                  <tr>
                    <td bgcolor="#111827" style="padding: 32px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom: 20px;">
                            <p style="color: #d1d5db !important; font-size: 16px; font-weight: bold; margin: 0 0 8px 0;">
                              Need help? Contact us immediately!
                            </p>
                            <p style="color: #9ca3af !important; font-size: 16px; margin: 0;">
                              <a href="mailto:support@firstserveseattle.com" style="color: #86efac !important; text-decoration: none;">
                                support@firstserveseattle.com
                              </a>
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="border-top: 1px solid #374151; padding-top: 20px;">
                            <p style="color: #9ca3af !important; font-size: 14px; margin: 0;">
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
          <meta name="color-scheme" content="light only" />
          <meta name="supported-color-schemes" content="light only" />
          <title>Subscription Cancelled</title>
          <style>
            :root { color-scheme: light only; }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc; color: #111827; -webkit-text-size-adjust: 100%;">
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
                            <h1 style="color: #ffffff !important; margin: 0; font-size: 32px; font-weight: bold;">
                              First Serve Seattle
                            </h1>
                            <p style="color: #ffffff !important; margin: 8px 0 0 0; font-size: 16px;">
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
                            <span style="color: #4b5563; font-size: 17px; font-weight: bold;">
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
                      <p style="color: #374151; font-size: 18px; line-height: 28px; margin: 0 0 24px 0;">
                        Your subscription to First Serve Seattle has been cancelled. You'll continue to have access until the end of your current billing period.
                      </p>

                      <!-- Info Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f9fafb" style="border: 1px solid #e5e7eb; margin: 24px 0;">
                        <tr>
                          <td style="padding: 24px;">
                            <p style="color: #374151; font-size: 17px; margin: 0; line-height: 28px;">
                              <strong style="color: #111827;">Access expires:</strong> End of current billing period<br/>
                              <strong style="color: #111827;">Status:</strong> Cancelled
                            </p>
                          </td>
                        </tr>
                      </table>

                      <p style="color: #374151; font-size: 18px; line-height: 28px; margin: 24px 0;">
                        We'd love to hear your feedback! If there's anything we could have done better, please let us know.
                      </p>

                      <!-- CTA Button -->
                      <table cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                        <tr>
                          <td bgcolor="#0c372b" style="border-radius: 8px;">
                            <a href="https://firstserveseattle.com/signup" style="display: block; padding: 16px 32px; color: #ffffff !important; text-decoration: none; font-weight: bold; font-size: 16px;">
                              Reactivate Subscription
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="color: #6b7280; font-size: 16px; margin: 24px 0 0 0;">
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
                            <p style="color: #d1d5db !important; font-size: 16px; font-weight: bold; margin: 0 0 8px 0;">
                              Thank you for being a member!
                            </p>
                            <p style="color: #9ca3af !important; font-size: 16px; margin: 0;">
                              <a href="mailto:support@firstserveseattle.com" style="color: #86efac !important; text-decoration: none;">
                                support@firstserveseattle.com
                              </a>
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="border-top: 1px solid #374151; padding-top: 20px;">
                            <p style="color: #9ca3af !important; font-size: 14px; margin: 0;">
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

  // ============================================================================
  // EMAIL ALERT TEMPLATES
  // ============================================================================

  alertTrialWelcome: (email: string, preferencesUrl: string, expiresAt: Date) => ({
    subject: 'Your 5-day court alerts are active!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <meta name="color-scheme" content="light only" />
          <meta name="supported-color-schemes" content="light only" />
          <title>Welcome to Court Alerts</title>
          <style>
            :root { color-scheme: light only; }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc; color: #111827;">
          <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f8fafc">
            <tr>
              <td align="center" style="padding: 20px 0;">
                <table width="600" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="border: 1px solid #e5e7eb; border-radius: 8px;">

                  <!-- Header -->
                  <tr>
                    <td bgcolor="#0c372b" style="padding: 32px; border-radius: 8px 8px 0 0;">
                      <h1 style="color: #ffffff !important; margin: 0; font-size: 24px; font-weight: bold;">
                        First Serve Seattle
                      </h1>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 32px;">
                      <h2 style="color: #111827; font-size: 24px; margin: 0 0 16px 0;">
                        You're all set for 5 days of free court alerts!
                      </h2>

                      <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
                        We'll send you personalized alerts when your favorite courts have open slots.
                      </p>

                      <!-- Savings callout -->
                      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#dcfce7" style="border: 1px solid #bbf7d0; border-radius: 8px; margin: 0 0 24px 0;">
                        <tr>
                          <td style="padding: 16px;">
                            <p style="color: #166534; font-size: 16px; font-weight: bold; margin: 0 0 4px 0;">
                              Save $24+ per session
                            </p>
                            <p style="color: #166534; font-size: 14px; margin: 0;">
                              Skip the 90-minute court reservation and play for free on public courts.
                            </p>
                          </td>
                        </tr>
                      </table>

                      <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
                        <strong>Your trial expires:</strong> ${expiresAt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </p>

                      <!-- CTA -->
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td bgcolor="#0c372b" style="border-radius: 8px;">
                            <a href="${preferencesUrl}" style="display: block; padding: 14px 28px; color: #ffffff !important; text-decoration: none; font-weight: bold; font-size: 16px;">
                              Customize Your Alert Preferences
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="color: #6b7280; font-size: 14px; margin: 24px 0 0 0;">
                        Want unlimited access? <a href="https://firstserveseattle.com/signup" style="color: #0c372b !important; font-weight: bold;">Subscribe now</a> and never miss an open court.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td bgcolor="#f9fafb" style="padding: 24px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 12px; margin: 0;">
                        First Serve Seattle | <a href="mailto:support@firstserveseattle.com" style="color: #6b7280;">support@firstserveseattle.com</a>
                      </p>
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

  dailyCourtAlert: (
    courts: Array<{ title: string; address: string; slots: string[]; mapsUrl: string }>,
    daysRemaining: number,
    preferencesUrl: string,
    unsubscribeUrl: string,
    email?: string,
    isPaidMember: boolean = false
  ) => {
    return {
      subject: courts.length === 1
        ? `${courts[0].title} has open slots today!`
        : `${courts.length} of your courts are open today!`,
      html: `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <meta name="color-scheme" content="light only" />
          <meta name="supported-color-schemes" content="light only" />
          <title>Open Court Notification</title>
          <style>
            :root { color-scheme: light only; }
            @media (prefers-color-scheme: dark) {
              body, table, td, div, p, a, span { background-color: #ffffff !important; color: #111827 !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff !important; color: #111827 !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
          <div style="background-color: #ffffff !important;">
          <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="background-color: #ffffff !important; min-width: 100% !important;">
            <tr>
              <td style="padding: 24px; background-color: #ffffff !important;">

                      <!-- Greeting -->
                      <p style="color: #111827 !important; font-size: 20px; line-height: 1.5; margin: 0 0 24px 0; background-color: #ffffff !important;">
                        Hey! Here are today's open courts:
                      </p>

                      <!-- Courts List -->
                      ${courts.map(court => `
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; background-color: #ffffff !important;">
                          <tr>
                            <td style="padding-bottom: 24px; border-bottom: 1px solid #e5e7eb; background-color: #ffffff !important;">
                              <p style="color: #111827 !important; font-size: 22px; font-weight: 600; margin: 0 0 8px 0; background-color: #ffffff !important;">
                                ${court.title}
                              </p>
                              <p style="color: #6b7280 !important; font-size: 17px; line-height: 1.4; margin: 0 0 12px 0; background-color: #ffffff !important;">
                                ${court.address}
                              </p>
                              <p style="color: #059669 !important; font-size: 19px; font-weight: 600; margin: 0 0 12px 0; background-color: #ffffff !important;">
                                ${court.slots.join(' · ')}
                              </p>
                              <a href="${court.mapsUrl}" style="color: #0c372b !important; font-size: 17px; text-decoration: none; font-weight: 500;">
                                Get Directions →
                              </a>
                            </td>
                          </tr>
                        </table>
                      `).join('')}

                      <!-- Trial reminder (only show for non-paid members) -->
                      ${!isPaidMember ? `
                      <p style="color: #6b7280 !important; font-size: 17px; line-height: 1.5; margin: 24px 0 16px 0; background-color: #ffffff !important;">
                        ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left on your free trial.
                        <a href="https://firstserveseattle.com/signup?plan=monthly${email ? `&email=${encodeURIComponent(email)}` : ''}" style="color: #0c372b !important; font-weight: 600; text-decoration: none;">
                          Subscribe for $8/mo
                        </a> to keep getting alerts.
                      </p>
                      ` : ''}

                      <!-- Footer -->
                      <p style="color: #9ca3af !important; font-size: 15px; line-height: 1.5; margin: 32px 0 0 0; padding-top: 16px; border-top: 1px solid #e5e7eb; background-color: #ffffff !important;">
                        <a href="${preferencesUrl}" style="color: #9ca3af !important; text-decoration: none;">Manage preferences</a> ·
                        <a href="${unsubscribeUrl}" style="color: #9ca3af !important; text-decoration: none;">Unsubscribe</a>
                      </p>

              </td>
            </tr>
          </table>
          </div>
        </body>
      </html>
    `
    };
  },

  trialExpiredReengagement: (email: string) => {
    const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    // Subject lines
    const subjects = [
      "Ready to play? See which courts are open",
      "Perfect tennis weather is back",
      "Seattle courts are busy — know before you go",
      "Sunny days ahead. Open courts too.",
    ];

    // Opening variations
    const greetings = ["Hey,", "Hi,", ""];

    // First paragraph variations
    const openingLines = [
      "Your First Serve Seattle trial ended, but the sunny weather is back and courts are filling up.",
      "Your First Serve Seattle trial ended, but spring is here and courts are filling up.",
      "Your First Serve Seattle trial ended, but the nice days are back and courts are filling up fast.",
    ];

    // Second paragraph variations
    const problemStatements = [
      "I built this to solve my own problem: showing which courts are open for first come, first serve play. Now I don't have to spend $24 every time I book a court or waste time driving to a packed park. I hope you join me.",
      "I built this because I was tired of showing up to packed courts or paying $24 to book one. Now I can see which courts are open for first come, first serve play. I hope you join me.",
      "I got tired of driving to packed parks or spending $24 to book a court. So I built this to show which courts are open for first come, first serve play. I hope you join me.",
    ];

    const subject = pick(subjects);
    const greeting = pick(greetings);
    const openingLine = pick(openingLines);
    const problemStatement = pick(problemStatements);
    const subscribeUrl = `https://www.firstserveseattle.com/checkout?plan=monthly&email=${encodeURIComponent(email)}`;

    const greetingHtml = greeting ? `<p style="color: #374151; font-size: 16px; line-height: 26px; margin: 0 0 20px 0;">
                  ${greeting}
                </p>

                ` : '';

    return {
      subject,
      html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff; color: #111827;">
          <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff">
            <tr>
              <td style="padding: 32px; max-width: 600px;">
                ${greetingHtml}<p style="color: #374151; font-size: 16px; line-height: 26px; margin: 0 0 20px 0;">
                  ${openingLine}
                </p>

                <p style="color: #374151; font-size: 16px; line-height: 26px; margin: 0 0 24px 0;">
                  ${problemStatement}
                </p>

                <table cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                  <tr>
                    <td bgcolor="#0c372b" style="border-radius: 6px;">
                      <a href="${subscribeUrl}" style="display: block; padding: 14px 28px; color: #ffffff !important; text-decoration: none; font-weight: bold; font-size: 16px;">
                        See today's open courts
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="color: #374151; font-size: 16px; line-height: 26px; margin: 0 0 20px 0;">
                  — Ryan
                </p>

                <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                  P.S. Cancel anytime.
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
    };
  },

  alertTrialExpiring: (email: string) => {
    const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    // Subject line variations
    const subjects = [
      "Your trial ends tomorrow",
      "Last day to lock in court access",
      "Tomorrow your trial expires",
    ];

    // Greeting variations
    const greetings = ["Hey,", "Hi,", ""];

    // Opening line variations
    const openingLines = [
      "Just a heads up — your free trial ends tomorrow.",
      "Quick reminder: your First Serve Seattle trial expires tomorrow.",
      "Your 5-day trial wraps up tomorrow.",
    ];

    // Value prop variations
    const valueProps = [
      "I built this so I could see which courts are open for first come, first serve play — and skip paying $24 to book every time I want to hit.",
      "Instead of showing up to packed courts or spending $24 to book, you can see exactly which courts are open for first come, first serve play.",
      "With a membership, you'll always know which courts are open for walk-up play — no more wasted trips or $24 booking fees.",
    ];

    // CTA text variations
    const ctaTexts = [
      "Keep your court access",
      "Subscribe for $8/mo",
      "Stay in the loop",
    ];

    const subject = pick(subjects);
    const greeting = pick(greetings);
    const openingLine = pick(openingLines);
    const valueProp = pick(valueProps);
    const ctaText = pick(ctaTexts);
    const subscribeUrl = `https://www.firstserveseattle.com/checkout?plan=monthly&email=${encodeURIComponent(email)}`;

    const greetingHtml = greeting ? `<p style="color: #374151; font-size: 16px; line-height: 26px; margin: 0 0 20px 0;">
                  ${greeting}
                </p>

                ` : '';

    return {
      subject,
      html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff; color: #111827;">
          <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff">
            <tr>
              <td style="padding: 32px; max-width: 600px;">
                ${greetingHtml}<p style="color: #374151; font-size: 16px; line-height: 26px; margin: 0 0 20px 0;">
                  ${openingLine}
                </p>

                <p style="color: #374151; font-size: 16px; line-height: 26px; margin: 0 0 24px 0;">
                  ${valueProp}
                </p>

                <table cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                  <tr>
                    <td bgcolor="#0c372b" style="border-radius: 6px;">
                      <a href="${subscribeUrl}" style="display: block; padding: 14px 28px; color: #ffffff !important; text-decoration: none; font-weight: bold; font-size: 16px;">
                        ${ctaText}
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="color: #374151; font-size: 16px; line-height: 26px; margin: 0 0 20px 0;">
                  — Ryan
                </p>

                <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                  P.S. It's just $8/mo and you can cancel anytime.
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
    };
  }
}