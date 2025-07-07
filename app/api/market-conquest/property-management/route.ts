
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PropertyManagementService } from '@/lib/services/market-conquest';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'PROFESSIONAL'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const contractStatus = searchParams.get('contractStatus');
    const city = searchParams.get('city');
    const state = searchParams.get('state');

    const filters: any = {};
    if (type) filters.type = type;
    if (contractStatus) filters.contractStatus = contractStatus;
    if (city) filters.city = city;
    if (state) filters.state = state;

    const result = await PropertyManagementService.getPropertyManagers(filters);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in property management GET:', error);
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

    if (!data.companyName || !data.type) {
      return NextResponse.json({ 
        error: 'Company name and type are required' 
      }, { status: 400 });
    }

    const result = await PropertyManagementService.createPropertyManager(data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error in property management POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
