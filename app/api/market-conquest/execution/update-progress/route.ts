
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ExecutionService } from '@/lib/services/market-conquest';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'PROFESSIONAL'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { milestoneId, progressPercentage, notes, actualValue } = await request.json();

    if (!milestoneId || progressPercentage === undefined) {
      return NextResponse.json({ 
        error: 'Milestone ID and progress percentage are required' 
      }, { status: 400 });
    }

    if (progressPercentage < 0 || progressPercentage > 100) {
      return NextResponse.json({ 
        error: 'Progress percentage must be between 0 and 100' 
      }, { status: 400 });
    }

    const result = await ExecutionService.updateMilestoneProgress(
      milestoneId,
      progressPercentage,
      notes,
      actualValue
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in update progress POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
