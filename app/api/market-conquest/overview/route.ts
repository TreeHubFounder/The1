
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MarketConquestService } from '@/lib/services/market-conquest';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'PROFESSIONAL'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await MarketConquestService.getConquestOverview();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in market conquest overview GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
