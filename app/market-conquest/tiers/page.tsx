
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import TierManagement from './_components/tier-management';

export const dynamic = 'force-dynamic';

export default async function TiersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !['ADMIN', 'PROFESSIONAL'].includes(session.user.role)) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Professional Tier System</h1>
          <p className="text-muted-foreground mt-2">
            Manage professional performance tiers: Bronze, Silver, Gold, Platinum, and Elite
          </p>
        </div>

        <Suspense fallback={<TierManagementSkeleton />}>
          <TierManagement />
        </Suspense>
      </div>
    </div>
  );
}

function TierManagementSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="h-96 bg-muted rounded-lg animate-pulse" />
    </div>
  );
}
