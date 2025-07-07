
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PropertyManagementHub from './_components/property-management-hub';

export const dynamic = 'force-dynamic';

export default async function PropertyManagementPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !['ADMIN', 'PROFESSIONAL'].includes(session.user.role)) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Property Management Hub</h1>
          <p className="text-muted-foreground mt-2">
            Manage relationships with property management companies and bulk service contracts
          </p>
        </div>

        <Suspense fallback={<PropertyManagementHubSkeleton />}>
          <PropertyManagementHub />
        </Suspense>
      </div>
    </div>
  );
}

function PropertyManagementHubSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="h-96 bg-muted rounded-lg animate-pulse" />
    </div>
  );
}

