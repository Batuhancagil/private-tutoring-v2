import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  inputMode?: 'text' | 'numeric' | 'tel' | 'email' | 'url' | 'search' | 'decimal';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = 'text', inputMode, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          inputMode={inputMode}
          className={cn(
            'flex h-11 min-h-[44px] w-full rounded-md border border-gray-300 dark:border-gray-600',
            'bg-white dark:bg-gray-800',
            'px-3 py-2.5 text-base sm:text-sm',
            'text-gray-900 dark:text-white',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'touch-manipulation', // Improve touch responsiveness on mobile
            error &&
              'border-red-500 dark:border-red-500 focus:ring-red-500',
            className
          )}
          ref={ref}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error && props.id ? `${props.id}-error` : undefined}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert" id={props.id ? `${props.id}-error` : undefined}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';






