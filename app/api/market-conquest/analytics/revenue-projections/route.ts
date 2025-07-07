
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AnalyticsService } from '@/lib/services/market-conquest';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'PROFESSIONAL'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '12');

    if (months < 1 || months > 60) {
      return NextResponse.json({ 
        error: 'Months must be between 1 and 60' 
      }, { status: 400 });
    }

    const result = await AnalyticsService.generateRevenueProjections(months);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in revenue projections GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
