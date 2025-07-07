
import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, TreePine } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <Loader2 className={cn('animate-spin text-[#FF7A00]', sizes[size], className)} />
  );
};

interface PageLoadingProps {
  message?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F2F5]">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <TreePine className="h-12 w-12 text-[#2E4628] mr-2" />
          <div className="text-2xl font-bold text-[#2E4628]">TreeHub</div>
        </div>
        <LoadingSpinner size="lg" className="mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, lines = 1 }) => {
  return (
    <div className="animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'bg-gray-200 rounded',
            i > 0 && 'mt-2',
            className || 'h-4 w-full'
          )}
        />
      ))}
    </div>
  );
};

interface CardLoadingProps {
  count?: number;
}

export const CardLoading: React.FC<CardLoadingProps> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse">
            <div className="bg-gray-200 rounded h-6 w-3/4 mb-4"></div>
            <div className="bg-gray-200 rounded h-4 w-full mb-2"></div>
            <div className="bg-gray-200 rounded h-4 w-5/6 mb-4"></div>
            <div className="flex space-x-2">
              <div className="bg-gray-200 rounded h-8 w-20"></div>
              <div className="bg-gray-200 rounded h-8 w-24"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
