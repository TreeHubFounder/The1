
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

    const { competitorId, serviceType, ourPrice } = await request.json();

    if (!competitorId || !serviceType || !ourPrice) {
      return NextResponse.json({ 
        error: 'Competitor ID, service type, and our price are required' 
      }, { status: 400 });
    }

    const result = await CompetitorService.analyzePricing(competitorId, serviceType, ourPrice);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in competitor pricing POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
