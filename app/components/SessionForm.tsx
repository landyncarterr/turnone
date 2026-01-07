'use client';

import { useState, FormEvent, useRef } from 'react';
import { parseCSV, findLapTimeColumn, parseLapTimeToSeconds, computeStats, formatLapTime, extractMetadata, extractKeyValueMetadata, extractSegmentTimes, extractSccaHeaderMetadata } from '@/app/lib/csv';

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

interface SessionFormProps {
  onSubmit: (data: SessionData) => Promise<void>;
  isLoading: boolean;
}

interface CsvParsedData {
  lapsUsed: number;
  bestLap: string;
  avgLap: string;
  stdDevSeconds: number;
  consistencyNote: string;
  format?: 'scca' | 'column';
  inferred?: {
    driver_name?: string;
    car?: string;
    track?: string;
    session_type?: string;
    conditions?: string;
  };
}

export default function SessionForm({ onSubmit, isLoading }: SessionFormProps) {
  const [formData, setFormData] = useState<SessionData>({
    driver_name: '',
    car: '',
    track: '',
    session_type: 'Practice',
    conditions: '',
    best_lap: '',
    avg_lap: '',
    consistency: '',
    driver_notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvParsed, setCsvParsed] = useState<CsvParsedData | null>(null);
  const [csvDebugPreview, setCsvDebugPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setCsvError(null);
    setCsvFileName(file.name);

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/);
      
      // Extract SCCA header metadata first (Racer, Vehicle, Venue)
      const sccaHeaderMeta = extractSccaHeaderMetadata(text);
      
      // Try SCCA Segment Times format first (pass raw text, not lines)
      const segmentTimes = extractSegmentTimes(text);
      let lapSeconds: number[] = [];
      let metadata: any = {};
      let format: 'scca' | 'column' = 'column';

      if (segmentTimes.length >= 2) {
        // SCCA format detected - use Segment Times
        lapSeconds = segmentTimes;
        format = 'scca';
        
        // Use header metadata (preferred) or fall back to key-value extraction
        const sccaMetadata = extractKeyValueMetadata(lines);
        metadata = {
          driver_name: sccaHeaderMeta.racer || sccaMetadata.driver_name,
          car: sccaHeaderMeta.vehicle || sccaMetadata.car,
          track: sccaHeaderMeta.venue || sccaMetadata.track,
          session_type: sccaMetadata.session_type || 'Session',
          conditions: sccaMetadata.conditions || 'Unknown',
        };
      } else {
        // Fall back to column-based detection
        const rows = parseCSV(text);

        if (rows.length === 0) {
          setCsvError('CSV file is empty');
          return;
        }

        // Extract metadata from first ~30 rows, but prefer SCCA header metadata
        const rowMetadata = extractMetadata(rows);
        metadata = {
          driver_name: sccaHeaderMeta.racer || rowMetadata.driver_name,
          car: sccaHeaderMeta.vehicle || rowMetadata.car,
          track: sccaHeaderMeta.venue || rowMetadata.track,
          session_type: rowMetadata.session_type,
          conditions: rowMetadata.conditions,
        };

        // First row is headers
        const headers = rows[0];
        const lapTimeColumnIndex = findLapTimeColumn(headers);

        if (lapTimeColumnIndex === null) {
          setCsvError('Could not detect lap times. This file must include either a "Segment Times" line or a lap time column.');
          return;
        }

        // Extract lap times from remaining rows
        const columnName = headers[lapTimeColumnIndex] || 'Time';
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length > lapTimeColumnIndex) {
            const value = row[lapTimeColumnIndex];
            const seconds = parseLapTimeToSeconds(value);
            if (seconds !== null) {
              lapSeconds.push(seconds);
            }
          }
        }

      if (lapSeconds.length === 0) {
        setCsvError(`Could not extract lap times from the ${columnName} column. Please verify CSV format.`);
        // Debug preview: show first 20 non-empty lines
        const previewLines = lines.filter(l => l.trim().length > 0).slice(0, 20);
        setCsvDebugPreview(previewLines.join('\n'));
        return;
      }
      }

      // Compute statistics
      const stats = computeStats(lapSeconds);
      if (!stats) {
        setCsvError('Could not compute statistics');
        return;
      }

      // Store parsed CSV data
      const parsed: CsvParsedData = {
        lapsUsed: stats.sampleSize,
        bestLap: formatLapTime(stats.best),
        avgLap: formatLapTime(stats.average),
        stdDevSeconds: stats.stdDev,
        consistencyNote: stats.consistency,
        format,
        inferred: metadata,
      };
      setCsvParsed(parsed);

      // Auto-fill form fields
      const consistencyText = format === 'scca'
        ? `Computed from CSV Segment Times (${parsed.lapsUsed} segments). Std dev: ${parsed.stdDevSeconds.toFixed(2)}s. ${parsed.consistencyNote}.`
        : `Computed from CSV (${parsed.lapsUsed} laps). Std dev: ${parsed.stdDevSeconds.toFixed(2)}s. ${parsed.consistencyNote}.`;

      setFormData((prev) => ({
        ...prev,
        best_lap: parsed.bestLap,
        avg_lap: parsed.avgLap,
        consistency: consistencyText,
        // Auto-fill from metadata (user can still edit)
        driver_name: metadata.driver_name || prev.driver_name || '',
        car: metadata.car || prev.car || '',
        track: metadata.track || prev.track || '',
        session_type: metadata.session_type || prev.session_type || (format === 'scca' ? 'Session' : 'Practice'),
        conditions: metadata.conditions || prev.conditions || '',
        driver_notes: prev.driver_notes || 'Generated from uploaded telemetry CSV.',
      }));
    } catch (error) {
      setCsvError('Error parsing CSV file. Please check the format.');
      console.error('CSV parsing error:', error);
    }
  };

  const handleClearCSV = () => {
    setCsvFileName(null);
    setCsvError(null);
    setCsvParsed(null);
    setCsvDebugPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Reset auto-filled fields to empty
    setFormData((prev) => ({
      ...prev,
      best_lap: '',
      avg_lap: '',
      consistency: '',
      driver_notes: '',
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting || isLoading) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Build session data from CSV + form, with defaults
      const consistencyText = csvParsed
        ? (csvParsed.format === 'scca'
          ? `Computed from CSV Segment Times (${csvParsed.lapsUsed} segments). Std dev: ${csvParsed.stdDevSeconds.toFixed(2)}s. ${csvParsed.consistencyNote}.`
          : `Computed from CSV (${csvParsed.lapsUsed} laps). Std dev: ${csvParsed.stdDevSeconds.toFixed(2)}s. ${csvParsed.consistencyNote}.`)
        : '';

      const sessionData: SessionData = {
        driver_name: formData.driver_name || csvParsed?.inferred?.driver_name || 'Unknown',
        car: formData.car || csvParsed?.inferred?.car || 'Unknown',
        track: formData.track || csvParsed?.inferred?.track || 'Unknown',
        session_type: formData.session_type || csvParsed?.inferred?.session_type || (csvParsed?.format === 'scca' ? 'Session' : 'Practice'),
        conditions: formData.conditions || csvParsed?.inferred?.conditions || 'Unknown',
        best_lap: formData.best_lap || csvParsed?.bestLap || '',
        avg_lap: formData.avg_lap || csvParsed?.avgLap || '',
        consistency: formData.consistency || consistencyText,
        driver_notes: formData.driver_notes || (csvParsed ? 'Generated from uploaded telemetry CSV.' : ''),
      };

      await onSubmit(sessionData);
    } finally {
      // Don't reset isSubmitting here - let parent component control loading state
      setTimeout(() => setIsSubmitting(false), 1000);
    }
  };

  const hasCsvData = csvParsed !== null;
  const isFormValid = hasCsvData || (
    formData.driver_name.trim() !== '' &&
    formData.car.trim() !== '' &&
    formData.track.trim() !== '' &&
    formData.conditions.trim() !== '' &&
    formData.best_lap.trim() !== '' &&
    formData.avg_lap.trim() !== ''
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* CSV Upload Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <label htmlFor="csv_upload" className="block text-sm font-medium text-gray-700 mb-2">
          Upload Lap Time CSV (Optional)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="file"
            id="csv_upload"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleCSVUpload}
            className="block text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#E10600] file:text-white hover:file:bg-[#C50500] file:cursor-pointer"
          />
          {csvFileName && (
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm text-gray-600">{csvFileName}</span>
              <button
                type="button"
                onClick={handleClearCSV}
                className="text-sm text-[#E10600] hover:text-[#C50500] underline"
              >
                Clear CSV
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Upload lap time CSV (optional). We'll auto-fill best/average/consistency.
        </p>
        {csvError && (
          <div className="mt-2">
            <p className="text-sm text-red-600">{csvError}</p>
            {csvDebugPreview && (
              <details className="mt-2">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  Debug: Show first 20 lines
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 border border-gray-300 rounded text-xs overflow-auto max-h-40">
                  {csvDebugPreview}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>

      {/* CSV Summary Panel */}
      {hasCsvData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-green-900 mb-1">
                {csvParsed.format === 'scca' ? 'SCCA Telemetry CSV detected' : 'CSV detected'} — you can generate immediately
              </h3>
              <p className="text-xs text-green-700">Optional: add driver/car/track if you want it in the report.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-sm">
            <div>
              <span className="text-green-700 font-medium">Racer:</span>
              <span className="ml-2 text-green-900">{csvParsed.inferred?.driver_name || 'Unknown'}</span>
            </div>
            <div>
              <span className="text-green-700 font-medium">Vehicle:</span>
              <span className="ml-2 text-green-900">{csvParsed.inferred?.car || 'Unknown'}</span>
            </div>
            <div>
              <span className="text-green-700 font-medium">Venue:</span>
              <span className="ml-2 text-green-900">{csvParsed.inferred?.track || 'Unknown'}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
            <div>
              <span className="text-green-700 font-medium">{csvParsed.format === 'scca' ? 'Segments used:' : 'Laps used:'}</span>
              <span className="ml-2 text-green-900">{csvParsed.lapsUsed}</span>
            </div>
            <div>
              <span className="text-green-700 font-medium">Best lap:</span>
              <span className="ml-2 text-green-900">{csvParsed.bestLap}</span>
            </div>
            <div>
              <span className="text-green-700 font-medium">Average lap:</span>
              <span className="ml-2 text-green-900">{csvParsed.avgLap}</span>
            </div>
            <div>
              <span className="text-green-700 font-medium">Std dev:</span>
              <span className="ml-2 text-green-900">{csvParsed.stdDevSeconds.toFixed(2)}s</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="driver_name" className="block text-sm font-medium text-gray-700 mb-2">
            Driver Name {!hasCsvData && '*'}
          </label>
          <input
            type="text"
            id="driver_name"
            name="driver_name"
            value={formData.driver_name}
            onChange={handleChange}
            required={!hasCsvData}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E10600] focus:border-transparent"
            placeholder="e.g., John Smith"
          />
        </div>

        <div>
          <label htmlFor="car" className="block text-sm font-medium text-gray-700 mb-2">
            Car {!hasCsvData && '*'}
          </label>
          <input
            type="text"
            id="car"
            name="car"
            value={formData.car}
            onChange={handleChange}
            required={!hasCsvData}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E10600] focus:border-transparent"
            placeholder="e.g., Porsche 911 GT3"
          />
        </div>

        <div>
          <label htmlFor="track" className="block text-sm font-medium text-gray-700 mb-2">
            Track {!hasCsvData && '*'}
          </label>
          <input
            type="text"
            id="track"
            name="track"
            value={formData.track}
            onChange={handleChange}
            required={!hasCsvData}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E10600] focus:border-transparent"
            placeholder="e.g., Circuit of the Americas"
          />
        </div>

        <div>
          <label htmlFor="session_type" className="block text-sm font-medium text-gray-700 mb-2">
            Session Type {!hasCsvData && '*'}
          </label>
          <select
            id="session_type"
            name="session_type"
            value={formData.session_type}
            onChange={handleChange}
            required={!hasCsvData}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E10600] focus:border-transparent"
          >
            <option value="Practice">Practice</option>
            <option value="Qualifying">Qualifying</option>
            <option value="Race">Race</option>
            <option value="Test">Test</option>
          </select>
        </div>

        <div>
          <label htmlFor="conditions" className="block text-sm font-medium text-gray-700 mb-2">
            Track Conditions {!hasCsvData && '*'}
          </label>
          <input
            type="text"
            id="conditions"
            name="conditions"
            value={formData.conditions}
            onChange={handleChange}
            required={!hasCsvData}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E10600] focus:border-transparent"
            placeholder="e.g., Dry, Wet, Damp"
          />
        </div>

        <div>
          <label htmlFor="best_lap" className="block text-sm font-medium text-gray-700 mb-2">
            Best Lap Time {!hasCsvData && '*'}
          </label>
          <input
            type="text"
            id="best_lap"
            name="best_lap"
            value={formData.best_lap}
            onChange={handleChange}
            required={!hasCsvData}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E10600] focus:border-transparent"
            placeholder="e.g., 1:45.234"
          />
        </div>

        <div>
          <label htmlFor="avg_lap" className="block text-sm font-medium text-gray-700 mb-2">
            Average Lap Time {!hasCsvData && '*'}
          </label>
          <input
            type="text"
            id="avg_lap"
            name="avg_lap"
            value={formData.avg_lap}
            onChange={handleChange}
            required={!hasCsvData}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E10600] focus:border-transparent"
            placeholder="e.g., 1:46.891"
          />
        </div>

        <div>
          <label htmlFor="consistency" className="block text-sm font-medium text-gray-700 mb-2">
            Lap Time Consistency Notes
          </label>
          <input
            type="text"
            id="consistency"
            name="consistency"
            value={formData.consistency}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E10600] focus:border-transparent"
            placeholder="e.g., Consistent within 0.5s"
          />
        </div>
      </div>

      <div>
        <label htmlFor="driver_notes" className="block text-sm font-medium text-gray-700 mb-2">
          Driver Notes
        </label>
        <textarea
          id="driver_notes"
          name="driver_notes"
          value={formData.driver_notes}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E10600] focus:border-transparent"
          placeholder="Any additional notes or observations from the driver..."
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || isSubmitting || !isFormValid}
        className="w-full bg-[#E10600] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#C50500] focus:ring-2 focus:ring-[#E10600] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading || isSubmitting ? 'Generating… this can take ~10–20 seconds' : 'Generate Performance Report'}
      </button>
    </form>
  );
}
