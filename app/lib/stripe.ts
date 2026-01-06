import Stripe from 'stripe';
import { MOCK_MODE } from './mockMode';

export function getStripe(): Stripe {
  // In mock mode, return a dummy Stripe instance (won't be used)
  if (MOCK_MODE) {
    return {} as Stripe;
  }
  
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  });
}

export const PRICE_IDS = {
  BASIC: process.env.STRIPE_PRICE_ID_BASIC || '',
  PRO: process.env.STRIPE_PRICE_ID_PRO || '',
};

export const PLANS = {
  BASIC: {
    name: 'Basic',
    price: 29,
    reports: 10,
    priceId: PRICE_IDS.BASIC,
  },
  PRO: {
    name: 'Pro',
    price: 49,
    reports: 'unlimited',
    priceId: PRICE_IDS.PRO,
  },
};

