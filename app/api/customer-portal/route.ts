import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getOrCreateStripeCustomerByEmail } from '@/app/lib/stripeCustomer';
import { getStripe } from '@/app/lib/stripe';
import { MOCK_MODE } from '@/app/lib/mockMode';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json(
        { error: 'Please sign in to manage billing' },
        { status: 401 }
      );
    }

    // MOCK MODE: Return mock portal URL
    if (MOCK_MODE) {
      return NextResponse.json({
        url: '/generate?mock_portal=true',
      });
    }

    const { customerId } = await getOrCreateStripeCustomerByEmail(email);
    const stripe = getStripe();

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/generate`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}

