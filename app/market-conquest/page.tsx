
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import MarketConquestDashboard from './_components/market-conquest-dashboard';

export const dynamic = 'force-dynamic';

export default async function MarketConquestPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !['ADMIN', 'PROFESSIONAL'].includes(session.user.role)) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Market Conquest Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Bucks County Domination Strategy - Transform TreeHub into the dominant force in tree care
          </p>
        </div>

        <Suspense fallback={<MarketConquestDashboardSkeleton />}>
          <MarketConquestDashboard />
        </Suspense>
      </div>
    </div>
  );
}

function MarketConquestDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Overview Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-80 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
