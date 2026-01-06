import { NextRequest, NextResponse } from 'next/server';
import { MOCK_MODE } from '@/app/lib/mockMode';

// Simple in-memory tracking (for production, use database or Stripe metadata)
// This is a temporary solution for demo purposes
const reportCounts = new Map<string, { count: number; resetDate: Date }>();

function getReportCount(customerId: string, plan: string): { count: number; limit: number } {
  const now = new Date();
  const key = `${customerId}-${plan}`;
  const record = reportCounts.get(key);

  // Reset count if it's a new month
  if (!record || now > record.resetDate) {
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    reportCounts.set(key, { count: 0, resetDate });
    return { count: 0, limit: plan === 'basic' ? 10 : Infinity };
  }

  const limit = plan === 'basic' ? 10 : Infinity;
  return { count: record.count, limit };
}

function incrementReportCount(customerId: string, plan: string): void {
  const key = `${customerId}-${plan}`;
  const record = reportCounts.get(key);
  
  if (record) {
    record.count += 1;
  } else {
    const now = new Date();
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    reportCounts.set(key, { count: 1, resetDate });
  }
}

export async function POST(request: NextRequest) {
  try {
    // MOCK MODE: Always allow unlimited reports
    if (MOCK_MODE) {
      const { action } = await request.json();
      if (action === 'check') {
        return NextResponse.json({ count: 0, limit: Infinity, canGenerate: true });
      }
      if (action === 'increment') {
        return NextResponse.json({ count: 1, limit: Infinity });
      }
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { customerId, plan, action } = await request.json();

    if (!customerId || !plan) {
      return NextResponse.json(
        { error: 'Missing customerId or plan' },
        { status: 400 }
      );
    }

    if (action === 'check') {
      const { count, limit } = getReportCount(customerId, plan);
      return NextResponse.json({ count, limit, canGenerate: count < limit });
    }

    if (action === 'increment') {
      const { count, limit } = getReportCount(customerId, plan);
      
      if (count >= limit) {
        return NextResponse.json(
          { error: 'Report limit reached for this month', count, limit },
          { status: 403 }
        );
      }

      incrementReportCount(customerId, plan);
      const newCount = getReportCount(customerId, plan);
      return NextResponse.json({ count: newCount.count, limit: newCount.limit });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error tracking report:', error);
    return NextResponse.json(
      { error: 'Failed to track report' },
      { status: 500 }
    );
  }
}

