// Enhanced event logging with business impact tracking
import { logEvent } from '@/lib/logEvent';

export type UserJourneyStage = 
  | 'discovery'     // First visit, exploring
  | 'engaged'       // Using filters, searching
  | 'committed'     // Viewing details, using maps
  | 'paywall_hit'   // Hit the paywall
  | 'conversion';   // Signed up

export type ConversionIntent = 
  | 'browsing'      // Just looking
  | 'planning'      // Searching specific courts
  | 'ready_to_play' // Opening maps, getting directions
  | 'subscribing';  // In paywall flow

// Only log filter events when they're actually changed from defaults
class FilterEventTracker {
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
    
    // Check if this is actually a change from defaults or last state
    const isDefaultState = JSON.stringify(currentFilters) === JSON.stringify(this.defaultFilters);
    const isUnchanged = JSON.stringify(currentFilters) === JSON.stringify(this.lastFilters);
    
    if (isDefaultState || isUnchanged) {
      return; // Don't log default or unchanged states
    }

    // Determine user intent based on filter combination
    const intent = this.getConversionIntent(amenities, popFilter);
    const stage = this.getUserJourneyStage(amenities, popFilter);
    
    // Get active filters only (more actionable data)
    const activeFilters = Object.entries(amenities)
      .filter(([, active]) => active)
      .map(([filter]) => filter);

    logEvent('filter_applied', {
      activeFilters,
      popFilter,
      intent,
      stage,
      filterCount: activeFilters.length + (popFilter ? 1 : 0),
      // Track filter combinations that suggest serious intent
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

  private static getConversionIntent(amenities: Record<string, boolean>, popFilter: string | null): ConversionIntent {
    const activeCount = Object.values(amenities).filter(Boolean).length;
    
    if (activeCount === 0 && !popFilter) return 'browsing';
    if (activeCount >= 2 || popFilter === 'walk') return 'ready_to_play';
    if (activeCount === 1 || popFilter) return 'planning';
    return 'browsing';
  }

  private static getUserJourneyStage(amenities: Record<string, boolean>, popFilter: string | null): UserJourneyStage {
    const hasSpecificNeeds = Object.values(amenities).some(Boolean) || popFilter;
    return hasSpecificNeeds ? 'engaged' : 'discovery';
  }

  private static isHighIntentCombination(amenities: Record<string, boolean>, popFilter: string | null): boolean {
    // Combinations that suggest user is ready to play today
    return amenities.lights && popFilter === 'walk' || 
           amenities.ball_machine || 
           (Object.values(amenities).filter(Boolean).length >= 2);
  }
}

// Enhanced paywall analytics for days-based system
class PaywallAnalytics {
  static trackPaywallHit() {
    const uniqueDays = JSON.parse(localStorage.getItem('fss_days') ?? '[]').length;
    const gateDays = Number(localStorage.getItem('fss_gate') ?? 3);
    const daysUntilPaywall = Math.max(0, gateDays - uniqueDays + 1);
    
    logEvent('paywall_reached', {
      uniqueDays,
      gateDays,
      daysUntilPaywall,
      userJourneyStage: 'paywall_hit',
      // Track different gate cohorts for A/B testing
      gateGroup: this.getGateGroup(gateDays),
      // More granular timing
      isEarlyHit: uniqueDays < gateDays - 1,
      isOnTimeHit: uniqueDays === gateDays,
      isLateHit: uniqueDays > gateDays,
    });
  }

  static trackOfferExperiment(offer: string, gateDays: number) {
    logEvent('offer_experiment', {
      offer,
      gateDays,
      gateGroup: this.getGateGroup(gateDays),
      experimentVersion: '2024_q2', // Version your experiments
    });
  }

  private static getGateGroup(gateDays: number): string {
    if (gateDays <= 3) return 'strict';
    if (gateDays <= 5) return 'moderate';
    return 'permissive';
  }
}

// Track user engagement depth and conversion signals
class EngagementTracker {
  private static sessionStartTime = Date.now();
  private static actionCount = 0;

  static trackHighValueAction(action: string, courtId?: number, courtTitle?: string) {
    this.actionCount++;
    const timeOnSite = Math.round((Date.now() - this.sessionStartTime) / 1000);
    
    // Determine user journey stage based on action type
    const stage = this.getStageFromAction(action);
    const intent = this.getIntentFromAction(action, timeOnSite, this.actionCount);
    
    logEvent(`high_value_${action}`, {
      courtId,
      courtTitle,
      userJourneyStage: stage,
      conversionIntent: intent,
      sessionDepth: this.actionCount,
      timeOnSite,
      // Conversion probability indicators
      isQuickAction: timeOnSite < 30,
      isDeepEngagement: this.actionCount >= 5,
      isReadyToPlay: intent === 'ready_to_play',
    });
  }

  private static getStageFromAction(action: string): UserJourneyStage {
    if (action.includes('maps') || action.includes('directions')) return 'committed';
    if (action.includes('detail') || action.includes('expand')) return 'engaged';
    return 'discovery';
  }

  private static getIntentFromAction(action: string, timeOnSite: number, actionCount: number): ConversionIntent {
    if (action.includes('maps') || action.includes('ball_machine')) return 'ready_to_play';
    if (timeOnSite > 120 && actionCount >= 3) return 'planning';
    return 'browsing';
  }
}

// Enhanced conversion tracking with better attribution
class ConversionTracker {
  static trackVisit(pathname: string, showPaywall: boolean) {
    const uniqueDays = JSON.parse(localStorage.getItem('fss_days') ?? '[]').length;
    const gateDays = Number(localStorage.getItem('fss_gate') ?? 3);
    const visitNumber = Number(localStorage.getItem('visitNumber') ?? 0);
    
    logEvent('enhanced_visit', {
      pathname,
      showPaywall,
      uniqueDays,
      gateDays,
      visitNumber,
      daysUntilPaywall: Math.max(0, gateDays - uniqueDays),
      userJourneyStage: showPaywall ? 'paywall_hit' : 'discovery',
      // Better segmentation for analysis
      visitorType: this.getVisitorType(visitNumber, uniqueDays),
      paywalStatus: this.getPaywallStatus(uniqueDays, gateDays),
    });
  }

  private static getVisitorType(visitNumber: number, uniqueDays: number): string {
    if (visitNumber === 1) return 'new';
    if (uniqueDays >= 3) return 'regular';
    return 'returning';
  }

  private static getPaywallStatus(uniqueDays: number, gateDays: number): string {
    const remaining = gateDays - uniqueDays;
    if (remaining <= 0) return 'blocked';
    if (remaining === 1) return 'final_day';
    if (remaining <= 2) return 'approaching';
    return 'safe';
  }

  static trackOfferImpression(currentOffer: string) {
    const gateDays = Number(localStorage.getItem('fss_gate') ?? 3);
    
    logEvent('offer_impression', {
      offer: currentOffer,
      gateDays,
      timestamp: new Date().toISOString(),
      // Track for A/B test analysis
      cohort: this.getOfferCohort(),
    });
  }

  private static getOfferCohort(): string {
    // Use stable user ID for consistent cohort assignment
    const userId = localStorage.getItem('userId') ?? '';
    const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return hash % 2 === 0 ? 'control' : 'variant';
  }
}

// Export the enhanced tracking functions
export {
  FilterEventTracker,
  PaywallAnalytics,
  EngagementTracker,
  ConversionTracker,
};

// Note: For GTM-integrated event logging, use enhancedLogEvent from '@/lib/enhancedLogEvent'