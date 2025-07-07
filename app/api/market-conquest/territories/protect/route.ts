
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TerritoryService } from '@/lib/services/market-conquest';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PROFESSIONAL') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { territoryId, exclusivityFee } = await request.json();

    if (!territoryId) {
      return NextResponse.json({ error: 'Territory ID is required' }, { status: 400 });
    }

    const result = await TerritoryService.protectTerritory(
      territoryId,
      session.user.id,
      exclusivityFee
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in territory protect POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
