import { NextRequest, NextResponse } from 'next/server';
import { getStripe, PLANS } from '@/app/lib/stripe';
import { MOCK_MODE } from '@/app/lib/mockMode';

export async function POST(request: NextRequest) {
  try {
    const { plan } = await request.json();

    if (plan !== 'basic' && plan !== 'pro') {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // MOCK MODE: Bypass Stripe, redirect immediately with mock customer ID
    if (MOCK_MODE) {
      const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      return NextResponse.json({
        sessionId: 'mock_session',
        url: `${baseUrl}/?success=true&customer_id=mock_customer_pro`,
      });
    }

    const selectedPlan = plan === 'basic' ? PLANS.BASIC : PLANS.PRO;
    const stripe = getStripe();

    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_BASE_URL is not set' },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?canceled=true`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

