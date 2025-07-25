import { logEvent, LogMetadata } from '@/lib/logEvent';

// GTM dataLayer interface
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

/**
 * Enhanced event logging that sends to both Supabase (detailed analytics) 
 * and GTM dataLayer (marketing optimization)
 */
export async function enhancedLogEvent(
  event: string,
  metadata: LogMetadata = {},
): Promise<void> {
  // Continue sending detailed events to Supabase
  await logEvent(event, metadata);
  
  // Also send simplified marketing events to GTM dataLayer
  pushToDataLayer(event, metadata);
}

/**
 * Push marketing-focused events to GTM dataLayer for ad platform optimization
 */
function pushToDataLayer(event: string, metadata: LogMetadata): void {
  if (typeof window === 'undefined') return;
  
  window.dataLayer = window.dataLayer || [];
  
  // Map your sophisticated events to standard marketing events
  const marketingEvent = mapToMarketingEvent(event, metadata);
  
  if (marketingEvent) {
    window.dataLayer.push(marketingEvent);
  }
}

/**
 * Map your detailed business events to marketing-focused dataLayer events
 */
function mapToMarketingEvent(event: string, metadata: LogMetadata): Record<string, unknown> | null {
  const baseData = {
    user_id: metadata.userId,
    session_id: metadata.sessionId,
    visitor_type: getVisitorType(metadata),
  };

  switch (event) {
    // Key conversion events for ad optimization
    case 'enhanced_visit':
      return {
        event: 'page_view',
        page_location: window.location.href,
        page_path: metadata.pathname,
        user_journey_stage: metadata.userJourneyStage,
        conversion_intent: getIntentScore(metadata),
        ...baseData,
      };

    case 'filter_applied':
      return {
        event: 'search',
        search_term: JSON.stringify(metadata.activeFilters),
        high_intent: metadata.isHighIntentFilter,
        user_journey_stage: 'engaged',
        filter_count: metadata.filterCount,
        ...baseData,
      };

    case 'high_value_view_details':
    case 'high_value_expand_details':
      return {
        event: 'view_item',
        item_id: metadata.courtId?.toString(),
        item_name: metadata.courtTitle,
        content_type: 'tennis_court',
        user_journey_stage: metadata.userJourneyStage,
        engagement_depth: metadata.sessionDepth,
        ...baseData,
      };

    case 'high_value_open_maps':
    case 'high_value_get_directions':
      return {
        event: 'select_item', // High-intent action
        item_id: metadata.courtId?.toString(),
        item_name: metadata.courtTitle,
        content_type: 'tennis_court',
        user_journey_stage: 'committed',
        ready_to_play: true,
        ...baseData,
      };

    case 'paywall_reached':
      return {
        event: 'begin_checkout', // Marketing funnel equivalent
        currency: 'USD',
        value: 12.0, // Your subscription price
        user_journey_stage: 'paywall_hit',
        days_until_paywall: metadata.daysUntilPaywall,
        unique_days: metadata.uniqueDays,
        gate_group: metadata.gateGroup,
        ...baseData,
      };

    case 'subscription_completed':
      return {
        event: 'purchase', // Key conversion for ROAS
        transaction_id: metadata.transactionId,
        currency: 'USD',
        value: metadata.amount || 12.0,
        subscription_type: metadata.subscriptionType,
        gate_days: metadata.gateDays,
        ...baseData,
      };

    case 'offer_experiment':
      return {
        event: 'view_promotion',
        creative_name: metadata.offer,
        promotion_id: `${metadata.offer}_${metadata.gateDays}d`,
        promotion_name: `Gate ${metadata.gateDays} Days`,
        experiment_version: metadata.experimentVersion,
        ...baseData,
      };

    // Custom events for marketing attribution
    case 'signup':
      return {
        event: 'sign_up',
        method: metadata.method || 'email',
        user_journey_stage: 'conversion',
        ...baseData,
      };

    default:
      // For events we don't specifically map, send as custom event
      if (event.startsWith('high_value_') || event.includes('conversion')) {
        return {
          event: 'custom_conversion',
          event_name: event,
          user_journey_stage: metadata.userJourneyStage,
          conversion_intent: metadata.conversionIntent,
          ...baseData,
        };
      }
      return null;
  }
}

