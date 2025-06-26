// Offer experiment management and tracking
import { ConversionTracker, PaywallAnalytics } from '@/lib/eventLogging';
import { logEvent } from '@/lib/logEvent';

export interface OfferConfig {
  id: string;
  name: string;
  freeTrialDays: number;
  discount?: {
    percentage: number;
    duration: string; // e.g., "first_month", "first_3_months"
  };
  trialType: 'anonymous_views' | 'full_trial';
  description: string;
}

export const OFFERS: Record<string, OfferConfig> = {
  // Current experimental offers
  
  FIFTY_PERCENT_OFF_FIRST_MONTH: {
    id: 'fifty_percent_off_first_month',
    name: '50% Off First Month',
    freeTrialDays: 0,
    discount: {
      percentage: 50,
      duration: 'first_month',
    },
    trialType: 'full_trial',
    description: 'Get 50% off your first month when you subscribe',
  },
  
  THREE_DAY_TRIAL: {
    id: 'three_day_trial',
    name: '3 Free Anonymous Views',
    freeTrialDays: 3,
    trialType: 'anonymous_views',
    description: 'Get 3 free days of court access, then subscribe for unlimited access.',
  },
  
};

class OfferExperimentManager {
  private static COHORT_KEY = 'offer_cohort_assignment';

  // Assign user to an offer cohort
  static assignOfferCohort(): OfferConfig {
    // Check if user already has an assignment
    const existingCohort = localStorage.getItem(this.COHORT_KEY);
    if (existingCohort && OFFERS[existingCohort]) {
      return OFFERS[existingCohort];
    }

    // Assign new cohort based on current experiment
    const currentExperiment = this.getCurrentExperiment();
    const assignedOffer = this.selectOfferForUser(currentExperiment);
    
    // Store assignment persistently
    localStorage.setItem(this.COHORT_KEY, assignedOffer.id);
    
    // Track the assignment
    PaywallAnalytics.trackOfferExperiment(assignedOffer.id, assignedOffer.freeTrialDays);
    
    logEvent('offer_cohort_assigned', {
      offerId: assignedOffer.id,
      offerName: assignedOffer.name,
      experiment: currentExperiment,
      freeTrialDays: assignedOffer.freeTrialDays,
      hasDiscount: !!assignedOffer.discount,
      trialType: assignedOffer.trialType,
    });

    return assignedOffer;
  }

  // Get the current running experiment
  private static getCurrentExperiment(): string {
    // You can change this to switch experiments
    return 'q2_2024_five_days_vs_trial'; // Current experiment name
  }

  // Select offer based on experiment and user
  private static selectOfferForUser(experiment: string): OfferConfig {
    switch (experiment) {
      case 'q2_2024_five_days_vs_trial':
        // All users get 50% off first month
        return OFFERS.FIFTY_PERCENT_OFF_FIRST_MONTH;
        
      case 'gate_days_experiment':
        // All users get 3 days now
        return OFFERS.THREE_DAY_TRIAL;
        
      default:
        return OFFERS.FIFTY_PERCENT_OFF_FIRST_MONTH; // Default fallback
    }
  }

  // Track offer impression when paywall is shown
  static trackOfferImpression() {
    const assignedOffer = this.assignOfferCohort();
    ConversionTracker.trackOfferImpression(assignedOffer.id);
    
    logEvent('offer_impression', {
      offerId: assignedOffer.id,
      offerName: assignedOffer.name,
      context: 'paywall_shown',
      uniqueDays: JSON.parse(localStorage.getItem('fss_days') ?? '[]').length,
      gateDays: Number(localStorage.getItem('fss_gate') ?? 3),
    });
  }

  // Track conversion funnel for offers
  static trackOfferConversion(stage: 'click_cta' | 'start_checkout' | 'complete_signup', planType?: string) {
    const assignedOffer = this.getAssignedOffer();
    if (!assignedOffer) return;

    logEvent('offer_conversion_funnel', {
      stage,
      offerId: assignedOffer.id,
      offerName: assignedOffer.name,
      planType,
      freeTrialDays: assignedOffer.freeTrialDays,
      hasDiscount: !!assignedOffer.discount,
      discountPercentage: assignedOffer.discount?.percentage,
      timestamp: new Date().toISOString(),
    });
  }

  // Get the user's assigned offer
  static getAssignedOffer(): OfferConfig | null {
    const cohortId = localStorage.getItem(this.COHORT_KEY);
    return cohortId && OFFERS[cohortId] ? OFFERS[cohortId] : null;
  }

  // Analytics helper: Get conversion metrics for experiments
  static getExperimentMetrics() {
    // This would typically query your analytics database
    // For now, just return the current user's assignment for debugging
    const assignedOffer = this.getAssignedOffer();
    const uniqueDays = JSON.parse(localStorage.getItem('fss_days') ?? '[]').length;
    const gateDays = Number(localStorage.getItem('fss_gate') ?? 3);
    
    return {
      currentOffer: assignedOffer,
      progressToPaywall: uniqueDays / gateDays,
      daysRemaining: Math.max(0, gateDays - uniqueDays),
      hasReachedPaywall: uniqueDays >= gateDays,
    };
  }
}

export { OfferExperimentManager }; 