/**
 * Parse CSV text into a 2D array of strings
 * Handles basic comma separation and quoted values
 */
export function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      currentLine.push(currentField.trim());
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // Line separator
      if (currentField || currentLine.length > 0) {
        currentLine.push(currentField.trim());
        currentField = '';
        if (currentLine.length > 0) {
          lines.push(currentLine);
        }
        currentLine = [];
      }
      // Handle \r\n
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else {
      currentField += char;
    }
  }

  // Add last field and line
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField.trim());
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Find the column index that contains lap times
 * Matches common column names (case-insensitive, trimmed)
 * Priority order: explicit lap-time names first, then generic "time"
 */
export function findLapTimeColumn(headers: string[]): number | null {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  // Priority order (exact match preferred, then contains):
  // 1. "laptime"
  // 2. "lap time"
  // 3. "lap_time"
  // 4. "time" (explicitly supported for lap times)
  // 5. "lap"
  
  // Check in priority order
  const priorityList = ['laptime', 'lap time', 'lap_time', 'time', 'lap'];
  
  for (const match of priorityList) {
    // First try exact match
    const exactIndex = normalizedHeaders.findIndex(h => h === match);
    if (exactIndex !== -1) {
      return exactIndex;
    }
    
    // Then try contains (for variations like "LapTime", "Lap Time", etc.)
    const containsIndex = normalizedHeaders.findIndex(h => h.includes(match));
    if (containsIndex !== -1) {
      return containsIndex;
    }
  }
  
  return null;
}

/**
 * Parse lap time string to seconds (number)
 * Supports lap duration formats only (rejects timestamps):
 * - "1:23.456" (M:SS.mmm)
 * - "83.456" (seconds only)
 * - "00:01:23.456" (HH:MM:SS.mmm, but only if hours <= 1)
 */
export function parseLapTimeToSeconds(value: string): number | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  // Reject values that look like timestamps or dates
  // Check for date patterns (YYYY-MM-DD, MM/DD/YYYY, etc.)
  if (trimmed.match(/\d{4}-\d{2}-\d{2}/) || // ISO date
      trimmed.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/) || // US date format
      trimmed.match(/[Tt]\d{2}:\d{2}:\d{2}/) || // ISO datetime separator
      trimmed.includes('Z') || // UTC timezone
      trimmed.match(/[+-]\d{2}:\d{2}$/)) { // Timezone offset
    return null;
  }

  // Try format: M:SS.mmm or MM:SS.mmm (lap duration format)
  const match1 = trimmed.match(/^(\d+):(\d{1,2})\.?(\d*)$/);
  if (match1) {
    const minutes = parseInt(match1[1], 10);
    const seconds = parseInt(match1[2], 10);
    
    // Validate: seconds must be < 60, minutes should be reasonable for a lap (< 60)
    if (seconds >= 60 || minutes >= 60) {
      return null; // Likely a timestamp, not a lap time
    }
    
    const milliseconds = match1[3] ? parseFloat('0.' + match1[3]) : 0;
    const totalSeconds = minutes * 60 + seconds + milliseconds;
    
    // Reject if total time is unreasonable for a lap (> 1 hour)
    if (totalSeconds > 3600) {
      return null;
    }
    
    return totalSeconds;
  }

  // Try format: HH:MM:SS.mmm (only accept if hours <= 1, indicating lap duration)
  const match2 = trimmed.match(/^(\d+):(\d{2}):(\d{2})\.?(\d*)$/);
  if (match2) {
    const hours = parseInt(match2[1], 10);
    const minutes = parseInt(match2[2], 10);
    const seconds = parseInt(match2[3], 10);
    
    // Only accept if hours <= 1 (lap duration, not timestamp)
    if (hours > 1) {
      return null; // Likely a timestamp
    }
    
    // Validate: minutes and seconds must be < 60
    if (minutes >= 60 || seconds >= 60) {
      return null;
    }
    
    const milliseconds = match2[4] ? parseFloat('0.' + match2[4]) : 0;
    const totalSeconds = hours * 3600 + minutes * 60 + seconds + milliseconds;
    
    // Reject if total time is unreasonable for a lap (> 1 hour)
    if (totalSeconds > 3600) {
      return null;
    }
    
    return totalSeconds;
  }

  // Try format: seconds only (e.g., "83.456")
  // Only accept if it's a reasonable lap time (< 1 hour)
  const secondsOnly = parseFloat(trimmed);
  if (!isNaN(secondsOnly) && secondsOnly > 0 && secondsOnly < 3600) {
    return secondsOnly;
  }

  return null;
}

