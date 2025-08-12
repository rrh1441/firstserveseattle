# Email Template Fix - Mobile Rendering Issue

## Problem
Email templates are showing as plain text on mobile devices but render correctly on web/desktop. This is because mobile email clients (Gmail app, Outlook mobile) are rejecting the HTML due to incompatible CSS.

## Current Issues with Templates
Located in `/lib/emails/templates.ts`:

1. **Using modern CSS that mobile doesn't support:**
   - `display: flex` and `inline-flex` 
   - `gap` property
   - CSS gradients (`linear-gradient`)
   - Advanced properties like `letter-spacing`, `box-shadow`
   - Complex nested divs instead of tables

2. **Templates affected:**
   - `purchaseConfirmation` - PARTIALLY FIXED (converted to tables)
   - `bookingConfirmation` - PARTIALLY FIXED (converted to tables)  
   - `bookingReminder` - NEEDS FIX
   - `bookingCancelled` - NEEDS FIX
   - `noSessionsWarning` - NEEDS FIX

## Solution Required
Convert all email templates to use **table-based layouts** with only basic inline CSS that works on ALL email clients.

### Mobile-Compatible HTML Requirements:
1. Use `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN">`
2. Use tables for ALL layout (no divs for structure)
3. No flexbox, no CSS Grid
4. No gradients - use solid background colors
5. Only basic inline styles
6. No border-radius on mobile-incompatible elements
7. Use `bgcolor` attribute instead of background CSS where possible
8. Keep all styles inline
9. Use standard fonts (Arial, sans-serif)

### Template Structure Pattern:
```html
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <!-- Content using nested tables -->
  </table>
</body>
</html>
```

## Other Updates Completed
- Updated `STRIPE_PRODUCT_SWINGSTICK` in `.env.local` from `prod_SqfKhYmsP8JyAv` to `prod_SqlonoRDpgKzQ0`
- Note: Also update this in Vercel deployment variables

## Files to Modify
- `/lib/emails/templates.ts` - Fix the remaining 3 templates (bookingReminder, bookingCancelled, noSessionsWarning)

## Testing
After fixing, test emails on:
- Gmail mobile app
- Outlook mobile app  
- Apple Mail on iPhone
- Any Android email client

The templates should show formatted HTML, not plain text.