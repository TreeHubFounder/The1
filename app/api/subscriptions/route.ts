
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SubscriptionService } from '@/lib/services/subscription-service';

export const dynamic = 'force-dynamic';

// Get user subscription
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await SubscriptionService.getSubscriptionAnalytics();

    return NextResponse.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error('Failed to get subscription:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch subscription data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Create or upgrade subscription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tier, isAnnual = false } = body;

    if (!tier) {
      return NextResponse.json(
        { error: 'Subscription tier is required' },
        { status: 400 }
      );
    }

    const subscription = await SubscriptionService.createSubscription(
      session.user.id,
      tier,
      isAnnual
    );

    return NextResponse.json({
      success: true,
      data: subscription,
      message: 'Subscription created successfully',
    });
  } catch (error) {
    console.error('Failed to create subscription:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create subscription',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Cancel subscription
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await SubscriptionService.cancelSubscription(session.user.id);

    return NextResponse.json({
      success: true,
      data: subscription,
      message: 'Subscription cancelled successfully',
    });
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cancel subscription',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
