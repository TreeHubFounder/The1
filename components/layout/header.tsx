
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { 
  Menu, 
  X, 
  User, 
  Briefcase, 
  AlertTriangle, 
  Settings, 
  LogOut,
  Bell,
  MessageSquare,
  Search,
  TreePine
} from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { data: session, status } = useSession();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Briefcase },
    { name: 'Jobs', href: '/jobs', icon: Briefcase },
    { name: 'Professionals', href: '/professionals', icon: User },
    { name: 'Equipment', href: '/equipment', icon: Settings },
    { name: 'Emergency', href: '/emergency', icon: AlertTriangle, isEmergency: true },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#2E4628] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <TreePine className="h-8 w-8 text-[#FF7A00]" />
              <span className="text-white text-xl font-bold tracking-tight">TreeHub</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  item.isEmergency
                    ? 'text-red-300 hover:text-red-100 hover:bg-red-600/20'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <item.icon className={`h-4 w-4 ${item.isEmergency ? 'animate-pulse' : ''}`} />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center max-w-md w-full mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search jobs, professionals, equipment..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="loading-shimmer h-8 w-8 rounded-full"></div>
            ) : session ? (
              <>
                {/* Notifications */}
                <button className="relative p-2 text-gray-300 hover:text-white transition-colors">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-[#FF7A00] ring-2 ring-[#2E4628]"></span>
                </button>

                {/* Messages */}
                <button className="relative p-2 text-gray-300 hover:text-white transition-colors">
                  <MessageSquare className="h-5 w-5" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-[#FF7A00] ring-2 ring-[#2E4628]"></span>
                </button>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 p-2 rounded-md text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-[#FF7A00] flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {session.user?.firstName?.charAt(0) || session.user?.email?.charAt(0)}
                      </span>
                    </div>
                    <span className="hidden lg:block text-sm font-medium">
                      {session.user?.firstName || 'User'}
                    </span>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>Your Profile</span>
                        </div>
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <div className="flex items-center space-x-2">
                          <Settings className="h-4 w-4" />
                          <span>Settings</span>
                        </div>
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={() => signOut()}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-2">
                          <LogOut className="h-4 w-4" />
                          <span>Sign out</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/signin"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="btn-primary text-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#1F2F1B] border-t border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Mobile Search */}
            <div className="px-3 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                />
              </div>
            </div>

            {/* Mobile Navigation Links */}
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  item.isEmergency
                    ? 'text-red-300 hover:text-red-100 hover:bg-red-600/20'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <item.icon className={`h-5 w-5 ${item.isEmergency ? 'animate-pulse' : ''}`} />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