/**
 * Get visitor type for marketing segmentation
 */
function getVisitorType(metadata: LogMetadata): string {
  const visitNumber = metadata.visitNumber as number;
  const uniqueDays = metadata.uniqueDays as number;
  
  if (visitNumber === 1) return 'new_visitor';
  if (uniqueDays && uniqueDays >= 3) return 'regular_user';
  return 'returning_visitor';
}

/**
 * Convert your detailed conversion intent to a simple score for ads
 */
function getIntentScore(metadata: LogMetadata): number {
  const intent = metadata.conversionIntent as string;
  switch (intent) {
    case 'ready_to_play': return 4;
    case 'subscribing': return 5;
    case 'planning': return 3;
    case 'browsing': return 1;
    default: return 2;
  }
}

/**
 * Enhanced tracking classes that use the new dual-tracking system
 */
export class EnhancedFilterEventTracker {
  private static defaultFilters = {
    amenities: {
      lights: false,
      hitting_wall: false,
      pickleball_lined: false,
      ball_machine: false,
    },
    popFilter: null as string | null,
  };

  private static lastFilters = { ...this.defaultFilters };

  static trackFilterChange(amenities: Record<string, boolean>, popFilter: string | null) {
    const currentFilters = { amenities, popFilter };
    
    const isDefaultState = JSON.stringify(currentFilters) === JSON.stringify(this.defaultFilters);
    const isUnchanged = JSON.stringify(currentFilters) === JSON.stringify(this.lastFilters);
    
    if (isDefaultState || isUnchanged) return;

    const intent = this.getConversionIntent(amenities, popFilter);
    const stage = this.getUserJourneyStage(amenities, popFilter);
    
    const activeFilters = Object.entries(amenities)
      .filter(([, active]) => active)
      .map(([filter]) => filter);

    // Use enhanced logging for dual tracking
    enhancedLogEvent('filter_applied', {
      activeFilters,
      popFilter,
      intent,
      stage,
      filterCount: activeFilters.length + (popFilter ? 1 : 0),
      isHighIntentFilter: this.isHighIntentCombination(amenities, popFilter),
    });

    this.lastFilters = { 
      amenities: {
        lights: amenities.lights || false,
        hitting_wall: amenities.hitting_wall || false,
        pickleball_lined: amenities.pickleball_lined || false,
        ball_machine: amenities.ball_machine || false,
      }, 
      popFilter 
    };
  }

  private static getConversionIntent(amenities: Record<string, boolean>, popFilter: string | null) {
    const activeCount = Object.values(amenities).filter(Boolean).length;
    
    if (activeCount === 0 && !popFilter) return 'browsing';
    if (activeCount >= 2 || popFilter === 'walk') return 'ready_to_play';
    if (activeCount === 1 || popFilter) return 'planning';
    return 'browsing';
  }

  private static getUserJourneyStage(amenities: Record<string, boolean>, popFilter: string | null) {
    const hasSpecificNeeds = Object.values(amenities).some(Boolean) || popFilter;
    return hasSpecificNeeds ? 'engaged' : 'discovery';
  }

  private static isHighIntentCombination(amenities: Record<string, boolean>, popFilter: string | null): boolean {
    return amenities.lights && popFilter === 'walk' || 
           amenities.ball_machine || 
           (Object.values(amenities).filter(Boolean).length >= 2);
  }
}

/**
 * Quick setup function to add GTM to your site
 */
export function initializeGTM(gtmId: string) {
  if (typeof window === 'undefined') return;
  
  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  
  // Add GTM script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
  document.head.appendChild(script);
  
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js'
  });
}