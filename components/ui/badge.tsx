
import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'verified' | 'emergency' | 'pending' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'verified', size = 'md', ...props }, ref) => {
    const baseClasses = 'inline-flex items-center gap-1 font-medium rounded-full transition-all duration-200';
    
    const variants = {
      verified: 'bg-[#2E4628] text-white',
      emergency: 'bg-red-600 text-white animate-pulse',
      pending: 'bg-yellow-100 text-yellow-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      danger: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-1.5 text-base',
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
