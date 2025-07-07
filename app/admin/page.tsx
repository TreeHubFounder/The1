
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/admin/admin-dashboard';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            TreeHub AI Command Center
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage your AI-powered tree care operating system
          </p>
        </div>
        
        <AdminDashboard />
      </div>
    </div>
  );
}
