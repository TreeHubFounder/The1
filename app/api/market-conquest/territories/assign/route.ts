
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TerritoryService } from '@/lib/services/market-conquest';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    if (!data.territoryId || !data.professionalId) {
      return NextResponse.json({ 
        error: 'Territory ID and Professional ID are required' 
      }, { status: 400 });
    }

    const result = await TerritoryService.assignProfessional(data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in territory assign POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
