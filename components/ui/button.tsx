
import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-target',
  {
    variants: {
      variant: {
        primary: 'bg-[#FF7A00] hover:bg-[#E56A00] text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:ring-[#FF7A00]',
        secondary: 'bg-[#2E4628] hover:bg-[#1F2F1B] text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:ring-[#2E4628]',
        outline: 'border-2 border-[#2E4628] text-[#2E4628] hover:bg-[#2E4628] hover:text-white focus:ring-[#2E4628]',
        emergency: 'bg-red-600 hover:bg-red-700 text-white shadow-lg animate-pulse focus:ring-red-500',
        ghost: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500',
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
        default: 'h-10 px-4 py-2',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!loading && icon && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
