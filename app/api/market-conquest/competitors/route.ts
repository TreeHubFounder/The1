
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
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const type = searchParams.get('type');
    const threatLevel = searchParams.get('threatLevel');

    const filters: any = {};
    if (territoryId) filters.territoryId = territoryId;
    if (city) filters.city = city;
    if (state) filters.state = state;
    if (type) filters.type = type;
    if (threatLevel) filters.threatLevel = threatLevel;

    const result = await CompetitorService.getCompetitors(filters);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in competitors GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'PROFESSIONAL'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    if (!data.name || !data.type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    const result = await CompetitorService.addCompetitor(data, data.territoryId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error in competitors POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
