/**
 * Mock Mode Configuration
 * Set NEXT_PUBLIC_MOCK_MODE=true to enable local development without API keys
 */

export const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

/**
 * Generate a realistic mock racing performance report
 * Follows the exact 6-section structure
 */
export function generateMockReport(sessionData: {
  driver_name: string;
  car: string;
  track: string;
  session_type: string;
  conditions: string;
  best_lap: string;
  avg_lap: string;
  consistency?: string;
  driver_notes?: string;
}): string {
  const { driver_name, car, track, session_type, conditions, best_lap, avg_lap, consistency, driver_notes } = sessionData;
  
  // Calculate delta for analysis
  const bestTime = parseFloat(best_lap.replace(/[^\d.]/g, '')) || 0;
  const avgTime = parseFloat(avg_lap.replace(/[^\d.]/g, '')) || 0;
  const delta = avgTime - bestTime;
  const consistencyPercent = bestTime > 0 ? ((delta / bestTime) * 100).toFixed(1) : '0.0';

  return `**1. Session Overview**

This ${session_type.toLowerCase()} session was conducted at ${track} with ${driver_name} behind the wheel of the ${car}. Track conditions were ${conditions.toLowerCase()} throughout the session. The primary objective was to ${session_type.toLowerCase() === 'practice' ? 'establish baseline performance and optimize vehicle setup' : session_type.toLowerCase() === 'qualifying' ? 'achieve optimal single-lap performance' : 'develop race pace and consistency'}. Based on available session data, the driver completed multiple laps with consistent execution.

**2. Performance Summary**

The session's best lap time of ${best_lap} compares to an average lap time of ${avg_lap}, representing a ${delta > 0 ? delta.toFixed(3) : '0.000'}-second variance (${consistencyPercent}% spread). ${delta < 1.0 ? 'This indicates excellent consistency, with the driver operating near peak performance throughout the session.' : delta < 2.5 ? 'This demonstrates strong consistency with minimal variance between best and average times.' : 'This shows moderate consistency with room for improvement in repeatability.'} The driver demonstrated ${delta < 1.0 ? 'exceptional' : delta < 2.5 ? 'strong' : 'developing'} execution of the optimal lap, with ${delta < 1.0 ? 'minimal' : delta < 2.5 ? 'acceptable' : 'notable'} variance across the session. ${consistency || 'Based on available session data, lap time consistency aligns with expected outcomes for this track configuration.'}

**3. Key Observations**

• **Consistency Performance**: ${delta < 1.5 ? 'Lap time variance is minimal, demonstrating strong repeatability and car control throughout the session.' : 'Moderate lap time spread suggests occasional execution variations that, when addressed, could improve average pace.'}

• **Pace Potential**: ${delta < 1.0 ? 'The driver is consistently operating near peak performance, with minimal gap between best and average times.' : `The ${delta.toFixed(2)}-second gap between best and average lap demonstrates that faster pace is achievable with improved consistency.`}

• **Session Context**: ${driver_notes ? `Driver feedback indicates: ${driver_notes.substring(0, 100)}${driver_notes.length > 100 ? '...' : ''}` : 'Session data establishes a clear performance baseline for future comparison and development.'}

• **Development Focus**: ${delta > 2.0 ? 'Primary opportunity lies in reducing lap time variance through improved technique repeatability and corner execution consistency.' : 'With strong consistency established, focus should shift to incremental pace improvements through optimized line and technique refinement.'}

• **Track-Specific Performance**: Based on available session data, performance characteristics align with expected outcomes for this track configuration and conditions.

**4. Time Gain Opportunities**

• **Consistency Development**: ${delta > 1.5 ? `Reducing lap time variance by ${(delta * 0.6).toFixed(2)}-${(delta * 0.8).toFixed(2)} seconds through improved repeatability would significantly lower average lap times.` : `Targeting ${(delta * 0.3).toFixed(2)}-${(delta * 0.5).toFixed(2)} seconds through refined braking points and optimized corner entry speeds.`}

• **Braking Technique**: Consistent brake pressure application and release points can improve corner entry stability and reduce lap time variance. Focus on maintaining optimal brake balance through key braking zones.

• **Corner Exit Optimization**: Consistent throttle application and exit speed maintenance, particularly in medium-speed corners where small gains compound throughout the lap.

• **Track Position Optimization**: Refining racing line through key sectors, particularly in complex corner sequences, offers measurable time gains without increased risk.

• **Lap Execution**: ${delta > 1.0 ? 'Developing the ability to string together optimal sectors consistently will close the gap between best and average lap performance.' : 'Maintaining current consistency while working to lower the overall best time through incremental improvements.'}

**5. Recommendations for Next Session**

1. **Driving Focus**: Prioritize consistent corner entry speeds and exit throttle application. Work on maintaining optimal racing line through complex corner sequences, with particular attention to ${delta > 1.5 ? 'reducing variance in execution' : 'refining technique for incremental gains'}.

2. **Session Planning**: ${session_type.toLowerCase() === 'practice' ? 'In the next practice session, dedicate specific segments to consistency drills, focusing on achieving lap times within 0.5 seconds of the target pace.' : session_type.toLowerCase() === 'qualifying' ? 'Develop a structured out-lap and warm-up procedure to ensure optimal tire temperature and car balance for the first flying lap.' : 'Incorporate longer runs to develop consistency under race conditions, focusing on maintaining pace as tire degradation occurs.'}

3. **Data Review**: Analyze sector times to identify specific corners or sections where consistency can be improved. Compare best lap sector times to average performance to highlight areas requiring attention.

4. **Preparation**: ${conditions && conditions.toLowerCase().includes('wet') || conditions.toLowerCase().includes('damp') ? 'Given the variable conditions, focus on developing confidence in wet-weather car control and identifying optimal braking and cornering techniques for these conditions.' : 'Review track notes and video analysis from this session to reinforce optimal lines and braking points before the next session.'}

**6. Target Goals for Next Session**

• **Consistency Target**: ${delta > 1.5 ? `Reduce average lap time to within ${(delta * 0.7).toFixed(2)} seconds of the best lap, representing a ${(delta * 0.3).toFixed(3)}-second improvement in average pace.` : `Maintain average lap times within ${(delta * 0.9).toFixed(2)} seconds of the best lap while working to lower the overall average by ${(delta * 0.2).toFixed(3)} seconds.`}

• **Pace Target**: Target a best lap time improvement of ${(bestTime * 0.005).toFixed(3)} seconds through refined technique and optimized line execution.

• **Execution Target**: ${delta > 1.0 ? `Achieve at least 70% of laps within ${(delta * 0.6).toFixed(2)} seconds of the session best lap time.` : `Maintain 80% of laps within ${(delta * 0.8).toFixed(2)} seconds of the best lap while working to lower the overall best time.`}

• **Focus Area**: Prioritize consistent sector execution, with particular attention to the sector showing the highest variance between best and average times.

• **Development Objective**: ${delta > 2.0 ? 'Establish baseline consistency before pursuing pace improvements.' : 'Refine existing consistency while pursuing incremental pace gains.'}`;
}

