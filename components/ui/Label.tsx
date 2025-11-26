import { LabelHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
  required?: boolean;
}

export function Label({
  children,
  className,
  required,
  ...props
}: LabelProps) {
  return (
    <label
      className={cn(
        'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1',
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-red-500 dark:text-red-400 ml-1">*</span>
      )}
    </label>
  );
}






