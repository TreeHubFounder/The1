
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CompetitorService } from '@/lib/services/market-conquest';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'PROFESSIONAL'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { competitorId, outcome, jobValue, ourBid, theirBid } = await request.json();

    if (!competitorId || !outcome || !jobValue || !ourBid) {
      return NextResponse.json({ 
        error: 'Competitor ID, outcome, job value, and our bid are required' 
      }, { status: 400 });
    }

    if (!['won', 'lost'].includes(outcome)) {
      return NextResponse.json({ 
        error: 'Outcome must be either "won" or "lost"' 
      }, { status: 400 });
    }

    const result = await CompetitorService.trackJobOutcome(
      competitorId,
      outcome,
      jobValue,
      ourBid,
      theirBid
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in track outcome POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
