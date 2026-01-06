'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import SessionForm from '../components/SessionForm';
import ReportDisplay from '../components/ReportDisplay';
import AuthButton from '../components/AuthButton';

interface SessionData {
  driver_name: string;
  car: string;
  track: string;
  session_type: string;
  conditions: string;
  best_lap: string;
  avg_lap: string;
  consistency: string;
  driver_notes: string;
}

function GenerateContent() {
  const [report, setReport] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [reportCount, setReportCount] = useState<{ count: number; limit: number } | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);
  const [hasFreeAccess, setHasFreeAccess] = useState(false);
  const [freeReportAvailable, setFreeReportAvailable] = useState<boolean | null>(null);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [reportHistory, setReportHistory] = useState<any[]>([]);
  const { data: session } = useSession();
  const searchParams = useSearchParams();


  const checkSubscription = async (sessionIdOrCustomerId: string) => {
    try {
      // If it's a customer_id (mock mode), check directly
      if (sessionIdOrCustomerId.startsWith('mock_') || sessionIdOrCustomerId.startsWith('cus_')) {
        const response = await fetch('/api/check-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: sessionIdOrCustomerId }),
        });

      const data = await response.json();
      setHasSubscription(data.hasSubscription);
      setSubscriptionPlan(data.plan || null);
      setFreeReportAvailable(data.freeReportAvailable ?? null);
      setStripeCustomerId(data.stripeCustomerId || null);

      // Check report count if subscription is active
      if (data.hasSubscription && data.plan) {
        const countResponse = await fetch('/api/track-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: sessionIdOrCustomerId, plan: data.plan, action: 'check' }),
        });
        const countData = await countResponse.json();
        setReportCount({ count: countData.count || 0, limit: countData.limit || Infinity });
      }
      setCheckingSubscription(false);
      return;
      }

      // Otherwise, get customer ID from session
      const sessionResponse = await fetch('/api/get-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionIdOrCustomerId }),
      });

      if (!sessionResponse.ok) {
        setHasSubscription(false);
        setCheckingSubscription(false);
        return;
      }

      const sessionData = await sessionResponse.json();
      const customerId = sessionData.customerId;

      if (!customerId) {
        setHasSubscription(false);
        setCheckingSubscription(false);
        return;
      }

      // Check subscription status
      const response = await fetch('/api/check-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });

      const data = await response.json();
      setHasSubscription(data.hasSubscription);
      setSubscriptionPlan(data.plan || null);
      setFreeReportAvailable(data.freeReportAvailable ?? null);
      setStripeCustomerId(data.stripeCustomerId || null);

      // Check report count if subscription is active
      if (data.hasSubscription && data.plan) {
        const countResponse = await fetch('/api/track-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId, plan: data.plan, action: 'check' }),
        });
        const countData = await countResponse.json();
        setReportCount({ count: countData.count || 0, limit: countData.limit || Infinity });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setHasSubscription(false);
    } finally {
      setCheckingSubscription(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const mockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
    setIsMockMode(mockMode);
    
    // Load report history from localStorage
    try {
      const historyKey = 'turnone_report_history_v1';
      const stored = localStorage.getItem(historyKey);
      if (stored) {
        setReportHistory(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Error loading history:', err);
    }
    
    // Check for free access
    const checkFreeAccess = async () => {
      try {
        const response = await fetch('/api/check-free-access');
        const data = await response.json();
        if (data.hasFreeAccess) {
          setHasFreeAccess(true);
          setHasSubscription(true);
          setSubscriptionPlan('pro');
          setReportCount({ count: 0, limit: Infinity });
          setCheckingSubscription(false);
          return true;
        }
      } catch (error) {
        console.error('Error checking free access:', error);
      }
      return false;
    };

    // Check free access first
    checkFreeAccess().then((hasAccess) => {
      if (hasAccess) {
        setFreeReportAvailable(true);
        return;
      }

      // MOCK MODE: Auto-approve subscription
      if (mockMode) {
        setHasSubscription(true);
        setSubscriptionPlan('pro');
        setReportCount({ count: 0, limit: Infinity });
        setFreeReportAvailable(true);
        setCheckingSubscription(false);
        return;
      }

      // Check subscription status - use session's Stripe customer ID if available
      const sessionStripeCustomerId = (session as any)?.stripeCustomerId;
      
      if (sessionStripeCustomerId) {
        // Check subscription using session's Stripe customer ID
        checkSubscription(sessionStripeCustomerId);
      } else {
        // Fallback to URL params for legacy flow
        const sessionId = searchParams.get('session_id');
        const customerId = searchParams.get('customer_id');
        
        if (sessionId) {
          checkSubscription(sessionId);
        } else if (customerId) {
          checkSubscription(customerId);
        } else if (session?.user?.email) {
          // User is signed in but no Stripe customer yet - allow free report
          setHasSubscription(false);
          setFreeReportAvailable(true);
          setCheckingSubscription(false);
        } else {
          // Not signed in - require sign in
          setHasSubscription(false);
          setFreeReportAvailable(false);
          setCheckingSubscription(false);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, session]);

  const handleSubmit = async (data: SessionData) => {
    // Check if user can generate (subscription, free access, or free report available)
    if (!hasSubscription && !isMockMode && !hasFreeAccess && freeReportAvailable !== true) {
      setError('Please subscribe to generate reports');
      return;
    }

    // Customer ID is now always derived from session, no URL params needed
    // The API route will handle getting/creating the Stripe customer

    // Check report limit before generating
    if (subscriptionPlan && reportCount) {
      if (reportCount.count >= reportCount.limit) {
        setError(`You've reached your monthly limit of ${reportCount.limit} reports. Please upgrade to Pro for unlimited reports.`);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate report
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.error || 'Failed to generate report. Please try again.';
        
        // Handle specific error codes
        if (response.status === 401) {
          errorMessage = 'Please sign in to continue.';
        } else if (response.status === 402) {
          // Payment required - free report used or quota exceeded
          setFreeReportAvailable(false);
          // Refresh subscription status
          if (stripeCustomerId) {
            checkSubscription(stripeCustomerId);
          }
          // Don't change error message - it's already specific
        } else if (response.status === 429) {
          errorMessage = 'Too many requests. Please wait a few minutes and try again.';
        } else if (response.status === 500) {
          errorMessage = 'Something went wrong. Please try again.';
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Refresh subscription status to update counts
      if (session?.user?.email && stripeCustomerId) {
        checkSubscription(stripeCustomerId);
      }
      
      // Update local history
      try {
        const historyKey = 'turnone_report_history_v1';
        const existing = localStorage.getItem(historyKey);
        const history = existing ? JSON.parse(existing) : [];
        
        const newEntry = {
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          driver: data.driver_name,
          track: data.track,
          car: data.car,
          reportText: result.report,
        };
        
        history.unshift(newEntry);
        const trimmed = history.slice(0, 5);
        localStorage.setItem(historyKey, JSON.stringify(trimmed));
        setReportHistory(trimmed);
      } catch (err) {
        console.error('Error saving to history:', err);
      }

      setReport(result.report);
      setSessionData(result.sessionData);
      
      // Save to local history
      try {
        const historyKey = 'turnone_report_history_v1';
        const existing = localStorage.getItem(historyKey);
        const history = existing ? JSON.parse(existing) : [];
        
        const newEntry = {
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          driver: data.driver_name,
          track: data.track,
          car: data.car,
          reportText: result.report,
        };
        
        history.unshift(newEntry);
        // Keep only last 5
        const trimmed = history.slice(0, 5);
        localStorage.setItem(historyKey, JSON.stringify(trimmed));
        setReportHistory(trimmed);
      } catch (err) {
        console.error('Error saving to history:', err);
      }
      
      // Scroll to report
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setReport(null);
    setSessionData(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (checkingSubscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E10600] mx-auto mb-4"></div>
          <p className="text-gray-600">Checking subscription...</p>
        </div>
      </div>
    );
  }

  // Not signed in
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-6">
            Sign in to generate your free report.
          </p>
          <AuthButton />
        </div>
      </div>
    );
  }

  // Signed in but no subscription and no free report available
  if (!hasSubscription && freeReportAvailable === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Free Report Used</h2>
          <p className="text-gray-600 mb-6">
            You've used your free report. Subscribe to generate more reports.
          </p>
          <a
            href="/#pricing"
            className="inline-block bg-[#E10600] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#C50500] focus:ring-2 focus:ring-[#E10600] transition-colors"
          >
            View Pricing
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/turnone-logo.png"
              alt="TurnOne"
              height={32}
              width={180}
              priority
            />
          </Link>
          <AuthButton />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Generate Performance Report
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Enter your session data to generate a professional report
          </p>
          {mounted && isMockMode && (
            <div className="inline-block px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
              <p className="text-sm text-yellow-800">
                🧪 <strong>Mock Mode Active</strong> - Using sample data (no API keys required)
              </p>
            </div>
          )}
          {mounted && hasFreeAccess && (
            <div className="inline-block px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                <strong>Access: Free Pro</strong>
              </p>
            </div>
          )}
          {mounted && !hasFreeAccess && !hasSubscription && freeReportAvailable === true && (
            <div className="inline-block px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                <strong>Free report available: 1</strong>
              </p>
            </div>
          )}
          {mounted && !hasFreeAccess && !hasSubscription && freeReportAvailable === false && (
            <div className="inline-block px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg mb-4">
              <p className="text-sm text-gray-700">
                <strong>Free report used — subscribe to generate more</strong>
              </p>
            </div>
          )}
          {mounted && reportCount && subscriptionPlan && (
            <div className="inline-block px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-gray-700">
                {subscriptionPlan === 'basic' ? (
                  <>Reports this month: <span className="font-semibold">{reportCount.count} / {reportCount.limit}</span></>
                ) : (
                  <>Unlimited reports - <span className="font-semibold">{reportCount.count}</span> generated this month</>
                )}
              </p>
            </div>
          )}
          {mounted && (hasSubscription || hasFreeAccess) && (
            <div className="mt-4">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/customer-portal', {
                      method: 'POST',
                    });
                    const data = await response.json();
                    if (data.url) {
                      window.location.href = data.url;
                    }
                  } catch (error) {
                    console.error('Error opening customer portal:', error);
                    alert('Failed to open billing portal. Please try again.');
                  }
                }}
                className="text-sm text-[#E10600] hover:text-[#C50500] underline"
              >
                Manage Billing
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {!report ? (
          <>
            {mounted && reportHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Reports</h3>
                  <button
                    onClick={() => {
                      localStorage.removeItem('turnone_report_history_v1');
                      setReportHistory([]);
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Clear history
                  </button>
                </div>
                <div className="space-y-2">
                  {reportHistory.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setReport(item.reportText);
                        setSessionData({
                          driver_name: item.driver,
                          track: item.track,
                          car: item.car,
                          session_type: 'Practice',
                          conditions: '',
                          best_lap: '',
                          avg_lap: '',
                          consistency: '',
                          driver_notes: '',
                        });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-[#E10600] hover:bg-red-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{item.driver}</div>
                      <div className="text-sm text-gray-600">{item.track} • {item.car}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <SessionForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 text-center">
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-[#E10600] text-white rounded-lg hover:bg-[#C50500] focus:ring-2 focus:ring-[#E10600] transition-colors font-medium"
              >
                Generate New Report
              </button>
            </div>
            <ReportDisplay report={report} sessionData={sessionData!} />
          </>
        )}
      </div>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E10600] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <GenerateContent />
    </Suspense>
  );
}
