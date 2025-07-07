
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CompetitorService } from '@/lib/services/market-conquest';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'PROFESSIONAL'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    if (!data.competitorId || !data.analysisType) {
      return NextResponse.json({ 
        error: 'Competitor ID and analysis type are required' 
      }, { status: 400 });
    }

    // Add the analyzer's ID to the data
    data.analyzedById = session.user.id;

    const result = await CompetitorService.createAnalysis(data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error in competitor analysis POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
