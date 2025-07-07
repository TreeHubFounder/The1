
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TierService } from '@/lib/services/market-conquest';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PROFESSIONAL') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await TierService.getProfessionalTierDashboard(session.user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in tier dashboard GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
