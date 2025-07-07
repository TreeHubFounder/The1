
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

    const { propertyManagerId, serviceTypes, estimatedVolume } = await request.json();

    if (!propertyManagerId || !serviceTypes || !estimatedVolume) {
      return NextResponse.json({ 
        error: 'Property manager ID, service types, and estimated volume are required' 
      }, { status: 400 });
    }

    if (!Array.isArray(serviceTypes) || serviceTypes.length === 0) {
      return NextResponse.json({ 
        error: 'Service types must be a non-empty array' 
      }, { status: 400 });
    }

    const result = await PropertyManagementService.generateProposal(
      propertyManagerId,
      serviceTypes,
      estimatedVolume
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in property management proposals POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
