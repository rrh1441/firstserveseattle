# Enhanced Marketing Tracking Setup

## Overview

Your new enhanced tracking system provides:
- **Existing Supabase tracking** (unchanged) - detailed business intelligence, unlimited storage
- **New GTM dataLayer integration** - marketing attribution, ad platform optimization, GA4 funnels

## Quick Start

### 1. Add GTM to your Next.js app

Add to `src/app/layout.tsx`:

```tsx
import { initializeGTM } from '@/lib/enhancedLogEvent';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Replace with your GTM ID
    initializeGTM('GTM-XXXXXXX');
  }, []);

  return (
    <html>
      {/* Your existing layout */}
    </html>
  );
}
```

### 2. Replace logEvent imports with enhancedLogEvent

**Before:**
```tsx
import { logEvent } from '@/lib/logEvent';

// Only goes to Supabase
logEvent('signup', { method: 'email' });
```

**After:**
```tsx
import { enhancedLogEvent } from '@/lib/enhancedLogEvent';

// Goes to both Supabase AND GTM dataLayer
enhancedLogEvent('signup', { method: 'email' });
```

### 3. Key Marketing Events You'll Get

Your sophisticated events now automatically push to GTM as:

| Your Event | GTM Event | Purpose |
|------------|-----------|---------|
| `enhanced_visit` → | `page_view` | Page tracking, GA4 funnels |
| `filter_applied` → | `search` | Search intent for ads |
| `high_value_view_details` → | `view_item` | Product interest |
| `high_value_open_maps` → | `select_item` | High-intent action |
| `paywall_reached` → | `begin_checkout` | Conversion funnel |
| `subscription_completed` → | `purchase` | Revenue tracking (ROAS) |

## Marketing Benefits

### Ad Platform Optimization
- **Facebook Ads**: Receives `purchase` events to optimize for subscribers
- **Google Ads**: Gets conversion data to improve targeting
- **Better attribution**: Cross-device tracking via GTM

### GA4 Integration
- **Marketing funnels**: page_view → search → view_item → begin_checkout → purchase  
- **Acquisition reports**: Organic vs paid channel performance
- **User journey**: From discovery to conversion

### Unlimited Event Storage
- **Supabase**: Detailed analytics (unlimited)
- **GTM**: Marketing events (no 250-event limit)

## Implementation Example

Here's how to update your existing components:

```tsx
// Before: src/components/SomeComponent.tsx
import { FilterEventTracker } from '@/lib/eventLogging';

// After: Enhanced version
import { EnhancedFilterEventTracker } from '@/lib/enhancedLogEvent';

function MyComponent() {
  const handleFilterChange = (amenities, popFilter) => {
    // This now sends to both Supabase AND GTM dataLayer
    EnhancedFilterEventTracker.trackFilterChange(amenities, popFilter);
  };
}
```

## GTM Container Setup

In your GTM container, create:

### Variables
- `User ID` = `{{dataLayer - user_id}}`
- `Journey Stage` = `{{dataLayer - user_journey_stage}}`
- `Intent Score` = `{{dataLayer - conversion_intent}}`

### Triggers
- **High Intent Search**: `search` event + `high_intent` = true
- **Ready to Play**: `select_item` event + `ready_to_play` = true  
- **Subscription**: `purchase` event

### Tags
- **Facebook Pixel**: Send `Purchase` events with value
- **Google Ads**: Send conversions for ROAS optimization
- **GA4**: Enhanced e-commerce tracking

## A/B Testing Integration

Your existing A/B testing now flows to marketing:

```tsx
enhancedLogEvent('offer_experiment', {
  offer: 'early_bird_50',
  gateDays: 3,
  experimentVersion: '2024_q2'
});

// GTM receives:
// event: 'view_promotion'  
// promotion_id: 'early_bird_50_3d'
// promotion_name: 'Gate 3 Days'
```

## Next Steps

1. **Get GTM ID** from Google Tag Manager
2. **Add GTM script** to your layout
3. **Replace logEvent imports** with enhancedLogEvent
4. **Set up conversion tracking** in Facebook/Google Ads
5. **Create GA4 funnels** using the standard e-commerce events

Your sophisticated analytics continue unchanged, but now you also get powerful marketing attribution!