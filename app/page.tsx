'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMockMode(process.env.NEXT_PUBLIC_MOCK_MODE === 'true');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="w-full bg-black flex items-center justify-center h-16 sm:h-20">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-center">
          <Link href="/" className="h-full flex items-center">
            <Image
              src="/turnone-logo1.png"
              alt="TurnOne"
              height={168}
              width={840}
              className="h-full w-auto object-contain scale-200 origin-center"
              priority
            />
          </Link>
        </div>
      </header>

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

      {/* CTA Section */}
      <div className="bg-[#E10600] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-red-100 mb-8">
            Start generating coach-quality performance reports with TurnOne today. Completely free.
          </p>
          <Link
            href="/generate"
            className="inline-block bg-white text-[#E10600] py-3 px-8 rounded-lg font-semibold text-lg hover:bg-gray-100 focus:ring-2 focus:ring-white transition-colors"
          >
            Generate a Report
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 text-sm text-gray-600">
            <Link href="/terms" className="hover:text-[#E10600] transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-[#E10600] transition-colors">Privacy</Link>
            <a href="mailto:support@turnone.com" className="hover:text-[#E10600] transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
