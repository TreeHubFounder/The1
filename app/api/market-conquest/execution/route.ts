
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ExecutionService } from '@/lib/services/market-conquest';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'PROFESSIONAL'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');

    const filters: any = {};
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (assignedTo) filters.assignedTo = assignedTo;

    const result = await ExecutionService.getMilestones(filters);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in execution GET:', error);
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

    if (!data.title || !data.description || !data.type || !data.plannedStartDate || !data.plannedEndDate) {
      return NextResponse.json({ 
        error: 'Title, description, type, planned start date, and planned end date are required' 
      }, { status: 400 });
    }

    // Convert date strings to Date objects
    data.plannedStartDate = new Date(data.plannedStartDate);
    data.plannedEndDate = new Date(data.plannedEndDate);

    const result = await ExecutionService.createMilestone(data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error in execution POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
