import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, getDefaultClassNames } from 'react-day-picker';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CalendarChevronProps = React.ComponentProps<'svg'> & {
  orientation?: 'left' | 'right';
};

function CalendarChevron({
  orientation,
  className,
  ...props
}: CalendarChevronProps) {
  return orientation === 'left' ? (
    <ChevronLeft className={cn('size-4', className)} {...props} />
  ) : (
    <ChevronRight className={cn('size-4', className)} {...props} />
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: 'flex flex-col gap-4 sm:flex-row',
        month: 'space-y-4',
        month_caption: 'relative flex items-center justify-center pt-1',
        caption_label:
          'text-sm font-medium uppercase tracking-[0.18em] text-[var(--study-kicker)]',
        nav: 'flex items-center gap-1',
        button_previous: cn(
          buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
          'absolute left-1 top-1 size-7 rounded-full'
        ),
        button_next: cn(
          buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
          'absolute right-1 top-1 size-7 rounded-full'
        ),
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday:
          'w-9 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-[var(--study-kicker)]',
        week: 'mt-2 flex w-full',
        day: 'relative h-9 w-9 p-0 text-center text-sm',
        day_button: cn(
          buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
          'size-9 rounded-full font-normal aria-selected:opacity-100'
        ),
        today: '[&>button]:text-[var(--study-ink)] [&>button]:ring-1 [&>button]:ring-[var(--study-line)]',
        selected:
          '[&>button]:bg-[var(--study-ink)] [&>button]:text-white [&>button]:hover:bg-[var(--study-ink)] [&>button]:hover:text-white [&>button]:focus:bg-[var(--study-ink)] [&>button]:focus:text-white [&>button]:rounded-full',
        outside: 'text-[var(--study-copy-muted)] opacity-50',
        disabled: 'text-[var(--study-copy-muted)] opacity-40',
        hidden: 'invisible',
        ...classNames
      }}
      components={{
        Chevron: CalendarChevron
      }}
      {...props}
    />
  );
}

export { Calendar };
