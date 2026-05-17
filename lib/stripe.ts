import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is missing');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-04-10' as any,
    });
  }
  return stripeInstance;
}

// Legacy eager export for routes that already lazy-init
export const stripe = (() => {
  try {
    return getStripe();
  } catch {
    return null as any;
  }
})();
