
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RevenueService } from '@/lib/services/revenue-service';

export const dynamic = 'force-dynamic';

// Get revenue projections
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projections = await RevenueService.getRevenueProjections();

    if (!projections) {
      return NextResponse.json(
        { error: 'Failed to fetch revenue projections' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: projections,
    });
  } catch (error) {
    console.error('Failed to get revenue projections:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch revenue projections',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
