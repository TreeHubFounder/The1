
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TierService } from '@/lib/services/market-conquest';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { professionalId } = await request.json();
    
    // If admin is updating someone else's metrics, use provided ID; otherwise use session user ID
    const targetId = session.user.role === 'ADMIN' && professionalId 
      ? professionalId 
      : session.user.id;

    const result = await TierService.updatePerformanceMetrics(targetId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in update metrics POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
