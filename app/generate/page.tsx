'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SessionForm from '../components/SessionForm';
import ReportDisplay from '../components/ReportDisplay';

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

interface ReportHistoryEntry {
  id: string;
  createdAt: string;
  driver: string;
  track: string;
  car: string;
  reportText: string;
}

export default function GeneratePage() {
  const [report, setReport] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);
  const [reportHistory, setReportHistory] = useState<ReportHistoryEntry[]>([]);

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
  }, []);

  const handleSubmit = async (data: SessionData) => {
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
        throw new Error(errorData.error || 'Failed to generate report. Please try again.');
      }

      const result = await response.json();
      
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
                Generate Another Report
              </button>
            </div>
            {sessionData && <ReportDisplay report={report} sessionData={sessionData} />}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
            <p>&copy; 2025 TurnOne. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-[#E10600]">Terms</Link>
              <Link href="/privacy" className="hover:text-[#E10600]">Privacy</Link>
              <a href="mailto:support@turnone.com" className="hover:text-[#E10600]">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
