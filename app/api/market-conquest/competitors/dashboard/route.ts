
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CompetitorService } from '@/lib/services/market-conquest';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'PROFESSIONAL'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const territoryId = searchParams.get('territoryId');

    const result = await CompetitorService.getCompetitiveDashboard(territoryId || undefined);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in competitive dashboard GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
