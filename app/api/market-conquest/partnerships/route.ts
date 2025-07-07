
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PartnershipService } from '@/lib/services/market-conquest';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'PROFESSIONAL'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const partnerType = searchParams.get('partnerType');
    const status = searchParams.get('status');
    const strategicImportance = searchParams.get('strategicImportance');

    const filters: any = {};
    if (partnerType) filters.partnerType = partnerType;
    if (status) filters.status = status;
    if (strategicImportance) filters.strategicImportance = strategicImportance;

    const result = await PartnershipService.getPartnerships(filters);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in partnerships GET:', error);
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

    if (!data.partnerName || !data.partnerType) {
      return NextResponse.json({ 
        error: 'Partner name and type are required' 
      }, { status: 400 });
    }

    const result = await PartnershipService.createPartnership(data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error in partnerships POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
