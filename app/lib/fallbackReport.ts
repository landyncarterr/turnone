/**
 * Fallback Report Generator
 * Generates professional reports when OpenAI is unavailable
 * Uses only user-provided data with deterministic rules
 */

export interface SessionData {
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

/**
 * Parse lap time to seconds for calculations
 */
function parseLapTimeToSeconds(lapTime: string): number {
  if (!lapTime || lapTime.trim() === '') return 0;
  
  // Remove any non-numeric except decimal points and colons
  const cleaned = lapTime.trim();
  
  // Handle MM:SS.mmm format
  const parts = cleaned.split(':');
  if (parts.length === 2) {
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  }
  
  // Handle SS.mmm format
  if (parts.length === 1) {
    return parseFloat(parts[0]) || 0;
  }
  
  return 0;
}

/**
 * Format seconds back to M:SS.mmm format
 */
function formatLapTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  const secsPadded = secs.includes('.') ? secs : secs + '.000';
  const parts = secsPadded.split('.');
  return `${mins}:${parts[0].padStart(2, '0')}.${parts[1] || '000'}`;
}

/**
 * Generate a professional fallback report using only session data
 */
export function generateFallbackReport(session: SessionData): string {
  const bestSeconds = parseLapTimeToSeconds(session.best_lap);
  const avgSeconds = parseLapTimeToSeconds(session.avg_lap);
  const delta = avgSeconds - bestSeconds;
  const deltaPercent = bestSeconds > 0 ? ((delta / bestSeconds) * 100).toFixed(1) : '0.0';

  // Determine consistency level
  let consistencyLevel = 'moderate';
  let consistencyComment = 'moderate consistency';
  if (delta < 0.3) {
    consistencyLevel = 'strong';
    consistencyComment = 'strong consistency';
  } else if (delta < 0.8) {
    consistencyLevel = 'moderate';
    consistencyComment = 'moderate consistency';
  } else {
    consistencyLevel = 'inconsistent';
    consistencyComment = 'notable variance in lap times';
  }

  // Check for wet/low grip conditions
  const conditionsLower = (session.conditions || '').toLowerCase();
  const isWet = conditionsLower.includes('wet') || 
                conditionsLower.includes('damp') || 
                conditionsLower.includes('rain') ||
                conditionsLower.includes('low grip');

  // Determine session focus
  const sessionTypeLower = (session.session_type || 'practice').toLowerCase();
  let sessionFocus = 'establish baseline performance and optimize vehicle setup';
  if (sessionTypeLower.includes('qualify') || sessionTypeLower.includes('qual')) {
    sessionFocus = 'achieve optimal single-lap performance';
  } else if (sessionTypeLower.includes('race')) {
    sessionFocus = 'develop race pace and consistency';
  }

  // Build report following the exact 6-section structure
  const report = `**1. Session Overview**

This ${session.session_type || 'practice'} session was conducted at ${session.track || 'the track'} with ${session.driver_name || 'the driver'} behind the wheel of the ${session.car || 'vehicle'}. Track conditions were ${session.conditions || 'standard'} throughout the session. The primary objective was to ${sessionFocus}. Based on available session data, the driver completed multiple laps with ${consistencyComment}.

**2. Performance Summary**

The session's best lap time of ${session.best_lap} compares to an average lap time of ${session.avg_lap}, representing a ${delta >= 0 ? delta.toFixed(3) : '0.000'}-second variance (${deltaPercent}% spread). ${delta < 0.3 ? 'This indicates strong consistency, with the driver operating near peak performance throughout the session.' : delta < 0.8 ? 'This demonstrates moderate consistency with acceptable variance between best and average times.' : 'This shows notable variance between best and average lap times, indicating room for improvement in repeatability.'} The driver demonstrated ${delta < 0.3 ? 'strong' : delta < 0.8 ? 'developing' : 'emerging'} execution of the optimal lap, with ${delta < 0.3 ? 'minimal' : delta < 0.8 ? 'moderate' : 'notable'} variance across the session. ${session.consistency || 'Based on available session data, lap time consistency aligns with expected outcomes for this track configuration.'}

**3. Key Observations**

• **Consistency Performance**: ${delta < 0.3 ? 'Lap time variance is minimal, demonstrating strong repeatability and car control throughout the session.' : delta < 0.8 ? 'Moderate lap time spread suggests occasional execution variations that, when addressed, could improve average pace.' : 'Notable lap time variance indicates inconsistent execution that, when improved, would significantly lower average lap times.'}

• **Pace Potential**: ${delta < 0.3 ? 'The driver is consistently operating near peak performance, with minimal gap between best and average times.' : `The ${delta.toFixed(2)}-second gap between best and average lap demonstrates that faster average pace is achievable with improved consistency.`}

• **Session Context**: ${session.driver_notes && session.driver_notes.trim() !== '' ? `Driver feedback indicates: ${session.driver_notes.substring(0, 150)}${session.driver_notes.length > 150 ? '...' : ''}` : 'Session data establishes a clear performance baseline for future comparison and development.'}

• **Development Focus**: ${delta > 0.8 ? 'Primary opportunity lies in reducing lap time variance through improved technique repeatability and corner execution consistency.' : delta > 0.3 ? 'Focus should shift to incremental pace improvements through optimized line and technique refinement while maintaining consistency.' : 'With strong consistency established, focus should shift to incremental pace improvements through optimized line and technique refinement.'}

• **Track-Specific Performance**: Based on available session data, performance characteristics align with expected outcomes for this track configuration and conditions.${isWet ? ' Track conditions requiring additional caution and conservative approach were noted.' : ''}

**4. Time Gain Opportunities**

• **Consistency Development**: ${delta > 0.8 ? `Reducing lap time variance by ${(delta * 0.5).toFixed(2)}-${(delta * 0.7).toFixed(2)} seconds through improved repeatability would significantly lower average lap times.` : delta > 0.3 ? `Targeting ${(delta * 0.4).toFixed(2)}-${(delta * 0.6).toFixed(2)} seconds through refined braking points and optimized corner entry speeds.` : `Targeting incremental gains of ${(delta * 0.3).toFixed(2)}-${(delta * 0.5).toFixed(2)} seconds through refined technique.`}

• **Braking Technique**: ${isWet ? 'Given track conditions, focus on smooth brake pressure application and early braking points to maintain stability and control.' : 'Consistent brake pressure application and release points can improve corner entry stability and reduce lap time variance. Focus on maintaining optimal brake balance through key braking zones.'}

• **Corner Exit Optimization**: ${isWet ? 'Conservative throttle application on corner exit is critical in current conditions. Focus on maintaining traction and minimizing wheelspin.' : 'Consistent throttle application and exit speed maintenance, particularly in medium-speed corners where small gains compound throughout the lap.'}

• **Track Position Optimization**: Refining racing line through key sectors, particularly in complex corner sequences, offers measurable time gains without increased risk.${isWet ? ' Exercise additional caution when exploring limits in these conditions.' : ''}

• **Lap Execution**: ${delta > 0.5 ? 'Developing the ability to string together optimal sectors consistently will close the gap between best and average lap performance.' : 'Maintaining current consistency while working to lower the overall best time through incremental improvements.'}

**5. Recommendations for Next Session**

1. **Driving Focus**: ${delta > 0.8 ? 'Prioritize consistent corner entry speeds and exit throttle application. Work on maintaining optimal racing line through complex corner sequences, with particular attention to reducing variance in execution.' : 'Prioritize consistent corner entry speeds and exit throttle application. Work on maintaining optimal racing line while focusing on incremental technique improvements.'}${isWet ? ' In similar conditions, maintain conservative approach while building confidence.' : ''}

2. **Session Planning**: ${sessionTypeLower.includes('qualify') || sessionTypeLower.includes('qual') ? 'In the next qualifying session, dedicate specific segments to optimizing single-lap performance, focusing on achieving consistent fast laps within narrow variance.' : sessionTypeLower.includes('race') ? 'Incorporate longer runs to develop consistency under race conditions, focusing on maintaining pace as conditions change.' : 'In the next practice session, dedicate specific segments to consistency drills, focusing on achieving lap times within acceptable variance of the target pace.'}

3. **Data Review**: Analyze sector times to identify specific corners or sections where consistency can be improved. Compare best lap sector times to average performance to highlight areas requiring attention.

4. **Preparation**: ${isWet ? 'Given the variable conditions, focus on developing confidence in wet-weather car control and identifying optimal braking and cornering techniques for these conditions.' : session.driver_notes && session.driver_notes.trim() !== '' ? 'Review driver notes from this session along with track notes and video analysis to reinforce optimal lines and braking points before the next session.' : 'Review track notes and video analysis from this session to reinforce optimal lines and braking points before the next session.'}

**6. Target Goals for Next Session**

• **Consistency Target**: ${delta > 0.8 ? `Reduce average lap time to within ${(delta * 0.6).toFixed(2)}-${(delta * 0.8).toFixed(2)} seconds of the best lap, representing a ${(delta * 0.2).toFixed(3)}-second improvement in average pace.` : delta > 0.3 ? `Maintain average lap times within ${(delta * 0.8).toFixed(2)}-${(delta * 1.0).toFixed(2)} seconds of the best lap while working to lower the overall average by ${(delta * 0.15).toFixed(3)} seconds.` : `Maintain average lap times within ${(delta * 0.9).toFixed(2)} seconds of the best lap while working to lower the overall average by ${(delta * 0.1).toFixed(3)} seconds.`}

• **Pace Target**: Target incremental best lap time improvement through refined technique and optimized line execution.${isWet ? ' In dry conditions, expect measurable improvements.' : ''}

• **Execution Target**: ${delta > 0.5 ? `Achieve at least 70% of laps within ${(delta * 0.7).toFixed(2)} seconds of the session best lap time.` : `Maintain 80% of laps within ${(delta * 0.9).toFixed(2)} seconds of the best lap while working to lower the overall best time.`}

• **Focus Area**: Prioritize consistent sector execution, with particular attention to the sector showing the highest variance between best and average times.

• **Development Objective**: ${delta > 0.8 ? 'Establish baseline consistency before pursuing pace improvements.' : delta > 0.3 ? 'Refine existing consistency while pursuing incremental pace gains.' : 'Maintain current consistency while pursuing incremental pace improvements.'}`;

  return report.trim();
}

