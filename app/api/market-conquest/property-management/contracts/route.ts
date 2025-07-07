
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PropertyManagementService } from '@/lib/services/market-conquest';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'PROFESSIONAL'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    if (!data.propertyManagerId || !data.contractNumber || !data.contractType) {
      return NextResponse.json({ 
        error: 'Property manager ID, contract number, and contract type are required' 
      }, { status: 400 });
    }

    // Convert date strings to Date objects
    data.startDate = new Date(data.startDate);
    data.endDate = new Date(data.endDate);

    const result = await PropertyManagementService.createContract(data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error in property management contracts POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
