import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-10 w-full min-w-0 rounded-lg border border-[var(--study-line)] bg-[var(--study-surface-soft)] px-3 py-2 text-sm text-[var(--study-ink)] transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--study-ink)] placeholder:text-[var(--study-copy-muted)] focus-visible:border-[var(--study-focus)] focus-visible:ring-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[var(--study-surface-soft)] disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-0',
        className
      )}
      {...props}
    />
  );
}

export { Input };
