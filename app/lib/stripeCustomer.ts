/**
 * Stripe Customer Management
 * Creates or retrieves Stripe customers by email
 */

import { getStripe } from './stripe';
import { MOCK_MODE } from './mockMode';

export async function getOrCreateStripeCustomerByEmail(email: string): Promise<{ customerId: string }> {
  // In mock mode, return a mock customer ID
  if (MOCK_MODE) {
    return { customerId: `mock_customer_${email.replace(/[^a-zA-Z0-9]/g, '_')}` };
  }

  const stripe = getStripe();

  // Search for existing customer by email
  const existingCustomers = await stripe.customers.list({
    email: email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    const customer = existingCustomers.data[0];
    // Ensure metadata exists
    if (!customer.metadata || !customer.metadata.free_report_used) {
      await stripe.customers.update(customer.id, {
        metadata: {
          ...customer.metadata,
          free_report_used: customer.metadata?.free_report_used || 'false',
        },
      });
    }
    return { customerId: customer.id };
  }

  // Create new customer
  const newCustomer = await stripe.customers.create({
    email: email,
    metadata: {
      free_report_used: 'false',
    },
  });

  return { customerId: newCustomer.id };
}

export async function getStripeCustomerMetadata(customerId: string): Promise<{ free_report_used?: string }> {
  // In mock mode, always return free report available
  if (MOCK_MODE || customerId.startsWith('mock_')) {
    return { free_report_used: 'false' };
  }

  const stripe = getStripe();
  const customer = await stripe.customers.retrieve(customerId);
  
  if (typeof customer === 'object' && !customer.deleted) {
    return customer.metadata || {};
  }
  
  return {};
}

export async function markFreeReportAsUsed(customerId: string): Promise<void> {
  // In mock mode, no-op
  if (MOCK_MODE || customerId.startsWith('mock_')) {
    return;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.retrieve(customerId);
  
  if (typeof customer === 'object' && !customer.deleted) {
    await stripe.customers.update(customerId, {
      metadata: {
        ...customer.metadata,
        free_report_used: 'true',
      },
    });
  }
}

