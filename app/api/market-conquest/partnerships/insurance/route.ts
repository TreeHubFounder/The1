
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PartnershipService } from '@/lib/services/market-conquest';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'PROFESSIONAL'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await PartnershipService.getInsurancePartnerships();

    if (!result.success) {
      return NextResponse.json({ error: (result as any).error || 'Failed to get insurance partnerships' }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in insurance partnerships GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
