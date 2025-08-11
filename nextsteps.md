# Next Steps - Email Template Update

## Current Status
The First Serve Seattle subscription service now has dual Stripe account support with automated emails via Resend. The welcome email template needs a final update to remove the tips section that was based on incorrect assumptions about the data.

## Required Change
Remove the "Quick Tips" section from the welcome email since we don't have hourly court availability data to provide accurate tips about best times to find courts.

## File to Update
`/Users/ryanheger/firstserveseattle/src/lib/resend/templates.ts`

### Current Tips Section to Remove (lines ~97-111):
```html
<!-- Tips Section -->
<div style="padding: 32px; background-color: #fef3c7; border-top: 1px solid #fde68a;">
  <div style="text-align: left; max-width: 500px;">
    <h4 style="color: #92400e; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">
      💡 Quick Tips
    </h4>
    <ul style="color: #92400e; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
      <li>Bookmark <a href="https://firstserveseattle.com/login" style="color: #92400e; text-decoration: underline;">firstserveseattle.com/login</a> for quick access</li>
      <li>Check courts early morning (6-8am) for best availability</li>
      <li>Weekday afternoons typically have more open courts</li>
      <li>You can cancel or change your plan anytime from the billing portal</li>
    </ul>
  </div>
</div>
```

### Replace With Simpler Section:
```html
<!-- Quick Access Reminder -->
<div style="padding: 32px; background-color: #fef3c7; border-top: 1px solid #fde68a;">
  <div style="text-align: left; max-width: 500px;">
    <h4 style="color: #92400e; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">
      💡 Quick Access
    </h4>
    <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
      Bookmark <a href="https://firstserveseattle.com/login" style="color: #92400e; text-decoration: underline;">firstserveseattle.com/login</a> for quick access to court availability. You can manage or cancel your subscription anytime from the billing portal.
    </p>
  </div>
</div>
```

## Testing After Update
1. Commit and push the change
2. Wait for Vercel deployment
3. Test a new signup with `USE_NEW_STRIPE_ACCOUNT=TRUE` 
4. Verify welcome email arrives with:
   - Correct First Serve Seattle branding
   - Service description about real-time court availability
   - Login link to `/login`
   - Billing portal link to `/billing`
   - NO specific tips about best times (since we don't have that data)

## Current Environment Variables in Vercel
- `USE_NEW_STRIPE_ACCOUNT=TRUE` (note: uppercase TRUE)
- All new Stripe keys are configured
- `RESEND_API_KEY` is configured

## Important Context
- The `tennis_courts_history` table stores court information snapshots but NOT real-time availability counts
- The `available_dates` field shows when courts are open (e.g., "06:00:00-23:00:00") but not how many are free
- We cannot provide data-driven tips about best times without proper availability tracking data
- The system is set up to run both old and new Stripe accounts simultaneously for gradual migration