
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'emergency';
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', title, dismissible, onDismiss, children, ...props }, ref) => {
    const variants = {
      info: {
        container: 'bg-blue-50 border-blue-200 text-blue-900',
        icon: Info,
        iconColor: 'text-blue-500',
      },
      success: {
        container: 'bg-green-50 border-green-200 text-green-900',
        icon: CheckCircle,
        iconColor: 'text-green-500',
      },
      warning: {
        container: 'bg-yellow-50 border-yellow-200 text-yellow-900',
        icon: AlertTriangle,
        iconColor: 'text-yellow-500',
      },
      danger: {
        container: 'bg-red-50 border-red-200 text-red-900',
        icon: XCircle,
        iconColor: 'text-red-500',
      },
      emergency: {
        container: 'bg-red-100 border-red-300 text-red-900 animate-pulse',
        icon: AlertTriangle,
        iconColor: 'text-red-600',
      },
    };

    const config = variants[variant];
    const IconComponent = config.icon;

    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-lg border p-4',
          config.container,
          className
        )}
        {...props}
      >
        <div className="flex">
          <div className="flex-shrink-0">
            <IconComponent className={cn('h-5 w-5', config.iconColor)} />
          </div>
          <div className="ml-3 flex-1">
            {title && (
              <h3 className="text-sm font-medium mb-1">{title}</h3>
            )}
            <div className="text-sm">{children}</div>
          </div>
          {dismissible && (
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={onDismiss}
                  className={cn(
                    'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                    variant === 'emergency' ? 'text-red-600 hover:bg-red-200 focus:ring-red-600' :
                    variant === 'danger' ? 'text-red-500 hover:bg-red-100 focus:ring-red-500' :
                    variant === 'warning' ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-500' :
                    variant === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-500' :
                    'text-blue-500 hover:bg-blue-100 focus:ring-blue-500'
                  )}
                >
                  <span className="sr-only">Dismiss</span>
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export { Alert };
