'use client';

import { useState } from 'react';
import { PLANS } from '@/app/lib/stripe';

export default function Pricing() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: 'basic' | 'pro') => {
    setLoading(plan);
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{PLANS.BASIC.name}</h3>
        <div className="mb-4">
          <span className="text-4xl font-bold text-gray-900">${PLANS.BASIC.price}</span>
          <span className="text-gray-600">/month</span>
        </div>
        <ul className="space-y-3 mb-6">
          <li className="flex items-center text-gray-700">
            <svg className="w-5 h-5 text-[#E10600] mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Up to {PLANS.BASIC.reports} reports per month
          </li>
          <li className="flex items-center text-gray-700">
            <svg className="w-5 h-5 text-[#E10600] mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            PDF export
          </li>
          <li className="flex items-center text-gray-700">
            <svg className="w-5 h-5 text-[#E10600] mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Professional reports
          </li>
        </ul>
        <button
          onClick={() => handleSubscribe('basic')}
          disabled={loading !== null}
          className="w-full bg-gray-800 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading === 'basic' ? 'Loading...' : 'Subscribe'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-[#E10600] relative">
        <div className="absolute top-0 right-0 bg-[#E10600] text-white px-3 py-1 text-sm font-semibold rounded-bl-lg">
          POPULAR
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{PLANS.PRO.name}</h3>
        <div className="mb-4">
          <span className="text-4xl font-bold text-gray-900">${PLANS.PRO.price}</span>
          <span className="text-gray-600">/month</span>
        </div>
        <ul className="space-y-3 mb-6">
          <li className="flex items-center text-gray-700">
            <svg className="w-5 h-5 text-[#E10600] mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Unlimited reports
          </li>
          <li className="flex items-center text-gray-700">
            <svg className="w-5 h-5 text-[#E10600] mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            PDF export
          </li>
          <li className="flex items-center text-gray-700">
            <svg className="w-5 h-5 text-[#E10600] mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Professional reports
          </li>
          <li className="flex items-center text-gray-700">
            <svg className="w-5 h-5 text-[#E10600] mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Priority support
          </li>
        </ul>
        <button
          onClick={() => handleSubscribe('pro')}
          disabled={loading !== null}
          className="w-full bg-[#E10600] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#C50500] focus:ring-2 focus:ring-[#E10600] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading === 'pro' ? 'Loading...' : 'Subscribe'}
        </button>
      </div>
    </div>
  );
}

