import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { REPORT_SYSTEM_PROMPT, buildUserPrompt } from '@/app/lib/prompts';
import { MOCK_MODE, generateMockReport } from '@/app/lib/mockMode';

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY && !MOCK_MODE) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
  });
}

export async function POST(request: NextRequest) {
  try {
    const sessionData = await request.json();

    // Validate required fields
    const required = ['driver_name', 'car', 'track', 'session_type', 'conditions', 'best_lap', 'avg_lap'];
    for (const field of required) {
      if (!sessionData[field] || sessionData[field].trim() === '') {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // MOCK MODE: Return mock report immediately
    if (MOCK_MODE) {
      // Simulate API delay for realism
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockReport = generateMockReport(sessionData);
      return NextResponse.json({ report: mockReport, sessionData });
    }

    const userPrompt = buildUserPrompt(sessionData);
    const openai = getOpenAI();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: REPORT_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 1200,
    });

    const report = completion.choices[0]?.message?.content;

    if (!report) {
      return NextResponse.json(
        { error: 'Failed to generate report. Please try again.' },
        { status: 500 }
      );
    }

    // Validate report structure - ensure all 6 sections are present
    const requiredSections = [
      'Session Overview',
      'Performance Summary',
      'Key Observations',
      'Time Gain Opportunities',
      'Recommendations for Next Session',
      'Target Goals for Next Session'
    ];

    const reportLower = report.toLowerCase();
    const missingSections = requiredSections.filter(
      section => !reportLower.includes(section.toLowerCase())
    );

    if (missingSections.length > 0) {
      console.warn('Report missing sections:', missingSections);
      // Still return the report but log the warning
    }

    // Ensure report length is reasonable (400-700 words)
    const wordCount = report.split(/\s+/).length;
    if (wordCount < 300 || wordCount > 800) {
      console.warn(`Report word count (${wordCount}) outside expected range (400-700)`);
    }

    console.log('[Analytics] Report generated successfully');

    return NextResponse.json({ report, sessionData });
  } catch (error) {
    console.error('Error generating report:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('OPENAI_API_KEY')) {
        return NextResponse.json(
          { error: 'OPENAI_API_KEY is not set' },
          { status: 500 }
        );
      }
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Configuration error. Please contact support.' },
          { status: 500 }
        );
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Service temporarily unavailable. Please try again in a moment.' },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to generate report. Please check your input and try again.' },
      { status: 500 }
    );
  }
}
