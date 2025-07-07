
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
    const propertyManagerId = searchParams.get('propertyManagerId');
    const timeframeMonths = parseInt(searchParams.get('timeframeMonths') || '12');

    if (!propertyManagerId) {
      return NextResponse.json({ 
        error: 'Property manager ID is required' 
      }, { status: 400 });
    }

    if (timeframeMonths < 1 || timeframeMonths > 60) {
      return NextResponse.json({ 
        error: 'Timeframe months must be between 1 and 60' 
      }, { status: 400 });
    }

    const result = await PropertyManagementService.trackROI(propertyManagerId, timeframeMonths);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in property management ROI GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
