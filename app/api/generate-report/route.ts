import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { REPORT_SYSTEM_PROMPT, buildUserPrompt } from '@/app/lib/prompts';
import { MOCK_MODE, generateMockReport } from '@/app/lib/mockMode';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { isFreeProEmail } from '@/app/lib/freeAccess';
import { getStripeCustomerMetadata, markFreeReportAsUsed, getOrCreateStripeCustomerByEmail } from '@/app/lib/stripeCustomer';
import { getStripe } from '@/app/lib/stripe';
import { rateLimit, getClientIP } from '@/app/lib/rateLimit';

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY && !MOCK_MODE) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
  });
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const session = await auth();
    const email = session?.user?.email;
    const rateLimitKey = email || getClientIP(request);
    
    if (!rateLimit(rateLimitKey, 5, 10 * 60 * 1000)) {
      console.log('[Analytics] Rate limit exceeded:', { email: email || 'anonymous', ip: !email ? rateLimitKey : undefined });
      return NextResponse.json(
        { error: 'Too many requests. Please wait a few minutes and try again.' },
        { status: 429 }
      );
    }

    // Require signed-in session
    if (!email) {
      return NextResponse.json(
        { error: 'Please sign in to generate reports' },
        { status: 401 }
      );
    }

    const stripeCustomerId = (session as any)?.stripeCustomerId;

    // Check entitlements
    let canGenerate = false;
    let isFreeReport = false;
    let finalStripeCustomerId = stripeCustomerId;
    let subscriptionPlan: 'basic' | 'pro' | null = null;
    let currentPeriodStart: number | null = null;

    // Free Pro access emails bypass all checks
    if (isFreeProEmail(email)) {
      canGenerate = true;
      subscriptionPlan = 'pro';
    } else if (MOCK_MODE) {
      // Mock mode allows generation
      canGenerate = true;
      subscriptionPlan = 'pro';
    } else {
      // Get or create Stripe customer if needed
      if (!finalStripeCustomerId) {
        const { customerId } = await getOrCreateStripeCustomerByEmail(email);
        finalStripeCustomerId = customerId;
      }

      // Check subscription status
      const stripe = getStripe();
      const subscriptions = await stripe.subscriptions.list({
        customer: finalStripeCustomerId,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        // Has active subscription
        const subscription = subscriptions.data[0];
        currentPeriodStart = (subscription as any).current_period_start || null;
        
        // Determine plan type
        const priceId = subscription.items.data[0]?.price.id;
        if (priceId === process.env.STRIPE_PRICE_ID_BASIC) {
          subscriptionPlan = 'basic';
        } else if (priceId === process.env.STRIPE_PRICE_ID_PRO) {
          subscriptionPlan = 'pro';
        }
        
        // Pro plan: unlimited
        if (subscriptionPlan === 'pro') {
          canGenerate = true;
        } else if (subscriptionPlan === 'basic') {
          // Basic plan: check quota
          const customer = await stripe.customers.retrieve(finalStripeCustomerId);
          if (typeof customer === 'object' && !customer.deleted) {
            const metadata = customer.metadata || {};
            const storedPeriodStart = metadata.usage_period_start 
              ? parseInt(metadata.usage_period_start, 10) 
              : null;
            const usageCount = metadata.usage_count 
              ? parseInt(metadata.usage_count, 10) 
              : 0;

            // Reset if period changed
            if (currentPeriodStart !== null && storedPeriodStart !== currentPeriodStart) {
              await stripe.customers.update(finalStripeCustomerId, {
                metadata: {
                  ...metadata,
                  usage_period_start: currentPeriodStart.toString(),
                  usage_count: '0',
                },
              });
              canGenerate = true;
            } else if (usageCount >= 10) {
              // Quota exceeded
              console.log('[Analytics] Basic plan quota exceeded:', { email, customerId: finalStripeCustomerId });
              return NextResponse.json(
                { error: 'Basic plan limit reached (10 reports this billing period). Upgrade to Pro for unlimited.' },
                { status: 402 }
              );
            } else {
              canGenerate = true;
            }
          }
        }
      } else {
        // No subscription - check if free report is available
        const metadata = await getStripeCustomerMetadata(finalStripeCustomerId);
        const freeReportUsed = metadata.free_report_used === 'true';
        
        if (!freeReportUsed) {
          canGenerate = true;
          isFreeReport = true;
        }
      }
    }

    if (!canGenerate) {
      return NextResponse.json(
        { error: "You've used your free report. Subscribe to generate more." },
        { status: 402 }
      );
    }

    const sessionData = await request.json();

    // Validate required fields
    const required = ['driver_name', 'car', 'track', 'session_type', 'conditions', 'best_lap', 'avg_lap'];
    for (const field of required) {
      if (!sessionData[field] || sessionData[field].trim() === '') {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // MOCK MODE: Return mock report immediately
    if (MOCK_MODE) {
      // Simulate API delay for realism
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockReport = generateMockReport(sessionData);
      return NextResponse.json({ report: mockReport, sessionData });
    }

    const userPrompt = buildUserPrompt(sessionData);
    const openai = getOpenAI();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: REPORT_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 1200,
    });

    const report = completion.choices[0]?.message?.content;

    if (!report) {
      return NextResponse.json(
        { error: 'Failed to generate report. Please try again.' },
        { status: 500 }
      );
    }

    // Validate report structure - ensure all 6 sections are present
    const requiredSections = [
      'Session Overview',
      'Performance Summary',
      'Key Observations',
      'Time Gain Opportunities',
      'Recommendations for Next Session',
      'Target Goals for Next Session'
    ];

    const reportLower = report.toLowerCase();
    const missingSections = requiredSections.filter(
      section => !reportLower.includes(section.toLowerCase())
    );

    if (missingSections.length > 0) {
      console.warn('Report missing sections:', missingSections);
      // Still return the report but log the warning
    }

    // Ensure report length is reasonable (400-700 words)
    const wordCount = report.split(/\s+/).length;
    if (wordCount < 300 || wordCount > 800) {
      console.warn(`Report word count (${wordCount}) outside expected range (400-700)`);
    }

    // Update usage tracking after successful report generation
    if (finalStripeCustomerId && !isFreeProEmail(email) && !MOCK_MODE) {
      const stripe = getStripe();
      
      if (isFreeReport) {
        // Mark free report as used
        try {
          await markFreeReportAsUsed(finalStripeCustomerId);
        } catch (error) {
          console.error('Error marking free report as used:', error);
        }
      } else if (subscriptionPlan === 'basic' && currentPeriodStart !== null) {
        // Increment Basic plan usage count
        try {
          const customer = await stripe.customers.retrieve(finalStripeCustomerId);
          if (typeof customer === 'object' && !customer.deleted) {
            const metadata = customer.metadata || {};
            const currentCount = metadata.usage_count 
              ? parseInt(metadata.usage_count, 10) 
              : 0;
            
            await stripe.customers.update(finalStripeCustomerId, {
              metadata: {
                ...metadata,
                usage_period_start: currentPeriodStart.toString(),
                usage_count: (currentCount + 1).toString(),
              },
            });
          }
        } catch (error) {
          console.error('Error updating usage count:', error);
          // Don't fail the request if metadata update fails
        }
      }
    }

    // Log analytics
    console.log('[Analytics] Report generated:', {
      email,
      plan: subscriptionPlan || (isFreeReport ? 'free' : 'none'),
      customerId: finalStripeCustomerId || 'none',
    });

    return NextResponse.json({ report, sessionData });
  } catch (error) {
    console.error('Error generating report:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('OPENAI_API_KEY')) {
        return NextResponse.json(
          { error: 'OPENAI_API_KEY is not set' },
          { status: 500 }
        );
      }
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Configuration error. Please contact support.' },
          { status: 500 }
        );
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Service temporarily unavailable. Please try again in a moment.' },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to generate report. Please check your input and try again.' },
      { status: 500 }
    );
  }
}

