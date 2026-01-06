import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { isFreeProEmail } from '@/app/lib/freeAccess';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    
    if (!email) {
      return NextResponse.json({ hasFreeAccess: false });
    }
    
    const hasFreeAccess = isFreeProEmail(email);
    
    return NextResponse.json({
      hasFreeAccess,
      email: hasFreeAccess ? email : null,
    });
  } catch (error) {
    console.error('Error checking free access:', error);
    return NextResponse.json({ hasFreeAccess: false });
  }
}

