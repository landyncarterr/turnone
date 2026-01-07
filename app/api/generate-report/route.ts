import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { REPORT_SYSTEM_PROMPT, buildUserPrompt } from "@/app/lib/prompts";
import { generateFallbackReport } from "@/app/lib/fallbackReport";

export const runtime = "nodejs";

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey: key });
}

export async function POST(req: NextRequest) {
  try {
    // Safe JSON parsing
    let sessionData: any;
    try {
      sessionData = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!sessionData.best_lap || sessionData.best_lap.trim() === '') {
      return NextResponse.json(
        { error: 'Best lap time is required. Please provide a best lap time or upload a CSV with lap data.' },
        { status: 400 }
      );
    }

    if (!sessionData.avg_lap || sessionData.avg_lap.trim() === '') {
      return NextResponse.json(
        { error: 'Average lap time is required. Please provide an average lap time or upload a CSV with lap data.' },
        { status: 400 }
      );
    }

    // Ensure all fields have defaults
    const finalSessionData = {
      driver_name: sessionData.driver_name || 'Unknown',
      car: sessionData.car || 'Unknown',
      track: sessionData.track || 'Unknown',
      session_type: sessionData.session_type || 'Practice',
      conditions: sessionData.conditions || 'Unknown',
      best_lap: sessionData.best_lap,
      avg_lap: sessionData.avg_lap,
      consistency: sessionData.consistency || '',
      driver_notes: sessionData.driver_notes || '',
    };

    // Try OpenAI first
    let report: string;
    let fallbackUsed = false;

    try {
      const openai = getOpenAI();
      const userPrompt = buildUserPrompt(finalSessionData);

      const resp = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 1200,
        messages: [
          { role: "system", content: REPORT_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      });

      report = resp.choices?.[0]?.message?.content?.trim() || "";
      
      if (!report) {
        console.warn("[generate-report] Empty report from OpenAI, using fallback");
        report = generateFallbackReport(finalSessionData);
        fallbackUsed = true;
      }
    } catch (openaiErr: any) {
      // Check if OpenAI failed due to quota/availability issues
      const message = openaiErr?.message || "";
      const status = openaiErr?.status || openaiErr?.response?.status || openaiErr?.statusCode || openaiErr?.code;
      
      const shouldUseFallback = 
        message.includes("OPENAI_API_KEY") ||
        message.includes("api key") ||
        status === 429 ||
        message.toLowerCase().includes("rate limit") ||
        message.toLowerCase().includes("quota") ||
        message.toLowerCase().includes("insufficient") ||
        message.toLowerCase().includes("outage") ||
        message.toLowerCase().includes("unavailable");

      if (shouldUseFallback) {
        console.warn("[generate-report] OpenAI unavailable, using fallback", { 
          errorType: shouldUseFallback ? "fallback_triggered" : "unknown",
          message: message.substring(0, 100)
        });
        report = generateFallbackReport(finalSessionData);
        fallbackUsed = true;
      } else {
        // Re-throw if it's not a fallback-eligible error
        throw openaiErr;
      }
    }

    return NextResponse.json({ report, sessionData: finalSessionData, fallbackUsed });
  } catch (err: any) {
    const debugId = Math.random().toString(36).slice(2, 8);
    const message = err?.message || "";
    const status = err?.status || err?.response?.status || err?.statusCode || err?.code;

    let errorType = "unknown";
    if (message.includes("OPENAI_API_KEY") || message.includes("api key")) {
      errorType = "missing_key";
    } else if (
      (message.toLowerCase().includes("model") && 
       (message.includes("not found") || message.includes("does not exist") || message.includes("not available"))) ||
      status === 404
    ) {
      errorType = "model_access";
    } else if (status === 429 || message.toLowerCase().includes("rate limit") || message.toLowerCase().includes("quota")) {
      errorType = "rate_limit";
    } else if (status === 400 || message.toLowerCase().includes("invalid")) {
      errorType = "invalid_request";
    }

    // Log full error to Vercel Function logs
    console.error("[generate-report]", { 
      debugId, 
      errorType, 
      status,
      err 
    });

    return NextResponse.json(
      { 
        error: "Failed to generate report.", 
        errorType, 
        debugId 
      },
      { status: 500 }
    );
  }
}
