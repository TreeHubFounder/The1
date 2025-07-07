
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ExecutionManagement from './_components/execution-management';

export const dynamic = 'force-dynamic';

export default async function ExecutionPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !['ADMIN', 'PROFESSIONAL'].includes(session.user.role)) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Execution Timeline</h1>
          <p className="text-muted-foreground mt-2">
            Track progress on conquest milestones and week-by-week execution plan
          </p>
        </div>

        <Suspense fallback={<ExecutionManagementSkeleton />}>
          <ExecutionManagement />
        </Suspense>
      </div>
    </div>
  );
}

function ExecutionManagementSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="h-96 bg-muted rounded-lg animate-pulse" />
    </div>
  );
}

