
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Get active storm events
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause
    const where: any = {
      OR: [
        { endTime: { gte: new Date() } }, // Ongoing storms
        { endTime: null }, // Storms without end time
      ],
    };

    if (state) {
      where.affectedStates = { has: state };
    }

    if (city) {
      where.affectedCities = { has: city };
    }

    if (severity) {
      where.severity = severity;
    }

    const storms = await prisma.stormEvent.findMany({
      where,
      orderBy: [
        { severity: 'desc' },
        { startTime: 'desc' },
      ],
      take: limit,
      include: {
        weatherData: true,
        stormResponses: {
          include: {
            aiAgent: true,
          },
        },
      },
    });

    // Calculate business intelligence metrics
    const stormMetrics = {
      totalActiveStorms: storms.length,
      severityBreakdown: storms.reduce((acc: any, storm) => {
        acc[storm.severity] = (acc[storm.severity] || 0) + 1;
        return acc;
      }, {}),
      estimatedTreeServiceDemand: storms.reduce((total, storm) => {
        const demandMultiplier = {
          'Extreme': 100,
          'High': 50,
          'Medium': 20,
          'Low': 5,
        };
        return total + (demandMultiplier[storm.treeServiceDemand as keyof typeof demandMultiplier] || 0);
      }, 0),
      topAffectedStates: storms.reduce((acc: any, storm) => {
        storm.affectedStates.forEach(state => {
          acc[state] = (acc[state] || 0) + 1;
        });
        return acc;
      }, {}),
    };

    return NextResponse.json({
      success: true,
      data: {
        storms,
        metrics: stormMetrics,
        count: storms.length,
      },
    });
  } catch (error) {
    console.error('Failed to get storm events:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch storm events',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Create manual storm event (for admin/testing)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      type,
      severity,
      affectedStates,
      affectedCities,
      centerLatitude,
      centerLongitude,
      maxWindSpeed,
      startTime,
      endTime,
      impactRadius,
    } = body;

    const storm = await prisma.stormEvent.create({
      data: {
        name,
        type,
        severity,
        affectedStates: affectedStates || [],
        affectedCities: affectedCities || [],
        affectedZipCodes: [],
        centerLatitude,
        centerLongitude,
        impactRadius: impactRadius || 25,
        maxWindSpeed,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        predictedDamage: severity === 'Extreme' || severity === 'Severe' ? 'High' : 'Medium',
        treeServiceDemand: severity === 'Extreme' ? 'Extreme' : severity === 'Severe' ? 'High' : 'Medium',
      },
    });

    return NextResponse.json({
      success: true,
      data: storm,
      message: 'Storm event created successfully',
    });
  } catch (error) {
    console.error('Failed to create storm event:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create storm event',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
