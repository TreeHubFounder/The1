
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      domain: process.env.NEXT_PUBLIC_DOMAIN || 'treehub.app',
      version: '1.0.0',
      services: {
        database: 'connected',
        api: 'operational',
        auth: 'operational',
      },
      uptime: process.uptime(),
    };

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    const errorData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      domain: process.env.NEXT_PUBLIC_DOMAIN || 'treehub.app',
      error: 'Database connection failed',
      services: {
        database: 'disconnected',
        api: 'operational',
        auth: 'unknown',
      },
    };

    return NextResponse.json(errorData, { status: 503 });
  }
}
