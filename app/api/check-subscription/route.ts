import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/app/lib/stripe';
import { MOCK_MODE } from '@/app/lib/mockMode';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { isFreeProEmail } from '@/app/lib/freeAccess';
import { getStripeCustomerMetadata } from '@/app/lib/stripeCustomer';

export async function POST(request: NextRequest) {
  try {
    // Get session to check email and Stripe customer ID
    const session = await auth();
    const email = session?.user?.email;
    const stripeCustomerId = (session as any)?.stripeCustomerId;

    // Check for free Pro access first
    if (email && isFreeProEmail(email)) {
      return NextResponse.json({
        hasSubscription: true,
        plan: 'pro',
        subscriptionId: 'free_pro_access',
        isFreeAccess: true,
        stripeCustomerId: stripeCustomerId || null,
        freeReportAvailable: true,
      });
    }

    // MOCK MODE: Always return active PRO subscription
    if (MOCK_MODE) {
      return NextResponse.json({
        hasSubscription: true,
        plan: 'pro',
        subscriptionId: 'mock_subscription_pro',
        stripeCustomerId: stripeCustomerId || null,
        freeReportAvailable: true,
      });
    }

    const { customerId } = await request.json();
    const finalCustomerId = customerId || stripeCustomerId;

    if (!finalCustomerId) {
      // If no customer ID, check if user has free report available
      // For new users without Stripe customer yet, allow free report
      return NextResponse.json({
        hasSubscription: false,
        plan: null,
        stripeCustomerId: null,
        freeReportAvailable: true,
      });
    }

    const stripe = getStripe();
    
    // Check for active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: finalCustomerId,
      status: 'active',
      limit: 1,
    });

    const hasActiveSubscription = subscriptions.data.length > 0;

    if (hasActiveSubscription) {
      const subscription = subscriptions.data[0];
      const priceId = subscription.items.data[0]?.price.id;
      
      let plan: 'basic' | 'pro' | null = null;
      if (priceId === process.env.STRIPE_PRICE_ID_BASIC) {
        plan = 'basic';
      } else if (priceId === process.env.STRIPE_PRICE_ID_PRO) {
        plan = 'pro';
      }
      
      return NextResponse.json({
        hasSubscription: true,
        plan: plan,
        subscriptionId: subscription.id,
        stripeCustomerId: finalCustomerId,
        freeReportAvailable: true, // Subscribed users always have access
      });
    }

    // No subscription - check if free report is available
    const metadata = await getStripeCustomerMetadata(finalCustomerId);
    const freeReportUsed = metadata.free_report_used === 'true';
    const freeReportAvailable = !freeReportUsed;

    return NextResponse.json({
      hasSubscription: false,
      plan: null,
      stripeCustomerId: finalCustomerId,
      freeReportAvailable: freeReportAvailable,
    });
  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json({
      hasSubscription: false,
      plan: null,
      stripeCustomerId: null,
      freeReportAvailable: false,
    });
  }
}

