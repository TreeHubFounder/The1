
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RevenueService } from '@/lib/services/revenue-service';

export const dynamic = 'force-dynamic';

// Track lead conversion
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { leadId, jobValue } = body;

    if (!leadId || !jobValue) {
      return NextResponse.json(
        { error: 'Lead ID and job value are required' },
        { status: 400 }
      );
    }

    const conversion = await RevenueService.trackLeadConversion(leadId, jobValue);

    return NextResponse.json({
      success: true,
      data: conversion,
      message: 'Lead conversion tracked successfully',
    });
  } catch (error) {
    console.error('Failed to track lead conversion:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track lead conversion',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
