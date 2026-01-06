'use client';

import { useState } from 'react';

interface ReportDisplayProps {
  report: string;
  sessionData: {
    driver_name: string;
    car: string;
    track: string;
    session_type: string;
  };
}

export default function ReportDisplay({ report, sessionData }: ReportDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    if (downloadingPDF) return;
    
    setDownloadingPDF(true);
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report, sessionData }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate PDF. Please try again.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Performance_Report_${sessionData.driver_name.replace(/\s+/g, '_')}_${sessionData.track.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert(error instanceof Error ? error.message : 'Failed to download PDF. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const formatReport = (text: string) => {
    const sections = text.split(/\n\n+/);
    return sections.map((section, index) => {
      const lines = section.split('\n');
      return (
        <div key={index} className="mb-6">
          {lines.map((line, lineIndex) => {
            if (line.match(/^\d+\.\s+\*\*.*\*\*/)) {
              // Section title
              const title = line.replace(/\*\*/g, '').replace(/^\d+\.\s+/, '');
              return (
                <h3 key={lineIndex} className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  {title}
                </h3>
              );
            } else if (line.startsWith('•')) {
              // Bullet point
              return (
                <p key={lineIndex} className="text-gray-700 mb-2 ml-4">
                  {line}
                </p>
              );
            } else if (line.trim()) {
              // Regular paragraph
              return (
                <p key={lineIndex} className="text-gray-700 mb-3 leading-relaxed">
                  {line}
                </p>
              );
            }
            return null;
          })}
        </div>
      );
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <h2 className="text-2xl font-bold text-gray-900">Performance Report</h2>
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            {copied ? 'Copied!' : 'Copy Report'}
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="px-4 py-2 bg-[#E10600] text-white rounded-lg hover:bg-[#C50500] focus:ring-2 focus:ring-[#E10600] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {downloadingPDF ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <span className="text-sm text-gray-600">Driver:</span>
          <p className="font-semibold text-gray-900">{sessionData.driver_name}</p>
        </div>
        <div>
          <span className="text-sm text-gray-600">Track:</span>
          <p className="font-semibold text-gray-900">{sessionData.track}</p>
        </div>
        <div>
          <span className="text-sm text-gray-600">Car:</span>
          <p className="font-semibold text-gray-900">{sessionData.car}</p>
        </div>
        <div>
          <span className="text-sm text-gray-600">Session:</span>
          <p className="font-semibold text-gray-900">{sessionData.session_type}</p>
        </div>
      </div>

      <div className="prose max-w-none text-gray-800">
        {formatReport(report)}
      </div>
    </div>
  );
}

