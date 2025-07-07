
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PartnershipManagement from './_components/partnership-management';

export const dynamic = 'force-dynamic';

export default async function PartnershipsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !['ADMIN', 'PROFESSIONAL'].includes(session.user.role)) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Partnership Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage strategic partnerships: Insurance companies, property management, municipal contracts
          </p>
        </div>

        <Suspense fallback={<PartnershipManagementSkeleton />}>
          <PartnershipManagement />
        </Suspense>
      </div>
    </div>
  );
}

function PartnershipManagementSkeleton() {
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
