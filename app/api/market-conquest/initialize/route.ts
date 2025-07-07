
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MarketConquestService } from '@/lib/services/market-conquest';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await MarketConquestService.initializeAll();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in market conquest initialize POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