/**
 * Format seconds to M:SS.mmm format
 */
export function formatLapTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const wholeSecs = Math.floor(secs);
  const millis = Math.round((secs - wholeSecs) * 1000);
  
  return `${minutes}:${wholeSecs.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
}

/**
 * Compute statistics from lap times
 */
export interface LapTimeStats {
  best: number;
  average: number;
  stdDev: number;
  consistency: string;
  sampleSize: number;
}

export function computeStats(lapSeconds: number[]): LapTimeStats | null {
  if (lapSeconds.length === 0) {
    return null;
  }

  // Calculate average
  const sum = lapSeconds.reduce((a, b) => a + b, 0);
  const average = sum / lapSeconds.length;

  // Calculate standard deviation
  const variance = lapSeconds.reduce((acc, lap) => acc + Math.pow(lap - average, 2), 0) / lapSeconds.length;
  const stdDev = Math.sqrt(variance);

  // Determine consistency
  let consistency: string;
  if (stdDev <= 0.15) {
    consistency = 'Very consistent';
  } else if (stdDev <= 0.35) {
    consistency = 'Moderately consistent';
  } else {
    consistency = 'Inconsistent';
  }

  return {
    best: Math.min(...lapSeconds),
    average,
    stdDev,
    consistency,
    sampleSize: lapSeconds.length,
  };
}

/**
 * Extract metadata from CSV rows (first ~30 rows)
 * Looks for key-value pairs and single-cell patterns
 */
export interface ExtractedMetadata {
  driver_name?: string;
  car?: string;
  track?: string;
  session_type?: string;
  conditions?: string;
}

export function extractMetadata(rows: string[][]): ExtractedMetadata {
  const metadata: ExtractedMetadata = {};
  const scanLimit = Math.min(30, rows.length);

  for (let i = 0; i < scanLimit; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    // Check for key-value pairs in two-column format
    if (row.length >= 2) {
      const key = row[0].toLowerCase().trim();
      const value = row[1].trim();

      if (value && value.length > 0) {
        if (key.includes('driver') && key.includes('name')) {
          metadata.driver_name = value;
        } else if (key.includes('driver') && !metadata.driver_name) {
          metadata.driver_name = value;
        } else if (key.includes('vehicle') || key.includes('car')) {
          metadata.car = value;
        } else if (key.includes('track')) {
          metadata.track = value;
        } else if (key.includes('session') && (key.includes('type') || key.includes('kind'))) {
          metadata.session_type = value;
        } else if (key.includes('condition') || key.includes('weather')) {
          metadata.conditions = value;
        }
      }
    }

    // Check for single-cell patterns like "Track: Road Atlanta"
    if (row.length === 1) {
      const cell = row[0].trim();
      const colonMatch = cell.match(/^([^:]+):\s*(.+)$/i);
      if (colonMatch) {
        const key = colonMatch[1].toLowerCase().trim();
        const value = colonMatch[2].trim();

        if (key.includes('driver') && key.includes('name')) {
          metadata.driver_name = value;
        } else if (key.includes('driver') && !metadata.driver_name) {
          metadata.driver_name = value;
        } else if (key.includes('vehicle') || key.includes('car')) {
          metadata.car = value;
        } else if (key.includes('track')) {
          metadata.track = value;
        } else if (key.includes('session') && (key.includes('type') || key.includes('kind'))) {
          metadata.session_type = value;
        } else if (key.includes('condition') || key.includes('weather')) {
          metadata.conditions = value;
        }
      }
    }
  }

  return metadata;
}

/**
 * Extract key-value metadata from raw text lines (SCCA format)
 * Handles lines like "Venue Road Atlanta", "Vehicle Porsche 911", "Racer John Smith"
 */
export function extractKeyValueMetadata(lines: string[]): ExtractedMetadata {
  const metadata: ExtractedMetadata = {};

  for (const line of lines) {
    if (!line || line.trim() === '') continue;

    // Split by comma, tab, or multiple spaces
    const parts = line.split(/[,\t]|\s{2,}/).map(p => p.trim()).filter(p => p.length > 0);
    
    if (parts.length < 2) continue;

    const key = parts[0].toLowerCase().trim();
    const value = parts.slice(1).join(' ').trim(); // Join remaining parts in case value has spaces

    if (!value || value.length === 0) continue;

    // Match SCCA metadata keys
    if (key === 'venue') {
      metadata.track = value;
    } else if (key === 'vehicle') {
      metadata.car = value;
    } else if (key === 'racer') {
      metadata.driver_name = value;
    } else if (key === 'championship') {
      // Optional, can be used for session type if needed
      if (!metadata.session_type) {
        metadata.session_type = value;
      }
    } else if (key === 'date' || key === 'time') {
      // Optional metadata, skip for now
    }
  }

  return metadata;
}

/**
 * Extract Segment Times from SCCA CSV format
 * Uses raw text and regex to find lap time patterns, regardless of delimiters
 */
export function extractSegmentTimes(rawText: string): number[] {
  const segmentTimes: number[] = [];
  const lines = rawText.split(/\r?\n/);

  for (const line of lines) {
    if (!line || line.trim() === '') continue;

    const trimmed = line.trim();
    
    // Check if line contains "Segment Times" (case-insensitive)
    if (!trimmed.toLowerCase().includes('segment times')) {
      continue;
    }

    // Extract ALL lap time tokens from the entire line using regex
    // Pattern: M:SS.mmm or MM:SS.mmm (1-2 digits, colon, 2 digits, dot, 1-3 digits)
    const lapTimePattern = /\b\d{1,2}:\d{2}\.\d{1,3}\b/g;
    const matches = trimmed.match(lapTimePattern);

    if (matches && matches.length > 0) {
      // Parse each matched token
      for (const match of matches) {
        const seconds = parseLapTimeToSeconds(match);
        if (seconds !== null) {
          segmentTimes.push(seconds);
        }
      }
    }

    // Found Segment Times line with matches, continue scanning in case there are more
    // (some files may wrap, but we'll take the first occurrence with matches)
    if (segmentTimes.length >= 2) {
      break;
    }
  }

  return segmentTimes;
}

/**
 * Extract SCCA header metadata from raw text
 * Handles lines like "Venue    Sebring Full", "Vehicle  NP01-090", "Racer    Jason"
 * Tolerates tabs, commas, or multiple spaces as separators
 */
export function extractSccaHeaderMetadata(rawText: string): {
  racer?: string;
  vehicle?: string;
  venue?: string;
} {
  const result: { racer?: string; vehicle?: string; venue?: string } = {};
  const lines = rawText.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Match Racer
    const racerMatch = trimmed.match(/^(?:Racer)\s*[\t, ]+(.+?)\s*$/i);
    if (racerMatch && racerMatch[1]) {
      const value = racerMatch[1].trim().replace(/[,\t]+$/, '').trim();
      if (value) {
        result.racer = value;
      }
    }

    // Match Vehicle
    const vehicleMatch = trimmed.match(/^(?:Vehicle)\s*[\t, ]+(.+?)\s*$/i);
    if (vehicleMatch && vehicleMatch[1]) {
      const value = vehicleMatch[1].trim().replace(/[,\t]+$/, '').trim();
      if (value) {
        result.vehicle = value;
      }
    }

    // Match Venue
    const venueMatch = trimmed.match(/^(?:Venue)\s*[\t, ]+(.+?)\s*$/i);
    if (venueMatch && venueMatch[1]) {
      const value = venueMatch[1].trim().replace(/[,\t]+$/, '').trim();
      if (value) {
        result.venue = value;
      }
    }
  }

  return result;
}

