'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Pricing from './components/Pricing';
import AuthButton from './components/AuthButton';

function HomeContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMockMode(process.env.NEXT_PUBLIC_MOCK_MODE === 'true');
    
    // Handle Stripe redirects (or mock mode redirects)
    if (searchParams.get('success')) {
      const sessionId = searchParams.get('session_id');
      const customerId = searchParams.get('customer_id');
      if (sessionId) {
        // Redirect to generate page after successful subscription
        window.location.href = `/generate?session_id=${sessionId}`;
      } else if (customerId) {
        // Mock mode redirect
        window.location.href = `/generate?customer_id=${customerId}`;
      }
    }
  }, [searchParams]);

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

      {/* Hero Section */}
      <div className="bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <Image
                src="/turnone-logo.png"
                alt="TurnOne"
                height={64}
                width={360}
                priority
              />
            </div>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              TurnOne turns raw session data into coach-quality racing performance reports in under a minute.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={mounted && isMockMode ? "/generate" : "#pricing"}
              className="inline-block bg-[#E10600] text-white py-4 px-8 rounded-lg font-semibold text-lg hover:bg-[#C50500] focus:ring-2 focus:ring-[#E10600] transition-colors"
            >
              {mounted && isMockMode ? 'Start Generating Reports (Mock Mode)' : 'Get Started'}
            </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Professional Reports in Minutes
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#E10600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Structured Analysis</h3>
            <p className="text-gray-600">
              Reports follow a professional structure with session overview, performance summary, and actionable recommendations.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#E10600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">PDF Export</h3>
            <p className="text-gray-600">
              Download professional PDF reports ready for sharing with drivers, coaches, and sponsors.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#E10600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast & Reliable</h3>
            <p className="text-gray-600">
              Generate comprehensive reports in seconds using advanced AI analysis of your session data.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="bg-white py-16 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Choose the plan that fits your needs
          </p>
          <Pricing />
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#E10600] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-red-100 mb-8">
            Start generating coach-quality performance reports with TurnOne today.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 text-sm text-gray-600">
            <a href="/terms" className="hover:text-[#E10600] transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-[#E10600] transition-colors">Privacy</a>
            <a href="mailto:support@stratusracing.com" className="hover:text-[#E10600] transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E10600] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
