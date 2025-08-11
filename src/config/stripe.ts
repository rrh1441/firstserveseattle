// Stripe configuration with support for migration between accounts

export const stripeConfig = {
  // Feature flag to switch between accounts
  useNewAccount: process.env.USE_NEW_STRIPE_ACCOUNT === 'true',
  
  // Old Stripe account (SimpleApps)
  old: {
    secretKey: process.env.STRIPE_SECRET_KEY_OLD || process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY_OLD || process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET_OLD || process.env.STRIPE_WEBHOOK_SECRET,
    monthlyPriceId: 'price_1Qbm96KSaqiJUYkj7SWySbjU',
    annualPriceId: 'price_1QowMRKSaqiJUYkjgeqLADm4',
    fiftyPercentOffPromoCode: 'promo_1R8o3pKSaqiJUYkjLMJ3UX4z',
  },
  
  // New Stripe account (First Serve Seattle)
  new: {
    secretKey: process.env.STRIPE_SECRET_KEY_NEW!,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY_NEW!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET_NEW!,
    monthlyPriceId: process.env.STRIPE_MONTHLY_PRICE_ID_NEW!,
    annualPriceId: process.env.STRIPE_ANNUAL_PRICE_ID_NEW!,
    fiftyPercentOffPromoCode: process.env.STRIPE_FIFTY_OFF_PROMO_NEW!,
  },
  
  // Get current configuration based on feature flag
  getCurrent() {
    return this.useNewAccount ? this.new : this.old;
  },
  
  // Get price IDs for current account
  getPriceIds() {
    const config = this.getCurrent();
    return {
      monthly: config.monthlyPriceId,
      annual: config.annualPriceId,
    };
  },
  
  // Get promotion code for current account
  getPromoCode() {
    const config = this.getCurrent();
    return config.fiftyPercentOffPromoCode;
  }
};