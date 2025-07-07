
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TerritoryService } from '@/lib/services/market-conquest';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'PROFESSIONAL'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const county = searchParams.get('county');
    const state = searchParams.get('state');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const filters: any = {};
    if (county) filters.county = county;
    if (state) filters.state = state;
    if (status) filters.status = status;
    if (type) filters.type = type;

    const result = await TerritoryService.getTerritories(filters);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in territories GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    const result = await TerritoryService.createTerritory(data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error in territories POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
