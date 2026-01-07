import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { REPORT_SYSTEM_PROMPT, buildUserPrompt } from "@/app/lib/prompts";

export const runtime = "nodejs";

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey: key });
}

export async function POST(req: NextRequest) {
  try {
    const sessionData = await req.json();

    const openai = getOpenAI();
    const userPrompt = buildUserPrompt(sessionData);

    const resp = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 1200,
      messages: [
        { role: "system", content: REPORT_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const report = resp.choices?.[0]?.message?.content?.trim() || "";
    return NextResponse.json({ report });
  } catch (err: any) {
    const msg =
      err?.message?.includes("OPENAI_API_KEY")
        ? "Server missing OPENAI_API_KEY. Set it in Vercel Environment Variables and redeploy."
        : "Failed to generate report. Please try again.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
