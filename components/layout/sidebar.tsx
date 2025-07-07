
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home,
  Briefcase,
  Users,
  Settings,
  AlertTriangle,
  MessageSquare,
  DollarSign,
  BarChart3,
  Shield,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  userRole?: 'PROFESSIONAL' | 'COMPANY' | 'HOMEOWNER' | 'ADMIN' | 'VENDOR';
}

export default function Sidebar({ userRole = 'PROFESSIONAL' }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const getNavigationItems = () => {
    const commonItems: Array<{
      name: string;
      href: string;
      icon: any;
      isEmergency?: boolean;
    }> = [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'Jobs', href: '/dashboard/jobs', icon: Briefcase },
      { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
      { name: 'Payments', href: '/dashboard/payments', icon: DollarSign },
    ];

    switch (userRole) {
      case 'PROFESSIONAL':
        return [
          ...commonItems,
          { name: 'My Profile', href: '/dashboard/profile', icon: Users },
          { name: 'My Bids', href: '/dashboard/bids', icon: FileText },
          { name: 'Equipment', href: '/dashboard/equipment', icon: Settings },
          { name: 'Emergency Alerts', href: '/dashboard/emergency', icon: AlertTriangle, isEmergency: true },
        ];
      
      case 'COMPANY':
        return [
          ...commonItems,
          { name: 'Company Profile', href: '/dashboard/company', icon: Users },
          { name: 'Post Jobs', href: '/dashboard/post-job', icon: Briefcase },
          { name: 'Team Management', href: '/dashboard/team', icon: Users },
          { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
          { name: 'Emergency Response', href: '/dashboard/emergency', icon: AlertTriangle, isEmergency: true },
        ];
      
      case 'ADMIN':
        return [
          ...commonItems,
          { name: 'User Management', href: '/admin/users', icon: Users },
          { name: 'Platform Analytics', href: '/admin/analytics', icon: BarChart3 },
          { name: 'Verification Queue', href: '/admin/verification', icon: Shield },
          { name: 'Emergency Management', href: '/admin/emergency', icon: AlertTriangle, isEmergency: true },
        ];
      
      case 'VENDOR':
        return [
          ...commonItems,
          { name: 'My Equipment', href: '/dashboard/my-equipment', icon: Settings },
          { name: 'Sales Analytics', href: '/dashboard/sales', icon: BarChart3 },
          { name: 'Inventory Management', href: '/dashboard/inventory', icon: Users },
        ];
      
      default:
        return commonItems;
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 z-40 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:shadow-lg transition-shadow"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        )}
      </button>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-[#FF7A00] text-white shadow-md'
                  : item.isEmergency
                  ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon 
                className={`h-5 w-5 flex-shrink-0 ${
                  item.isEmergency ? 'animate-pulse' : ''
                } ${
                  isActive ? 'text-white' : ''
                }`} 
              />
              {!isCollapsed && (
                <span className="font-medium truncate">{item.name}</span>
              )}
              
              {/* Emergency indicator */}
              {item.isEmergency && !isCollapsed && (
                <div className="ml-auto">
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      {!isCollapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-[#F0F2F5] rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-1">Need Help?</h4>
            <p className="text-xs text-gray-600 mb-2">
              Contact our 24/7 support team for assistance.
            </p>
            <button className="text-xs text-[#FF7A00] hover:text-[#E56A00] font-medium">
              Get Support
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
