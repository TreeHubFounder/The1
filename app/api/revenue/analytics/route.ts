
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RevenueService } from '@/lib/services/revenue-service';

export const dynamic = 'force-dynamic';

// Get revenue analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') as 'daily' | 'weekly' | 'monthly' | 'yearly' || 'monthly';

    const analytics = await RevenueService.getRevenueAnalytics(period);

    if (!analytics) {
      return NextResponse.json(
        { error: 'Failed to fetch revenue analytics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Failed to get revenue analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch revenue analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
